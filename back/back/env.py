"""Environment definitions for the back-end."""

import json
from os import getenv

from dotenv import load_dotenv

__all__ = ["EnvError", "ENV"]


class EnvError(OSError):
    """Any error related to environment variables."""


class MissingEnvError(EnvError):
    """An environment variable is missing."""

    def __init__(self, key: str) -> None:
        """An environment variable is missing."""
        super().__init__(f"{key} is not set")


def get_or_raise(key: str) -> str:
    """Get value from environment or raise an error."""
    value = getenv(key)
    if not value:
        raise MissingEnvError(key)
    return value


def get_or_none(key: str) -> str | None:
    """Get value from environment or return None."""
    value = getenv(key)
    if not value:
        return None
    return value


def get_or_default(key: str, default: str) -> str:
    """Get value from environment or return default."""
    value = getenv(key)
    if not value:
        return default
    return value


class Env:  # pylint: disable=too-many-instance-attributes
    """Check environment variables types and constraints."""

    deploy_env: str

    # Logs
    log_level: str

    # Zitadel
    zitadel_app_secret: dict
    zitadel_url: str
    zitadel_introspection_url: str
    zitadel_org_id: str
    zitadel_admin_role: str

    matrix_user: str
    matrix_password: str
    matrix_room: str

    # MongoDB
    db_uri: str
    db_name: str

    charon_url: str
    charon_token: str

    nix_url: str

    def __init__(self) -> None:
        """Load all variables."""

        # If we are in a kubernetes pod, we need to load vault secrets
        if getenv("KUBERNETES_SERVICE_HOST"):
            load_dotenv("/vault/secrets/env")

        self.deploy_env = get_or_default("DEPLOY_ENV", "local")
        load_dotenv(f".env.{self.deploy_env}")

        self.log_level = get_or_none("LOG_LEVEL") or "INFO"

        zitadel_secret_file = get_or_none("ZITADEL_SECRET_FILE")
        if zitadel_secret_file:
            with open(zitadel_secret_file, "r", encoding="utf-8") as f:
                self.zitadel_app_secret = json.load(f)
        else:
            self.zitadel_app_secret = json.loads(get_or_raise("ZITADEL_APP_SECRET"))

        self.zitadel_url = get_or_raise("ZITADEL_URL")
        self.zitadel_introspection_url = get_or_raise("ZITADEL_INTROSPECTION_URL")
        self.zitadel_org_id = get_or_raise("ZITADEL_ORG_ID")
        self.zitadel_admin_role = get_or_raise("ZITADEL_ADMIN_ROLE")

        self.db_uri = get_or_raise("DB_URI")
        self.db_name = get_or_raise("DB_NAME")

        self.matrix_user = get_or_raise("MATRIX_USER")
        self.matrix_password = get_or_raise("MATRIX_PASSWORD")
        self.matrix_room = get_or_raise("MATRIX_ROOM")

        self.charon_url = get_or_raise("CHARON_URL")
        self.charon_token = get_or_raise("CHARON_TOKEN")

        self.nextcloud_share_url = get_or_raise("NEXTCLOUD_SHARE_URL")
        self.nextcloud_share_password = get_or_raise("NEXTCLOUD_SHARE_PASSWORD")

        self.nix_url = get_or_raise("NIX_URL")


ENV = Env()
