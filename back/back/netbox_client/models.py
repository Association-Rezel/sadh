"""
# Modèle Netbox FAIPP

Comment on représente les équipements dans [Netbox](netbox.faipp.net).

Les champs précédés d'une étoile `*` ne sont pas constant, peuvent être modifiés par les adhérents.
Les champs précédés d'un chapeau `^` peuvent être modifiés par les admins.
Tous les autres champs sont constants.
"""
from enum import Enum, auto

from pydantic import BaseModel, validator


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
