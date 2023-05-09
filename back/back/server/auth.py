"""Get or edit users.

Keycloak integration as been discussed in the following issue:
    https://github.com/tiangolo/fastapi/discussions/9066
"""


from fastapi import APIRouter, Depends, HTTPException, Security, status
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWTError
from pydantic import Json

from back.core.auth import KEYCLOAK_PUBLIC_KEY, keycloak_openid, oauth2_scheme

router = APIRouter(prefix="/auth", tags=["users"])


async def get_auth(token: str = Security(oauth2_scheme)) -> Json:
    """Get the user's identity from the token or terminate the request."""
    try:
        return keycloak_openid.decode_token(
            token,
            key=KEYCLOAK_PUBLIC_KEY,
            options={
                "verify_signature": True,
                "verify_aud": False,  # TODO : verify audience (mettre sur True et corriger les erreurs)
                "exp": True,
            },
        )
    except (JWTError, ExpiredSignatureError, JWTClaimsError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),  # "Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


@router.get("/user")
async def get_current_user(
    identity: Json = Depends(get_auth),
):
    """Get the current user's identity.

    TODO : Renvoyer les informations utiles à l'utilisateur ; cf le type "User" du front
    """
    return {
        "id": identity["sub"],
        "isAdmin": True,
    }
