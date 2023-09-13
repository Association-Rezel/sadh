"""NetBoxClient class definition."""
import logging
from ast import List
from os import name
from typing import Any

import requests
from pynetbox import RequestError
from pynetbox.core.api import Api
from pynetbox.core.query import RequestError

from back.email.main import send_admin_message
from back.env import ENV
from back.errors import NetBoxConnectionError
from back.interfaces.auth import KeycloakId
from back.interfaces.box import ONT, Box, BoxModel, DeviceRoles, Models
from back.interfaces.subscriptions import Subscription
from back.interfaces.users import User
from back.netbox_client.setup import assert_requires

logger = logging.getLogger(__name__)


class NetBoxClient:
    """All netbox interactions pass by this class."""

    api: Api
    vlan65_id: int
    vlan101_id: int
    vlan102_id: int

    def __init__(self) -> None:
        """Init the netbox client."""
        self.api = Api(ENV.netbox_url, token=ENV.netbox_token)
        logger.warning("Starting netbox requirements check.")
        try:
            self.api.status()
        except RequestError as ex:
            raise NetBoxConnectionError from ex
        assert_requires(self.api)
        self.init_vlan_ids()
        logger.info("Netbox service ready")

    def init_vlan_ids(self) -> None:
        """Init vlan ids."""
        if (vlan65 := self.api.ipam.vlans.get(vid="65")) is None:
            raise Exception("Vlan 65 not found in Netbox")
        if (vlan101 := self.api.ipam.vlans.get(vid="101")) is None:
            raise Exception("Vlan 101 not found in Netbox")
        if (vlan102 := self.api.ipam.vlans.get(vid="102")) is None:
            raise Exception("Vlan 102 not found in Netbox")

        self.vlan65_id = vlan65.id
        self.vlan101_id = vlan101.id
        self.vlan102_id = vlan102.id

    def create_user_tag(self, user: User) -> None:
        """Create a tag for a user."""
        tag = "user-" + str(user.keycloak_id)
        self.api.extras.tags.create(slug=tag, name=tag, description=user.name)

    def get_box_from_user(self, _id: KeycloakId) -> Box | None:
        """Try to find the box of the user."""
        res = list(self.api.dcim.devices.filter(tag="user-" + _id, limit=1))
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
        try:
            res = self.api.dcim.devices.filter(tag="user-" + str(_id), device_roles=DeviceRoles.ONT, limit=1)
        except RequestError as ex:
            logger.exception(f"Error while getting ONT from user {_id}")
            return None
        if len(res) == 0:
            return None
        nb_ont = res.__next__()

        pon_interface = self._get_pon_interface(nb_ont.id)

        position_PM = str(pon_interface.trace()[2][0])
        return ONT(
            serial_number=nb_ont.serial,
            position_PM=position_PM,
            netbox_id=nb_ont.id,
        )

    def register_ont(self, serial_number: str, software_version: str, sub: Subscription, telecomian: bool) -> ONT:
        """Register an ONT in netbox and notify Charon for OLT configuration."""
        MEC128_ID = 3  # C'est comme ça et puis c'est tout

        # The natural order allows us to automatically get the lowest available port
        empty_mec_ports = self.api.dcim.front_ports.filter(device_id=MEC128_ID, cabled=False, limit=1)
        if len(empty_mec_ports) < 1:
            logger.error("No empty MEC port found")
            send_admin_message(
                ":x: Erreur :x:",
                "Impossible de trouver un port MEC libre lors de l'enregistrement d'un ONT",
            )
            raise Exception("No empty MEC port found")
        port_in_PM = empty_mec_ports.__next__()

        # Translate MEC port name to position_in_pon
        position_in_pon = mec_port_name_to_position_in_pon(port_in_PM.name)

        # Cache site of residence to avoid too many requests
        nb_site_residence = self.api.dcim.sites.get(slug=sub.chambre.residence.name.lower())

        # Get or create chambre rack
        chambre_rack = self.api.dcim.racks.get(name=f"{sub.chambre.residence.name} {sub.chambre.name}")
        if chambre_rack is None:
            chambre_rack = self.api.dcim.racks.create(
                name=f"{sub.chambre.residence.name} {sub.chambre.name}",
                site=nb_site_residence.id,  # type: ignore
                status="active",
            )

        # Create ONT in netbox
        ont_device = self.api.dcim.devices.get(serial=serial_number)

        if ont_device is None:
            ont_device = self.api.dcim.devices.create(
                device_role=self.api.dcim.device_roles.get(slug=DeviceRoles.ONT.name.lower()).id,  # type: ignore
                device_type=self.api.dcim.device_types.get(slug=Models.NOKIA_G_010G_Q.value.name.lower()).id,  # type: ignore
                name=f"ONT {sub.chambre.residence.name}-{sub.chambre.name}",
                serial=serial_number,
                site=nb_site_residence.id,  # type: ignore
                rack=chambre_rack.id,  # type: ignore
                status="active",
                tags=[self.api.extras.tags.get(slug="user-" + str(sub.user_id)).id],  # type: ignore
                custom_fields={"position_in_pon": position_in_pon, "ont_sftw_ver": software_version},
            )

        # Add VLANs to ONT
        for interface in self.api.dcim.interfaces.filter(device_id=ont_device.id):  # type: ignore
            interface.update(
                {"mode": "tagged", "tagged_vlans": [self.vlan65_id, self.vlan101_id if telecomian else self.vlan102_id]}
            )

        pon_interface = self._get_pon_interface(ont_device.id)  # type: ignore

        # Add cable from pon to MEC port
        self.api.dcim.cables.create(
            a_terminations=[
                {"object_type": "dcim.interface", "object_id": pon_interface.id},
            ],
            b_terminations=[
                {"object_type": "dcim.frontport", "object_id": port_in_PM.id},
            ],
        )

        # Everything setup on Netbox, now we can notify Charon
        # Timeout to 5s because front-end is waiting for us
        try:
            charon_response = requests.get(
                f"{ENV.charon_url}register-onu/{ont_device.id}",  # type: ignore
                headers={"Authorization": f"Bearer {ENV.charon_token}"},
                timeout=5,
            )
        except requests.exceptions.Timeout:
            logger.error("Charon timed out")
            send_admin_message(
                ":x: Erreur :x:",
                f"Charon a time out lors de l'enregistrement de l'ONT {ont_device.id}",  # type: ignore
            )
            raise Exception("Charon timed out")

        if charon_response.status_code != 200:
            logger.error("Charon returned an error")
            logger.error(charon_response.status_code)
            logger.error(charon_response.text)
            send_admin_message(
                ":x: Erreur :x:",
                f"Charon a retourné une erreur lors de l'enregistrement de l'ONT {ont_device.id}",  # type: ignore
            )
            raise Exception("Charon returned an error")

        return ONT(
            serial_number=serial_number,
            position_PM=port_in_PM.name,
            netbox_id=ont_device.id,  # type: ignore
        )

    def _get_pon_interface(self, ont_id: int) -> Any:
        nb_ont_interfaces_pon = list(self.api.dcim.interfaces.filter(device_id=ont_id, name="pon"))

        if len(nb_ont_interfaces_pon) != 1:
            logger.error(f"Invalid number of PON interfaces for ONT {ont_id}")
            msg = f"Invalid number of PON interfaces for ONT {ont_id}"
            raise Exception(msg)

        return nb_ont_interfaces_pon[0]


def mec_port_name_to_position_in_pon(mec_port_name: str) -> int:
    """Translate MEC port name to position_in_pon."""
    # Par exemple B4 = 12, C1 = 17
    return int(mec_port_name[1:]) + 8 * (ord(mec_port_name[0]) - ord("A"))
