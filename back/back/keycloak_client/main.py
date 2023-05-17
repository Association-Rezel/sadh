"""Keycloak integration.

Needed env :

- ENV.kc_url
- ENV.kc_client_id
- ENV.kc_client_secret
"""


import logging

from fastapi import Depends, Security
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError
from keycloak import KeycloakOpenID

from back.env import ENV
from back.http_errors import Unauthorized

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


@Depends
def decode(token: str = Security(__scheme)) -> dict:  # noqa: B008
    """Decode token."""
    try:
        return __kc.decode_token(
            token,
            key=__public_key,
            options={
                "verify_signature": True,
                "verify_aud": False,  # TODO : verify audience (mettre sur True et corriger les erreurs)
                "exp": True,
            },
        )
    except (JWTError, ExpiredSignatureError, JWTClaimsError):
        raise Unauthorized  # noqa: B904
