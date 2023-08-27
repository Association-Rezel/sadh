"""NetBoxClient class definition."""
import logging
from turtle import pos

from pynetbox import RequestError
from pynetbox.core.api import Api
from sqlalchemy import desc

from back.env import ENV
from back.errors import NetBoxConnectionError, UnexpectedNetboxSchemaError
from back.interfaces.auth import KeycloakId
from back.interfaces.box import ONT, Box, BoxModel, DeviceRoles
from back.interfaces.users import User
from back.netbox_client.setup import assert_requires

logger = logging.getLogger(__name__)


class NetBoxClient:
    """All netbox interactions pass by this class."""

    api: Api

    def __init__(self) -> None:
        """Init the netbox client."""
        self.api = Api(ENV.netbox_url, token=ENV.netbox_token)
        logger.warning("Starting netbox requirements check.")
        try:
            self.api.status()
        except RequestError as ex:
            raise NetBoxConnectionError from ex
        assert_requires(self.api)
        logger.info("Netbox service ready")

    def create_user_tag(self, user: User) -> None:
        """Create a tag for a user."""
        self.api.extras.tags.create(slug=user.keycloak_id, name=user.keycloak_id, description=user.name)

    def get_box_from_user(self, _id: KeycloakId) -> Box | None:
        """Try to find the box of the user."""
        res = list(self.api.dcim.devices.filter(tag=_id, limit=1))
        if not res:
            return None
        nb_box = res[0]
        return Box(
            serial_number=nb_box.serial,
            model=BoxModel(
                manufacturer=nb_box.device_type.manufacturer.slug,
                name=nb_box.device_type.slug,
            ),
        )

    def get_ont_from_user(self, _id: KeycloakId) -> ONT | None:
        """Try to find the ont of the user."""
        res = list(self.api.dcim.devices.filter(tag=_id, device_roles=DeviceRoles.ONT, limit=1))
        if not res:
            return None
        nb_ont = res[0]

        nb_ont_interfaces_pon = list(self.api.dcim.interfaces.filter(device_id=nb_ont.id, name="pon"))

        if len(nb_ont_interfaces_pon) != 1:
            logger.error(f"Invalid number of PON interfaces for ONT {nb_ont.id}")
            return None
        pon_interface = nb_ont_interfaces_pon[0]
        position_PM = str(pon_interface.trace()[2][0])
        return ONT(
            serial_number=nb_ont.serial,
            position_PM=position_PM,
        )
