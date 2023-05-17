"""User interface."""
import re
from collections.abc import Callable, Generator
from typing import Any

from pydantic import BaseModel

UUID_REGEX_STR = "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
UUID_REGEX = re.compile(UUID_REGEX_STR, re.IGNORECASE)


class KeycloakId(str):
    """A keycloak id is a UUIDv4."""

    @classmethod
    def __get_validators__(cls) -> Generator[Callable, None, None]:
        """Validators.

        one or more validators may be yielded which will be called in the
        order to validate the input, each validator will receive as an input
        the value returned from the previous validator
        """
        yield cls.validate

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema: dict) -> None:
        """Update json schema.

        __get_pydantic_json_schema__ should mutate the dict it receives
        in place, the returned value will be ignored.
        """
        field_schema.update(
            pattern=UUID_REGEX_STR,
            examples=["ab3f404f-25fa-4f56-9ed9-9a72e9b3239f"],
        )

    @classmethod
    def validate(cls, v: Any) -> "KeycloakId":  # noqa: ANN401
        """Validate a keycloak id."""
        if not isinstance(v, str):
            raise TypeError("string required")
        m = UUID_REGEX.fullmatch(v.lower())
        if not m:
            raise ValueError("Not a valid UUIDv4")
        return cls(v.lower())


class Token(BaseModel):
    """A JWT decoded into a usable struct."""

    keycloak_id: KeycloakId
    name: str
