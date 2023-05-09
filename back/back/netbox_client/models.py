"""
# Modèle Netbox FAIPP

Comment on représente les équipements dans [Netbox](netbox.faipp.net).

Les champs précédés d'une étoile `*` ne sont pas constant, peuvent être modifiés par les adhérents.
Les champs précédés d'un chapeau `^` peuvent être modifiés par les admins.
Tous les autres champs sont constants.
"""
from enum import Enum, auto
from ipaddress import IPv4Interface, IPv6Interface

from pydantic import BaseModel, root_validator, validator

from back.netbox_client.errors import DifferentIpTypeError, PortOutOfRangeError


class Adherent(str):
    """
    ## Adhérents

    Tag: Chaque adhérent est représenté par un tag au format : `user_<keycloak_id>`
    """


class Residence(Enum):
    """
    ## Résidences

    Une residence est représentée par un [Site](https://docs.netbox.dev/en/stable/models/dcim/site/) sur netbox.

    La valeur de l'enum en lowercase donne le nom du site et son slug.
    """

    ALJT = auto()


class Chambre(BaseModel):
    """
    ## Chambre

    Une chambre d'adhérent est représentée par une [location](https://docs.netbox.dev/en/stable/models/dcim/location/)
    sur netbox.

    - **Site:** `{residence}` (ALJT, ASS etc.)
    - **Name:** `{numero de chambre}`
    - **^Tag:** `{tag_adherent}`
    """

    residence: Residence
    name: str
    adherent: Adherent


# pylint: disable=C0116,C0103,E0213
class BM(BaseModel):
    """A box model must define Name and Manufacturer"""

    name: str
    manufacturer: str
    nb_ifaces: int

    @validator("name")
    def name_lower(value: str):  # type: ignore[misc]
        return value.lower()

    @validator("manufacturer")
    def manufacturer_lower(value: str):  # type: ignore[misc]
        return value.lower()


class BoxModel(Enum):
    """
    ## Box model

    Un type de box est représentée par un [Site](https://docs.netbox.dev/en/stable/models/dcim/devicetype/) sur netbox.

    La valeur de l'enum en lowercase donne le nom du device type et son slug.
    """

    XIAOMI_AC2350 = BM(manufacturer="XIAOMI", name="AC2350", nb_ifaces=4)
    TP_LINK_ARCHER_C6V3 = BM(manufacturer="TP_LINK", name="C6V3", nb_ifaces=5)


class Box(BaseModel):
    """
    ## Box

    Une box est représentée par un [device](https://docs.netbox.dev/en/stable/models/dcim/device/) sur netbox.

    ### Device

    - **Device Type:** `{box_model}` (au cas où on en utilise différentes box dans le futur)
    - **Serial number:** `{box_serial}` Numéro de série de la box

    ### User

    - **^Location:** Chambre
    - **^Tag:** `{tag_adherent}`

    ### Interfaces réseau

    TODO: add this
    """

    model: BoxModel
    serial_number: str

    location: Chambre
    adherent: Adherent


class IPv4(IPv4Interface):
    """An ipv4 address."""


class IPv6(IPv6Interface):
    """An ipv6 address."""


IP = IPv4 | IPv6


class Protocols(Enum):
    """Protocles pour une ouverture de ports."""

    TCP = auto()
    UDP = auto()


class PortBinding(BaseModel):
    """
    ## Port

    Une ouverture de port est représentée par un [service](https://docs.netbox.dev/en/stable/models/ipam/service/)
    sur netbox.

    Pour l'ouverture, il faut :

    - Nom du port binding pour l'utilisateur
    - IP interne
    - Port interne
    - IP externe
    - Port externe
    - Protocole
    - Adherent

    En plus de cela, il nous faut :

    """

    name: str
    ext_ip: IP
    ext_port: int
    int_ip: IP
    int_port: int
    proto: Protocols
    adherent: Adherent

    @root_validator()
    def ips_must_be_v4_or_v6(cls, values: dict) -> dict:
        EXT_IP, INT_IP = "ext_ip", "int_ip"
        if not isinstance(values[EXT_IP], type(values[INT_IP])):
            raise DifferentIpTypeError(EXT_IP, INT_IP)
        return values

    @validator("ext_port", "int_port")
    def ports_must_be_in_range(cls, value: int) -> int:
        MIN_PORT, MAX_PORT = 0, 2**16
        if not MIN_PORT < value < MAX_PORT:
            raise PortOutOfRangeError(value)
        return value


class DHCPLease(BaseModel):
    """
    ## DHCP Lease

    Une lease DHCP est représentée par un [IP](https://docs.netbox.dev/en/stable/models/ipam/ipaddress/) sur netbox.

    Pour la lease, il faut :

    - IP
    - MAC
    - Nom du device
    - Adherent
    """

    ip: IP
    mac: str
    hostname: str | None
    adherent: Adherent
