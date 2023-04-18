"""Keycloak options."""
from keycloak import KeycloakError
from back.env import ENV


def auth_login(redirect_to: str) -> str:
    """Get login endpoint."""
    auth_url = ENV.keycloak.auth_url(
        redirect_uri=redirect_to,
        scope="openid profile email"
    )
    return auth_url


def check_auth_code(code: str) -> str | None:
    """Check if the given auth code is valid.

    If the auth code is valid, return the JWT.
    Else, return None.
    """
    try:
        access_token = ENV.keycloak.token(
            grant_type='authorization_code',
            code=code
        )
        user_info = ENV.keycloak.userinfo(token = access_token["access_token"])
    except KeycloakError:
        return None
    return str(user_info)
