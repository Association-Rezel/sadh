import re
from datetime import datetime

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.charon import register_ont_in_olt
from back.core.hermes import get_users_on_box
from back.core.ipam_logging import create_log
from back.core.pon import (
    get_ont_from_box,
    get_ontinfo_from_box,
    get_ontinfo_from_serial_number,
)
from back.messaging.matrix import send_matrix_message
from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.mongodb.log_models import IpamLog
from back.mongodb.pon_models import ONTInfo
from back.server.dependencies import get_box_from_mac_str, must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("devices")


@router.get(
    "/box/by_ssid/{ssid}",
    response_model=Box,
    dependencies=[must_be_sadh_admin],
)
async def _get_box_by_ssid(
    ssid: str,
    db: AsyncIOMotorDatabase = get_db,
) -> Box:
    box_dict = await db.boxes.find_one(
        {"unets.wifi.ssid": re.compile(f"^{ssid}$", re.IGNORECASE)}
    )

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)


@router.get(
    "/box/by_mac/{mac}",
    response_model=Box,
    dependencies=[must_be_sadh_admin],
)
async def _get_box_by_mac(
    box: Box = get_box_from_mac_str,
) -> Box:
    return box


@router.delete(
    "/box/{mac_str}",
    response_model=Box,
    dependencies=[must_be_sadh_admin],
)
async def _delete_box_by_mac(
    box: Box = get_box_from_mac_str,
    db: AsyncIOMotorDatabase = get_db,
) -> Box:
    if len(box.unets) > 1:
        raise HTTPException(
            status_code=400, detail="There must be only the main unet left"
        )

    if await get_ontinfo_from_box(db, box):
        raise HTTPException(
            status_code=400, detail="This box still has an ONT attached"
        )

    users = await get_users_on_box(db, box)

    if len(users) != 1:
        raise HTTPException(
            status_code=500,
            detail="Internal error. There is only one unet on the box but zero or more than one users are associated with it",
        )

    user = users[0]

    await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$unset": {"membership.unetid": ""}},
    )

    result = await db.boxes.delete_one({"mac": str(box.mac)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Box not found")

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=" ".join(
                [
                    f"Deleted unet {box.unets[0].unet_id} which had {box.unets[0].network.wan_ipv4.ip}",
                    f"and {box.unets[0].network.ipv6_prefix} assigned.",
                ]
            ),
        ),
    )

    return box


@router.patch(
    "/box/{mac_str}/mac/{new_mac}",
    response_model=Box,
    dependencies=[must_be_sadh_admin],
)
async def _update_box_mac(
    new_mac: str,
    box: Box = get_box_from_mac_str,
    db: AsyncIOMotorDatabase = get_db,
) -> Box:
    """Replace the MAC address of a box."""
    updated_box = Box.model_validate(
        await db.boxes.find_one_and_update(
            {"mac": str(box.mac)},
            {"$set": {"mac": new_mac}},
            return_document=ReturnDocument.AFTER,
        )
    )

    ont = await get_ont_from_box(db, box)
    if ont:
        result = await db.pms.update_many(
            {},
            {"$set": {"pon_list.$[].ont_list.$[ont].box_mac_address": new_mac}},
            array_filters=[{"ont.serial_number": ont.serial_number}],
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to update the attached ONT",
            )

        if result.modified_count > 1:
            send_matrix_message(
                f"❌ Plusieurs ONTs avec le même numéro de série {ont.serial_number} ont été modifiés"
            )

    return updated_box


@router.get(
    "/ont/{serial_number}",
    response_model=ONTInfo,
    dependencies=[must_be_sadh_admin],
)
async def _get_ont_by_serial_number(
    serial_number: str,
    db: AsyncIOMotorDatabase = get_db,
) -> ONTInfo:
    ont_info = await get_ontinfo_from_serial_number(db, serial_number)

    if not ont_info:
        raise HTTPException(status_code=404, detail="ONT not found")

    return ont_info


@router.delete(
    "/ont/{serial_number}",
    response_model=ONTInfo,
    dependencies=[must_be_sadh_admin],
)
async def _delete_ont_by_serial_number(
    serial_number: str,
    db: AsyncIOMotorDatabase = get_db,
) -> ONTInfo:
    ont_info = await get_ontinfo_from_serial_number(db, serial_number)

    if not ont_info:
        raise HTTPException(status_code=404, detail="ONT not found")

    result = await db.pms.update_many(
        {},
        {"$pull": {"pon_list.$[].ont_list": {"serial_number": serial_number}}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete the ONT")

    if result.modified_count > 1:
        send_matrix_message(
            f"❌ Plusieurs ONTs avec le même numéro de série {serial_number} ont été supprimés"
        )

    return ont_info


@router.patch(
    "/ont/{serial_number}/box",
    response_model=ONTInfo,
    dependencies=[must_be_sadh_admin],
)
async def _update_ont_box(
    new_mac: str,
    serial_number: str,
    db: AsyncIOMotorDatabase = get_db,
) -> ONTInfo:
    result = await db.pms.update_many(
        {},
        {"$set": {"pon_list.$[].ont_list.$[ont].box_mac_address": new_mac}},
        array_filters=[{"ont.serial_number": serial_number}],
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=404,
            detail="ONT not found",
        )

    if result.modified_count > 1:
        send_matrix_message(
            f"❌ Plusieurs ONTs avec le même numéro de série {serial_number} ont été modifiés"
        )

    ont_info = await get_ontinfo_from_serial_number(db, serial_number)
    if not ont_info:
        raise HTTPException(
            status_code=500, detail="ONT not found (after being updated ??)"
        )

    return ont_info


@router.post(
    "/ont/{serial_number}/register_in_olt",
    response_model=None,
)
async def _register_ont_in_olt(
    serial_number: str,
) -> None:
    """Force the registration of an ONT in the OLT."""

    return register_ont_in_olt(serial_number)
