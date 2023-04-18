from pydantic import BaseModel


class User(BaseModel):
    """A user model"""

    keycloak_id: str

    class Config:
        """Config"""

        schema_extra = {"example": {"keycloak_id": "123456789"}}


class LoginUrl(BaseModel):
    """A request to log to the keycloak server."""

    url: str

    class Config:
        """Config"""

        schema_extra = {"example": {"url": "https://example.com/login"}}
