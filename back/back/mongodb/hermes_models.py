"""
Defines Models for the database
"""

from netaddr import EUI, mac_unix, mac_unix_expanded
from pydantic import BaseModel, Field, field_validator

REGEX_IPV4_CIDR = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$"
REGEX_IPV4 = r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
REGEX_UNET_ID = r"^[a-z0-9]{8}$"


class WanIpv4(BaseModel):
    """
    WanIpv4 Model
    """

    vlan: int
    ip: str = Field(pattern=REGEX_IPV4_CIDR)


class WanIpv6(BaseModel):
    """
    WanIpv6 Model
    """

    vlan: int
    ip: str


class LanIpv4(BaseModel):
    """
    LanIpv4 Model
    """

    address: str
    vlan: int


class UnetNetwork(BaseModel):
    """
    UnetNetwork Model
    """

    wan_ipv4: WanIpv4
    wan_ipv6: WanIpv6
    ipv6_prefix: str
    lan_ipv4: LanIpv4


class WifiDetails(BaseModel):
    """
    WifiDetails Model
    """

    ssid: str
    psk: str


class Ipv4Portforwarding(BaseModel):
    """
    Ipv4Portforwarding Model
    """

    wan_port: int
    lan_ip: str = Field(pattern=REGEX_IPV4)
    lan_port: int
    protocol: str
    name: str
    desc: str


class Ipv6Portopening(BaseModel):
    """
    Ipv6Portopening Model
    """

    ip: str
    port: int
    protocol: str
    name: str
    desc: str


class UnetFirewall(BaseModel):
    """
    UnetFirewall Model
    """

    ipv4_port_forwarding: list[Ipv4Portforwarding]
    ipv6_port_opening: list[Ipv6Portopening]


class DnsServers(BaseModel):
    """
    DnsServers Model
    """

    ipv4: list[str]
    ipv6: list[str]


class Dhcp(BaseModel):
    """
    DnsV4 Model
    """

    dns_servers: DnsServers


class UnetProfile(BaseModel):
    """
    UnetProfile Model
    """

    unet_id: str = Field(pattern=REGEX_UNET_ID)
    network: UnetNetwork
    wifi: WifiDetails
    firewall: UnetFirewall
    dhcp: Dhcp


class WanVlan(BaseModel):
    """
    WanVlan Model
    """

    vlan_id: int
    ipv4_gateway: str = Field(pattern=REGEX_IPV4_CIDR + r"|^$")
    ipv6_gateway: str


class Box(BaseModel):
    """
    Box Model
    """

    type: str  # Type de box (ex: ac2350)
    main_unet_id: str = Field(pattern=REGEX_UNET_ID)
    mac: str
    unets: list[UnetProfile]
    wan_vlan: list[WanVlan]

    @field_validator('mac')
    def check_mac(cls, v: str):
        mac_obj = EUI(v)
        if mac_obj is None:
            raise ValueError('Invalid MAC address')
        mac_obj.dialect = mac_unix_expanded
        return v.format()
