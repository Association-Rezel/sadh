"""Assert all requirements are meet to be able to add info to netbox."""
import logging
from typing import Any

from pynetbox.core.api import Api

from back.netbox_client.models import Models, Residence

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
    objects_to_add = set(objects_to_sync.keys()) - {s.slug for s in _api.filter(name=list(objects_to_sync.keys()))}
    for obj in objects_to_add:
        _api.create(slug=obj, **objects_to_sync[obj])
    logger.debug("Added %s entries in the %s/%s table.", len(objects_to_add), api_group, api_resource)


def assert_requires(api: Api) -> None:
    """Assert all requirements are meet."""
    assert_residences(api)
    assert_box_models(api)


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
