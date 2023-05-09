"""Gestion d'une box."""
from fastapi import APIRouter

from back.interfaces.box import IPAddresses46

router = APIRouter(prefix="/box", tags=["box"])


@router.get("/ip")
def get_ip() -> IPAddresses46:
    """Tmp."""
    return IPAddresses46(ipv4="127.0.0.1", ipv6="::1")
