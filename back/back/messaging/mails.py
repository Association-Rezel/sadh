"""Email module."""

import smtplib
import threading
from datetime import datetime, timedelta
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import pytz
from babel.dates import format_datetime
from jinja2 import Environment, PackageLoader, select_autoescape
from motor.motor_asyncio import AsyncIOMotorDatabase

from back.core.hermes import get_box_from_user
from back.core.pon import get_ontinfo_from_box
from back.env import ENV
from back.messaging.matrix import send_matrix_message
from back.mongodb.user_models import Residence, User

pdf_lock = threading.Lock()


jinja2_emails_env = Environment(
    loader=PackageLoader("back", "templates/emails"), autoescape=select_autoescape()
)


def _send_email(
    subject: str,
    body: str,
    to: str,
    attachments: list[str] | None = None,
    bcc: str | None = ENV.fai_email_address,
    html: bool = False,
) -> None:
    """Send email."""

    if ENV.deploy_env == "local":
        print("DEPLOY_ENV is local")
        print(f"NOT sending email to {to} with subject: {subject}")
        print(body)
        return

    try:
        message = MIMEMultipart("mixed")
        message["From"] = "FAI Rezel <fai@rezel.net>"
        message["To"] = to
        if bcc:
            message["Bcc"] = bcc
        message["Subject"] = subject
        message.attach(MIMEText(body, "html" if html else "plain"))
        if attachments:
            for attachment in attachments:
                with open(attachment, "rb") as file:
                    part = MIMEApplication(
                        file.read(), _subtype=attachment.split(".")[-1]
                    )
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={attachment.split('/')[-1]}",
                    )
                    message.attach(part)
        with smtplib.SMTP("smtp.rezel.net", 25) as server:
            server.sendmail(
                "fai@rezel.net", [to, bcc] if bcc else to, message.as_string()
            )
    except Exception as e:
        send_matrix_message(
            f"❌ Erreur lors de l'envoi du mail à {to}, Sujet : {subject}",
            "```",
            str(e),
            "```",
        )


def send_email_validated_ftth(user: User) -> None:
    _send_email(
        "Rezel - Demande d'adhésion validée",
        jinja2_emails_env.get_template("request_validated_ftth.html").render(user=user),
        user.email,
        html=True,
    )


async def send_email_validated_wifi(user: User, db: AsyncIOMotorDatabase) -> None:
    box = await get_box_from_user(db, user)  # type: ignore

    if box is None:
        raise ValueError("User has no box")

    if not user.membership:
        raise ValueError("User has no membership")

    if not user.membership.unetid or not any(
        unet.unet_id == user.membership.unetid for unet in box.unets
    ):
        raise ValueError("User has no unetid or unetid is not in box")

    user_unetid = user.membership.unetid
    adh_unet = next(filter(lambda unet: unet.unet_id == user_unetid, box.unets))

    PARIS_TZ = pytz.timezone("Europe/Paris")
    date_wifi: datetime
    if datetime.now(tz=PARIS_TZ).hour < 5:
        date_wifi = datetime.now(tz=PARIS_TZ).replace(
            hour=5, minute=0, second=0, microsecond=0
        )
    else:
        date_wifi = datetime.now(tz=PARIS_TZ).replace(
            hour=5, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

    _send_email(
        "Rezel - Demande d'adhésion validée",
        jinja2_emails_env.get_template("request_validated_wifi.html").render(
            user=user,
            date_wifi=date_wifi.strftime("%d/%m"),
            ssid=adh_unet.wifi.ssid,
            password=adh_unet.wifi.psk,
        ),
        user.email,
        html=True,
    )


async def send_mail_appointment_validated(user: User, db: AsyncIOMotorDatabase) -> None:
    if user.membership is None or user.membership.appointment is None:
        raise ValueError("User has no membership or appointment")

    box = await get_box_from_user(db, user)  # type: ignore

    if box is None:
        raise ValueError("User has no box")

    ont = await get_ontinfo_from_box(db, box)

    if ont is None:
        raise ValueError("User has no ONT")

    _send_email(
        f"Rezel - Ton rendez-vous du {user.membership.appointment.slot.start.strftime('%d/%m/%Y')} de raccordement à la fibre optique",
        jinja2_emails_env.get_template("appointment_validated.html").render(
            user=user,
            appt_day_of_the_week=format_datetime(
                user.membership.appointment.slot.start, "EEEE", locale="fr"
            ),
            appt_date=user.membership.appointment.slot.start.strftime("%d/%m"),
            appt_time=user.membership.appointment.slot.start.strftime("%H:%M"),
            position_mec_128=ont.mec128_position,
            ssid=next(
                filter(lambda unet: unet.unet_id == box.main_unet_id, box.unets)
            ).wifi.ssid,
            password=next(
                filter(lambda unet: unet.unet_id == box.main_unet_id, box.unets)
            ).wifi.psk,
            is_aljt=user.membership.address.residence == Residence.ALJT,
        ),
        user.email,
        html=True,
    )


async def send_mail_new_adherent_on_box(user: User, db: AsyncIOMotorDatabase) -> None:
    if user.membership is None:
        raise ValueError("User has no membership")

    box = await get_box_from_user(db, user)  # type: ignore

    if box is None:
        raise ValueError("User has no box")

    main_unet_user = await db.users.find_one({"membership.unetid": box.main_unet_id})

    if main_unet_user is None:
        raise ValueError("Main unet user not found. Is it an orphan box ?")

    main_unet_user = User.model_validate(main_unet_user)

    _send_email(
        "Rezel - Nouvel adhérent sur le lien fibre",
        jinja2_emails_env.get_template("new_adherent_on_box.html").render(
            user=main_unet_user,
            box=box,
        ),
        main_unet_user.email,
        html=True,
    )


def send_mail_no_more_wifi_on_box(user: User) -> None:
    _send_email(
        "Rezel - Plus d'autres adhérents wifi sur le lien fibre",
        jinja2_emails_env.get_template("no_more_wifi_adherent_on_box.html").render(
            user=user,
        ),
        user.email,
        html=True,
    )
