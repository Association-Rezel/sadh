"""Environment definitions for the back-end."""

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

    # OIDC
    oidc_issuer: str
    oidc_client_id: str
    oidc_client_secret: str
    oidc_redirect_uri: str

    oidc_admin_issuer: str
    oidc_admin_client_id: str
    oidc_admin_client_secret: str
    oidc_admin_redirect_uri: str
    oidc_admin_required_entitlement: str

    starlette_session_secret: str
    session_expiration_time_seconds: int

    matrix_user: str
    matrix_password: str
    matrix_room: str

    # MongoDB
    db_uri: str
    db_name: str

    charon_url: str

    nix_url: str

    ptah_url: str

    vault_url: str
    vault_role_name: str
    vault_transit_mount: str
    vault_transit_key: str

    fai_email_address: str | None
    sender_email_address: str | None
    sender_email_address_password: str | None

    documenso_url: str
    documenso_token: str
    documenso_template_contract_ftth_id: int
    documenso_template_contract_wifi_id: int

    # Dolibarr
    dolibarr_api_token: str
    dolibarr_base_url: str

    def __init__(self) -> None:
        """Load all variables."""

        # If we are in a kubernetes pod, we need to load vault secrets
        if getenv("KUBERNETES_SERVICE_HOST"):
            load_dotenv("/vault/secrets/env")

        self.deploy_env = get_or_default("DEPLOY_ENV", "local")
        load_dotenv(f".env.{self.deploy_env}")

        self.log_level = get_or_none("LOG_LEVEL") or "INFO"

        self.oidc_issuer = get_or_raise("OIDC_ISSUER")
        self.oidc_client_id = get_or_raise("OIDC_CLIENT_ID")
        self.oidc_client_secret = get_or_raise("OIDC_CLIENT_SECRET")
        self.oidc_redirect_uri = get_or_raise("OIDC_REDIRECT_URI")

        self.oidc_admin_issuer = get_or_raise("OIDC_ADMIN_ISSUER")
        self.oidc_admin_client_id = get_or_raise("OIDC_ADMIN_CLIENT_ID")
        self.oidc_admin_client_secret = get_or_raise("OIDC_ADMIN_CLIENT_SECRET")
        self.oidc_admin_redirect_uri = get_or_raise("OIDC_ADMIN_REDIRECT_URI")
        self.oidc_admin_required_entitlement = get_or_raise(
            "OIDC_ADMIN_REQUIRED_ENTITLEMENT"
        )
        self.starlette_session_secret = get_or_raise("STARLETTE_SESSION_SECRET")
        self.session_expiration_time_seconds = int(
            get_or_default("SESSION_EXPIRATION_TIME_SECONDS", "3600")
        )

        self.db_uri = get_or_raise("DB_URI")
        self.db_name = get_or_raise("DB_NAME")

        self.matrix_user = get_or_raise("MATRIX_USER")
        self.matrix_password = get_or_raise("MATRIX_PASSWORD")
        self.matrix_room = get_or_raise("MATRIX_ROOM")

        self.charon_url = get_or_raise("CHARON_URL")

        self.nix_url = get_or_raise("NIX_URL")

        self.ptah_url = get_or_raise("PTAH_URL")

        self.vault_url = get_or_raise("VAULT_URL")
        self.vault_role_name = get_or_raise("VAULT_ROLE_NAME")
        self.vault_transit_mount = get_or_raise("VAULT_TRANSIT_MOUNT")
        self.vault_transit_key = get_or_raise("VAULT_TRANSIT_KEY")
        self.vault_token = get_or_none("VAULT_TOKEN")

        self.fai_email_address = get_or_none("FAI_EMAIL_ADDRESS")
        self.sender_email_address = get_or_none("SENDER_EMAIL_ADDRESS")
        self.sender_email_password = get_or_none("SENDER_EMAIL_PASSWORD")

        self.documenso_url = get_or_raise("DOCUMENSO_URL")

        if self.documenso_url[-1] == "/":
            self.documenso_url = self.documenso_url[:-1]

        self.documenso_token = get_or_raise("DOCUMENSO_TOKEN")
        self.documenso_template_contract_ftth_id = int(
            get_or_raise("DOCUMENSO_TEMPLATE_CONTRACT_FTTH_ID")
        )
        self.documenso_template_contract_wifi_id = int(
            get_or_raise("DOCUMENSO_TEMPLATE_CONTRACT_WIFI_ID")
        )

        self.dolibarr_api_token = get_or_raise("DOLIBARR_API_TOKEN")
        self.dolibarr_base_url = get_or_raise("DOLIBARR_BASE_URL")


ENV = Env()
