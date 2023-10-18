"""Manage subscriptions."""

import re
from fastapi.responses import JSONResponse

import requests
from fastapi import Request, Response

from back.env import ENV
from back.middlewares import must_be_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("nix")

@router.post("/{path:path}")
async def _reverse_proxy(
    request: Request,
    _: None = must_be_admin
):
    # On proxy la requête vers nix
    url = f"{ENV.nix_url}{request.url.path.replace('/nix/', '/')}"
    # On récupère les headers
    headers = {
        'Authorization': f"Bearer {ENV.nix_token}",
    }
    # On lance la requête
    data = await request.body()
    try:
        response = requests.request(
            request.method,
            url,
            data=data,
            headers=headers,
            timeout=15,
        )
    except requests.exceptions.Timeout:
        return Response(status_code=504)
    
    if response.status_code == 200:
        filename = re.findall("filename=\"(.+)\"", response.headers['content-disposition'])[0]

        return JSONResponse(
            content={"filename": filename, "content": response.content.decode()},
            status_code=response.status_code,
        )
    
    else:
        return Response(content=response.content, status_code=response.status_code)