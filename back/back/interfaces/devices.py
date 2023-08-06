"""Devices interfaces."""
from pydantic import BaseModel

from back.interfaces.box import IP


class Device(BaseModel):
    """Device."""

    mac: str
    ip: IP
    hostname: str
