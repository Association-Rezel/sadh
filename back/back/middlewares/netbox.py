"""Middlewares to inject netbox data."""


import logging

from fastapi import Depends

from back.http_errors import NotFound
from back.interfaces import User
from back.interfaces.box import Box
from back.middlewares.db import user
from back.netbox_client import NETBOX

logger = logging.getLogger(__name__)


@Depends
def box(_user: User = user) -> Box:
    """Return the current user box."""
    maybe_box = NETBOX.get_box_from_user(_user.keycloak_id)
    if maybe_box is None:
        raise NotFound
    return maybe_box
