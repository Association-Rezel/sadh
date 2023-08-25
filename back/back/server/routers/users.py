"""Get or edit users."""


from fastapi import HTTPException
from fastapi.responses import Response

from back.core.users import get_users
from back.database import Session
from back.database.subscriptions import DBSubscription
from back.email import send_email
from back.env import ENV
from back.interfaces import User
from back.interfaces.box import Chambre, Status
from back.interfaces.subscriptions import Subscription
from back.middlewares import db, must_be_admin, user
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("users")


@router.get("/")
def _(_db: Session = db, _: None = must_be_admin) -> list[User]:
    """This is some docs."""
    return get_users(_db)

@router.get("/me")
async def _me(
    _user: User = user,
) -> User:
    """Get the current user's identity."""
    return _user

@router.get("/me/subscription")
async def _get_user_subscriptions(
    response: Response,
    _user: User = user,
    _db: Session = db,
):
    """Get subscription of the current user."""
    sub = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not sub:
        response.status_code = 404
        return HTTPException(status_code=404, detail="User has no subscription")
    return Subscription.from_orm(sub)

@router.post("/me/subscription", status_code=201)
async def _subscribe(
    response: Response,
    chambre: Chambre,
    _user: User = user,
    _db: Session = db,
):
    """Ask to subscribe."""
    if _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first():
        response.status_code = 400
        return HTTPException(status_code=400, detail="User already subscribed")
    # Create subscription
    subscription = DBSubscription(
        user_id=_user.keycloak_id,
        chambre=chambre,
    )
    _db.add(subscription)
    _db.commit()
    send_email("Demande d'abonnement", f"Un utilisateur a demandé à s'abonner: {_user.name} - {_user.email}\n\nResidence : {chambre.residence}\nChambre : {chambre.name}\n\nPour valider l'abonnement, rendez-vous sur {ENV.frontend_url}/admin/")
    return Subscription.from_orm(subscription)

@router.put("/me/subscription", status_code=200)
async def _update_subscription(
    response: Response,
    chambre: Chambre,
    _user: User = user,
    _db: Session = db,
):
    """Update subscription."""
    subscription = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not subscription:
        response.status_code = 404
        return HTTPException(status_code=404, detail="User did not subscribed")
    if subscription.status != Status.PENDING_VALIDATION:
        response.status_code = 400
        return HTTPException(status_code=400, detail="Can't modify not pending subscription")
    subscription.chambre = chambre
    _db.commit()
    return Subscription.from_orm(subscription)

@router.delete("/me/subscription", status_code=200)
async def _unsubscribe(
    response: Response,
    unsubscribe_reason: str,
    _user: User = user,
    _db: Session = db,
):
    """Unsubscribe."""
    subscription = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not subscription:
        response.status_code = 404
        return HTTPException(status_code=404, detail="User has no subscription")
    if unsubscribe_reason is None:
        response.status_code = 400
        return HTTPException(status_code=400, detail="Missing unsubscribe reason")
    subscription.unsubscribe_reason = unsubscribe_reason
    subscription.status = Status.PENDING_UNSUBSCRIPTION
    _db.commit()
    send_email("Demande de désabonnement", f"Un utilisateur a demandé à se désabonner : {_user.name} - {_user.email}\n\nPour valider la désinscription, rendez-vous sur {ENV.frontend_url}/admin/")
    return Subscription.from_orm(subscription)
