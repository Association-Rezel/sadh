import logging

from common_models.base import RezelBaseModel
from common_models.user_models import (
    DepositStatus,
    MembershipStatus,
    MembershipType,
    User,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response as FastAPIResponse
from pymongo import ReturnDocument

from back.core.dolibarr import (
    cancel_dolibarr_invoice,
    check_dolibarr_payment_status,
    check_single_invoice_paid,
    compute_subscription_info,
    create_advance_invoice,
    create_selective_invoice,
    get_invoice_payment_url,
    get_invoice_pdf,
    get_archived_member_invoices,
    get_member_invoices,
    get_member_subscriptions,
    renew_dolibarr_membership,
)
from back.mongodb.db import GetDatabase
from back.server.dependencies import RequireCurrentUser, UserFromPath, must_be_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/me/subscriptions")
async def get_my_subscriptions(user: RequireCurrentUser) -> list[dict]:
    if user.dolibarr_id is None:
        return []
    try:
        return get_member_subscriptions(user)
    except ValueError as e:
        logger.error("Error fetching subscriptions: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la récupération des cotisations depuis Dolibarr",
        ) from e


@router.get("/me/invoices")
async def get_my_invoices(user: RequireCurrentUser) -> list[dict]:
    if user.dolibarr_id is None:
        return []
    try:
        return get_member_invoices(user)
    except ValueError as e:
        logger.error("Error fetching invoices: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la récupération des factures depuis Dolibarr",
        ) from e


@router.get("/me/archived-invoices")
async def get_my_archived_invoices(user: RequireCurrentUser) -> list[dict]:
    if user.dolibarr_id is None:
        return []
    try:
        return get_archived_member_invoices(user)
    except ValueError as e:
        logger.error("Error fetching archived invoices: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la récupération des anciennes factures",
        ) from e


class DolibarrPaymentStatusResponse(RezelBaseModel):
    paid: bool


@router.get("/me/dolibarr-payment-status")
async def get_my_dolibarr_payment_status(
    user: RequireCurrentUser,
    db: GetDatabase,
) -> DolibarrPaymentStatusResponse:
    if user.dolibarr_id is None or user.membership is None:
        return DolibarrPaymentStatusResponse(paid=False)

    try:
        paid_items = await check_dolibarr_payment_status(user, db)
    except ValueError as e:
        logger.error("Error checking Dolibarr payment status: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la vérification du paiement Dolibarr",
        ) from e

    update_fields: dict = {}
    if paid_items.get("first_month"):
        update_fields["membership.paid_first_month"] = True
    if paid_items.get("membership"):
        update_fields["membership.paid_membership"] = True
    if paid_items.get("deposit") and user.membership.type == MembershipType.FTTH:
        update_fields["membership.deposit_status"] = DepositStatus.PAID.value

    if update_fields:
        await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {"$set": update_fields},
            return_document=ReturnDocument.AFTER,
        )

    is_already_active = user.membership.status in (
        MembershipStatus.ACTIVE,
        MembershipStatus.PENDING_INACTIVE,
    )
    if paid_items.get("membership") and is_already_active:
        try:
            renew_dolibarr_membership(user)
        except Exception as e:
            logger.error("Error renewing Dolibarr membership: %s", e)

    is_paid = any(paid_items.values())
    return DolibarrPaymentStatusResponse(paid=is_paid)


class DolibarrPaymentUrlResponse(RezelBaseModel):
    payment_url: str | None


@router.get("/me/invoices/{invoice_id}/payment-url")
async def get_invoice_payment_url_endpoint(
    invoice_id: str,
    user: RequireCurrentUser,
) -> DolibarrPaymentUrlResponse:
    if user.dolibarr_id is None:
        return DolibarrPaymentUrlResponse(payment_url=None)

    try:
        url = get_invoice_payment_url(user, invoice_id)
    except Exception as e:
        logger.error("Error getting invoice payment URL: %s", e)
        return DolibarrPaymentUrlResponse(payment_url=None)

    return DolibarrPaymentUrlResponse(payment_url=url)


@router.get("/me/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    user: RequireCurrentUser,
):
    if user.dolibarr_id is None:
        raise HTTPException(status_code=404, detail="Facture introuvable")

    result = get_invoice_pdf(user, invoice_id)
    if result is None:
        raise HTTPException(status_code=404, detail="PDF introuvable")

    pdf_bytes, filename = result
    return FastAPIResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/me/invoices/{invoice_id}/status")
async def get_invoice_status(
    invoice_id: str,
    user: RequireCurrentUser,
) -> DolibarrPaymentStatusResponse:
    if user.dolibarr_id is None:
        return DolibarrPaymentStatusResponse(paid=False)

    paid = check_single_invoice_paid(user, invoice_id)
    return DolibarrPaymentStatusResponse(paid=paid)


@router.post("/me/invoices/{invoice_id}/cancel")
async def cancel_invoice(
    invoice_id: str,
    user: RequireCurrentUser,
):
    if user.dolibarr_id is None:
        raise HTTPException(status_code=400, detail="Compte Dolibarr non configuré")

    success = cancel_dolibarr_invoice(user, invoice_id)
    if not success:
        raise HTTPException(
            status_code=400, detail="Impossible d'annuler cette facture"
        )

    return {"ok": True}


class AdvancePaymentResponse(RezelBaseModel):
    payment_url: str | None
    invoice_id: int | None


class SelectivePaymentRequest(RezelBaseModel):
    items: list[str]  # "first_month", "deposit", "membership"


@router.post("/me/selective-payment")
async def create_selective_payment(
    body: SelectivePaymentRequest,
    user: RequireCurrentUser,
    db: GetDatabase,
) -> AdvancePaymentResponse:
    if user.membership is None or user.dolibarr_id is None:
        raise HTTPException(
            status_code=400, detail="Membership ou compte Dolibarr non configuré"
        )

    valid_items = {"first_month", "deposit", "membership"}
    items = [i for i in body.items if i in valid_items]
    if not items:
        raise HTTPException(
            status_code=400, detail="Aucun élément de paiement sélectionné"
        )

    try:
        result = await create_selective_invoice(user, db, items)
    except Exception as e:
        logger.error("Error creating selective invoice: %s", e)
        raise HTTPException(
            status_code=502, detail="Erreur lors de la création de la facture"
        ) from e

    if result is None:
        return AdvancePaymentResponse(payment_url=None, invoice_id=None)

    return AdvancePaymentResponse(
        payment_url=result["payment_url"],
        invoice_id=result["invoice_id"],
    )


@router.post("/me/advance-payment")
async def create_advance_payment(
    user: RequireCurrentUser,
    db: GetDatabase,
    num_months: int = Query(ge=1, le=12),
) -> AdvancePaymentResponse:
    if user.membership is None or user.dolibarr_id is None:
        raise HTTPException(
            status_code=400, detail="Membership ou compte Dolibarr non configuré"
        )

    try:
        result = await create_advance_invoice(user, db, num_months)
    except Exception as e:
        logger.error("Error creating advance invoice: %s", e)
        raise HTTPException(
            status_code=502, detail="Erreur lors de la création de la facture"
        ) from e

    if result is None:
        return AdvancePaymentResponse(payment_url=None, invoice_id=None)

    return AdvancePaymentResponse(
        payment_url=result["payment_url"],
        invoice_id=result["invoice_id"],
    )


class SubscriptionInfoResponse(RezelBaseModel):
    total_months_paid: int | None
    subscription_end: int | None  # unix timestamp
    membership_end: int | None  # unix timestamp


def _build_subscription_info_response(user: User) -> SubscriptionInfoResponse:
    if user.dolibarr_id is None or user.membership is None:
        return SubscriptionInfoResponse(
            total_months_paid=None, subscription_end=None, membership_end=None
        )
    info = compute_subscription_info(user)
    if info is None:
        return SubscriptionInfoResponse(
            total_months_paid=None, subscription_end=None, membership_end=None
        )
    return SubscriptionInfoResponse(
        total_months_paid=info["total_months_paid"],
        subscription_end=info.get("subscription_end"),
        membership_end=info.get("membership_end"),
    )


@router.get("/me/subscription-info")
async def get_subscription_info(user: RequireCurrentUser) -> SubscriptionInfoResponse:
    return _build_subscription_info_response(user)


@router.get("/{user_id}/subscription-info", dependencies=[Depends(must_be_admin)])
async def get_user_subscription_info(user: UserFromPath) -> SubscriptionInfoResponse:
    return _build_subscription_info_response(user)
