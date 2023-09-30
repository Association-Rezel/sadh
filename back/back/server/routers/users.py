"""Get or edit users."""


import os
import tempfile

import nextcloud_client.nextcloud_client
from fastapi import HTTPException, UploadFile
from fastapi import Response as FastAPIResponse
from fastapi.responses import Response

from back.core.appointments import get_subscription_appointments
from back.core.subscriptions import create_empty_subscription_flow
from back.core.users import get_subscriptions, get_user_bundles, get_users
from back.database import Session
from back.database.appointments import DBAppointment
from back.database.subscriptions import DBSubscription
from back.database.users import DBUser
from back.email import send_admin_message, send_email_contract, send_email_signed_contract
from back.env import ENV
from back.interfaces.appointments import Appointment, AppointmentSlot
from back.interfaces.auth import KeycloakId
from back.interfaces.box import ONT, Box, Chambre, Status
from back.interfaces.subscriptions import Subscription
from back.interfaces.users import User, UserDataBundle
from back.middlewares import db, must_be_admin, user
from back.netbox_client import NETBOX
from back.nextcloud import NEXTCLOUD
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

    create_empty_subscription_flow(_db, str(subscription.subscription_id))

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
            slot_start=slot.start.isoformat(),
            slot_end=slot.end.isoformat(),
            status=Status.PENDING_VALIDATION,
        )
        added_appointments.append(db_app)
        _db.add(db_app)
    _db.commit()

    return list(map(Appointment.from_orm, added_appointments))

@router.get("/me/contract")
async def _me_get_contract(
    _user: User = user,
) -> FastAPIResponse:
    try:
        tmp_filename, tmp_dir = NEXTCLOUD.get_file(f"{_user.keycloak_id}.pdf")
    except nextcloud_client.nextcloud_client.HTTPResponseError:
        raise HTTPException(status_code=404, detail="User not found")
    with open(tmp_filename, "rb") as f:
        contract = f.read()
    tmp_dir.cleanup()
    return FastAPIResponse(content=contract, media_type="application/pdf")

### ADMIN


@router.get("/")
def _get_users(_db: Session = db, _: None = must_be_admin) -> list[User]:
    """Get all users."""
    return get_users(_db)


@router.get("/subscriptions")
def _get_subscriptions(_db: Session = db, _: None = must_be_admin) -> list[Subscription]:
    """Get all subscriptions."""
    return get_subscriptions(_db)


@router.get("/dataBundles")
def _get_data_bundles(
    _db: Session = db,
    _: None = must_be_admin,
) -> list[UserDataBundle]:
    """Get all user data bundles."""
    return get_user_bundles(_db)


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

@router.get("/{keycloak_id}/contract")
async def _user_get_contract(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> FastAPIResponse:
    try:
        tmp_filename, tmp_dir = NEXTCLOUD.get_file(f"{keycloak_id}.pdf")
    except nextcloud_client.nextcloud_client.HTTPResponseError:
        raise HTTPException(status_code=404, detail="User not found")
    with open(tmp_filename, "rb") as f:
        contract = f.read()
    tmp_dir.cleanup()
    return FastAPIResponse(content=contract, media_type="application/pdf")

@router.post("/{keycloak_id}/contract")
async def _user_upload_contract(
    keycloak_id: str,
    file: UploadFile,
    _db: Session = db,
    _: None = must_be_admin,
) -> None:
    db_user = _db.query(DBUser).filter_by(keycloak_id=keycloak_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    temp_dir = tempfile.TemporaryDirectory()
    tmp_filename = os.path.join(temp_dir.name, f"{keycloak_id}.pdf")
    with open(tmp_filename, "wb") as f:
        f.write(file.file.read())
    NEXTCLOUD.put_file(tmp_filename)
    send_email_signed_contract(db_user.email, tmp_filename)
    temp_dir.cleanup()

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
) -> ONT:
    if NETBOX.get_ont_from_user(KeycloakId(keycloak_id)):
        raise HTTPException(status_code=400, detail="User already has an ONT")

    sub = _db.query(DBSubscription).filter_by(user_id=keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")

    ont = NETBOX.register_ont(serial_number, software_version, sub)
    if not ont:
        raise HTTPException(status_code=500, detail="Error while registering ONT")

    return ont


@router.get("/{keycloak_id}/box")
async def _user_get_box(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> Box:
    box: Box | None
    try:
        box = NETBOX.get_box_from_user(KeycloakId(keycloak_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur interne sur la communication avec Netbox")
    if not box:
        raise HTTPException(status_code=404, detail="No box found for this user")
    return box


@router.post("/{keycloak_id}/box")
async def _user_register_box(
    keycloak_id: str,
    telecomian: bool,
    serial_number: str,
    mac_address: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> Box:
    #  Verifiy Non-existing box
    try:
        box = NETBOX.get_box_from_user(KeycloakId(keycloak_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur interne sur la communication avec Netbox")

    if box:
        raise HTTPException(status_code=400, detail="User already has a box")

    # Verify existing subscription
    sub = _db.query(DBSubscription).filter_by(user_id=keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User has no subscription")

    # Register box
    try:
        box = NETBOX.register_box(serial_number, mac_address, sub, telecomian)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erreur interne sur la communication avec Netbox")

    return box


@router.get("/{keycloak_id}/dataBundle")
async def _user_get_data_bundles(
    keycloak_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> UserDataBundle:
    """Get all user data bundles."""
    bundleList = get_user_bundles(_db, KeycloakId(keycloak_id))
    if not bundleList:
        raise HTTPException(status_code=404, detail="User not found")
    return bundleList[0]


@router.post("/{keycloak_id}/appointments")
async def _user_post_appointment_slots(
    keycloak_id: str,
    slots: list[AppointmentSlot],
    _db: Session = db,
    _: None = must_be_admin,
) -> list[Appointment]:
    """Submit appointment slots."""
    sub = _db.query(DBSubscription).filter_by(user_id=keycloak_id).first()
    if not sub:
        raise HTTPException(status_code=400, detail="User has no subscription")

    added_appointments = []

    for slot in slots:
        db_app = DBAppointment(
            subscription_id=sub.subscription_id,
            slot_start=slot.start.isoformat(),
            slot_end=slot.end.isoformat(),
            status=Status.PENDING_VALIDATION,
        )
        added_appointments.append(db_app)
        _db.add(db_app)
    _db.commit()

    return list(map(Appointment.from_orm, added_appointments))
