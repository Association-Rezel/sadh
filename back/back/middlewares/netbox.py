"""Middlewares to inject netbox data."""


import logging

from fastapi import Depends

from back.interfaces import User
from back.middlewares.db import user
from back.netbox_client.models import Adherent, Box, BoxModel, Chambre, Residence

logger = logging.getLogger(__name__)


@Depends
def box(_user: User = user) -> Box:
    """Return the current user box."""
    _box = Box(
        model=BoxModel.XIAOMI_AC2350.value,
        serial_number="123",
        location=Chambre(
            residence=Residence.ALJT,
            name="404",
            adherent=Adherent(_user.keycloak_id),
        ),
        adherent=Adherent(_user.keycloak_id),
    )
    return _box
