from datetime import datetime
from ipaddress import IPv4Interface

import pytz
import requests
from common_models.hermes_models import Box, UnetProfile
from common_models.user_models import User
from fastapi import APIRouter, Depends, HTTPException

from back.env import ENV
from back.mongodb.db import GetDatabase
from back.server.dependencies import RequireCurrentUser, must_be_admin

router = APIRouter(prefix="/net", tags=["net"])


@router.get(
    "/ssids",
    response_model=list[str],
)
async def _list_ssids(
    db: GetDatabase,
):
    """List all SSIDS."""

    return (
        await db.boxes.aggregate(
            [
                {"$unwind": "$unets"},
                {"$group": {"_id": None, "ssids": {"$addToSet": "$unets.wifi.ssid"}}},
                {"$project": {"_id": 0, "ssids": 1}},
            ]
        ).to_list(None)
    )[0]["ssids"]


@router.get(
    "/valid_ssid/{ssid}",
    response_model=bool,
)
async def _validate_ssid(
    ssid: str,
    user: RequireCurrentUser,
    db: GetDatabase,
) -> bool:
    """Check if the SSID is not already used."""

    if user.membership is None:
        return True

    nb = await db.boxes.count_documents(
        {
            "unets": {
                "$elemMatch": {
                    "wifi.ssid": ssid,
                    "unet_id": {"$ne": user.membership.unetid},
                }
            }
        }
    )

    return nb == 0


@router.get(
    "/get-all-ont-summary",
    response_model=str,
    dependencies=[Depends(must_be_admin)],
)
def get_all_ont_summary():
    """Get all ONT summary from Charon"""

    r = requests.get(
        f"{ENV.charon_url}/get-all-ont-summary/olt1",
        timeout=10,
    )

    if r.status_code != 200:
        return f"Charon Error {r.status_code} : {r.text}"

    return r.text


@router.post(
    "/transfer-unet/{unet_id}/to/{mac}",
    response_model=UnetProfile,
    dependencies=[Depends(must_be_admin)],
)
async def _transfer_unet(
    unet_id: str,
    mac: str,
    db: GetDatabase,
):
    """Transfer a unet to a new box."""

    current_box = await db.boxes.find_one({"unets.unet_id": unet_id})
    if not current_box:
        raise HTTPException(
            status_code=404, detail="No current box found for this unet"
        )
    current_box = Box.model_validate(current_box)

    unet = next((unet for unet in current_box.unets if unet.unet_id == unet_id))

    if current_box.main_unet_id == unet_id:
        raise HTTPException(
            status_code=400, detail="Cannot transfer the main unet of a box"
        )

    new_box = await db.boxes.find_one({"mac": str(mac)})
    if not new_box:
        raise HTTPException(status_code=404, detail="No box found with this mac")
    new_box = Box.model_validate(new_box)

    if next((unet for unet in new_box.unets if unet.unet_id == unet_id), None):
        raise HTTPException(
            status_code=400, detail="Unet already exists in the new box"
        )

    # Remove the unet from the current box
    await db.boxes.find_one_and_update(
        {"mac": str(current_box.mac)},
        {"$pull": {"unets": {"unet_id": unet_id}}},
    )

    # Check the unets on the new box to determine if local VLAN needs to change
    vlans_on_new_box = set(
        unet_already_on_box.network.lan_ipv4.vlan
        for unet_already_on_box in new_box.unets
    )
    if unet.network.lan_ipv4.vlan in vlans_on_new_box:
        # The VLAN is already used on the new box, we need to change it to a new one that is not used
        new_vlan = 1
        while new_vlan in vlans_on_new_box:
            new_vlan += 1

        unet.network.lan_ipv4.vlan = new_vlan
        unet.network.lan_ipv4.address = IPv4Interface(f"192.168.{new_vlan}.1/24")

    # Add the unet to the new box
    await db.boxes.find_one_and_update(
        {"mac": str(mac)},
        {"$push": {"unets": unet.model_dump(mode="json")}},
    )

    ### Update attached wifi adherents

    # Find the users related to the transfer
    wifi_user = User.model_validate(
        await db.users.find_one({"membership.unetid": unet_id})
    )
    original_ftth_user = User.model_validate(
        await db.users.find_one({"membership.unetid": current_box.main_unet_id})
    )
    new_ftth_user = User.model_validate(
        await db.users.find_one({"membership.unetid": new_box.main_unet_id})
    )

    # Update the original FTTH user
    if (
        original_ftth_user.membership
        and original_ftth_user.membership.attached_wifi_adherents
    ):
        await db.users.find_one_and_update(
            {"_id": str(original_ftth_user.id)},
            {
                "$set": {
                    "membership.attached_wifi_adherents.$[elem].to_date": datetime.now(
                        tz=pytz.timezone("Europe/Paris")
                    ).timestamp(),
                    "membership.attached_wifi_adherents.$[elem].comment": f"Transfered to box {mac}",
                }
            },
            array_filters=[{"elem.user_id": str(wifi_user.id), "elem.to_date": None}],
        )

    # Update the new FTTH user
    if new_ftth_user.membership:
        await db.users.find_one_and_update(
            {"_id": str(new_ftth_user.id)},
            {
                "$push": {
                    "membership.attached_wifi_adherents": {
                        "user_id": str(wifi_user.id),
                        "from_date": datetime.now(
                            tz=pytz.timezone("Europe/Paris")
                        ).timestamp(),
                        "comment": f"Transfered from box {current_box.mac}",
                    }
                }
            },
        )

    return unet
