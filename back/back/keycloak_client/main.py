"""Keycloak integration.

Needed env :

- ENV.kc_url
- ENV.kc_client_id
- ENV.kc_client_secret
"""


import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Security
from fastapi.security import OAuth2AuthorizationCodeBearer
from keycloak import KeycloakOpenID
from starlette.status import HTTP_401_UNAUTHORIZED

from back.env import ENV

__realm = "users"
__logger = logging.getLogger(__name__)

__kc = KeycloakOpenID(
    server_url=ENV.kc_url,
    client_id=ENV.kc_client_id,
    client_secret_key=ENV.kc_client_secret,
    realm_name=__realm,
    verify=True,
)

__scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{ENV.kc_url}realms/{__realm}/protocol/openid-connect/auth",
    tokenUrl=f"{ENV.kc_url}realms/{__realm}/protocol/openid-connect/token",
)

__public_key = f"-----BEGIN PUBLIC KEY-----\n{__kc.public_key()}\n-----END PUBLIC KEY-----"


@dataclass
class Token:
    """Keyclak JWT unlock."""

    sub: str
    is_admin: bool


def __decode(token: str) -> dict:
    """Decode token."""
    return __kc.decode_token(
        token,
        key=__public_key,
        options={
            "verify_signature": True,
            "verify_aud": False,  # TODO : verify audience (mettre sur True et corriger les erreurs)
            "exp": True,
        },
    )


def __extract_token(jwt: dict) -> Token:
    """Extract subject from JWT."""
    return Token(
        sub=jwt["sub"],
        is_admin=True,
    )


class UNAUTHORIZED(HTTPException):
    """Unauthorized."""

    def __init__(self) -> None:
        """Init default args."""
        super().__init__(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@Depends
def protect(token: str = Security(__scheme)) -> Token:  # noqa: B008
    """Get the user's identity from the token or terminate the request."""
    try:
        return __extract_token(__decode(token))
    except Exception as e:  # noqa: BLE001
        __logger.debug("Error validating JWT.")
        __logger.debug(e)
        raise UNAUTHORIZED  # noqa: B904
