"""Get or edit users."""


from turtle import st

from fastapi import HTTPException
from fastapi.responses import Response

from back.core.appointments import get_subscription_appointments
from back.core.users import get_subscriptions, get_users
from back.database import Session
from back.database.appointments import DBAppointment
from back.database.subscriptions import DBSubscription
from back.database.users import User as DBUser
from back.email import send_admin_message, send_email_contract
from back.env import ENV
from back.interfaces import User
from back.interfaces.appointments import Appointment, AppointmentSlot
from back.interfaces.auth import KeycloakId
from back.interfaces.box import ONT, Chambre, Status
from back.interfaces.subscriptions import Subscription
from back.middlewares import db, must_be_admin, user
from back.netbox_client import NETBOX
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("users")


@router.get("/me")
async def _me(
    _user: User = user,
) -> User:
    """Get the current user's identity."""
    return _user


@router.get("/me/subscription")
async def _get_me_subscription(
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
async def _me_subscribe(
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

    send_admin_message(
        "Demande d'abonnement",
        f"Un utilisateur a demandé à s'abonner: {_user.name} - {_user.email}\n\nResidence : {chambre.residence}\nChambre : {chambre.name}\n\nPour valider l'abonnement, rendez-vous sur {ENV.frontend_url}/admin/ \n\nUn email avec les détails lui a été envoyé.",
    )
    send_email_contract(_user.email, _user.name)
    return Subscription.from_orm(subscription)


@router.put("/me/subscription", status_code=200)
async def _me_update_subscription(
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
async def _me_unsubscribe(
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

    send_admin_message(
        "Demande de désabonnement",
        f"Un utilisateur a demandé à se désabonner : {_user.name} - {_user.email}\n\nPour valider la désinscription, rendez-vous sur {ENV.frontend_url}/admin/",
    )
    return Subscription.from_orm(subscription)


@router.get("/me/appointments")
async def _me_get_appointments(
    _db: Session = db,
    _user: User = user,
) -> list[Appointment]:
    """Get all appointments of the current user."""
    sub = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=400, detail="User has no subscription")

    return get_subscription_appointments(_db, sub.subscription_id)


@router.post("/me/appointments")
async def _me_post_appointment_slots(
    slots: list[AppointmentSlot],
    _db: Session = db,
    _user: User = user,
) -> list[Appointment]:
    """Submit appointment slots."""
    sub = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=400, detail="User has no subscription")

    user_appointments = get_subscription_appointments(_db, sub.subscription_id)
    if len(user_appointments) > 0:
        raise HTTPException(status_code=400, detail="User already has appointments")

    added_appointments = []

    for slot in slots:
        db_app = DBAppointment(
            subscription_id=sub.subscription_id,
            slot_start=slot.start,
            slot_end=slot.end,
            status=Status.PENDING_VALIDATION,
        )
        added_appointments.append(db_app)
        _db.add(db_app)
    _db.commit()

    return list(map(Appointment.from_orm, added_appointments))


### ADMIN


@router.get("/")
def _get_users(_db: Session = db, _: None = must_be_admin) -> list[User]:
    """Get all users."""
    return get_users(_db)


@router.get("/subscriptions")
def _get_subscriptions(_db: Session = db, _: None = must_be_admin) -> list[Subscription]:
    """Get all subscriptions."""
    return get_subscriptions(_db)


@router.get("/{keycloak_id}")
async def _user_get(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> User:
    u = _db.query(DBUser).filter_by(keycloak_id=keycloak_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return User.from_orm(u)


@router.put("/{keycloak_id}")
async def _user_update(
    u: User,
    _db: Session = db,
    _: None = must_be_admin,
) -> User:
    db_user = _db.query(DBUser).filter_by(keycloak_id=u.keycloak_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.name = u.name
    db_user.email = u.email
    db_user.is_admin = u.is_admin
    _db.commit()
    return User.from_orm(db_user)


@router.get("/{keycloak_id}/subscription")
async def _user_get_subscription(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> Subscription:
    sub = _db.query(DBSubscription).filter_by(user_id=keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")
    return Subscription.from_orm(sub)


@router.put("/{keycloak_id}/subscription")
async def _user_update_subscription(
    subscription: Subscription,
    _db: Session = db,
    _: None = must_be_admin,
) -> Subscription:
    sub = _db.query(DBSubscription).filter_by(user_id=subscription.user_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")
    sub.chambre = subscription.chambre
    sub.status = subscription.status
    sub.unsubscribe_reason = subscription.unsubscribe_reason
    _db.commit()
    return Subscription.from_orm(sub)


@router.get("/{keycloak_id}/ont")
async def _user_get_ont(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> ONT:
    ont = NETBOX.get_ont_from_user(KeycloakId(keycloak_id))
    if not ont:
        raise HTTPException(status_code=404, detail="No ONT found for this user")
    return ont


@router.post("/{keycloak_id}/ont")
async def _user_register_ont(
    keycloak_id: str,
    serial_number: str,
    software_version: str,
    _db: Session = db,
    _: None = must_be_admin,
):
    if NETBOX.get_ont_from_user(KeycloakId(keycloak_id)):
        return HTTPException(status_code=400, detail="User already has an ONT")

    sub = _db.query(DBSubscription).filter_by(user_id=keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")

    ont = NETBOX.register_ont(serial_number, software_version, sub)
    if not ont:
        return HTTPException(status_code=500, detail="Error while registering ONT")

    return ont
