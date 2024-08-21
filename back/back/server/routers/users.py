"""Get or edit users."""

from pprint import pprint

import nextcloud_client.nextcloud_client
from fastapi import HTTPException
from fastapi import Response as FastAPIResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from pymongo import ReturnDocument

from back.core.hermes import register_box_for_new_ftth_adh
from back.core.pon import position_in_pon_to_mec128_string, register_ont_for_new_ftth_adh
from back.messaging.mails import send_email_contract
from back.messaging.matrix import send_matrix_message
from back.middlewares.dependencies import get_box_from_user_id, get_user_from_user_id, get_user_me, must_be_sadh_admin
from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.mongodb.pon_models import ONT, PM, ONTInfos, RegisterONT
from back.mongodb.user_models import (
    Address,
    AppointmentSlot,
    DepositStatus,
    EquipmentStatus,
    MembershipRequest,
    MembershipStatus,
    MembershipUpdate,
    User,
    UserUpdate,
)
from back.nextcloud import NEXTCLOUD
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("users")


@router.get("/me", response_model=User)
def _me(
    user: User = get_user_me,
):
    """Get the current user's identity."""
    if user.membership:
        user.membership.redact_for_non_admin()
    return user


class CreateMembership(BaseModel):
    address: Address
    phone_number: str


@router.post("/me/membershipRequest", status_code=201, response_model=User)
async def _me_create_membershipRequest(
    request: MembershipRequest,
    user: User = get_user_me,
    db: AsyncIOMotorDatabase = get_db,
):
    """Request a membership."""

    if user.membership:
        raise HTTPException(status_code=400, detail="User is already a member")

    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$set": {
                "phone_number": request.phone_number,
                "membership.address": request.address.model_dump(mode="json"),
                "membership.status": MembershipStatus.REQUEST_PENDING_VALIDATION,
                "membership.equipment_status": EquipmentStatus.PENDING_PROVISIONING,
                "membership.deposit_status": DepositStatus.NOT_DEPOSITED,
                "membership.init.payment_method_first_month": request.payment_method_first_month,
                "membership.init.payment_method_deposit": request.payment_method_deposit,
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    user = User.model_validate(userdict)

    send_matrix_message(
        "<h4>🆕 Demande d'adhésion</h4>",
        f"Un utilisateur a demandé à adhérer: {user.first_name} {user.last_name} - {user.email}",
    )

    send_email_contract(user.email, user.first_name + " " + user.last_name)
    return user


@router.get("/me/contract")
def _me_get_contract(
    user: User = get_user_me,
) -> FastAPIResponse:
    try:
        tmp_filename, tmp_dir = NEXTCLOUD.get_file(f"{user.id}.pdf")
    except nextcloud_client.nextcloud_client.HTTPResponseError:
        raise HTTPException(status_code=404, detail="User not found")
    with open(tmp_filename, "rb") as f:
        contract = f.read()
    tmp_dir.cleanup()
    return FastAPIResponse(content=contract, media_type="application/pdf")


@router.post("/me/availability", response_model=User)
async def _me_add_availability_slots(
    slots: list[AppointmentSlot],
    user: User = get_user_me,
    db: AsyncIOMotorDatabase = get_db,
) -> User:
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$push": {"availability_slots": {"$each": [slot.model_dump(mode="json") for slot in slots]}}},
        return_document=ReturnDocument.AFTER,
    )

    send_matrix_message(
        "<h4>⌚ Créneaux de disponibilité</h4>"
        f"{user.first_name} {user.last_name} a ajouté des créneaux de disponibilité",
    )

    return User.model_validate(userdict)


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


@router.patch("/{user_id}/membership", dependencies=[must_be_sadh_admin], response_model=User)
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
        key: getattr(update, key) for key, _dict_value in update.model_dump(exclude_unset=True, mode="json").items()
    }

    print(updatedict)

    updated = user.membership.model_copy(update=updatedict)

    userdict = await db.users.find_one_and_update(
        {"_id": user_id},
        {"$set": {"membership": updated.model_dump(exclude_unset=True, mode="json")}},
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


@router.get("/{user_id}/contract", dependencies=[must_be_sadh_admin])
def _user_get_contract(
    user: User = get_user_from_user_id,
) -> FastAPIResponse:
    try:
        tmp_filename, tmp_dir = NEXTCLOUD.get_file(f"{user.id}.pdf")
    except nextcloud_client.nextcloud_client.HTTPResponseError:
        raise HTTPException(status_code=404, detail="User not found")
    with open(tmp_filename, "rb") as f:
        contract = f.read()
    tmp_dir.cleanup()
    return FastAPIResponse(content=contract, media_type="application/pdf")


# @router.post("/{user_id}/contract", dependencies=[must_be_sadh_admin])
# async def _user_upload_contract(
#     file: UploadFile,
#     user: User = get_user_from_sub,
# ):
#     temp_dir = tempfile.TemporaryDirectory()
#     tmp_filename = os.path.join(temp_dir.name, f"{user.sub}.pdf")
#     with open(tmp_filename, "wb") as f:
#         f.write(file.file.read())
#     NEXTCLOUD.put_file(tmp_filename)
#     send_email_signed_contract(user.email, tmp_filename)
#     temp_dir.cleanup()


@router.get("/{user_id}/ont", dependencies=[must_be_sadh_admin])
async def _user_get_ont(
    db: AsyncIOMotorDatabase = get_db,
    box: Box | None = get_box_from_user_id,
) -> ONTInfos:
    if not box:
        raise HTTPException(
            status_code=404,
            detail="No box found for this user. The user is likely not linked to the main unet of a box",
        )

    pm = await db.pms.find_one({"pon_list.ont_list.box_mac_address": box.mac})

    if not pm:  # No PM has this ONT
        raise HTTPException(status_code=404, detail="No ONT found for this user")

    pm = PM.model_validate(pm)

    ont = [ont for pon in pm.pon_list for ont in pon.ont_list if ont.box_mac_address == box.mac][0]

    ont_infos = ONTInfos(
        serial_number=ont.serial_number,
        software_version=ont.software_version,
        box_mac_address=ont.box_mac_address,
        mec128_position=position_in_pon_to_mec128_string(pm.pon_list[0], ont.position_in_pon),
        olt_interface=pm.pon_list[0].olt_interface,
        pm_description=pm.description,
        position_in_subscriber_panel=ont.position_in_subscriber_panel,
        pon_rack=pm.pon_list[0].rack,
        pon_tiroir=pm.pon_list[0].tiroir,
    )

    return ont_infos


@router.post("/{user_id}/ont", dependencies=[must_be_sadh_admin])
async def _user_register_ont(
    register: RegisterONT,
    db: AsyncIOMotorDatabase = get_db,
) -> ONTInfos:
    try:
        ont_infos = await register_ont_for_new_ftth_adh(
            db, register.pm_id, register.serial_number, register.software_version, register.box_mac_address
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ont_infos


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
        raise HTTPException(status_code=400, detail="User has no membership or already has a unetid attached")

    if await db.boxes.find_one({"mac": mac_address}):
        raise HTTPException(status_code=400, detail="Box with this MAC address already exists")

    new_box = await register_box_for_new_ftth_adh(db, box_type, mac_address, telecomian)

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"membership.unetid": new_box.main_unet_id}},
    )

    return new_box


# TODO Remove probably useless
# @router.post("/{user_id}/availability", dependencies=[must_be_sadh_admin], response_model=Box)
# async def _user_create_appointment_slots(
#     user_id: str,
#     slots: list[AppointmentSlot],
#     db: AsyncIOMotorDatabase = get_db,
# ) -> list[AppointmentSlot]:
#     """Submit appointment slots."""
#     user = await db.users.find_one({"_id": user_id})
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     user = await db.users.find_one_and_update(
#         {"_id": user_id},
#         {"$push": {"availability_slots": slots}},
#         return_document=ReturnDocument.AFTER,
#     )

#     return user.availability_slots
