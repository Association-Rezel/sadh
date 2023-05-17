"""Gestion d'une box."""


from back.middlewares.netbox import box
from back.netbox_client.models import (
    Adherent,
    Box,
    DHCPLease,
    IPv4,
    PortBinding,
    Protocols,
)
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("box")


@router.get("/")
def get(_box: Box = box) -> Box:
    """Return the current user box."""
    return _box


@router.get("/leases")
def list_leases() -> list[int]:
    """Return the current user box."""
    return [1, 2, 3]


@router.get("/lease/{id}")
def get_lease(id: int) -> DHCPLease:
    """Return the current user box."""
    return DHCPLease(
        ip=IPv4("192.168.1.1"),
        mac="00:00:00:00:00:00",
        hostname="pc1.local",
        adherent=Adherent("123"),
    )


@router.get("/port")
def get_port() -> PortBinding:
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
