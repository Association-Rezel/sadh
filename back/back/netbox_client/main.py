"""NetBoxClient class definition."""
import logging

from pynetbox import RequestError
from pynetbox.core.api import Api

from back.env import ENV
from back.netbox_client.errors import NetBoxConnectionError
from back.netbox_client.setup import assert_requires

logger = logging.getLogger(__name__)


class NetBoxClient:
    """All netbox interactions pass by this class."""

    api: Api

    def __init__(self) -> None:
        self.api = Api(ENV.netbox_url, token=ENV.netbox_token)
        logger.warning("Starting netbox requirements check.")
        try:
            self.api.status()
        except RequestError as ex:
            raise NetBoxConnectionError from ex
        assert_requires(self.api)
        logger.info("Netbox service ready")
