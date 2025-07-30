from uuid import UUID

from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
from typing_extensions import Literal

from back.env import ENV

USER_SESSION_KEY: Literal["user"] = "user"
ADMIN_SESSION_KEY: Literal["admin"] = "admin"


class JWT(BaseModel):
    email: str
    iat: int


class JWTUser(JWT):
    user_id: UUID


class JWTAdmin(JWT):
    username: str


oauth = OAuth()

# Register the User OIDC provider
oauth.register(
    name="user_oidc",
    server_metadata_url=f"{ENV.oidc_issuer}/.well-known/openid-configuration",
    client_id=ENV.oidc_client_id,
    client_secret=ENV.oidc_client_secret,
    client_kwargs={
        "scope": "openid email profile",
        "response_mode": "query",
    },
)

# Register the Admin OIDC provider
oauth.register(
    name="admin_oidc",
    server_metadata_url=f"{ENV.oidc_admin_issuer}/.well-known/openid-configuration",
    client_id=ENV.oidc_admin_client_id,
    client_secret=ENV.oidc_admin_client_secret,
    client_kwargs={
        "scope": "openid email profile entitlements",
        "response_mode": "query",
    },
)
