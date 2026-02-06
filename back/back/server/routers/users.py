"""Get or edit users."""

import logging
from datetime import datetime, timedelta
from secrets import randbelow

from common_models.hermes_models import Box, UnetProfile
from common_models.log_models import IpamLog
from common_models.user_models import (
    AppointmentSlot,
    DepositStatus,
    EquipmentStatus,
    MembershipStatus,
    MembershipType,
    User,
)
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pymongo import ReturnDocument

from back.core.charon import register_ont_in_olt
from back.core.documenso import (
    create_signable_document_from_draft,
    delete_document,
    generate_contract_draft_for_user,
    prefill_address_in_draft,
)
from back.core.hermes import (
    get_box_by_ssid,
    get_box_from_user,
    register_box_for_new_ftth_adh,
    register_unet_on_box,
)
from back.core.ipam_logging import create_log
from back.core.pon import (
    get_ont_from_box,
    get_ontinfo_from_box,
    register_ont_for_new_ftth_adh,
)
from back.core.scholarship_student import (
    get_all_scholarship_students,
    reset_all_scholarship_students,
)
from back.core.status_update import StatusUpdateInfo, delete_unet_of_wifi_adherent
from back.messaging.matrix import send_matrix_message
from back.messaging.sms import send_code
from back.mongodb.db import GetDatabase
from back.mongodb.pon_com_models import ONTInfo, RegisterONT
from back.mongodb.user_com_models import (
    AuthStatusResponse,
    MembershipRequest,
    MembershipUpdate,
    UserUpdate,
)
from back.server.dependencies import (
    BoxFromUserInPath,
    OptionalCurrentUser,
    OptionalCurrentUserBox,
    RequireCurrentUser,
    StatusUpdateManagerDep,
    UserFromPath,
    get_box,
    must_be_admin,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=AuthStatusResponse)
def _me(
    user: OptionalCurrentUser,
) -> AuthStatusResponse:
    """Get the current user's identity."""
    if not user:
        return AuthStatusResponse(logged_in=False, user=None)
    user.redact_for_non_admin()
    return AuthStatusResponse(logged_in=True, user=user)


@router.get("/me/generateVerificationCode", status_code=201, response_model=None)
async def _me_generate_sms_code(
    user: RequireCurrentUser,
    db: GetDatabase,
) -> User:
    if len(user.valid_sms_codes) >= 2:
        raise HTTPException(
            status_code=400,
            detail="Trop de demandes de code SMS, si le problème persiste contactez fai@rezel.net",
        )
    if user.phone_number_verified:
        raise HTTPException(
            status_code=400,
            detail="Numéro déjà vérifié, si le problème persiste contactez fai@rezel.net",
        )
    if user.phone_number is None:
        raise HTTPException(
            status_code=400,
            detail="Aucun numéro de téléphone défini, si le problème persiste contactez fai@rezel.net",
        )
    code = str(randbelow(1000000)).zfill(6)
    try:
        send_code(user.phone_number, code)
    except Exception as e:
        logging.warning("SMS sending is disabled, not sending code, error : ", e.args)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'envoi du SMS, si le problème persiste contactez fai@rezel.net",
        )
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$set": {
                "valid_sms_codes": user.valid_sms_codes + [code],
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    user = User.model_validate(userdict)
    user.redact_for_non_admin()
    return user


@router.get("/me/checkVerificationCode", status_code=201, response_model=User)
async def _me_check_sms_code(
    code: str,
    user: RequireCurrentUser,
    db: GetDatabase,
) -> User:
    if len(code) != 6 or not code.isdigit():
        raise HTTPException(status_code=400, detail="Format du code incorrect")
    if user.phone_number is None:
        raise HTTPException(
            status_code=400,
            detail="Aucun numéro de téléphone défini, si le problème persiste contactez fai@rezel.net",
        )
    if user.phone_number_verified:
        raise HTTPException(
            status_code=400,
            detail="Numéro déjà vérifié, si le problème persiste contactez fai@rezel.net",
        )
    if user.number_of_tried_sms_code >= 5:
        raise HTTPException(
            status_code=400,
            detail="Trop de tentatives, si le problème persiste contactez fai@rezel.net",
        )
    if user.valid_sms_codes == []:
        raise HTTPException(
            status_code=400,
            detail="Aucun code SMS généré, si le problème persiste contactez fai@rezel.net",
        )
    if code not in user.valid_sms_codes:
        userdict = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "number_of_tried_sms_code": user.number_of_tried_sms_code + 1,
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        user = User.model_validate(userdict)
        user.redact_for_non_admin()
        return user
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$set": {
                "phone_number_verified": True,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    user = User.model_validate(userdict)
    user.redact_for_non_admin()
    return user


@router.post("/me/membershipRequest", status_code=201, response_model=User)
async def _me_create_membership_request(
    request: MembershipRequest,
    user: RequireCurrentUser,
    db: GetDatabase,
) -> User:
    """Request a membership."""
    if user.membership:
        raise HTTPException(status_code=400, detail="User is already a member")

    document_id = generate_contract_draft_for_user(user, request.type)
    prefill_address_in_draft(document_id, request.address)
    links = create_signable_document_from_draft(user, document_id)

    if request.type is MembershipType.FTTH:
        userdict = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "phone_number": request.phone_number,
                    "iban": request.iban,
                    "membership.type": request.type,
                    "membership.ref_commande": f"{request.address.residence.name}-{request.address.appartement_id}-{datetime.today().strftime('%Y%m%d')}-1",
                    "membership.address": request.address.model_dump(mode="json"),
                    "membership.status": MembershipStatus.REQUEST_PENDING_VALIDATION,
                    "membership.equipment_status": EquipmentStatus.PENDING_PROVISIONING,
                    "membership.deposit_status": DepositStatus.NOT_DEPOSITED,
                    "membership.init.payment_method_first_month": request.payment_method_first_month,
                    "membership.init.payment_method_membership": request.payment_method_membership,
                    "membership.init.payment_method_deposit": request.payment_method_deposit,
                    "membership.documenso_contract_id": document_id,
                    "membership.documenso_adherent_url": links[0],
                    "membership.documenso_president_url": links[1],
                },
            },
            return_document=ReturnDocument.AFTER,
        )

    elif request.type is MembershipType.WIFI:
        if not request.ssid:
            raise HTTPException(
                status_code=400, detail="SSID is required for WIFI membership"
            )
        associated_box = await get_box_by_ssid(db, request.ssid)
        if not associated_box:
            raise HTTPException(status_code=404, detail="No box found for this SSID")

        userdict = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "membership.type": request.type,
                    "membership.address": request.address.model_dump(mode="json"),
                    "membership.status": MembershipStatus.REQUEST_PENDING_VALIDATION,
                    "membership.equipment_status": EquipmentStatus.PENDING_PROVISIONING,
                    "membership.deposit_status": DepositStatus.NOT_DEPOSITED,
                    "membership.init.main_unet_id": associated_box.main_unet_id,
                    "membership.init.payment_method_first_month": request.payment_method_first_month,
                    "membership.init.payment_method_membership": request.payment_method_membership,
                    "membership.documenso_contract_id": document_id,
                    "membership.documenso_adherent_url": links[0],
                    "membership.documenso_president_url": links[1],
                },
            },
            return_document=ReturnDocument.AFTER,
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid membership type")

    user = User.model_validate(userdict)

    send_matrix_message(
        f"<h4>🆕 Demande d'abonnement - {request.type.name}</h4>",
        f"Un utilisateur a demandé à s'abonner: {user.first_name} {user.last_name} - {user.email}",
        f"🔗 https://fai.rezel.net/admin/users/{user.id}",
    )

    user.redact_for_non_admin()
    return user


@router.post("/me/availability", response_model=User)
async def _me_add_availability_slots(
    slots: list[AppointmentSlot],
    user: RequireCurrentUser,
    db: GetDatabase,
) -> User:
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$push": {
                "availability_slots": {
                    "$each": [slot.model_dump(mode="json") for slot in slots]
                }
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    send_matrix_message(
        "<h4>⌚ Créneaux de disponibilité</h4>"
        f"{user.first_name} {user.last_name} a ajouté des créneaux de disponibilité",
    )

    user = User.model_validate(userdict)
    user.redact_for_non_admin()

    return user


@router.get("/me/unet", dependencies=[], response_model=UnetProfile)
async def _user_get_unet(
    user: RequireCurrentUser,
    db: GetDatabase,
) -> UnetProfile:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if not user.membership.unetid:
        raise HTTPException(status_code=400, detail="User has no unetid")

    # find the box where the unetid is in the unets Array
    box = await get_box_from_user(db, user)
    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    # get the unet profile from the box
    for unet in box.unets:
        if unet.unet_id == user.membership.unetid:
            return unet

    raise HTTPException(status_code=404, detail="No unet found for this user")


@router.patch("/me/unet", dependencies=[], response_model=UnetProfile)
async def _user_update_unet(
    new_unet: UnetProfile,
    user: RequireCurrentUser,
    box: OptionalCurrentUserBox,
    db: GetDatabase,
) -> UnetProfile:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if not user.membership.unetid:
        raise HTTPException(status_code=400, detail="User has no unetid")

    if not user.membership.unetid == new_unet.unet_id:
        raise HTTPException(
            status_code=400, detail="Unet ID does not match user's unetid"
        )
    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    # check SSID
    if not new_unet.wifi.ssid.startswith("Rezel-"):
        raise HTTPException(
            status_code=400,
            detail="SSID must start with 'Rezel-'",
        )

    # Count the number of boxs containing a unet with the same SSID
    same_ssid_nb = await db.boxes.count_documents(
        {
            "unets": {
                "$elemMatch": {
                    "wifi.ssid": new_unet.wifi.ssid,
                    "unet_id": {"$ne": user.membership.unetid},
                }
            }
        }
    )
    if same_ssid_nb > 0:
        raise HTTPException(
            status_code=400,
            detail=f"SSID {new_unet.wifi.ssid} is already used",
        )

    # update the unet profile in the box, but only the fields
    # that are allowed to be updated by  the user (e.g. not the WAN adresses)
    for unet in box.unets:
        if unet.unet_id == user.membership.unetid:
            for field in [
                "wifi",
                "firewall",
                "dhcp",
            ]:
                setattr(unet, field, getattr(new_unet, field))
            break

    # update the box in the database
    box_dict = await db.boxes.find_one_and_update(
        {"mac": str(box.mac)},
        {
            "$set": {
                "unets": [
                    unet.model_dump(exclude_unset=True, mode="json")
                    for unet in box.unets
                ]
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    box = Box.model_validate(box_dict)

    for unet in box.unets:
        if unet.unet_id == user.membership.unetid:
            return unet

    raise HTTPException(status_code=404, detail="No unet found for this user")


### ADMIN


@router.get(
    "/",
    dependencies=[Depends(must_be_admin)],
    response_model=list[User],
)
async def _get_users(
    db: GetDatabase,
) -> list[User]:
    """Get all users."""
    return await db.users.find().to_list(None)


@router.get(
    "/scholarship-student",
    response_model=list[User],
    dependencies=[Depends(must_be_admin)],
    tags=["scholarship-student"],
)
async def _get_all_scholarship_students(
    db: GetDatabase,
) -> list[User]:
    return await get_all_scholarship_students(db)


@router.post(
    "/scholarship-student/reset",
    dependencies=[Depends(must_be_admin)],
    tags=["scholarship-student"],
)
async def _reset_all_scholarship_students(
    db: GetDatabase,
) -> JSONResponse:
    await reset_all_scholarship_students(db)
    return JSONResponse({"message": "All scholarship students have been reset"})


@router.get(
    "/{user_id}",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_get(
    user: UserFromPath,
) -> User:
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_update(
    user_id: str,
    update: UserUpdate,
    db: GetDatabase,
) -> User:
    # mode="json" is used to avoid issues with sets
    # see https://github.com/pydantic/pydantic/issues/8016#issuecomment-1794530831

    userdict = await db.users.find_one_and_update(
        {"_id": user_id},
        {"$set": update.model_dump(exclude_unset=True, mode="json")},
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


@router.patch(
    "/{user_id}/membership",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_update_membership(
    user_id: str,
    update: MembershipUpdate,
    db: GetDatabase,
    user: UserFromPath,
) -> User:
    """Edit the user's membership."""
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    # Remove all non-set fields from the update
    updatedict = {
        key: getattr(update, key)
        for key, _dict_value in update.model_dump(
            exclude_unset=True, mode="json"
        ).items()
    }

    updated = user.membership.model_copy(update=updatedict)

    userdict = await db.users.find_one_and_update(
        {"_id": user_id},
        {"$set": {"membership": updated.model_dump(exclude_unset=True, mode="json")}},
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


@router.delete(
    "/{user_id}/membership",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_delete_membership(
    user_id: str,
    db: GetDatabase,
    user: UserFromPath,
    box: BoxFromUserInPath,
) -> User:
    """Delete the user's membership."""
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if box or user.membership.unetid:
        raise HTTPException(
            status_code=400, detail="User is still linked to a box or unet"
        )

    if box and await get_ont_from_box(db, box):
        raise HTTPException(status_code=400, detail="User is still linked to an ONT")

    # Actually just move the membership to prev_memberships so we keep
    # Orange references and stuff. Let's archive instead of pure deletion.
    user.membership.deleted_date = datetime.now()
    userdict = await db.users.find_one_and_update(
        {"_id": user_id},
        {
            "$push": {"prev_memberships": user.membership.model_dump(mode="json")},
            "$unset": {"membership": ""},
        },
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


@router.get(
    "/{user_id}/ont",
    dependencies=[Depends(must_be_admin)],
)
async def _user_get_ont(
    db: GetDatabase,
    box: BoxFromUserInPath,
) -> ONTInfo:
    if not box:
        raise HTTPException(
            status_code=404,
            detail="No box found for this user. The user is likely not linked to the main unet of a box",
        )

    ont_info = await get_ontinfo_from_box(db, box)

    if not ont_info:
        raise HTTPException(
            status_code=404,
            detail="No ONT found for this box.",
        )

    return ont_info


@router.post(
    "/{user_id}/ont",
    dependencies=[Depends(must_be_admin)],
)
async def _user_register_ont(
    register: RegisterONT,
    db: GetDatabase,
    box: BoxFromUserInPath,
) -> ONTInfo:
    if not box:
        raise HTTPException(
            status_code=404,
            detail="No box found for this user. Please register a box before registering an ONT.",
        )
    try:
        ont_info = await register_ont_for_new_ftth_adh(
            db,
            register.pm_id,
            register.serial_number,
            register.software_version,
            box,
            register.position_pm,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    register_ont_in_olt(register.serial_number)

    return ont_info


@router.get(
    "/{user_id}/box",
    dependencies=[Depends(must_be_admin)],
    response_model=Box,
)
async def _user_get_box(
    user: UserFromPath,
    box: BoxFromUserInPath,
) -> Box:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if not user.membership.unetid:
        raise HTTPException(status_code=404, detail="User has no unetid")

    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    return box


@router.post(
    "/{user_id}/box",
    dependencies=[Depends(must_be_admin)],
    response_model=Box,
)
async def _user_register_box(
    box_type: str,
    ptah_profile: str,
    telecomian: bool,
    mac_address: str,
    db: GetDatabase,
    user: UserFromPath,
) -> Box:
    if not user.membership or user.membership.unetid:
        raise HTTPException(
            status_code=400,
            detail="User has no membership or already has a unetid attached",
        )

    mac_address = mac_address.lower()

    if await db.boxes.find_one({"mac": str(mac_address)}):
        raise HTTPException(
            status_code=400, detail="Box with this MAC address already exists"
        )

    new_box = await register_box_for_new_ftth_adh(
        db, box_type, ptah_profile, mac_address, telecomian
    )

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=" ".join(
                [
                    f"Main unet {new_box.main_unet_id} created on new box {mac_address}",
                    f"for {user.first_name} {user.last_name}",
                    f"({user.membership.address.residence.name} - {user.membership.address.appartement_id})",
                ]
            ),
        ),
    )

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.unetid": new_box.main_unet_id}},
    )

    return new_box


@router.post(
    "/{user_id}/unet",
    dependencies=[Depends(must_be_admin)],
    response_model=Box,
)
async def _user_register_unet(
    telecomian: bool,
    mac_address: str,
    db: GetDatabase,
    user: UserFromPath,
) -> Box:
    if not user.membership or user.membership.unetid:
        raise HTTPException(
            status_code=400,
            detail="User has no membership or already has a unetid attached",
        )

    mac_address = mac_address.lower()

    box_dict = await db.boxes.find_one({"mac": str(mac_address)})
    if not box_dict:
        raise HTTPException(status_code=400, detail="Box with this MAC does not exist")

    box = Box.model_validate(box_dict)

    unet_profile = await register_unet_on_box(db, box, telecomian)

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=" ".join(
                [
                    f"Unet {unet_profile.unet_id} created on existing box {mac_address}",
                    f"for {user.first_name} {user.last_name}",
                    f"({user.membership.address.residence.name} - {user.membership.address.appartement_id})",
                ]
            ),
        ),
    )

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.unetid": unet_profile.unet_id}},
    )

    await db.users.update_one(
        {"membership.unetid": box.main_unet_id},
        {
            "$push": {
                "membership.attached_wifi_adherents": {
                    "user_id": str(user.id),
                    # Because unet will be available tomorrow at 6:00, when
                    # the box is reconfigured
                    "from_date": datetime.today() + timedelta(days=1),
                    "comment": "",
                }
            }
        },
    )

    return box


@router.delete(
    "/{user_id}/unet",
    dependencies=[Depends(must_be_admin)],
    response_model=Box,
)
async def _user_delete_unet(
    db: GetDatabase,
    user: UserFromPath,
    box: BoxFromUserInPath,
) -> Box:
    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    if not user.membership or not user.membership.unetid:
        raise HTTPException(
            status_code=400,
            detail="User has no unetid attached",
        )

    if user.membership.unetid == box.main_unet_id:
        raise HTTPException(
            status_code=400, detail="Cannot delete the main unet of a box"
        )

    await delete_unet_of_wifi_adherent(user, db)

    updated_box = Box.model_validate(await db.boxes.find_one({"mac": str(box.mac)}))

    return updated_box


@router.get(
    "/{user_id}/next-membership-status",
    dependencies=[Depends(must_be_admin)],
    response_model=StatusUpdateInfo,
)
async def _user_get_next_membership_status(
    db: GetDatabase,
    user: UserFromPath,
    status_update_manager: StatusUpdateManagerDep,
) -> StatusUpdateInfo:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    possible_updates = status_update_manager.get_possible_updates_from(
        user.membership.type, user.membership.status
    )

    if not possible_updates:
        raise HTTPException(status_code=404, detail="No possible status update found")

    return await StatusUpdateInfo.from_status_update(
        db,
        user,
        possible_updates[0],
    )


@router.post(
    "/{user_id}/next-membership-status",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_update_membership_status(
    next_status: MembershipStatus,
    user: UserFromPath,
    db: GetDatabase,
    status_update_manager: StatusUpdateManagerDep,
) -> User:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    possible_updates = status_update_manager.get_possible_updates_from(
        user.membership.type, user.membership.status
    )

    if not any(update.to_status == next_status for update in possible_updates):
        raise HTTPException(
            status_code=400, detail="This status update is not possible"
        )

    update = next(
        update for update in possible_updates if update.to_status == next_status
    )

    if await update.check_conditions(user, db):
        raise HTTPException(
            status_code=400,
            detail="The following conditions are not met: "
            + ", ".join(map(lambda c: c.description, update.conditions)),
        )

    return await update.apply_effects(user, db)


@router.post(
    "/{user_id}/generate_new_contract",
    dependencies=[Depends(must_be_admin)],
    response_model=User,
)
async def _user_generate_new_contract(
    user: UserFromPath,
    db: GetDatabase,
) -> User:
    """
    Generate a new contract for the user.
    If the user already has a contract, it will be deleted.
    """
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if user.membership.documenso_contract_id:
        delete_document(user.membership.documenso_contract_id)

    try:
        document_id = generate_contract_draft_for_user(user, user.membership.type)
        prefill_address_in_draft(document_id, user.membership.address)
        links = create_signable_document_from_draft(user, document_id)
    except ValueError as e:
        # If we can't generate a new contract, we should at least delete the old one
        # from the database
        await db.users.update_one(
            {"_id": str(user.id)},
            {
                "$set": {
                    "membership.contract_signed": False,
                    "membership.documenso_contract_id": None,
                    "membership.documenso_adherent_url": None,
                    "membership.documenso_president_url": None,
                }
            },
        )
        raise HTTPException(status_code=500, detail=str(e)) from e

    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$set": {
                "membership.contract_signed": False,
                "membership.documenso_contract_id": document_id,
                "membership.documenso_adherent_url": links[0],
                "membership.documenso_president_url": links[1],
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    send_matrix_message(
        "<h4>🆕 Nouveau contrat généré manuellement</h4>",
        f"👤 {user.first_name} {user.last_name}",
        f"🔗 https://fai.rezel.net/admin/users/f{user.id}",
    )

    return User.model_validate(userdict)


@router.post(
    "/{user_id}/transfer-devices",
    dependencies=[Depends(must_be_admin)],
    response_model=None,
)
async def _user_transfer_devices(
    target_user_id: str,
    db: GetDatabase,
    user: UserFromPath,
    box: BoxFromUserInPath,
) -> None:
    """
    Transfer all devices from one user to another.
    """
    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    ont = await get_ont_from_box(db, box)
    if not ont:
        raise HTTPException(status_code=404, detail="No ONT found for this user")

    target_user = await db.users.find_one({"_id": target_user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    target_user = User.model_validate(target_user)

    if not target_user.membership or target_user.membership.type != MembershipType.FTTH:
        raise HTTPException(
            status_code=400, detail="Target user has no FTTH membership"
        )

    target_user_current_box = await get_box(db, target_user)
    if target_user_current_box:
        raise HTTPException(status_code=400, detail="Target user already has a box")

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$unset": {"membership.unetid": ""}},
    )

    await db.users.find_one_and_update(
        {"_id": target_user_id},
        {"$set": {"membership.unetid": box.main_unet_id}},
    )

    main_unet = next(unet for unet in box.unets if unet.unet_id == box.main_unet_id)

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=" ".join(
                [
                    f"Transferred ONT {ont.serial_number} and Box {box.mac} from {user.first_name} {user.last_name}",
                    f"to {target_user.first_name} {target_user.last_name}. Main unet {main_unet.unet_id}",
                    f"has been assigned to {target_user.first_name} {target_user.last_name} ",
                    f"({target_user.membership.address.residence.name} - {target_user.membership.address.appartement_id}).",
                    f"IP addresses & blocks are {main_unet.network.wan_ipv4.ip} and",
                    f"{main_unet.network.ipv6_prefix}",
                ]
            ),
        ),
    )


@router.post(
    "/{user_id}/pay-user-partial-refunds",
    dependencies=[Depends(must_be_admin)],
)
async def _pay_user_refunds(
    user: UserFromPath,
    db: GetDatabase,
) -> JSONResponse:
    result = await db.partial_refunds.update_many(
        {"user_id": str(user.id), "paid": False},
        {"$set": {"paid": True}},
    )
    if result.modified_count == 0:
        return JSONResponse(
            {
                "message": "No refunds found for this user or all refunds are already paid"
            },
            status_code=404,
        )
    return JSONResponse(
        {
            "message": f"{result.modified_count} refunds marked as paid for {user.first_name}"
        }
    )
