"""Gestion d'une box."""

from fastapi import APIRouter

from back.netbox_client.models import (
    Adherent,
    Box,
    BoxModel,
    Chambre,
    DHCPLease,
    IPv4,
    PortBinding,
    Protocols,
    Residence,
)

router = APIRouter(prefix="/box", tags=["box"])


# TODO: implements
# - Conneced devices


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


@router.get("/lease")
def _lease() -> DHCPLease:
    """Return the current user box."""
    return DHCPLease(
        ip=IPv4("192.168.1.1"),
        mac="00:00:00:00:00:00",
        hostname="pc1.local",
        adherent=Adherent("123"),
    )


@router.get("/port")
def _port() -> PortBinding:
    """Return the current user box."""
    return PortBinding(
        name="Minecraft",
        ext_ip=IPv4("1.1.1.1/0"),
        ext_port=25565,
        int_ip=IPv4("192.168.1.42/24"),
        int_port=25575,
        proto=Protocols.TCP,
        adherent=Adherent("123"),
    )
