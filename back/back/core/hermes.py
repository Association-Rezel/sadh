import random
import string
from datetime import datetime
from ipaddress import IPv4Address, IPv4Interface, IPv6Address

from motor.motor_asyncio import AsyncIOMotorDatabase
from netaddr import EUI
from xkcdpass import xkcd_password

from back.core.ipam import MongoIpam
from back.core.ipam_logging import create_log
from back.mongodb.hermes_models import (
    Box,
    Dhcp,
    DnsServers,
    LanIpv4,
    UnetFirewall,
    UnetNetwork,
    UnetProfile,
    WanVlan,
    WifiDetails,
)
from back.mongodb.log_models import IpamLog
from back.mongodb.user_models import User

ADH_TP_IPV4_WAN_VLAN = WanVlan(
    vlan_id=101, ipv4_gateway=IPv4Address("137.194.11.254"), ipv6_gateway=None
)
ADH_EXTE_IPV4_WAN_VLAN = WanVlan(
    vlan_id=102,
    ipv4_gateway=IPv4Address("195.14.28.254"),
    ipv6_gateway=None,
)
ADH_IPV6_WAN_VLAN = WanVlan(
    vlan_id=103, ipv4_gateway=None, ipv6_gateway=IPv6Address("2a09:6847:ffff::1")
)


async def _generate_unique_unet_id(db: AsyncIOMotorDatabase) -> str:
    unet_id = "".join(
        random.choice(string.ascii_lowercase + string.digits) for _ in range(8)
    )
    if await db.boxes.find_one({"main_unet_id": unet_id}):
        return await _generate_unique_unet_id(db)
    return unet_id


async def register_box_for_new_ftth_adh(
    db: AsyncIOMotorDatabase,
    box_type: str,
    mac: str,
    telecom_ip: bool,
) -> Box:
    if await db.boxes.find_one({"mac": mac}):
        raise ValueError(f"Box with MAC address {mac} already exists")

    ipam = MongoIpam(db)

    available_ipv4 = await ipam.get_available_ipv4(telecom_ip)
    ipv6, prefix = ipam.compute_ipv6_and_prefix(available_ipv4.ip.ip, telecom_ip)

    unet_id = await _generate_unique_unet_id(db)

    new_box = Box(
        type=box_type.lower(),
        main_unet_id=unet_id,
        mac=EUI(mac),
        unets=[
            UnetProfile(
                unet_id=unet_id,
                network=UnetNetwork(
                    wan_ipv4=available_ipv4,
                    wan_ipv6=ipv6,
                    ipv6_prefix=prefix,
                    lan_ipv4=LanIpv4(address=IPv4Interface("192.168.1.1/24"), vlan=1),
                ),
                wifi=WifiDetails(
                    ssid=await generate_unique_ssid(db), psk=generate_password()
                ),
                dhcp=Dhcp(
                    dns_servers=DnsServers(
                        ipv4=[IPv4Address("8.8.8.8"), IPv4Address("1.1.1.1")],
                        ipv6=[
                            IPv6Address("2001:4860:4860::8888"),
                            IPv6Address("2606:4700:4700::1111"),
                        ],
                    )
                ),
                firewall=UnetFirewall(
                    ipv4_port_forwarding=[],
                    ipv6_port_opening=[],
                ),
            )
        ],
        wan_vlan=[ADH_TP_IPV4_WAN_VLAN, ADH_EXTE_IPV4_WAN_VLAN, ADH_IPV6_WAN_VLAN],
    )

    await db.boxes.insert_one(new_box.model_dump(mode="json"))

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=f"{available_ipv4.ip} and {ipv6.ip}/{prefix} assigned to unet {unet_id} on box {mac}",
        ),
    )

    return new_box


async def get_box_by_ssid(db: AsyncIOMotorDatabase, ssid: str) -> Box | None:
    box_dict = await db.boxes.find_one({"unets.wifi.ssid": ssid})
    if box_dict is None:
        return None

    return Box.model_validate(box_dict)


async def register_unet_on_box(
    db: AsyncIOMotorDatabase,
    box: Box,
    telecom_ip: bool,
) -> UnetProfile:
    ipam = MongoIpam(db)

    available_ipv4 = await ipam.get_available_ipv4(telecom_ip)
    ipv6, prefix = ipam.compute_ipv6_and_prefix(available_ipv4.ip.ip, telecom_ip)

    unet_id = await _generate_unique_unet_id(db)

    # To be sure not to have a duplicate local network in the box,
    # We take the highest vlan number and add 1
    highest_lan = max([unet.network.lan_ipv4.vlan for unet in box.unets])

    new_profile = UnetProfile(
        unet_id=unet_id,
        network=UnetNetwork(
            wan_ipv4=available_ipv4,
            wan_ipv6=ipv6,
            ipv6_prefix=prefix,
            lan_ipv4=LanIpv4(
                address=IPv4Interface(f"192.168.{highest_lan+1}.1/24"),
                vlan=highest_lan + 1,
            ),
        ),
        wifi=WifiDetails(ssid=await generate_unique_ssid(db), psk=generate_password()),
        dhcp=Dhcp(
            dns_servers=DnsServers(
                ipv4=[IPv4Address("8.8.8.8"), IPv4Address("1.1.1.1")],
                ipv6=[
                    IPv6Address("2001:4860:4860::8888"),
                    IPv6Address("2606:4700:4700::1111"),
                ],
            )
        ),
        firewall=UnetFirewall(
            ipv4_port_forwarding=[],
            ipv6_port_opening=[],
        ),
    )

    await db.boxes.update_one(
        {"mac": str(box.mac)},
        {"$push": {"unets": new_profile.model_dump(mode="json")}},
    )

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source="sadh-back",
            message=f"{available_ipv4.ip} and {ipv6.ip}/{prefix} assigned to unet {unet_id} on box {box.mac}",
        ),
    )

    return new_profile


async def get_box_from_user(db: AsyncIOMotorDatabase, user: User) -> Box | None:
    if not user.membership or not user.membership.unetid:
        return None

    return Box.model_validate(
        await db.boxes.find_one({"unets.unet_id": user.membership.unetid})
    )


def generate_password() -> str:
    default_words = xkcd_password.locate_wordfile()
    word_list = xkcd_password.generate_wordlist(
        wordfile=default_words, min_length=5, max_length=8, valid_chars="[^'\"]"
    )
    raw_password = xkcd_password.generate_xkcdpassword(
        word_list, numwords=4, delimiter="_"
    )

    if raw_password is None:
        raise ValueError("Password generation failed")

    return raw_password


async def get_users_on_box(db: AsyncIOMotorDatabase, box: Box) -> list[User]:
    return [
        User.model_validate(user)
        for user in await db.users.find(
            {
                "membership.unetid": {
                    "$in": [unet.unet_id for unet in box.unets],
                }
            }
        ).to_list(length=None)
    ]


async def generate_unique_ssid(db: AsyncIOMotorDatabase) -> str:
    """Get SSID that is not already assigned."""
    ssids = [
        "Rezel-Hydrogen",
        "Rezel-Helium",
        "Rezel-Lithium",
        "Rezel-Beryllium",
        "Rezel-Boron",
        "Rezel-Carbon",
        "Rezel-Nitrogen",
        "Rezel-Oxygen",
        "Rezel-Fluorine",
        "Rezel-Neon",
        "Rezel-Sodium",
        "Rezel-Magnesium",
        "Rezel-Aluminum",
        "Rezel-Silicon",
        "Rezel-Phosphorus",
        "Rezel-Sulfur",
        "Rezel-Chlorine",
        "Rezel-Argon",
        "Rezel-Potassium",
        "Rezel-Calcium",
        "Rezel-Scandium",
        "Rezel-Titanium",
        "Rezel-Vanadium",
        "Rezel-Chromium",
        "Rezel-Manganese",
        "Rezel-Iron",
        "Rezel-Cobalt",
        "Rezel-Nickel",
        "Rezel-Copper",
        "Rezel-Zinc",
        "Rezel-Gallium",
        "Rezel-Germanium",
        "Rezel-Arsenic",
        "Rezel-Selenium",
        "Rezel-Bromine",
        "Rezel-Krypton",
        "Rezel-Rubidium",
        "Rezel-Strontium",
        "Rezel-Yttrium",
        "Rezel-Zirconium",
        "Rezel-Niobium",
        "Rezel-Molybdenum",
        "Rezel-Technetium",
        "Rezel-Ruthenium",
        "Rezel-Rhodium",
        "Rezel-Palladium",
        "Rezel-Silver",
        "Rezel-Cadmium",
        "Rezel-Indium",
        "Rezel-Tin",
        "Rezel-Antimony",
        "Rezel-Tellurium",
        "Rezel-Iodine",
        "Rezel-Xenon",
        "Rezel-Cesium",
        "Rezel-Barium",
        "Rezel-Lanthanum",
        "Rezel-Cerium",
        "Rezel-Praseodymium",
        "Rezel-Neodymium",
        "Rezel-Promethium",
        "Rezel-Samarium",
        "Rezel-Europium",
        "Rezel-Gadolinium",
        "Rezel-Terbium",
        "Rezel-Dysprosium",
        "Rezel-Holmium",
        "Rezel-Erbium",
        "Rezel-Thulium",
        "Rezel-Ytterbium",
        "Rezel-Lutetium",
        "Rezel-Hafnium",
        "Rezel-Tantalum",
        "Rezel-Tungsten",
        "Rezel-Rhenium",
        "Rezel-Osmium",
        "Rezel-Iridium",
        "Rezel-Platinum",
        "Rezel-Gold",
        "Rezel-Mercury",
        "Rezel-Thallium",
        "Rezel-Lead",
        "Rezel-Bismuth",
        "Rezel-Polonium",
        "Rezel-Astatine",
        "Rezel-Radon",
        "Rezel-Francium",
        "Rezel-Radium",
        "Rezel-Actinium",
        "Rezel-Thorium",
        "Rezel-Protactinium",
        "Rezel-Uranium",
        "Rezel-Neptunium",
        "Rezel-Plutonium",
        "Rezel-Americium",
        "Rezel-Curium",
        "Rezel-Berkelium",
        "Rezel-Californium",
        "Rezel-Einsteinium",
        "Rezel-Fermium",
        "Rezel-Mendelevium",
        "Rezel-Nobelium",
        "Rezel-Lawrencium",
        "Rezel-Rutherfordium",
        "Rezel-Dubnium",
        "Rezel-Seaborgium",
        "Rezel-Bohrium",
        "Rezel-Hassium",
        "Rezel-Meitnerium",
        "Rezel-Darmstadtium",
        "Rezel-Roentgenium",
        "Rezel-Copernicium",
        "Rezel-Nihonium",
        "Rezel-Flerovium",
        "Rezel-Moscovium",
        "Rezel-Livermorium",
        "Rezel-Tennessine",
        "Rezel-Oganesson",
    ]

    random_ssid = None

    while random_ssid is None and ssids:
        random_ssid = random.choice(ssids)
        if await db.boxes.find_one({"unets.wifi.ssid": random_ssid}):
            random_ssid = None

    if random_ssid is None:
        random_ssid = "Rezel-" + str(datetime.now().timestamp())
    return random_ssid
