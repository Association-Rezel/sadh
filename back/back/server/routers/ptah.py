from fastapi.responses import StreamingResponse
from pydantic import HttpUrl
import requests
from fastapi import APIRouter, Depends, Response

from back.env import ENV
from back.server.dependencies import must_be_admin
from common_models.base import validate_mac
from rezel_vault_jwt.jwt_transit_manager import JwtTransitManager

from back.utils.K8sVaultTokenProcessing import K8sVaultTokenProcessing

router = APIRouter(prefix="/ptah", tags=["ptah"])


@router.get(
    "/ptah_profiles/names",
    dependencies=[Depends(must_be_admin)],
)
async def _get_ptah_profiles_name_list():
    if ENV.deploy_env == "local":
        return Response(content='["ac2350"]')

    url = f"{ENV.ptah_url}/v1/ptah_profiles/names"
    try:
        response = requests.request(
            url=url,
            method="GET",
            timeout=15,
        )
    except requests.exceptions.Timeout:
        return Response(status_code=504)

    if response.status_code == 200:
        return Response(
            content=response.content, status_code=200, media_type="application/json"
        )

    else:
        return Response(content=response.content, status_code=response.status_code)


@router.post(
    "/build/{mac}/{ptah_profile}",
    dependencies=[Depends(must_be_admin)],
)
async def _build(mac: str, ptah_profile: str):
    mac_box = validate_mac(mac)

    k8s_token_processing = K8sVaultTokenProcessing(
        vault_url=ENV.vault_url,
        vault_role_name=ENV.vault_role_name,
    )

    vault_token = (
        ENV.vault_token if ENV.vault_token else k8s_token_processing.get_vault_token()
    )

    jwt_manager = JwtTransitManager(
        vault_token=vault_token,
        vault_base_url=HttpUrl(ENV.vault_url),
        transit_mount=ENV.vault_transit_mount,
        transit_key=ENV.vault_transit_key,
    )
    token = jwt_manager.issue_jwt({"mac": str(mac_box)})

    url = f"{ENV.ptah_url}/v1/build/prepare/{str(mac_box)}"
    response = requests.request(
        url=url,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"profile": ptah_profile},
        timeout=60,
    )
    response.raise_for_status()

    ptah_download_url = f"{ENV.ptah_url}/v1/build/{str(mac_box)}"
    response = requests.post(
        ptah_download_url,
        headers={"Authorization": f"Bearer {token}"},
        stream=True,
        timeout=60,
    )

    response.raise_for_status()

    filename = "ptah.bin"

    return StreamingResponse(
        response.iter_content(chunk_size=8192),
        media_type=response.headers.get("Content-Type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
