"""Gestion d'une box."""
from fastapi import APIRouter

from back.interfaces.box import IPAddresses46
from back.netbox_client.models import Adherent, Box, BoxModel, Chambre, Residence

router = APIRouter(prefix="/box", tags=["box"])


@router.get("/ip")
def get_ip() -> IPAddresses46:
    """Tmp."""
    return IPAddresses46(ipv4="127.0.0.1", ipv6="::1")


# TODO: implements
# - Box
# - DHCPLease
# - Device
# - PortRule


@router.get("/")
def _() -> Box:
    """Return the current user box."""
    return Box(
        model=BoxModel.XIAOMI_AC2350,
        serial_number="123",
        location=Chambre(
            residence=Residence.ALJT,
            name="404",
            adherent=Adherent("123"),
        ),
        adherent=Adherent("123"),
    )
