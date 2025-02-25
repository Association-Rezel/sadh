"""
MODIFIED FROM https://gitlab.com/rezel/faipp/proj104-2024/ipam-for-mongodb/-/blob/main/ipam_mongodb/ipam_mongodb.py?ref_type=heads

Provides functions to interact with the MongoDB databases
and retrieve available IP ranges and addresses.

"""

from ipaddress import IPv4Address, IPv4Interface, IPv6Interface, IPv6Network
from typing import Tuple

from common_models.hermes_models import Box, WanIpv4, WanIpv6
from common_models.ipam_models import IPAMNetworks
from motor.motor_asyncio import AsyncIOMotorDatabase


class MongoIpam:
    """Provides functions to interact with the MongoDB databases
    and retrieve available IP ranges and addresses, namely

    - get_available_ipv4: returns an available IPv4 address"""

    def __init__(self, db: AsyncIOMotorDatabase):
        """Initializes the MongoDB client and the database."""
        self.db = db

    async def get_available_ipv4(self, from_telecom: bool) -> WanIpv4:
        """Returns an available IPv4 address from the database.

        Args:
            * from_telecom (bool): whether the adherent is from telecom or not
        """
        all_ipv4_nets = (await self.__get_all_networks()).ipv4_networks
        ipv4_nets = [net for net in all_ipv4_nets if net.from_telecom == from_telecom]

        # Get the used IPs
        used_ips = await self.__get_all_used_ip_addresses()
        used_ipv4 = [
            unet_profile.network.wan_ipv4.ip.ip
            for box in used_ips
            for unet_profile in box.unets
        ]

        # Find the first available IP
        for ipv4network in ipv4_nets:
            network = ipv4network.network
            for ip in network.hosts():
                if ip not in used_ipv4:
                    return WanIpv4(
                        ip=IPv4Interface(f"{ip}/{network.prefixlen}"),
                        vlan=ipv4network.vlan,
                    )

        raise ValueError("No available IPv4 address found.")

    def compute_ipv6_and_prefix(
        self, ipv4_addr: IPv4Address, from_telecom: bool
    ) -> Tuple[WanIpv6, IPv6Network]:
        """Computes the IPv6 prefix from an IPv4 address from telecom.
        Rules at : https://a.notes.rezel.net/Co4oqxHwQPWwVAMkf6AwHw

        Args:
            * ipv4_addr (IPAddress): the (public) IPv4 address of the adherent
            * from_telecom (bool): whether the adherent is from telecom or not"""
        if from_telecom:
            [_, _, x, y] = str(ipv4_addr).split(".")
            prefix = f"2a09:6847:{int(x):02x}{int(y):02x}::/48"
            public_ip = f"2a09:6847:ffff::{int(x):02x}{int(y):02x}/64"
        else:
            [_, _, _, z] = str(ipv4_addr).split(".")
            prefix = f"2a09:6847:4{int(z):02x}::/48"
            public_ip = f"2a09:6847:ffff::4{int(z):02x}/64"
        return WanIpv6(ip=IPv6Interface(public_ip), vlan=103), IPv6Network(prefix)

    async def __get_all_used_ip_addresses(self) -> list[Box]:
        """Retrieve all the boxes from the database
        (only the fields related to IP addresses are queried)"""
        response = self.db.boxes.find({})
        if response is None:
            raise ValueError(
                "No IP addresses found in the database. This is highly unusual. Check the database."
            )

        return [Box.model_validate(elt) async for elt in response]

    async def __get_all_networks(self) -> IPAMNetworks:
        """Returns all the IP ranges from the database."""
        response = await self.db.ipam.find_one()
        if response is None:
            raise ValueError("No IP ranges found in the database.")
        del response["_id"]
        networks = IPAMNetworks.model_validate(response)
        return networks
