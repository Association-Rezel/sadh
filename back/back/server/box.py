"""Gestion d'une box."""
from fastapi import APIRouter
from sqlalchemy import null
from back.interfaces.box import IPAddresses46

router = APIRouter(prefix="/box", tags=["box"])

#TODO renvoie réponse statique pour le moment

@router.get("/ip")
def get_ip() -> IPAddresses46:
    """Tmp."""
    return IPAddresses46(ipv4="127.0.0.1", ipv6="::1")

@router.get("/connectedDevices")
def get_connectedDevices():
    """Tmp."""
    return [ {
        "id": 1,
        "name": "Device 1",
        "ip": "255:255:255:255",
        "mac": "00:00:00:00:00:00",
    },
    {
        "id": 2,
        "name": "Device 2",
        "ip": "255:255:255:2",
        "mac": "00:00:00:00:00:01",
    }]

@router.get("/dhcpLeases")
def get_dhcpLeases():
    """Tmp."""
    return [ {
        "id": 1,
        "name": "Device 1",
        "description": "Description 1",
        "ip": "255:255:255:255",
        "mac": "00:00:00:00:00:00",
    },
    {
        "id": 2,
        "name": "Device 2",
        "description": "Description 2 blalfl lkfld kld d lkdlf",
        "ip": "255:255:255:2",
        "mac": "00:00:00:00:00:01",
    }]

@router.get("/dhcpLease/{id}")
def get_dhcpLease(id: int):
    """Tmp."""
    return {
        "id": int(id),
        "name": "Device 1",
        "description": "Description 1",
        "ip": "255:255:255:255",
        "mac": "00:00:00:00:00:00",
    }
    
    
@router.get("/addDhcpLease")
def add_DhcpLease():
    """Tmp."""
    return null


@router.get("/deleteDhcpLease")
def delete_DhcpLease():
    """Tmp."""
    return null