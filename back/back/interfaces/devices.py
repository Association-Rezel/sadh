"""Devices interfaces."""
from pydantic import BaseModel

from back.netbox_client.models import IP


class Device(BaseModel):
    """Device."""

    mac: str
    ip: IP
    hostname: str
