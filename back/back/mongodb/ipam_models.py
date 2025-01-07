"""
Defines the pydantic models for the mongodb 'ipam' collection
"""

from ipaddress import IPv4Network

from back.mongodb.base import RezelBaseModel


class IPAMIpv4Network(RezelBaseModel):
    """defines all the available IPv4 networks from which to get an IP address"""

    vlan: int  # the vlan of the network
    from_telecom: bool  # is the adherent from telecom?
    network: IPv4Network


class IPAMNetworks(RezelBaseModel):
    """defines all the available networks (i.e. ranges) from which to get an IP address"""

    ipv4_networks: list[IPAMIpv4Network]
    ipv6_networks: list[str]  # the ipv6 network addresses in cidr notation
