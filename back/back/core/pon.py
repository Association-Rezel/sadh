import re
from typing import Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase
from netaddr import EUI, mac_unix_expanded

from back.mongodb.hermes_models import Box
from back.mongodb.pon_models import ONT, PM, PON, ONTInfo


def get_first_free_port(pm: PM) -> Tuple[PON, int]:
    for pon in pm.pon_list:
        for i in range(0, pon.number_of_ports):
            if not any(ont.position_in_pon == i for ont in pon.ont_list):
                return pon, i
    raise ValueError("No free port available")


def is_free_port(pon: PON, position_in_pon: int) -> bool:
    if position_in_pon >= pon.number_of_ports:
        return False
    return not any(ont.position_in_pon == position_in_pon for ont in pon.ont_list)


def position_in_pon_to_mec128_string(pon: PON, position_in_pon: int) -> str:
    return f"{chr(ord('A') + (pon.mec128_offset + position_in_pon) // 8)}{((position_in_pon) % 8) + 1}"


def mec128_string_to_position_in_pon(pm: PM, mec128_position: str) -> Tuple[PON, int]:
    if not re.match(r"[A-Z][1-8]", mec128_position):
        raise ValueError(f"Invalid mec128 position {mec128_position} (format)")

    offseted_position = (
        (ord(mec128_position[0]) - ord("A")) * 8 + int(mec128_position[1]) - 1
    )

    for pon in pm.pon_list:
        if (
            pon.mec128_offset
            <= offseted_position
            < pon.mec128_offset + pon.number_of_ports
        ):
            return pon, offseted_position - pon.mec128_offset

    raise ValueError(f"Invalid mec128 position {mec128_position} (out of range)")


async def register_ont_for_new_ftth_adh(
    db: AsyncIOMotorDatabase,
    pm_id: str,
    serial_number: str,
    software_version: str,
    box: Box,
    position_mec128: str | None = None,
) -> ONTInfo:
    # PM exists
    if not (pm := PM.model_validate(await db.pms.find_one({"_id": pm_id}))):
        raise ValueError(f"PM with id {pm_id} does not exist")

    # ONT with this serial number not already registered
    if await db.pms.find_one({"pon_list.ont_list.serial_number": serial_number}):
        raise ValueError(f"ONT with serial number {serial_number} already registered")

    # Not already an ONT with the same box_mac_address
    if await db.pms.find_one({"pon_list.ont_list.box_mac_address": str(box.mac)}):
        raise ValueError(
            f"There is already an ONT registered for this box {str(box.mac)}"
        )

    position_pm: Tuple[PON, int] | None = None

    if position_mec128:
        position_pm = mec128_string_to_position_in_pon(pm, position_mec128)
        if not is_free_port(*position_pm):
            raise ValueError(
                f"Specified position in PM {position_mec128} is not available (already used)"
            )
    else:
        position_pm = get_first_free_port(pm)

    pon, position_in_pon = position_pm
    new_ont = ONT(
        serial_number=serial_number,
        software_version=software_version,
        box_mac_address=box.mac,
        position_in_pon=position_in_pon,
    )

    await db.pms.update_one(
        {
            "_id": pm.id,
            "pon_list.olt_interface": pon.olt_interface,
            "pon_list.olt_id": pon.olt_id,
        },
        {"$push": {"pon_list.$.ont_list": new_ont.model_dump(mode="json")}},
    )

    ont_info = ONTInfo(
        serial_number=serial_number,
        software_version=software_version,
        box_mac_address=str(box.mac),
        mec128_position=position_in_pon_to_mec128_string(pon, position_in_pon),
        olt_interface=pon.olt_interface,
        pm_description=pm.description,
        pon_rack=pon.rack,
        pon_tiroir=pon.tiroir,
    )

    return ont_info


async def get_ont_from_box(db: AsyncIOMotorDatabase, box: Box) -> ONT | None:
    pm = await db.pms.find_one({"pon_list.ont_list.box_mac_address": str(box.mac)})

    if not pm:  # No PM has this ONT
        return None

    pm = PM.model_validate(pm)

    ont = [
        ont
        for pon in pm.pon_list
        for ont in pon.ont_list
        if ont.box_mac_address == box.mac
    ][0]

    return ont


async def get_ontinfo_from_box(db: AsyncIOMotorDatabase, box: Box) -> ONTInfo | None:
    pm = await db.pms.find_one({"pon_list.ont_list.box_mac_address": str(box.mac)})

    if not pm:  # No PM has this ONT
        return None

    pm = PM.model_validate(pm)

    ont = [
        ont
        for pon in pm.pon_list
        for ont in pon.ont_list
        if ont.box_mac_address == box.mac
    ][0]

    pon = next(filter(lambda p: ont in p.ont_list, pm.pon_list))

    return ONTInfo(
        serial_number=ont.serial_number,
        software_version=ont.software_version,
        box_mac_address=str(EUI(ont.box_mac_address, dialect=mac_unix_expanded)),
        mec128_position=position_in_pon_to_mec128_string(pon, ont.position_in_pon),
        olt_interface=pon.olt_interface,
        pm_description=pm.description,
        position_in_subscriber_panel=ont.position_in_subscriber_panel,
        pon_rack=pon.rack,
        pon_tiroir=pon.tiroir,
    )


async def get_ont_from_serial_number(
    db: AsyncIOMotorDatabase, serial_number: str
) -> ONT | None:
    pm = await db.pms.find_one({"pon_list.ont_list.serial_number": serial_number})

    if not pm:  # No PM has this ONT
        return None

    pm = PM.model_validate(pm)

    ont = [
        ont
        for pon in pm.pon_list
        for ont in pon.ont_list
        if ont.serial_number == serial_number
    ][0]

    return ont


async def get_ontinfo_from_serial_number(
    db: AsyncIOMotorDatabase, serial_number: str
) -> ONTInfo | None:
    pm = await db.pms.find_one({"pon_list.ont_list.serial_number": serial_number})

    if not pm:  # No PM has this ONT
        return None

    pm = PM.model_validate(pm)

    ont = [
        ont
        for pon in pm.pon_list
        for ont in pon.ont_list
        if ont.serial_number == serial_number
    ][0]

    pon = next(filter(lambda p: ont in p.ont_list, pm.pon_list))

    return ONTInfo(
        serial_number=ont.serial_number,
        software_version=ont.software_version,
        box_mac_address=str(EUI(ont.box_mac_address, dialect=mac_unix_expanded)),
        mec128_position=position_in_pon_to_mec128_string(pon, ont.position_in_pon),
        olt_interface=pon.olt_interface,
        pm_description=pm.description,
        position_in_subscriber_panel=ont.position_in_subscriber_panel,
        pon_rack=pon.rack,
        pon_tiroir=pon.tiroir,
    )
