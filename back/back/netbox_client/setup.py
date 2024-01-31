"""Assert all requirements are meet to be able to add info to netbox."""
import logging
from typing import Any

from pynetbox.core.api import Api

from back.env import ENV
from back.interfaces.box import DeviceRoles, Models, PublicSubnets, Residence

logger = logging.getLogger(__name__)


def _sync_nb_objects(objects_to_sync: dict[str, dict[str, Any]], api_group: str, api_resource: str, api: Api) -> None:
    """Sync an object list with netbox.

    `objects_to_sync` must follow the format :
    {
        "slug1": {"additional field": "optional"},
        "slug2": {"another field": "optional"}
    }
    """
    _api = getattr(getattr(api, api_group), api_resource)
    objects_present = {str(s) for s in _api.filter(name=list(objects_to_sync.keys()))}
    objects_not_present = set(objects_to_sync.keys()) - objects_present
    if ENV.environment == "dev":
        for obj in objects_not_present:
            try:
                print(f"Adding {obj} to {api_group}/{api_resource}")
                _api.create(slug=obj, **objects_to_sync[obj])
            except Exception as e:
                print(f"Erreur: {e}")
        logger.debug("Added %s entries in the %s/%s table.", len(objects_not_present), api_group, api_resource)

    else:
        for obj in objects_not_present:
            print(f"{obj} should be added in {api_group}/{api_resource}")
        logger.debug("Missing %s entries in the %s/%s table.", len(objects_not_present), api_group, api_resource)


def assert_requires(api: Api) -> None:
    """Assert all requirements are meet."""
    assert_residences(api)
    assert_box_models(api)
    assert_ips(api)
    assert_device_role(api)


def assert_residences(api: Api) -> None:
    """Assert all residences exists."""
    _sync_nb_objects(
        {res.name.lower(): {"name": res.name.lower()} for res in Residence},
        "dcim",
        "sites",
        api,
    )


def assert_box_models(api: Api) -> None:
    """Assert all Modelss exists."""
    models = [mod.value for mod in Models]
    _sync_nb_objects(
        {mod.manufacturer: {"name": mod.manufacturer} for mod in models},
        "dcim",
        "manufacturers",
        api,
    )

    _sync_nb_objects(
        {mod.name: {"model": mod.name, "manufacturer": {"name": mod.manufacturer}} for mod in models},
        "dcim",
        "device_types",
        api,
    )


def assert_ips(api: Api) -> None:
    """Assert all public ips exists."""
    _sync_nb_objects(
        {str(sub.value): {"prefix": str(sub.value), "status": "reserved"} for sub in PublicSubnets},
        "ipam",
        "prefixes",
        api,
    )


def assert_device_role(api: Api) -> None:
    """Assert all device roles exist."""
    _sync_nb_objects(
        {role.name.lower(): {"name": role.name.lower()} for role in DeviceRoles},
        "dcim",
        "device-roles",
        api,
    )
