"""Gestion d'une box."""


from back.interfaces.box import Box, DHCPLease, IPv4, PortBinding, Protocols
from back.middlewares.netbox import box
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("box")


@router.get("/")
def get(_box: Box = box) -> Box:
    """Return the current user box."""
    return _box


@router.get("/leases")
def get_leases(_box: Box = box) -> list[DHCPLease]:
    """Return the current user box."""
    return [
        DHCPLease(
            ip=IPv4("192.168.1.15"),
            mac="00:00:00:00:00:00",
            hostname="PC1",
        ),
    ]


@router.get("/ports")
def get_ports(_box: Box = box) -> list[PortBinding]:
    """Return the current user box."""
    return [
        PortBinding(
            name="Minecraft",
            ext_ip=IPv4("137.194.8.6"),
            ext_port=25565,
            int_ip=IPv4("192.168.1.15"),
            int_port=25565,
            proto=Protocols.TCP,
        ),
    ]
