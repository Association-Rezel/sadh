from fastapi import APIRouter

from back.interfaces.box import IPAddresses46

router = APIRouter(prefix="/box", tags=["box"])


@router.get("/ip")
def get_ip() -> IPAddresses46:
    return IPAddresses46(ipv4="127.0.0.1", ipv6="::1")


@router.get("/MAC")
def get_mac():
    pass
