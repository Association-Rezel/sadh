"""Environment definitions for the back-end."""
from os import getenv

from dotenv import load_dotenv
from pydantic import PostgresDsn  # pylint: disable=no-name-in-module

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


class Env:  # pylint: disable=too-many-instance-attributes
    """Check environment variables types and constraints."""

    database_url: str
    login_redirect_url: str

    # Frontend
    frontend_url: str
    frontend_host: str
    frontend_port: str

    # Netbox
    netbox_url: str
    netbox_token: str

    # Logs
    log_level: str

    # Keycloak
    kc_url: str
    kc_client_id: str
    kc_client_secret: str

    charon_url: str
    charon_token: str

    def __init__(self) -> None:
        """Load all variables."""
        load_dotenv()
        _database = get_or_raise("DB_DATABASE")
        if not _database.startswith("/"):
            _database = f"/{_database}"
        self.database_url = PostgresDsn.build(
            scheme="postgresql",
            user=get_or_raise("DB_USER"),
            password=get_or_raise("DB_PASSWORD"),
            host=get_or_raise("DB_ADDR"),
            port=get_or_none("DB_PORT"),
            path=_database,
        )

        self.frontend_port = get_or_raise("FRONTEND_PORT")
        self.frontend_host = get_or_raise("FRONTEND_HOST")
        self.frontend_url = f"http://{self.frontend_host}:{self.frontend_port}"
        self.login_redirect_url = f"{self.frontend_url}/auth/login"

        self.netbox_url = get_or_raise("NETBOX_URL")
        self.netbox_token = get_or_raise("NETBOX_TOKEN")

        self.log_level = get_or_none("LOG_LEVEL") or "INFO"
        self.environment = get_or_none("ENV") or "prod"

        self.kc_url = get_or_raise("KC_URL")
        self.kc_client_id = get_or_raise("KC_CLIENT_ID")
        self.kc_client_secret = get_or_raise("KC_CLIENT_SECRET")

        self.matrix_user = get_or_raise("MATRIX_USER")
        self.matrix_password = get_or_raise("MATRIX_PASSWORD")

        self.charon_url = get_or_raise("CHARON_URL")
        self.charon_token = get_or_raise("CHARON_TOKEN")

        self.nextcloud_share_url = get_or_raise("NEXTCLOUD_SHARE_URL")
        self.nextcloud_share_password = get_or_raise("NEXTCLOUD_SHARE_PASSWORD")


ENV = Env()
