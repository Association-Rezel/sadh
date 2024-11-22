"""
Defines Models for the database
"""

from ipaddress import IPv4Address, IPv6Address

from netaddr import EUI, mac_unix_expanded
from pydantic import Field, field_validator

from back.mongodb.base import PortableMac, RezelBaseModel

REGEX_IPV4_CIDR = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$"
REGEX_IPV4 = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
REGEX_UNET_ID = r"^[a-z0-9]{8}$"


class WanIpv4(RezelBaseModel):
    """
    WanIpv4 Model
    """

    vlan: int
    ip: str = Field(pattern=REGEX_IPV4_CIDR)


class WanIpv6(RezelBaseModel):
    """
    WanIpv6 Model
    """

    vlan: int
    ip: str


class LanIpv4(RezelBaseModel):
    """
    LanIpv4 Model
    """

    address: str
    vlan: int


class UnetNetwork(RezelBaseModel):
    """
    UnetNetwork Model
    """

    wan_ipv4: WanIpv4
    wan_ipv6: WanIpv6
    ipv6_prefix: str
    lan_ipv4: LanIpv4


class WifiDetails(RezelBaseModel):
    """
    WifiDetails Model
    """

    ssid: str
    psk: str


class Ipv4Portforwarding(RezelBaseModel):
    """
    Ipv4Portforwarding Model
    """

    wan_port: int = Field(ge=0, le=65535)
    lan_ip: IPv4Address
    lan_port: int = Field(ge=0, le=65535)
    protocol: str = Field(pattern=r"^(tcp|udp)$")
    name: str
    desc: str

    @field_validator("protocol", mode="before")
    @classmethod
    def protocol_upper(cls, v):
        return v.lower()


class Ipv6Portopening(RezelBaseModel):
    """
    Ipv6Portopening Model
    """

    ip: IPv6Address
    port: int = Field(ge=0, le=65535)
    protocol: str = Field(pattern=r"^(tcp|udp)$")
    name: str
    desc: str

    @field_validator("protocol", mode="before")
    @classmethod
    def protocol_upper(cls, v):
        return v.lower()


class UnetFirewall(RezelBaseModel):
    """
    UnetFirewall Model
    """

    ipv4_port_forwarding: list[Ipv4Portforwarding]
    ipv6_port_opening: list[Ipv6Portopening]


class DnsServers(RezelBaseModel):
    """
    DnsServers Model
    """

    ipv4: list[IPv4Address]
    ipv6: list[IPv6Address]


class Dhcp(RezelBaseModel):
    """
    DnsV4 Model
    """

    dns_servers: DnsServers


class UnetProfile(RezelBaseModel):
    """
    UnetProfile Model
    """

    unet_id: str = Field(pattern=REGEX_UNET_ID)
    network: UnetNetwork
    wifi: WifiDetails
    firewall: UnetFirewall
    dhcp: Dhcp


class WanVlan(RezelBaseModel):
    """
    WanVlan Model
    """

    vlan_id: int
    ipv4_gateway: str = Field(pattern=REGEX_IPV4_CIDR + r"|^$")
    ipv6_gateway: str


class Box(RezelBaseModel):
    """
    Box Model
    """

    type: str  # Type de box (ex: ac2350)
    main_unet_id: str = Field(pattern=REGEX_UNET_ID)
    mac: PortableMac
    unets: list[UnetProfile]
    wan_vlan: list[WanVlan]

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            EUI: lambda mac: str(EUI(mac, dialect=mac_unix_expanded)),
        }
