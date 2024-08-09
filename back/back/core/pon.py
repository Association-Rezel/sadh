from typing import Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from back.mongodb.pon_models import ONT, PM, PON, ONTInfos


def get_first_free_port(pm: PM) -> Tuple[PON, int]:
    for pon in pm.pon_list:
        for i in range(1, pon.number_of_ports + 1):
            if not any(ont.position_in_pon == i for ont in pon.ont_list):
                return pon, i
    raise ValueError("No free port available")


def position_in_pon_to_mec128_string(pm: PM, pon: PON, position_in_pon: int) -> str:
    offset = 0
    for pon_idx in sorted(pm.pon_list, key=lambda pon: pon.local_pon_id):
        if pon_idx.local_pon_id < pon.local_pon_id:
            offset += pon_idx.number_of_ports
        else:
            break

    return f"{chr(ord('A') + offset + position_in_pon // 8)}{position_in_pon % 8}"


async def register_ont_for_new_ftth_adh(
    db: AsyncIOMotorDatabase,
    pm_id: str,
    serial_number: str,
    software_version: str,
    box_mac_address: str,
) -> ONTInfos:

    # PM exists
    if not (pm := PM.model_validate(await db.pms.find_one({"_id": pm_id}))):
        raise ValueError(f"PM with id {pm_id} does not exist")

    # ONT with this serial number not already registered
    if await db.pms.find_one({"pon_list.ont_list.serial_number": serial_number}):
        raise ValueError(f"ONT with serial number {serial_number} already registered")

    # Not already an ONT with the same box_mac_address
    if await db.pms.find_one({"pon_list.ont_list.box_mac_address": box_mac_address}):
        raise ValueError(f"ONT with box MAC address {box_mac_address} already registered")

    if not await db.boxes.find_one({"mac": box_mac_address}):
        raise ValueError("No box with this MAC address found")

    pon, position_in_pon = get_first_free_port(pm)

    new_ont = ONT(
        serial_number=serial_number,
        software_version=software_version,
        box_mac_address=box_mac_address,
        position_in_pon=position_in_pon,
    )

    await db.pms.update_one(
        {"_id": pm.id, "pon_list.local_pon_id": pon.local_pon_id},
        {"$push": {"pon_list.$.ont_list": new_ont.model_dump()}},
    )

    ont_infos = ONTInfos(
        serial_number=serial_number,
        software_version=software_version,
        box_mac_address=box_mac_address,
        mec128_position=position_in_pon_to_mec128_string(pm, pon, position_in_pon),
        local_pon_id=pon.local_pon_id,
        pm_description=pm.description,
        pon_rack=pon.rack,
        pon_tiroir=pon.tiroir,
    )

    return ont_infos
