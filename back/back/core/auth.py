# https://pypi.org/project/python-keycloak/
from fastapi.security import OAuth2AuthorizationCodeBearer
from keycloak import KeycloakOpenID

from back.env import get_or_raise

keycloak_url = get_or_raise("KC_URL")
realm = "users"
keycloak_openid  = KeycloakOpenID(
    server_url=keycloak_url,
    client_id=get_or_raise("KC_CLIENT_ID"),
    client_secret_key=get_or_raise("KC_CLIENT_SECRET"),
    realm_name=realm,
    verify=True
)

config_well_known = keycloak_openid.well_known()

KEYCLOAK_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n" + keycloak_openid.public_key() + "\n-----END PUBLIC KEY-----"

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{keycloak_url}realms/{realm}/protocol/openid-connect/auth",
    tokenUrl=f"{keycloak_url}realms/{realm}/protocol/openid-connect/token",
)
