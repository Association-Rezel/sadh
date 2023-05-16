"""Keycloak definition."""
from back.keycloak_client.main import Token, protect

__all__ = [
    "protect",
    "Token",
]
