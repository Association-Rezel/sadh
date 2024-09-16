"""Get or edit users."""

from datetime import datetime

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.charon import register_ont_in_olt
from back.core.documenso import (
    create_signable_document_from_draft,
    delete_document,
    generate_contract_draft_for_user,
    prefill_address_in_draft,
)
from back.core.hermes import register_box_for_new_ftth_adh, register_unet_on_box
from back.core.pon import get_ontinfo_from_box, register_ont_for_new_ftth_adh
from back.core.status_update import StatusUpdateInfo, StatusUpdateManager
from back.messaging.matrix import send_matrix_message
from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.mongodb.pon_models import ONTInfo, RegisterONT
from back.mongodb.user_models import (
    AppointmentSlot,
    DepositStatus,
    EquipmentStatus,
    MembershipRequest,
    MembershipStatus,
    MembershipType,
    MembershipUpdate,
    User,
    UserUpdate,
)
from back.server.dependencies import (
    get_box_from_user_id,
    get_status_update_manager,
    get_user_from_user_id,
    get_user_me,
    must_be_sadh_admin,
)
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("users")


@router.get("/me", response_model=User)
def _me(
    user: User = get_user_me,
) -> User:
    """Get the current user's identity."""
    user.redact_for_non_admin()
    return user


@router.post("/me/membershipRequest", status_code=201, response_model=User)
async def _me_create_membership_request(
    request: MembershipRequest,
    user: User = get_user_me,
    db: AsyncIOMotorDatabase = get_db,
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
                    "membership.type": request.type,
                    "membership.ref_commande": f"{request.address.residence.name}-{request.address.appartement_id}-{datetime.today().strftime('%Y%m%d')}-1",
                    "membership.address": request.address.model_dump(mode="json"),
                    "membership.status": MembershipStatus.REQUEST_PENDING_VALIDATION,
                    "membership.equipment_status": EquipmentStatus.PENDING_PROVISIONING,
                    "membership.deposit_status": DepositStatus.NOT_DEPOSITED,
                    "membership.init.payment_method_first_month": request.payment_method_first_month,
                    "membership.init.payment_method_deposit": request.payment_method_deposit,
                    "membership.documenso_contract_id": document_id,
                    "membership.documenso_adherent_url": links[0],
                    "membership.documenso_president_url": links[1],
                },
            },
            return_document=ReturnDocument.AFTER,
        )

    elif request.type is MembershipType.WIFI:
        userdict = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "membership.type": request.type,
                    "membership.address": request.address.model_dump(mode="json"),
                    "membership.status": MembershipStatus.REQUEST_PENDING_VALIDATION,
                    "membership.equipment_status": EquipmentStatus.PENDING_PROVISIONING,
                    "membership.deposit_status": DepositStatus.NOT_DEPOSITED,
                    "membership.init.ssid": request.ssid,
                    "membership.init.payment_method_first_month": request.payment_method_first_month,
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
        f"<h4>🆕 Demande d'adhésion - {request.type.name}</h4>",
        f"Un utilisateur a demandé à adhérer: {user.first_name} {user.last_name} - {user.email}",
        f"🔗 https://fai.rezel.net/admin/users/f{user.id}",
    )

    user.redact_for_non_admin()
    return user


@router.post("/me/availability", response_model=User)
async def _me_add_availability_slots(
    slots: list[AppointmentSlot],
    user: User = get_user_me,
    db: AsyncIOMotorDatabase = get_db,
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


### ADMIN


@router.get("/", dependencies=[must_be_sadh_admin], response_model=list[User])
async def _get_users(
    db: AsyncIOMotorDatabase = get_db,
) -> list[User]:
    """Get all users."""
    return await db.users.find().to_list(None)


@router.get("/{user_id}", dependencies=[must_be_sadh_admin], response_model=User)
async def _user_get(
    user: User = get_user_from_user_id,
) -> User:
    return user


@router.patch("/{user_id}", dependencies=[must_be_sadh_admin], response_model=User)
async def _user_update(
    user_id: str,
    update: UserUpdate,
    db: AsyncIOMotorDatabase = get_db,
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
    "/{user_id}/membership", dependencies=[must_be_sadh_admin], response_model=User
)
async def _user_update_membership(
    user_id: str,
    update: MembershipUpdate,
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_from_user_id,
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


@router.get("/{user_id}/ont", dependencies=[must_be_sadh_admin])
async def _user_get_ont(
    db: AsyncIOMotorDatabase = get_db,
    box: Box | None = get_box_from_user_id,
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


@router.post("/{user_id}/ont", dependencies=[must_be_sadh_admin])
async def _user_register_ont(
    register: RegisterONT,
    db: AsyncIOMotorDatabase = get_db,
    box: Box | None = get_box_from_user_id,
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


@router.get("/{user_id}/box", dependencies=[must_be_sadh_admin], response_model=Box)
async def _user_get_box(
    user: User = get_user_from_user_id,
    box: Box | None = get_box_from_user_id,
) -> Box:
    if not user.membership:
        raise HTTPException(status_code=400, detail="User has no membership")

    if not user.membership.unetid:
        raise HTTPException(status_code=404, detail="User has no unetid")

    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")

    return box


@router.post("/{user_id}/box", dependencies=[must_be_sadh_admin], response_model=Box)
async def _user_register_box(
    box_type: str,
    telecomian: bool,
    mac_address: str,
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_from_user_id,
) -> Box:
    if not user.membership or user.membership.unetid:
        raise HTTPException(
            status_code=400,
            detail="User has no membership or already has a unetid attached",
        )

    if await db.boxes.find_one({"mac": str(mac_address)}):
        raise HTTPException(
            status_code=400, detail="Box with this MAC address already exists"
        )

    new_box = await register_box_for_new_ftth_adh(db, box_type, mac_address, telecomian)

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.unetid": new_box.main_unet_id}},
    )

    return new_box


@router.post("/{user_id}/unet", dependencies=[must_be_sadh_admin], response_model=Box)
async def _user_register_unet(
    telecomian: bool,
    mac_address: str,
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_from_user_id,
) -> Box:
    if not user.membership or user.membership.unetid:
        raise HTTPException(
            status_code=400,
            detail="User has no membership or already has a unetid attached",
        )

    box_dict = await db.boxes.find_one({"mac": str(mac_address)})
    if not box_dict:
        raise HTTPException(status_code=400, detail="Box with this MAC does not exist")

    box = Box.model_validate(box_dict)

    unet_profile = await register_unet_on_box(db, box, telecomian)

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.unetid": unet_profile.unet_id}},
    )

    return box


@router.delete("/{user_id}/unet", dependencies=[must_be_sadh_admin], response_model=Box)
async def _user_delete_unet(
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_from_user_id,
    box: Box | None = get_box_from_user_id,
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

    box = Box.model_validate(
        await db.boxes.find_one_and_update(
            {"mac": str(box.mac)},
            {"$pull": {"unets": {"unet_id": user.membership.unetid}}},
            return_document=ReturnDocument.AFTER,
        )
    )

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$unset": {"membership.unetid": ""}},
    )

    return box


@router.get(
    "/{user_id}/next-membership-status",
    dependencies=[must_be_sadh_admin],
    response_model=StatusUpdateInfo,
)
async def _user_get_next_membership_status(
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_from_user_id,
    status_update_manager: StatusUpdateManager = get_status_update_manager,
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
    dependencies=[must_be_sadh_admin],
    response_model=User,
)
async def _user_update_membership_status(
    next_status: MembershipStatus,
    user: User = get_user_from_user_id,
    db: AsyncIOMotorDatabase = get_db,
    status_update_manager: StatusUpdateManager = get_status_update_manager,
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
    dependencies=[must_be_sadh_admin],
    response_model=User,
)
async def _user_generate_new_contract(
    user: User = get_user_from_user_id,
    db: AsyncIOMotorDatabase = get_db,
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
