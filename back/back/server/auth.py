"""Get or edit users."""


from fastapi import APIRouter

from back.keycloak_client import Token, protect

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_current_user(
    identity: Token = protect,
) -> dict:
    """Get the current user's identity.

    TODO : Renvoyer les informations utiles à l'utilisateur ; cf le type "User" du front
    """
    return {
        "id": identity.sub,
        "isAdmin": identity.is_admin,
    }
