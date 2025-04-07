import time
from typing import Tuple

import requests
from authlib.jose import JsonWebKey, JsonWebToken
from common_models.base import RezelBaseModel

from back.env import ENV


class ValidatorError(Exception):
    def __init__(self, error: dict[str, str], status_code: int):
        super().__init__()
        self.error = error
        self.status_code = status_code


OIDC_ISSUER = ENV.oidc_issuer
OIDC_CLIENT_ID = ENV.oidc_client_id


class OIDCTokenValidator:
    def __init__(self):
        self.oidc_config = self._fetch_oidc_config()
        self.jwks, self.last_fetch_jwks = self._fetch_jwks()
        self.jwt = JsonWebToken(["RS256", "RS384", "RS512"])

    def _fetch_oidc_config(self) -> dict:
        """
        Récupère la configuration OpenID Connect depuis l'endpoint `.well-known/openid-configuration`.
        """
        config_url = f"{OIDC_ISSUER}/.well-known/openid-configuration"
        response = requests.get(config_url, timeout=5)
        response.raise_for_status()
        return response.json()

    def _fetch_jwks(self) -> Tuple[dict, float]:
        """
        Récupère les clés publiques utilisées pour signer les JWT depuis le JWKS URI.
        """
        jwks_url = self.oidc_config["jwks_uri"]
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        last_fetch_jwks = time.time()
        return response.json(), last_fetch_jwks

    def fetch_userinfo(self, token_string: str) -> dict:
        """
        Récupère les informations de l'utilisateur via l'endpoint UserInfo de OpenID Connect.
        """
        headers = {"Authorization": f"Bearer {token_string}"}
        userinfo_url = self.oidc_config["userinfo_endpoint"]

        response = requests.get(userinfo_url, headers=headers, timeout=5)
        if response.status_code != 200:
            print(f"Error fetching user info: {response.text}")
        if response.status_code == 401:
            raise ValidatorError(
                {"code": "invalid_token", "description": "Token is invalid."}, 401
            )
        response.raise_for_status()

        user_data = response.json()
        return user_data

    def decode_jwt(self, token_string: str) -> dict:
        """
        Décode le JWT et vérifie la signature.
        """
        try:
            # Vérifier que la clé JWKS ne date pas de plus de 15min
            if time.time() - self.last_fetch_jwks > 900:
                self.jwks, self.last_fetch_jwks = self._fetch_jwks()

            # Vérifier la signature du JWT avec toutes les clés du JWKS
            jwt_decoded = self.jwt.decode(
                token_string, key=JsonWebKey.import_key_set(self.jwks)
            )
            return jwt_decoded

        except Exception as e:
            print(f"JWT signature verification failed: {e}")
            raise ValidatorError(
                {
                    "code": "invalid_token",
                    "description": "Token signature verification failed.",
                },
                401,
            )

    def validate_token(self, userinfo_data: dict, token_string: str, _=None) -> None:
        """
        Valide le token OIDC.
        """
        now = int(time.time())
        if not userinfo_data:
            raise ValidatorError(
                {"code": "invalid_token_revoked", "description": "Token was revoked."},
                401,
            )
        if "exp" in userinfo_data and userinfo_data["exp"] < now:
            raise ValidatorError(
                {"code": "invalid_token_expired", "description": "Token has expired."},
                401,
            )
        # Decode le jwt et vérifie la signature
        token_data = self.decode_jwt(token_string)

        if token_data["aud"] != OIDC_CLIENT_ID or token_data["iss"] != OIDC_ISSUER:
            raise ValidatorError(
                {
                    "code": "invalid_token",
                    "description": "Token audience or issuer mismatch.",
                },
                401,
            )

        # Vérifie que le sub de userinfo_data correspond à celui du token
        if userinfo_data["sub"] != token_data["sub"]:
            raise ValidatorError(
                {
                    "code": "invalid_token",
                    "description": "Token sub does not match userinfo sub.",
                },
                401,
            )

    def __call__(self, token_string: str):
        userinfo_data = self.fetch_userinfo(token_string)
        self.validate_token(userinfo_data, token_string)
        return userinfo_data


class OIDCUserInfo(RezelBaseModel):
    given_name: str
    family_name: str
    email: str
    admin: bool
