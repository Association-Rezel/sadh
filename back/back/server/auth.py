"""Get or edit users."""

# https://github.com/tiangolo/fastapi/discussions/9066

from fastapi import APIRouter, status, Depends, HTTPException, Security
from pydantic import Json

from back.core.auth import keycloak_openid, KEYCLOAK_PUBLIC_KEY, oauth2_scheme

router = APIRouter(prefix="/auth", tags=["users"])


async def get_auth(token: str = Security(oauth2_scheme)) -> Json:
    try:
        return keycloak_openid.decode_token(
            token,
            key=KEYCLOAK_PUBLIC_KEY,
            options={
                "verify_signature": True,
                "verify_aud": False,  # TODO : verify audience (mettre sur True et corriger les erreurs)
                "exp": True
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),  # "Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/user")
async def get_current_user(
        identity: Json = Depends(get_auth)
):
    # TODO : Renvoyer les informations utiles à l'utilisateur ; cf le type "User" du front
    return {
        "id": identity["sub"],
        "isAdmin": True
    }
