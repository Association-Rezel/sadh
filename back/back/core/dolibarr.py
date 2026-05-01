import base64
import logging
from calendar import monthrange
from datetime import datetime
from typing import Any
from urllib.parse import urlencode

import requests
from common_models.user_models import MembershipType, User
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from requests.exceptions import SSLError

from back.env import ENV
from back.messaging.matrix import send_matrix_message

logger = logging.getLogger(__name__)


def _esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


TYPE_ADHERENT = "2"  # adhérent 1€/an
ADVANCE_INVOICE_TAG = "__advance_payment__"
SELECTIVE_TAG_PREFIX = "__selective__:"
SUBSCRIPTION_REMINDER_TAG = "__subscription_reminder__"
ARCHIVED_TAG = "__archived__"
TAG_SEP = "|"


def _strip_meta_prefixes(note: str | None) -> str:
    n = (note or "").strip()
    for meta in ("__sadh__", ARCHIVED_TAG):
        prefix = f"{meta}{TAG_SEP}"
        while n.startswith(prefix):
            n = n[len(prefix) :]
    return n


def _is_archived_note(note: str | None) -> bool:
    return ARCHIVED_TAG in (note or "")


def _with_archived_tag(note: str | None) -> str:
    base = (note or "").strip()
    if _is_archived_note(base):
        return base
    return f"{ARCHIVED_TAG}{TAG_SEP}{base}" if base else ARCHIVED_TAG


def _subscription_reminder_months(note: str | None) -> int | None:
    n = _strip_meta_prefixes(note)
    if n == SUBSCRIPTION_REMINDER_TAG:
        return 1
    prefix = SUBSCRIPTION_REMINDER_TAG + ":"
    if n.startswith(prefix):
        try:
            return int(n[len(prefix) :])
        except ValueError:
            return 1
    return None


def _is_advance_tag(note: str | None) -> bool:
    return _strip_meta_prefixes(note) == ADVANCE_INVOICE_TAG


class DolibarrClient:
    # TODO: remplacer les returns None silencieux par des exceptions custom
    # (DolibarrUnreachableError / DolibarrHTTPError), pour simplifier les
    # appelants qui multiplient les "if r is None" mais on verra prochaine MR please :)

    def __init__(self, api_token: str, base_url: str) -> None:
        self._base_url = base_url
        self._headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "DOLAPIKEY": api_token,
        }

    def _request(self, method: str, path: str, **kwargs) -> requests.Response | None:
        url = f"{self._base_url}/api/index.php/{path}"
        try:
            return requests.request(method, url, headers=self._headers, **kwargs)
        except SSLError as e:
            logger.error("SSL error on %s %s: %s", method, path, e)
            return None

    def get(self, path: str, **kwargs) -> requests.Response | None:
        return self._request("GET", path, **kwargs)

    def post(self, path: str, **kwargs) -> requests.Response | None:
        return self._request("POST", path, **kwargs)

    def put(self, path: str, **kwargs) -> requests.Response | None:
        return self._request("PUT", path, **kwargs)

    def delete(self, path: str, **kwargs) -> requests.Response | None:
        return self._request("DELETE", path, **kwargs)

    def find_member_by_name(self, first_name: str, last_name: str) -> dict | None:
        for fn, ln in _name_variants(first_name, last_name):
            r = self.get(
                "members",
                params={
                    "sqlfilters": f"(t.firstname:=:'{_esc(fn)}') AND (t.lastname:=:'{_esc(ln)}')"
                },
                timeout=10,
            )
            if r is None or r.status_code != 200:
                continue
            data = r.json()
            if data and isinstance(data, list):
                logger.info(
                    "Found existing Dolibarr member %s for %s %s (matched as '%s %s')",
                    data[0].get("id"),
                    first_name,
                    last_name,
                    fn,
                    ln,
                )
                return data[0]
        return None

    def get_member(self, dolibarr_id: int) -> dict | None:
        r = self.get(f"members/{dolibarr_id}", timeout=10)
        if r is None or r.status_code != 200:
            return None
        return r.json()

    def update_member(self, dolibarr_id: int, data: dict) -> bool:
        r = self.put(f"members/{dolibarr_id}", json=data, timeout=10)
        return r is not None and r.status_code == 200

    def get_member_subscriptions(self, dolibarr_id: int) -> list[dict]:
        r = self.get(f"members/{dolibarr_id}/subscriptions", timeout=10)
        if r is None:
            raise ValueError("SSL error fetching subscriptions from Dolibarr")
        if r.status_code == 404:
            return []
        if r.status_code != 200:
            raise ValueError("Error fetching subscriptions from Dolibarr")
        return r.json()

    def get_thirdparty_id_from_member(self, dolibarr_id: int) -> int | None:
        member = self.get_member(dolibarr_id)
        if member is None:
            return None
        tp = member.get("fk_soc") or member.get("socid")
        if not tp or tp == "0":
            return None
        return int(tp)

    def find_thirdparty_by_name(self, first_name: str, last_name: str) -> int | None:
        for name in (f"{f} {ln}" for f, ln in _name_variants(first_name, last_name)):
            r = self.get(
                "thirdparties",
                params={"sqlfilters": f"(t.name:=:'{_esc(name)}')"},
                timeout=10,
            )
            if r is None or r.status_code != 200:
                continue
            data = r.json()
            if data and isinstance(data, list):
                tp_id = int(data[0]["id"])
                logger.info(
                    "Found existing Dolibarr thirdparty %d for %s %s (matched as '%s')",
                    tp_id,
                    first_name,
                    last_name,
                    name,
                )
                return tp_id

        for fn, ln in [(first_name, last_name), (last_name, first_name)]:
            r = self.get(
                "thirdparties",
                params={"sqlfilters": f"(t.name:like:'%{_esc(fn)}%{_esc(ln)}%')"},
                timeout=10,
            )
            if r is None or r.status_code != 200:
                continue
            data = r.json()
            if data and isinstance(data, list):
                tp_id = int(data[0]["id"])
                logger.info(
                    "Found existing Dolibarr thirdparty %d for %s %s via LIKE",
                    tp_id,
                    first_name,
                    last_name,
                )
                return tp_id

        return None

    def create_thirdparty(self, user: User) -> int | None:
        r = self.post(
            "thirdparties",
            json={
                "name": f"{user.last_name.upper()} {user.first_name.capitalize()}",
                "email": user.email,
                "client": "1",
                "code_client": "-1",
            },
            timeout=10,
        )
        if r is None or r.status_code != 200:
            logger.error(
                "Error creating Dolibarr thirdparty: %s", r.text if r else "SSL error"
            )
            return None
        try:
            tp_id = int(r.text)
            logger.info("Created Dolibarr thirdparty %d for user %s", tp_id, user.id)
            return tp_id
        except ValueError:
            logger.error("Dolibarr thirdparty response is not an int: %s", r.text)
            return None

    def get_or_create_thirdparty(self, user: User) -> int | None:
        # Priorité 1 : le membre Dolibarr a déjà un tiers lié (fk_soc)
        if user.dolibarr_id is not None:
            tp_id = self.get_thirdparty_id_from_member(int(user.dolibarr_id))
            if tp_id:
                return tp_id
        # Priorité 2 : chercher par nom (cas où le membre n'est pas encore créé)
        return self.find_thirdparty_by_name(
            user.first_name, user.last_name
        ) or self.create_thirdparty(user)

    def link_member_to_thirdparty(self, dolibarr_id: int, thirdparty_id: int) -> bool:
        r = self.put(
            f"members/{dolibarr_id}", json={"socid": thirdparty_id}, timeout=10
        )
        if r is None or r.status_code != 200:
            logger.error(
                "Error linking member %d to thirdparty %d", dolibarr_id, thirdparty_id
            )
            return False
        logger.info(
            "Linked Dolibarr member %d to thirdparty %d", dolibarr_id, thirdparty_id
        )
        return True

    def get_invoices_by_thirdparty(self, thirdparty_id: int) -> list[dict]:
        r = self.get(
            "invoices",
            params={
                "thirdparty_ids": str(thirdparty_id),
                "sortfield": "t.datef",
                "sortorder": "DESC",
            },
            timeout=10,
        )
        if r is None or r.status_code == 404:
            return []
        if r.status_code != 200:
            logger.error(
                "Error fetching invoices by thirdparty %d: %s", thirdparty_id, r.text
            )
            return []
        return r.json()

    def get_invoice(self, invoice_id: int | str) -> dict | None:
        r = self.get(f"invoices/{invoice_id}", timeout=10)
        if r is None or r.status_code != 200:
            logger.error(
                "Error fetching invoice %s: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return None
        return r.json()

    def create_invoice(
        self, thirdparty_id: int, lines: list[dict], note_private: str | None = None
    ) -> int | None:
        body: dict[str, Any] = {"socid": thirdparty_id, "type": 0}
        if note_private:
            body["note_private"] = note_private

        r = self.post("invoices", json=body, timeout=10)
        if r is None or r.status_code != 200:
            logger.error(
                "Error creating Dolibarr invoice: %s", r.text if r else "SSL error"
            )
            return None

        try:
            invoice_id = int(r.text)
        except ValueError:
            logger.error("Dolibarr invoice response is not an int: %s", r.text)
            return None

        for line in lines:
            rl = self.post(f"invoices/{invoice_id}/lines", json=line, timeout=10)
            if rl is None or rl.status_code != 200:
                logger.error(
                    "Error adding line to invoice %d: %s",
                    invoice_id,
                    rl.text if rl else "SSL error",
                )

        logger.info(
            "Created Dolibarr invoice %d (%d ligne(s)) for thirdparty %d",
            invoice_id,
            len(lines),
            thirdparty_id,
        )
        return invoice_id

    def update_invoice(self, invoice_id: int | str, data: dict) -> bool:
        r = self.put(f"invoices/{invoice_id}", json=data, timeout=10)
        if r is None or r.status_code != 200:
            logger.error(
                "Error updating Dolibarr invoice %s: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return False
        return True

    def validate_invoice(self, invoice_id: int) -> str | None:
        r = self.post(f"invoices/{invoice_id}/validate", timeout=10)
        if r is None or r.status_code != 200:
            logger.error(
                "Error validating Dolibarr invoice %d: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return None
        logger.info("Validated Dolibarr invoice %d", invoice_id)
        inv = self.get_invoice(invoice_id)
        return inv.get("ref") if inv else None

    def cancel_invoice(self, invoice_id: int | str) -> bool:
        r = self.post(
            f"invoices/{invoice_id}/settodraft", json={"idwarehouse": 0}, timeout=10
        )
        if r is None or r.status_code != 200:
            logger.error(
                "Failed to set invoice %s to draft: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return False
        r = self.delete(f"invoices/{invoice_id}", timeout=10)
        if r is None or r.status_code != 200:
            logger.error(
                "Failed to delete invoice %s: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return False
        logger.info("Cancelled and deleted invoice %s", invoice_id)
        return True

    def get_invoice_with_ownership_check(
        self, user: User, invoice_id: str
    ) -> dict | None:
        if user.dolibarr_id is None:
            return None
        thirdparty_id = self.get_thirdparty_id_from_member(user.dolibarr_id)
        if thirdparty_id is None:
            return None
        invoice = self.get_invoice(invoice_id)
        if invoice is None:
            return None
        if str(invoice.get("socid")) != str(thirdparty_id):
            logger.warning(
                "Invoice %s socid %s does not match user thirdparty %s",
                invoice_id,
                invoice.get("socid"),
                thirdparty_id,
            )
            return None
        return invoice

    def download_invoice_pdf(
        self, invoice_id: str, ref: str
    ) -> tuple[bytes, str] | None:
        self.put(
            f"invoices/{invoice_id}/builddoc",
            json={"langcode": "fr_FR", "model": "crabe"},
            timeout=15,
        )
        r = self.get(
            "documents/download",
            params={"modulepart": "facture", "original_file": f"{ref}/{ref}.pdf"},
            timeout=15,
        )
        if r is None or r.status_code != 200:
            logger.error(
                "Error downloading invoice PDF %s: %s",
                invoice_id,
                r.text if r else "SSL error",
            )
            return None
        data = r.json()
        content = data.get("content")
        if not content:
            logger.error("No content in PDF response for invoice %s", invoice_id)
            return None
        return base64.b64decode(content), data.get("filename", f"{ref}.pdf")


_client = DolibarrClient(ENV.dolibarr_api_token, ENV.dolibarr_base_url)


def _name_variants(first_name: str, last_name: str) -> list[tuple[str, str]]:
    """variantes des noms pour essayer de matcher dans Dolibarr - à terme clé primaire = user authentik je crois -"""
    seen: set[tuple[str, str]] = set()
    result: list[tuple[str, str]] = []
    for fn, ln in [(first_name, last_name), (last_name, first_name)]:
        for f, n in [
            (fn, ln),
            (fn.capitalize(), ln.capitalize()),
            (fn.upper(), ln.upper()),
            (fn.lower(), ln.lower()),
        ]:
            if (f, n) not in seen:
                seen.add((f, n))
                result.append((f, n))
    return result


def _subscription_line(
    membership_type: MembershipType, qty: int, scholarship: bool = False
) -> dict:
    if membership_type == MembershipType.FTTH:
        fk_product = ENV.dolibarr_service_ftth_id
        price_cents = (
            ENV.helloasso_ftth_price_scholarship
            if scholarship
            else ENV.helloasso_ftth_price
        )
        subprice = price_cents / 100.0
        default_desc = f"Abonnement Fibre ({qty} mois)"  # service doit être défini dans Dolibarr du coup
    else:
        fk_product = ENV.dolibarr_service_wifi_id
        price_cents = (
            ENV.helloasso_wifi_price_scholarship
            if scholarship
            else ENV.helloasso_wifi_price
        )
        subprice = price_cents / 100.0
        default_desc = f"Abonnement Wi-Fi ({qty} mois)"  # idem

    if fk_product:
        return {"fk_product": fk_product, "subprice": subprice, "qty": qty, "tva_tx": 0}
    return {
        "desc": default_desc,
        "subprice": subprice,
        "qty": qty,
        "tva_tx": 0,
        "product_type": 1,
    }


def _deposit_line() -> dict:
    deposit_price = ENV.helloasso_ftth_deposit_price / 100.0
    if ENV.dolibarr_product_deposit_id:
        return {
            "fk_product": ENV.dolibarr_product_deposit_id,
            "subprice": deposit_price,
            "qty": 1,
            "tva_tx": 0,
        }
    return {
        "desc": "Caution matériel",
        "subprice": deposit_price,
        "qty": 1,
        "tva_tx": 0,
        "product_type": 0,
    }


def _membership_line() -> dict:
    return {
        "desc": "Adhésion annuelle à l'association",
        "subprice": ENV.helloasso_membership_price / 100.0,
        "qty": 1,
        "tva_tx": 0,
    }


def compute_selective_invoice_lines(
    membership_type: MembershipType, items: list[str], scholarship: bool = False
) -> list[dict]:
    lines = []
    if "first_month" in items:
        lines.append(_subscription_line(membership_type, 1, scholarship))
    if "deposit" in items and membership_type == MembershipType.FTTH:
        lines.append(_deposit_line())
    if "membership" in items:
        lines.append(_membership_line())
    return lines


# on encode dans note_private de la facture les items payés
def _selective_tag(items: list[str]) -> str:
    return SELECTIVE_TAG_PREFIX + ",".join(sorted(items))


def _parse_selective_tag(note_private: str | None) -> set[str] | None:
    note = _strip_meta_prefixes(note_private)
    if not note.startswith(SELECTIVE_TAG_PREFIX):
        return None
    raw = note[len(SELECTIVE_TAG_PREFIX) :]
    return set(raw.split(",")) if raw else set()


def _add_calendar_months(dt: datetime, months: int) -> datetime:
    # On n'utilise pas timedelta(days=30*n) - les mois n'ont pas tous la même
    # durée, on conserve le même quantième :)
    total = dt.month - 1 + months
    year = dt.year + total // 12
    month = total % 12 + 1
    day = min(dt.day, monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _is_member_subscription_active(member: dict) -> bool:
    if str(member.get("statut", "0")) != "1":
        return False
    datefin = member.get("datefin")
    if not datefin:
        return False
    try:
        return int(datefin) > int(datetime.now().timestamp())
    except (ValueError, TypeError):
        return False


def build_invoice_payment_url(invoice_ref: str) -> str:
    params = urlencode({"source": "invoice", "ref": invoice_ref})
    return f"{ENV.dolibarr_base_url}/public/payment/newpayment.php?{params}"


async def create_dolibarr_user(user: User, db: AsyncIOMotorDatabase) -> User:
    if user.membership is None:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            "Le Membership de l'adhérent n'est pas défini !",
            "```",
        )
        raise ValueError("Error while adding user to dolibarr : Membership is None !")

    existing_member = _client.find_member_by_name(user.first_name, user.last_name)

    if existing_member:
        dolibarr_id = int(existing_member["id"])
        logger.info(
            "Reusing existing Dolibarr member %d for user %s (%s %s)",
            dolibarr_id,
            user.id,
            user.first_name,
            user.last_name,
        )
        _client.update_member(
            dolibarr_id, {"url": f"https://fai.rezel.net/admin/users/{user.id}"}
        )

        update_fields: dict[str, Any] = {"dolibarr_id": dolibarr_id}
        if _is_member_subscription_active(existing_member):
            logger.info(
                "Dolibarr member %d has active subscription, marking membership as paid",
                dolibarr_id,
            )
            update_fields["membership.paid_membership"] = True

        userdict = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {"$set": update_fields},
            return_document=ReturnDocument.AFTER,
        )
        return User.model_validate(userdict)

    r = _client.post(
        "members",
        json={
            "morphy": "phy",
            "typeid": TYPE_ADHERENT,
            "lastname": user.last_name,
            "firstname": user.first_name,
            "email": user.email,
            "url": f"https://fai.rezel.net/admin/users/{user.id}",
            "array_options": {
                "options_cotisation": 1,
                "options_methode_payement1": (
                    "- par virement bancaire, voici notre RIB : IBAN : FR76 3000 4033 6400 0100 0660 667, "
                    "domiciliation : BNP Paribas, BIC : BNPAFRPPXXX"
                ),
                "options_methode_payement2": (
                    "- en espèce ou chèque à notre local, salle 0A206 à Télécom Paris "
                    "(au fond du couloir des associations, côté LudoTech/Robotics/Forum/BDS), "
                    "19 Pl. Marguerite Perey, 91120 Palaiseau"
                ),
            },
        },
        timeout=5,
    )

    if r is None:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr : "
            "SSL error ! Le certificat de treso.rezel.net a peut être expiré !",
            "```",
            "SSL error",
            "```",
        )
        raise ValueError("Error while adding user to dolibarr : SSL error !")

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            r.text,
            "```",
        )
        raise ValueError("Error while adding user to dolibarr")

    try:
        dolibarr_id = int(r.text)
    except ValueError as e:
        raise ValueError(
            "Error while adding user to dolibarr : Dolibarr's response is not an int !"
        ) from e

    if not _client.update_member(dolibarr_id, {"statut": "1"}):
        logger.warning("Failed to validate Dolibarr member %d", dolibarr_id)

    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {"$set": {"dolibarr_id": dolibarr_id}},
        return_document=ReturnDocument.AFTER,
    )
    return User.model_validate(userdict)


def renew_dolibarr_membership(user: User) -> bool:

    if user.dolibarr_id is None:
        return False
    member = _client.get_member(user.dolibarr_id)
    if member is None:
        return False
    now_dt = datetime.now()
    current_datefin = 0
    try:
        current_datefin = int(member.get("datefin") or 0)
    except (TypeError, ValueError):
        current_datefin = 0
    eleven_months_ahead = int(now_dt.timestamp()) + 11 * 30 * 86400
    if current_datefin > eleven_months_ahead:
        logger.info(
            "Dolibarr member %d datefin already extended (> 11 months ahead), skip",
            user.dolibarr_id,
        )
        return True
    base_dt = (
        datetime.fromtimestamp(current_datefin)
        if current_datefin > int(now_dt.timestamp())
        else now_dt
    )
    new_end = base_dt.replace(year=base_dt.year + 1)
    success = _client.update_member(
        user.dolibarr_id,
        {"datefin": int(new_end.timestamp()), "statut": "1"},
    )
    if success:
        logger.info(
            "Renewed Dolibarr member %d datefin to %s (was %s)",
            user.dolibarr_id,
            new_end.date(),
            (
                datetime.fromtimestamp(current_datefin).date()
                if current_datefin
                else "none"
            ),
        )
    return success


def create_dolibarr_member_subscription(user: User) -> bool:
    if user.dolibarr_id is None:
        return False

    member = _client.get_member(user.dolibarr_id)
    if member and _is_member_subscription_active(member):
        logger.info(
            "Dolibarr member %d already has active subscription, skipping",
            user.dolibarr_id,
        )
        return True

    now = datetime.now()
    one_year_later = now.replace(year=now.year + 1)
    success = _client.update_member(
        user.dolibarr_id,
        {
            "datefin": int(one_year_later.timestamp()),
            "statut": "1",
        },
    )
    if success:
        logger.info(
            "Updated Dolibarr member %d datefin to %s",
            user.dolibarr_id,
            one_year_later.date(),
        )
    else:
        logger.error(
            "Failed to update Dolibarr member %d subscription", user.dolibarr_id
        )
    return success


def get_member_subscriptions(user: User) -> list[dict[str, Any]]:
    if user.dolibarr_id is None:
        return []
    return _client.get_member_subscriptions(user.dolibarr_id)


def _invoice_is_archived(inv: dict) -> bool:
    return _is_archived_note(inv.get("note_private"))


def archive_user_invoices(user: User) -> int:
    if user.dolibarr_id is None:
        return 0
    thirdparty_id = _client.get_thirdparty_id_from_member(user.dolibarr_id)
    if not thirdparty_id:
        return 0
    count = 0
    for inv in _client.get_invoices_by_thirdparty(thirdparty_id):
        note = inv.get("note_private") or ""
        if _is_archived_note(note):
            continue
        new_note = _with_archived_tag(note)
        if _client.update_invoice(inv.get("id"), {"note_private": new_note}):
            count += 1
    logger.info("Archived %d invoices for user %s", count, user.id)
    return count


def _filter_sadh_invoices(invoices: list[dict], archived: bool) -> list[dict[str, Any]]:
    clean = []
    for inv in invoices:
        note = inv.get("note_private") or ""
        if _is_advance_tag(note) and inv.get("paye") not in ("1", 1):
            _client.cancel_invoice(inv.get("id"))
            continue
        if _invoice_is_archived(inv) != archived:
            continue
        clean.append(inv)
    return clean


def get_member_invoices(user: User) -> list[dict[str, Any]]:
    if user.dolibarr_id is None:
        return []
    thirdparty_id = _client.get_thirdparty_id_from_member(user.dolibarr_id)
    if not thirdparty_id:
        return []
    return _filter_sadh_invoices(
        _client.get_invoices_by_thirdparty(thirdparty_id), archived=False
    )


def get_archived_member_invoices(user: User) -> list[dict[str, Any]]:
    if user.dolibarr_id is None:
        return []
    thirdparty_id = _client.get_thirdparty_id_from_member(user.dolibarr_id)
    if not thirdparty_id:
        return []
    return _filter_sadh_invoices(
        _client.get_invoices_by_thirdparty(thirdparty_id), archived=True
    )


async def check_dolibarr_payment_status(
    user: User, db: AsyncIOMotorDatabase
) -> dict[str, bool]:
    empty: dict[str, bool] = {
        "first_month": False,
        "deposit": False,
        "membership": False,
    }
    if user.dolibarr_id is None:
        return empty

    thirdparty_id = _client.get_thirdparty_id_from_member(user.dolibarr_id)
    invoices: list[dict] = []
    if thirdparty_id:
        invoices = _client.get_invoices_by_thirdparty(thirdparty_id)

    if not invoices:
        raw_user = await db.users.find_one({"_id": str(user.id)})
        stored_tp_id = (
            (raw_user or {}).get("membership", {}).get("dolibarr_thirdparty_id")
        )
        if stored_tp_id:
            invoices = _client.get_invoices_by_thirdparty(int(stored_tp_id))

    if not invoices:
        return empty

    paid_items: set[str] = set()
    for inv in invoices:
        note = (inv.get("note_private") or "").strip()
        if _invoice_is_archived(inv):
            continue
        if inv.get("paye") not in ("1", 1):
            continue
        logger.info(
            "Invoice %s: paye=%s, note_private=%r",
            inv.get("ref"),
            inv.get("paye"),
            note,
        )
        if _is_advance_tag(note) or _subscription_reminder_months(note) is not None:
            continue
        items_in_invoice = _parse_selective_tag(note)
        if items_in_invoice is not None:
            paid_items |= items_in_invoice

    return {k: k in paid_items for k in ("first_month", "deposit", "membership")}


async def create_selective_invoice(
    user: User, db: AsyncIOMotorDatabase, items: list[str]
) -> dict[str, Any] | None:
    if user.membership is None or user.dolibarr_id is None:
        return None

    lines = compute_selective_invoice_lines(
        user.membership.type, items, bool(user.scholarship_student)
    )
    if not lines:
        return None

    thirdparty_id = _client.get_or_create_thirdparty(user)
    if thirdparty_id is None:
        return None

    _client.link_member_to_thirdparty(user.dolibarr_id, thirdparty_id)
    await db.users.update_one(
        {"_id": str(user.id)},
        {"$set": {"membership.dolibarr_thirdparty_id": thirdparty_id}},
    )

    tag = _selective_tag(items)
    for inv in _client.get_invoices_by_thirdparty(thirdparty_id):
        note = (inv.get("note_private") or "").strip()
        is_paid = inv.get("paye") in ("1", 1)
        is_cancelled = str(inv.get("statut", inv.get("status", ""))) == "3"
        if note == tag and not is_paid and not is_cancelled:
            inv_ref, inv_id = inv.get("ref"), inv.get("id")
            if inv_ref and inv_id:
                logger.info(
                    "Reusing existing unpaid invoice %s for items %s", inv_ref, items
                )
                return {
                    "payment_url": build_invoice_payment_url(inv_ref),
                    "invoice_id": int(inv_id),
                }

    invoice_id = _client.create_invoice(thirdparty_id, lines, note_private=tag)
    if invoice_id is None:
        return None

    invoice_ref = _client.validate_invoice(invoice_id)
    if invoice_ref is None:
        return None

    return {
        "payment_url": build_invoice_payment_url(invoice_ref),
        "invoice_id": invoice_id,
    }


async def create_advance_invoice(
    user: User, db: AsyncIOMotorDatabase, num_months: int
) -> dict[str, Any] | None:
    if user.membership is None or user.dolibarr_id is None:
        return None

    raw_user = await db.users.find_one({"_id": str(user.id)})
    stored_tp_id = (raw_user or {}).get("membership", {}).get("dolibarr_thirdparty_id")
    thirdparty_id = (
        int(stored_tp_id)
        if stored_tp_id
        else _client.get_thirdparty_id_from_member(user.dolibarr_id)
    )
    if thirdparty_id is None:
        logger.error("Cannot resolve thirdparty for user %s", user.id)
        return None

    lines = [
        _subscription_line(
            user.membership.type, num_months, bool(user.scholarship_student)
        )
    ]
    invoice_id = _client.create_invoice(
        thirdparty_id, lines, note_private=ADVANCE_INVOICE_TAG
    )
    if invoice_id is None:
        return None

    invoice_ref = _client.validate_invoice(invoice_id)
    if invoice_ref is None:
        return None

    return {
        "payment_url": build_invoice_payment_url(invoice_ref),
        "invoice_id": invoice_id,
    }


async def create_subscription_reminder_invoice(
    user: User, db: AsyncIOMotorDatabase, num_months: int = 1
) -> dict[str, Any] | None:
    if user.membership is None or user.dolibarr_id is None:
        return None

    thirdparty_id = _client.get_or_create_thirdparty(user)
    if thirdparty_id is None:
        return None
    _client.link_member_to_thirdparty(user.dolibarr_id, thirdparty_id)
    await db.users.update_one(
        {"_id": str(user.id)},
        {"$set": {"membership.dolibarr_thirdparty_id": thirdparty_id}},
    )

    lines = [
        _subscription_line(
            user.membership.type, num_months, bool(user.scholarship_student)
        )
    ]
    invoice_id = _client.create_invoice(
        thirdparty_id,
        lines,
        note_private=f"{SUBSCRIPTION_REMINDER_TAG}:{num_months}",
    )
    if invoice_id is None:
        return None

    invoice_ref = _client.validate_invoice(invoice_id)
    if invoice_ref is None:
        return None

    return {
        "payment_url": build_invoice_payment_url(invoice_ref),
        "invoice_id": invoice_id,
    }


def _subscription_catchup_months(sub_end: int | None, now_ts: int) -> int:
    if sub_end is None:
        return 1
    overdue_seconds = now_ts - int(sub_end)
    if overdue_seconds <= 0:
        return 1
    return overdue_seconds // (30 * 86400) + 1


async def ensure_subscription_reminder_invoice(
    user: User, db: AsyncIOMotorDatabase
) -> tuple[dict[str, Any] | None, bool, int]:
    info = compute_subscription_info(user)
    sub_end = info.get("subscription_end") if info else None
    needed_months = _subscription_catchup_months(
        sub_end, int(datetime.now().timestamp())
    )

    existing = find_unpaid_invoice_for(user, "subscription")
    if existing is not None:
        existing_months = _subscription_reminder_months(
            existing.get("note_private") or ""
        )
        if existing_months is None or existing_months >= needed_months:
            return ({"invoice_id": existing.get("id")}, False, needed_months)
        logger.info(
            "Cancelling undersized subscription reminder invoice %s (%d mois) "
            "to recreate at %d mois for user %s",
            existing.get("id"),
            existing_months,
            needed_months,
            user.id,
        )
        _client.cancel_invoice(existing.get("id"))

    result = await create_subscription_reminder_invoice(user, db, needed_months)
    return (result, result is not None, needed_months)


async def ensure_membership_reminder_invoice(
    user: User, db: AsyncIOMotorDatabase
) -> tuple[dict[str, Any] | None, bool]:
    existing = find_unpaid_invoice_for(user, "membership")
    if existing is not None:
        return ({"invoice_id": existing.get("id")}, False)
    result = await create_selective_invoice(user, db, ["membership"])
    return (result, result is not None)


def find_unpaid_invoice_for(user: User, kind: str) -> dict | None:
    if user.dolibarr_id is None:
        return None
    thirdparty_id = _client.get_thirdparty_id_from_member(user.dolibarr_id)
    if not thirdparty_id:
        return None
    for inv in _client.get_invoices_by_thirdparty(thirdparty_id):
        note = (inv.get("note_private") or "").strip()
        if _invoice_is_archived(inv):
            continue
        if inv.get("paye") in ("1", 1):
            continue
        if str(inv.get("statut", inv.get("status", ""))) == "3":
            continue
        if kind == "subscription":
            if _subscription_reminder_months(note) is not None:
                return inv
            items = _parse_selective_tag(note)
            if items and "first_month" in items:
                return inv
        elif kind == "membership":
            items = _parse_selective_tag(note)
            if items and "membership" in items:
                return inv
    return None


def get_invoice_payment_url(user: User, invoice_id: str) -> str | None:
    invoice = _client.get_invoice_with_ownership_check(user, invoice_id)
    if invoice is None:
        return None
    ref = invoice.get("ref")
    return build_invoice_payment_url(ref) if ref else None


def cancel_dolibarr_invoice(user: User, invoice_id: str) -> bool:
    invoice = _client.get_invoice_with_ownership_check(user, invoice_id)
    if invoice is None:
        return False
    return _client.cancel_invoice(invoice_id)


def check_single_invoice_paid(user: User, invoice_id: str) -> bool:
    invoice = _client.get_invoice_with_ownership_check(user, invoice_id)
    if invoice is None:
        return False
    return invoice.get("paye") in ("1", 1)


def get_invoice_pdf(user: User, invoice_id: str) -> tuple[bytes, str] | None:
    invoice = _client.get_invoice_with_ownership_check(user, invoice_id)
    if invoice is None:
        return None
    ref = invoice.get("ref")
    if not ref:
        return None
    return _client.download_invoice_pdf(invoice_id, ref)


def compute_subscription_info(user: User) -> dict[str, Any] | None:
    if user.dolibarr_id is None or user.membership is None:
        return None

    service_id = (
        ENV.dolibarr_service_ftth_id
        if user.membership.type == MembershipType.FTTH
        else ENV.dolibarr_service_wifi_id
    )
    if service_id is None:
        return None

    total_months = 0
    for inv in get_member_invoices(user):
        if inv.get("paye") not in ("1", 1):
            continue
        for line in inv.get("lines", []):
            fk = line.get("fk_product")
            if fk and int(fk) == service_id:
                total_months += int(float(line.get("qty", 0)))

    membership_end: int | None = None
    member = _client.get_member(user.dolibarr_id)
    if member is not None:
        datefin = member.get("datefin")
        if datefin:
            try:
                membership_end = int(datefin)
            except (TypeError, ValueError):
                membership_end = None

    if total_months == 0:
        return {
            "total_months_paid": 0,
            "subscription_end": membership_end,
            "membership_end": membership_end,
        }

    start_date = user.membership.start_date
    if start_date is None:
        return {
            "total_months_paid": total_months,
            "subscription_end": membership_end,
            "membership_end": membership_end,
        }

    start_dt = (
        datetime.fromtimestamp(start_date)
        if isinstance(start_date, (int, float))
        else start_date
    )
    end_dt = _add_calendar_months(start_dt, total_months)

    return {
        "total_months_paid": total_months,
        "subscription_end": int(end_dt.timestamp()),
        "membership_end": membership_end,
    }
