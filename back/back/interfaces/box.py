"""IP ifaces."""
from ipaddress import IPv4Address, IPv6Address

from pydantic import BaseModel


class IPAddresses46(BaseModel):
    """A collection of IP addresses."""

    ipv4: IPv4Address
    ipv6: IPv6Address

    class Config:
        """Config."""

        schema_extra = {
            "example": {
                "ipv4": "127.0.0.1",
                "ipv6": "::1",
            },
        }
