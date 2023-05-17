"""How to authenticate users and filter permissions."""


from fastapi import Depends

from back.interfaces.auth import Token
from back.keycloak_client import decode


@Depends
def token(raw_token: dict = decode) -> Token:
    """Get the user's identity from the token or terminate the request.

    Example implementation :
    ```python
    @router.get("/token")
    async def _token(_t: Token = token) -> str:
        return _t.name
    ```
    """
    return Token(
        keycloak_id=raw_token["sub"],
        name=raw_token["preferred_username"],
    )
