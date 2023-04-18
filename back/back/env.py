"""Environment definitions for the back-end."""
from os import getenv
from dotenv import load_dotenv
from pydantic import PostgresDsn  # pylint: disable=no-name-in-module


def get_or_raise(key: str) -> str:
    """Get value from environment or raise an error."""
    value = getenv(key)
    if not value:
        raise EnvironmentError(f"{key} is not set")
    return value


def get_or_none(key: str) -> str | None:
    """Get value from environment or return None."""
    value = getenv(key)
    if not value:
        return None
    return value


class Env:
    """Check environment variables types and constraints."""
    database_url: str

    def __init__(self) -> None:
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

ENV = Env()
