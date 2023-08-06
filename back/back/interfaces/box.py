"""# Modèle Netbox FAIPP.

Comment on représente les équipements dans [Netbox](netbox.faipp.net).
"""
from enum import Enum, auto
from ipaddress import IPv4Interface, IPv4Network, IPv6Interface, IPv6Network
from typing import Any

from pydantic import BaseModel, Field, root_validator, validator

from back.errors import DifferentIpTypeError, PortOutOfRangeError


def slug(value: str) -> str:
    """Return the slug of a value."""
    return value.lower().replace(" ", "-")


class DeviceRoles(Enum):
    """Roles des devices."""

    BOX = auto()


class PublicSubnets(Enum):
    """Subnets publiques dispo a rezel."""

    telecom4 = IPv4Network("137.194.8.0/22")
    telecom6 = IPv6Network("2a09:6847::/32")
    exte4 = IPv4Network("195.14.28.0/24")


class Residence(Enum):
    """Résidence.

    Une residence est représentée par un [Site](https://docs.netbox.dev/en/stable/models/dcim/site/) sur netbox.
    """

    ALJT = auto()


class Chambre(BaseModel):
    """Chambre.

    Une chambre d'adhérent est représentée par une [location](https://docs.netbox.dev/en/stable/models/dcim/location/)
    sur netbox.
    """

    residence: Residence
    name: str = Field(
        None,
        description="Numero de chambre.",
    )

    __slug = validator("name", allow_reuse=True)(slug)


class BoxModel(BaseModel):
    """A box model must define Name and Manufacturer."""

    name: str = Field(
        None,
        description="Nom du modele de la box.",
    )
    manufacturer: str = Field(
        None,
        description="Nom du constructeur de la box.",
    )

    __slug = validator("name", "manufacturer", allow_reuse=True)(slug)


class Models(Enum):
    """Box model.

    Un type de box est représentée par un [Site](https://docs.netbox.dev/en/stable/models/dcim/devicetype/) sur netbox.

    La valeur de l'enum en lowercase donne le nom du device type et son slug.
    """

    XIAOMI_AC2350 = BoxModel(manufacturer="XIAOMI", name="AC2350")
    TP_LINK_ARCHER_C6V3 = BoxModel(manufacturer="TP_LINK", name="C6V3")


class Box(BaseModel):
    """Box.

    Une box est représentée par un [device](https://docs.netbox.dev/en/stable/models/dcim/device/) sur netbox.

    ### Device

    Information sur la box.

    - **model:** Device Type
    - **serial_number:** Numéro de série de la box

    ### User

    Information sur l'utilisateur de la box.

    - **location:** Chambre

    ### Interfaces réseau

    Configuration des interfaces réseau de la box.
    """

    model: BoxModel
    serial_number: str

    @validator("model")
    def model_must_be_in_enum(value: Any) -> BoxModel:
        """Model must be in enum."""
        for _model in Models:
            if _model.value == value:
                return value
        raise ValueError(f"Model {value} is not in Models enum")  # noqa: EM102


class IPv4(IPv4Interface):
    """An ipv4 address."""


class IPv6(IPv6Interface):
    """An ipv6 address."""


IP = IPv4 | IPv6


class Protocols(Enum):
    """Protocles pour une ouverture de ports."""

    TCP = "TCP"
    UDP = "UDP"


class PortBinding(BaseModel):
    """## Port.

    Une ouverture de port est représentée par un [service](https://docs.netbox.dev/en/stable/models/ipam/service/)
    sur netbox.

    Pour l'ouverture, il faut :

    - Nom du port binding pour l'utilisateur
    - IP interne
    - Port interne
    - IP externe
    - Port externe
    - Protocole

    """

    name: str
    ext_ip: IP
    ext_port: int
    int_ip: IP
    int_port: int
    proto: Protocols

    class Config:
        """Config."""

        schema_extra = {
            "example": {
                "name": "Minecraft",
                "ext_ip": "1.1.1.1/0",
                "ext_port": 25565,
                "int_ip": "192.168.1.42/24",
                "int_port": 25575,
                "proto": "TCP",
            },
        }

    @root_validator()
    def ips_must_be_v4_or_v6(cls, values: dict) -> dict:  # type: ignore[misc]
        """Cant bind an ipv4 to an ipv6."""
        ext_ip, int_ip = "ext_ip", "int_ip"
        if not values.get(ext_ip) or not values.get(int_ip):
            # Raises will be handled by pydantic
            return values
        if not isinstance(values[ext_ip], type(values[int_ip])):
            raise DifferentIpTypeError(ext_ip, int_ip)
        return values

    @validator("ext_port", "int_port")
    def ports_must_be_in_range(value: int) -> int:  # type: ignore[misc]
        """Port must be in range 1-65535."""
        _mi, _ma = 0, 2**16
        if not _mi < value < _ma:
            raise PortOutOfRangeError(value)
        return value


class DHCPLease(BaseModel):
    """## DHCP Lease.

    Une lease DHCP est représentée par un [IP](https://docs.netbox.dev/en/stable/models/ipam/ipaddress/) sur netbox.

    Pour la lease, il faut :

    - IP
    - MAC
    - Nom du device
    """

    ip: IP
    mac: str
    hostname: str | None
