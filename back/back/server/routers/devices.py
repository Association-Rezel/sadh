import re
from datetime import datetime

from common_models.hermes_models import Box
from common_models.log_models import IpamLog
from common_models.pon_models import ONT
from common_models.user_models import User
from fastapi import APIRouter, Depends, HTTPException
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
from back.mongodb.db import GetDatabase
from back.mongodb.pon_com_models import ONTInfo
from back.server.dependencies import BoxFromMacStr, must_be_admin

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get(
    "/box",
    response_model=list[Box],
    dependencies=[Depends(must_be_admin)],
)
async def _list_boxes(
    db: GetDatabase,
) -> list[Box]:
    return [Box.model_validate(box) for box in await db.boxes.find().to_list(None)]


@router.get(
    "/box/by_ssid/{ssid}",
    response_model=Box,
    dependencies=[Depends(must_be_admin)],
)
async def _get_box_by_ssid(
    ssid: str,
    db: GetDatabase,
) -> Box:
    box_dict = await db.boxes.find_one(
        {"unets.wifi.ssid": re.compile(f"^{ssid}$", re.IGNORECASE)}
    )

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)


@router.get(
    "/box/by_unet_id/{main_unet_id}",
    response_model=Box,
    dependencies=[Depends(must_be_admin)],
)
async def _get_box_by_unet_id(
    main_unet_id: str,
    db: GetDatabase,
) -> Box:
    box_dict = await db.boxes.find_one({"main_unet_id": main_unet_id})

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)


@router.get(
    "/box/by_mac/{mac}",
    response_model=Box,
    dependencies=[Depends(must_be_admin)],
)
async def _get_box_by_mac(
    box: BoxFromMacStr,
) -> Box:
    return box


@router.delete(
    "/box/{mac_str}",
    response_model=Box,
    dependencies=[Depends(must_be_admin)],
)
async def _delete_box_by_mac(
    box: BoxFromMacStr,
    db: GetDatabase,
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
    dependencies=[Depends(must_be_admin)],
)
async def _update_box_mac(
    new_mac: str,
    box: BoxFromMacStr,
    db: GetDatabase,
) -> Box:
    """Replace the MAC address of a box."""

    new_mac = new_mac.lower()

    existing_box = await db.boxes.find_one({"mac": new_mac})
    if existing_box:
        raise HTTPException(
            status_code=400,
            detail="A box with this MAC address already exists",
        )

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


@router.patch(
    "/box/{mac_str}/ptah_profile/{new_ptah_profile}",
    response_model=Box,
    dependencies=[Depends(must_be_admin)],
)
async def _update_box_ptah_profile(
    new_ptah_profile: str,
    box: BoxFromMacStr,
    db: GetDatabase,
) -> Box:
    """Replace the MAC address of a box."""

    new_ptah_profile = new_ptah_profile.lower()

    updated_box = Box.model_validate(
        await db.boxes.find_one_and_update(
            {"mac": str(box.mac)},
            {"$set": {"ptah_profile": new_ptah_profile}},
            return_document=ReturnDocument.AFTER,
        )
    )
    if not updated_box:
        raise HTTPException(
            status_code=404,
            detail="Box not found",
        )

    return updated_box


@router.get(
    "/ont",
    response_model=list[ONT],
    dependencies=[Depends(must_be_admin)],
)
async def _list_onts(
    db: GetDatabase,
) -> list[ONT]:
    return [
        ONT.model_validate(ont)
        async for ont in db.pms.aggregate(
            [
                {"$unwind": "$pon_list"},
                {"$unwind": "$pon_list.ont_list"},
                {"$replaceRoot": {"newRoot": "$pon_list.ont_list"}},
            ]
        )
    ]


@router.get(
    "/ont/{serial_number}",
    response_model=ONTInfo,
    dependencies=[Depends(must_be_admin)],
)
async def _get_ont_by_serial_number(
    serial_number: str,
    db: GetDatabase,
) -> ONTInfo:
    ont_info = await get_ontinfo_from_serial_number(db, serial_number)

    if not ont_info:
        raise HTTPException(status_code=404, detail="ONT not found")

    return ont_info


@router.delete(
    "/ont/{serial_number}",
    response_model=ONTInfo,
    dependencies=[Depends(must_be_admin)],
)
async def _delete_ont_by_serial_number(
    serial_number: str,
    db: GetDatabase,
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
    dependencies=[Depends(must_be_admin)],
)
async def _update_ont_box(
    new_mac: str,
    serial_number: str,
    db: GetDatabase,
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


@router.get(
    "/box/{mac_str}/users",
    response_model=list[User],
    dependencies=[Depends(must_be_admin)],
)
async def _get_users_on_box(
    box: BoxFromMacStr,
    db: GetDatabase,
) -> list[User]:
    return await get_users_on_box(db, box)
