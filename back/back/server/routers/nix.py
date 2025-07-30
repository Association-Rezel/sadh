import re

import requests
from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse

from back.env import ENV
from back.server.dependencies import must_be_admin

router = APIRouter(prefix="/nix", tags=["nix"])


@router.post(
    "/{path:path}",
    dependencies=[Depends(must_be_admin)],
)
async def _reverse_proxy(
    request: Request,
):
    # On proxy la requête vers nix
    url = f"{ENV.nix_url}{request.url.path.replace('/nix/', '/')}"
    # On lance la requête
    data = await request.body()
    try:
        response = requests.request(
            request.method,
            url,
            data=data,
            timeout=15,
        )
    except requests.exceptions.Timeout:
        return Response(status_code=504)

    if response.status_code == 200:
        filename = re.findall(
            'filename="(.+)"', response.headers["content-disposition"]
        )[0]

        return JSONResponse(
            content={"filename": filename, "content": response.content.decode()},
            status_code=response.status_code,
        )

    else:
        return Response(content=response.content, status_code=response.status_code)
