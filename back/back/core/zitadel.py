import time
from typing import Dict

import requests
from authlib.jose import jwt
from authlib.oauth2.rfc7662 import IntrospectTokenValidator

from back.env import ENV
from back.mongodb.base import RezelBaseModel


class ValidatorError(Exception):
    def __init__(self, error: Dict[str, str], status_code: int):
        super().__init__()
        self.error = error
        self.status_code = status_code


CLIENT_ID = ENV.zitadel_app_secret["clientId"]
KEY_ID = ENV.zitadel_app_secret["keyId"]
PRIVATE_KEY = ENV.zitadel_app_secret["key"]


class ZitadelIntrospectTokenValidator(IntrospectTokenValidator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def introspect_token(self, token_string):
        # Create JWT for client assertion
        payload = {
            "iss": CLIENT_ID,
            "sub": CLIENT_ID,
            "aud": ENV.zitadel_url,
            "exp": int(time.time()) + 60 * 60,  # Expires in 1 hour
            "iat": int(time.time()),
        }
        header = {"alg": "RS256", "kid": KEY_ID}
        jwt_token = jwt.encode(
            header,
            payload,
            PRIVATE_KEY,
        )

        # Send introspection request
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": jwt_token,
            "token": token_string,
        }
        response = requests.post(
            ENV.zitadel_introspection_url, headers=headers, data=data, timeout=5
        )
        if response.status_code != 200:
            print(f"Error while introspecting token: {response.text}")
        response.raise_for_status()
        token_data = response.json()
        return token_data

    def match_token_scopes(self, token, or_scopes):
        if or_scopes is None:
            return True
        scopes = token.get("scope", "").split()
        for and_scopes in or_scopes:
            if all(key in scopes for key in and_scopes.split()):
                return True
        return False

    def validate_token(self, token, scopes, _=None):
        now = int(time.time())
        if not token:
            raise ValidatorError(
                {"code": "invalid_token_revoked", "description": "Token was revoked."},
                401,
            )
        if not token.get("active"):
            raise ValidatorError(
                {"code": "invalid_token_inactive", "description": "Token is inactive."},
                401,
            )
        if token["exp"] < now:
            raise ValidatorError(
                {"code": "invalid_token_expired", "description": "Token has expired."},
                401,
            )
        if not self.match_token_scopes(token, scopes):
            raise ValidatorError(
                {
                    "code": "insufficient_scope",
                    "description": f"Token has insufficient scope. Route requires: {scopes}",
                },
                401,
            )

    def __call__(self, token_string, scopes):
        token = self.introspect_token(token_string)
        self.validate_token(token, scopes)
        return token


class ZitadelUserInfo(RezelBaseModel):
    given_name: str
    family_name: str
    email: str
    admin: bool
