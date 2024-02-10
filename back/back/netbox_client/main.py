"""NetBoxClient class definition."""

import logging
import random
import re
from datetime import datetime
from ipaddress import IPv4Interface, IPv6Interface, IPv6Network
from typing import Any

import requests
import xkcdpass.xkcd_password as xp
from netaddr import EUI
from pynetbox import RequestError
from pynetbox.core.api import Api
from pynetbox.core.query import RequestError
from pynetbox.models.ipam import Prefixes
from requests.adapters import HTTPAdapter

from back.email.main import send_admin_message
from back.env import ENV
from back.errors import NetBoxConnectionError
from back.interfaces.auth import KeycloakId
from back.interfaces.box import ONT, Box, BoxInterface, BoxModel, DeviceRoles, Models, WifiConfig
from back.interfaces.subscriptions import Subscription
from back.interfaces.users import User
from back.netbox_client.setup import assert_requires

logger = logging.getLogger(__name__)


# Voir https://pynetbox.readthedocs.io/en/latest/advanced.html#timeouts
class TimeoutHTTPAdapter(HTTPAdapter):
    def __init__(self, *args, **kwargs):
        self.timeout = kwargs.get("timeout", 5)
        super().__init__(*args, **kwargs)

    def send(self, request, **kwargs):
        kwargs['timeout'] = self.timeout
        return super().send(request, **kwargs)


class NetBoxClient:
    """All netbox interactions pass by this class."""

    api: Api
    vlan65_id: int
    vlan101_id: int
    vlan102_id: int

    adh_prefix: Prefixes
    adh_exte_prefix: Prefixes

    ONT_ROLE_ID: int
    BOX_ROLE_ID: int

    def __init__(self) -> None:
        """Init the netbox client."""
        self.api = Api(ENV.netbox_url, token=ENV.netbox_token)

        # Add timeout
        adapter = TimeoutHTTPAdapter()
        session = requests.Session()
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        self.api.http_session = session

        logger.warning("Starting netbox requirements check.")
        try:
            self.api.status()
        except RequestError as ex:
            logger.critical(ex)
            raise NetBoxConnectionError from ex
        assert_requires(self.api)
        self.init_vlan_ids()
        self.init_prefixes()
        self.init_roles()
        logger.info("Netbox service ready")

    def init_vlan_ids(self) -> None:
        """Init vlan ids."""
        if (vlan65 := self.api.ipam.vlans.get(vid="65")) is None:
            if ENV.environment == "dev":
                vlan65 = self.api.ipam.vlans.create(vid="65", name="VLAN 65", status="active")
            else:
                raise Exception("Vlan 65 not found in Netbox")
        if (vlan101 := self.api.ipam.vlans.get(vid="101")) is None:
            if ENV.environment == "vlans":
                vlan101 = self.api.ipam.vlans.create(vid="101", name="VLAN 101", status="active")
            else:
                raise Exception("Vlan 101 not found in Netbox")
        if (vlan102 := self.api.ipam.vlans.get(vid="102")) is None:
            if ENV.environment == "dev":
                vlan102 = self.api.ipam.vlans.create(vid="102", name="VLAN 102", status="active")
            else:
                raise Exception("Vlan 102 not found in Netbox")

        self.vlan65_id = vlan65.id  # type: ignore
        self.vlan101_id = vlan101.id  # type: ignore
        self.vlan102_id = vlan102.id  # type: ignore

    def init_prefixes(self) -> None:
        """Init prefixes."""
        if (adh := self.api.ipam.prefixes.get(prefix="137.194.8.0/22")) is None:
            raise Exception("Prefix 137.194.8/22 not found in Netbox")
        if (adh_exte := self.api.ipam.prefixes.get(prefix="195.14.28.0/24")) is None:
            raise Exception("Prefix 195.14.28/24 not found in Netbox")

        self.adh_prefix = adh
        self.adh_exte_prefix = adh_exte

    def init_roles(self) -> None:
        """Init roles."""
        if (ont_role := self.api.dcim.device_roles.get(slug=DeviceRoles.ONT.name.lower())) is None:
            raise Exception("Role ONT not found in Netbox")
        if (box_role := self.api.dcim.device_roles.get(slug=DeviceRoles.BOX.name.lower())) is None:
            raise Exception("Role BOX not found in Netbox")

        self.ONT_ROLE_ID = ont_role.id
        self.BOX_ROLE_ID = box_role.id

    def create_user_tag(self, user: User) -> None:
        """Create a tag for a user."""
        tag = "user-" + str(user.keycloak_id)
        self.api.extras.tags.create(slug=tag, name=tag, description=user.name)

    def get_box_from_user(self, _id: KeycloakId) -> Box | None:
        """Try to find the box of the user."""
        box_device = self._get_only_one_device(tag="user-" + str(_id), role_id=self.BOX_ROLE_ID, limit=1)
        if box_device is None:
            return None
        if_mgt = list(self.api.dcim.interfaces.filter(device_id=box_device.id, name="eth0.65"))[0]
        mac_address: str = if_mgt.mac_address

        ip_addresses = list(self.api.ipam.ip_addresses.filter(device_id=box_device.id))
        wan_adh_ipv4s: list[IPv4Interface] = []
        wan_adh_exte_ipv4s: list[IPv4Interface] = []
        mgt_ipv6s: list[IPv6Interface] = []

        for ip_addr in ip_addresses:
            if ip_addr.family.value == 4:
                if ip_addr.assigned_object.name == "eth0.101":
                    wan_adh_ipv4s.append(IPv4Interface(ip_addr.address))
                elif ip_addr.assigned_object.name == "eth0.102":
                    wan_adh_exte_ipv4s.append(IPv4Interface(ip_addr.address))
            elif ip_addr.family.value == 6:
                if ip_addr.assigned_object.name == "eth0.65":
                    mgt_ipv6s.append(IPv6Interface(ip_addr.address))

        if_wlan0 = list(self.api.dcim.interfaces.filter(device_id=box_device.id, name="wlan0"))[0]
        ssid = if_wlan0.wireless_lans[0].ssid  # type: ignore

        return Box(
            serial_number=box_device.serial,
            model=BoxModel(
                manufacturer=box_device.device_type.manufacturer.slug,
                name=box_device.device_type.slug,
            ),
            if_adh=BoxInterface(mac_address=mac_address, ipv4s=wan_adh_ipv4s, ipv6s=[]),
            if_adh_exte=BoxInterface(mac_address=mac_address, ipv4s=wan_adh_exte_ipv4s, ipv6s=[]),
            if_mgmt=BoxInterface(mac_address=mac_address, ipv4s=[], ipv6s=mgt_ipv6s),
            ssid=ssid,
        )

    def get_ont_from_user(self, _id: KeycloakId) -> ONT | None:
        """Try to find the ont of the user."""

        ont_device = self._get_only_one_device(tag="user-" + str(_id), role_id=self.ONT_ROLE_ID, limit=1)
        if ont_device is None:
            return None

        pon_interface = self._get_pon_interface(ont_device.id)  # type: ignore

        position_PM = str(pon_interface.trace()[2][0])
        return ONT(
            serial_number=ont_device.serial,
            position_PM=position_PM,
            netbox_id=ont_device.id,
        )

    def register_ont(self, serial_number: str, software_version: str, sub: Subscription) -> ONT:
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
                device_role=self.ONT_ROLE_ID,  # type: ignore
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
                {
                    "mode": "tagged-all",
                    "tagged_vlans": [self.vlan65_id, self.vlan101_id, self.vlan102_id],
                }
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
        if ENV.environment is not "dev":
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

    def register_box(self, serial_number: str, mac_address: str, sub: Subscription, telecomian: bool) -> Box:
        """Register an ONT in netbox and notify Charon for OLT configuration."""

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

        # Create Box in netbox
        device_box = self.api.dcim.devices.create(
            device_role=self.BOX_ROLE_ID,  # type: ignore
            device_type=self.api.dcim.device_types.get(slug=Models.XIAOMI_AC2350.value.name.lower()).id,  # type: ignore
            name=f"BOX {sub.chambre.residence.name}-{sub.chambre.name}",
            serial=serial_number,
            site=nb_site_residence.id,  # type: ignore
            rack=chambre_rack.id,  # type: ignore
            status="planned",
            tags=[self.api.extras.tags.get(slug="user-" + str(sub.user_id)).id],  # type: ignore
        )

        # Wireless LAN
        wifi_config = WifiConfig(
            ssid=generate_unique_ssid(self.api),
            password=generate_password(),
        )

        wlan = self.api.wireless.wireless_lans.create(
            name=f"{sub.chambre.residence.name}-{sub.chambre.name}",
            status="active",
            ssid=wifi_config.ssid,
            auth_type="wpa-personal",
            tags=[self.api.extras.tags.get(slug="user-" + str(sub.user_id)).id],  # type: ignore
            custom_fields={"local_id": 0},
            auth_psk=wifi_config.password,
        )

        # IP adresses

        # Setup interfaces
        interfaces = list(self.api.dcim.interfaces.filter(device_id=device_box.id))  # type: ignore

        mgt_if = list(filter(lambda i: i.name == "eth0.65", interfaces))[0]
        wan_if = list(filter(lambda i: i.name == "eth0.101" if telecomian else i.name == "eth0.102", interfaces))[0]
        wlan0_if = list(filter(lambda i: i.name == "wlan0", interfaces))[0]

        wan_prefix = self.adh_prefix if telecomian else self.adh_exte_prefix
        mgt_ipv6 = IPv6Interface(get_slaac_from_mac(EUI(mac_address)).ip.exploded + "/64")

        # Provision IP addresses & WLAN
        wan_ip = IPv4Interface(
            str(
                wan_prefix.available_ips.create(
                    {
                        "assigned_object_id": wan_if.id,
                        "assigned_object_type": "dcim.interface",
                        "tags": [self.api.extras.tags.get(slug="user-" + str(sub.user_id)).id],  # type: ignore
                    }
                )
            )
        )

        self.api.ipam.ip_addresses.create(
            address=str(mgt_ipv6),
            assigned_object_id=mgt_if.id,
            assigned_object_type="dcim.interface",
        )

        wlan0_if.update(
            {
                "rf_role": "ap",
                "wireless_lans": [wlan.id],  # type: ignore
                "mac_address": mac_address,
            }
        )

        # Set Mac to every eth0 subinterfaces
        for interface in interfaces:
            if interface.name.startswith("eth0."):
                interface.update({"mac_address": mac_address})

        return Box(
            serial_number=serial_number,
            model=BoxModel(
                manufacturer="xiaomi",
                name="ac2350",
            ),
            if_adh=BoxInterface(mac_address=mac_address, ipv4s=[wan_ip] if telecomian else [], ipv6s=[]),
            if_adh_exte=BoxInterface(mac_address=mac_address, ipv4s=[wan_ip] if not telecomian else [], ipv6s=[]),
            if_mgmt=BoxInterface(mac_address=mac_address, ipv4s=[], ipv6s=[IPv6Interface(mgt_ipv6)]),
            ssid=wifi_config.ssid,
        )

    def _get_pon_interface(self, ont_id: int) -> Any:
        nb_ont_interfaces_pon = list(self.api.dcim.interfaces.filter(device_id=ont_id, name="pon"))

        if len(nb_ont_interfaces_pon) != 1:
            logger.error(f"Invalid number of PON interfaces for ONT {ont_id}")
            msg = f"Invalid number of PON interfaces for ONT {ont_id}"
            raise Exception(msg)

        return nb_ont_interfaces_pon[0]

    def _get_only_one_device(self, **kwargs) -> Any | None:
        """Get only one device from netbox.

        Raises:
            Exception: If more than one device is found.

        Returns:
            Devices: The device found. None if no device is found.
        """
        devices = self.api.dcim.devices.filter(**kwargs)
        if (device := next(devices, None)) is None:
            return None
        elif next(devices, None) is not None:
            raise Exception(f"Found more than one device with {kwargs}")

        return device


MEC_PORT_PATTERN = re.compile(r"([A-P])([1-8])")


def mec_port_name_to_position_in_pon(mec_port_name: str) -> int:
    """Translate MEC port name to position_in_pon."""
    if not MEC_PORT_PATTERN.match(mec_port_name):
        raise ValueError(f"Invalid MEC port name {mec_port_name}")

    # Par exemple B4 = 12, C1 = 17, E1 = 1, F5 = 13
    return int(mec_port_name[1:]) + 8 * ((ord(mec_port_name[0]) - ord("A")) % 4)


def get_slaac_from_mac(mac: EUI):
    host_id = mac.modified_eui64()
    address_binary = int(host_id) + int(IPv6Network("fe80::/64").network_address)
    return IPv6Interface(address_binary)


def generate_password() -> str:
    default_words = xp.locate_wordfile()
    word_list = xp.generate_wordlist(wordfile=default_words, min_length=5, max_length=8, valid_chars="[^'\"]")
    raw_password = xp.generate_xkcdpassword(word_list, numwords=4, delimiter="_")
    return raw_password  # type: ignore


def generate_unique_ssid(api: Api) -> str:
    """Get SSID that is not in netbox."""
    ssids = [
        "Rezel-Hydrogen",
        "Rezel-Helium",
        "Rezel-Lithium",
        "Rezel-Beryllium",
        "Rezel-Boron",
        "Rezel-Carbon",
        "Rezel-Nitrogen",
        "Rezel-Oxygen",
        "Rezel-Fluorine",
        "Rezel-Neon",
        "Rezel-Sodium",
        "Rezel-Magnesium",
        "Rezel-Aluminum",
        "Rezel-Silicon",
        "Rezel-Phosphorus",
        "Rezel-Sulfur",
        "Rezel-Chlorine",
        "Rezel-Argon",
        "Rezel-Potassium",
        "Rezel-Calcium",
        "Rezel-Scandium",
        "Rezel-Titanium",
        "Rezel-Vanadium",
        "Rezel-Chromium",
        "Rezel-Manganese",
        "Rezel-Iron",
        "Rezel-Cobalt",
        "Rezel-Nickel",
        "Rezel-Copper",
        "Rezel-Zinc",
        "Rezel-Gallium",
        "Rezel-Germanium",
        "Rezel-Arsenic",
        "Rezel-Selenium",
        "Rezel-Bromine",
        "Rezel-Krypton",
        "Rezel-Rubidium",
        "Rezel-Strontium",
        "Rezel-Yttrium",
        "Rezel-Zirconium",
        "Rezel-Niobium",
        "Rezel-Molybdenum",
        "Rezel-Technetium",
        "Rezel-Ruthenium",
        "Rezel-Rhodium",
        "Rezel-Palladium",
        "Rezel-Silver",
        "Rezel-Cadmium",
        "Rezel-Indium",
        "Rezel-Tin",
        "Rezel-Antimony",
        "Rezel-Tellurium",
        "Rezel-Iodine",
        "Rezel-Xenon",
        "Rezel-Cesium",
        "Rezel-Barium",
        "Rezel-Lanthanum",
        "Rezel-Cerium",
        "Rezel-Praseodymium",
        "Rezel-Neodymium",
        "Rezel-Promethium",
        "Rezel-Samarium",
        "Rezel-Europium",
        "Rezel-Gadolinium",
        "Rezel-Terbium",
        "Rezel-Dysprosium",
        "Rezel-Holmium",
        "Rezel-Erbium",
        "Rezel-Thulium",
        "Rezel-Ytterbium",
        "Rezel-Lutetium",
        "Rezel-Hafnium",
        "Rezel-Tantalum",
        "Rezel-Tungsten",
        "Rezel-Rhenium",
        "Rezel-Osmium",
        "Rezel-Iridium",
        "Rezel-Platinum",
        "Rezel-Gold",
        "Rezel-Mercury",
        "Rezel-Thallium",
        "Rezel-Lead",
        "Rezel-Bismuth",
        "Rezel-Polonium",
        "Rezel-Astatine",
        "Rezel-Radon",
        "Rezel-Francium",
        "Rezel-Radium",
        "Rezel-Actinium",
        "Rezel-Thorium",
        "Rezel-Protactinium",
        "Rezel-Uranium",
        "Rezel-Neptunium",
        "Rezel-Plutonium",
        "Rezel-Americium",
        "Rezel-Curium",
        "Rezel-Berkelium",
        "Rezel-Californium",
        "Rezel-Einsteinium",
        "Rezel-Fermium",
        "Rezel-Mendelevium",
        "Rezel-Nobelium",
        "Rezel-Lawrencium",
        "Rezel-Rutherfordium",
        "Rezel-Dubnium",
        "Rezel-Seaborgium",
        "Rezel-Bohrium",
        "Rezel-Hassium",
        "Rezel-Meitnerium",
        "Rezel-Darmstadtium",
        "Rezel-Roentgenium",
        "Rezel-Copernicium",
        "Rezel-Nihonium",
        "Rezel-Flerovium",
        "Rezel-Moscovium",
        "Rezel-Livermorium",
        "Rezel-Tennessine",
        "Rezel-Oganesson",
    ]

    random_ssid = None

    while random_ssid is None and ssids:
        random_ssid = random.choice(ssids)
        if (ok := next(api.wireless.wireless_lans.filter(ssid=random_ssid), None)) is not None:
            print(ok)
            random_ssid = None

    if random_ssid is None:
        random_ssid = "default-ssid-" + str(datetime.now().timestamp())
    return random_ssid
