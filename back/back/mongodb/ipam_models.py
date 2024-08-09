"""
Defines the pydantic models for the mongodb 'ipam' collection
"""

from pydantic import BaseModel, Field

REGEX_IPV4_CIDR = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$"
REGEX_IPV4 = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"


class Ipv4Network(BaseModel):
    """defines all the available IPv4 networks from which to get an IP address"""

    vlan: int  # the vlan of the network
    from_telecom: bool  # is the adherent from telecom?
    network: str = Field(pattern=REGEX_IPV4_CIDR)  # the network address in cidr notation


class Networks(BaseModel):
    """defines all the available networks (i.e. ranges) from which to get an IP address"""

    ipv4_networks: list[Ipv4Network]
    ipv6_networks: list[str]  # the ipv6 network addresses in cidr notation
