"""Get or edit users."""


from back.interfaces.devices import Device
from back.middlewares.netbox import box
from back.netbox_client.models import Box, IPv4
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("devices")


@router.get("/")
def _(_box: Box = box) -> list[Device]:
    """List current connected devices."""
    return [
        Device(
            mac="00:00:00:00:00:01",
            ip=IPv4("192.168.1.1"),
            hostname="pc1.local",
        ),
        Device(
            mac="00:00:00:00:00:02",
            ip=IPv4("192.168.1.2"),
            hostname="pc2.local",
        ),
    ]
