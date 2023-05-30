"""NetBoxClient class definition."""
import logging

from pynetbox import RequestError
from pynetbox.core.api import Api

from back.env import ENV
from back.errors import NetBoxConnectionError
from back.interfaces.auth import KeycloakId
from back.interfaces.box import Box, BoxModel
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

    def create_user_tag(self, kcid: KeycloakId) -> None:
        """Create a tag for a user."""
        self.api.extras.tags.create(slug=kcid, name=kcid)

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
