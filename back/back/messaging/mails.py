"""Email module."""

import datetime
import os
import re
import smtplib
import threading
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fillpdf import fillpdfs

from back.env import ENV
from back.messaging.matrix import send_matrix_message

pdf_lock = threading.Lock()


def send_email(
    subject: str,
    body: str,
    to: str,
    attachments: list[str] | None = None,
    bcc: str = "fai@rezel.net",
    plain: bool = True,
) -> None:
    """Send email."""

    # If this is a dev environment, don't send the email
    if ENV.deploy_env != "prod":
        print("Email NOT SENT in non-prod environment")
        print(f"Email to {to} with subject {subject}:\n{body}")
        return

    try:
        message = MIMEMultipart("mixed")
        message["From"] = "FAI Rezel <fai@rezel.net>"
        message["To"] = to
        if bcc:
            message["Bcc"] = bcc
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain" if plain else "html"))
        if attachments:
            for attachment in attachments:
                with open(attachment, "rb") as file:
                    part = MIMEApplication(file.read(), _subtype=attachment.split(".")[-1])
                    part.add_header("Content-Disposition", f"attachment; filename={attachment.split('/')[-1]}")
                    message.attach(part)
        with smtplib.SMTP("smtp.rezel.net", 25) as server:
            server.sendmail("fai@rezel.net", [to, bcc] if bcc else to, message.as_string())
    except Exception as e:
        send_matrix_message(
            f"❌ Erreur lors de l'envoi du mail à {to}, Sujet : {subject}",
            "```",
            str(e),
            "```",
        )


def send_email_contract(to: str, adherent_name: str) -> None:
    """Send email contract."""

    pdf_lock.acquire()
    try:
        data_dict = {}
        for k in fillpdfs.get_form_fields(
            "resources/membership/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            sort=False,
            page_number=None,
        ):
            fieldName = re.sub(r"\\[0-9]{3}", "", k)
            if fieldName == "dateRezel":
                data_dict[k] = datetime.date.today().strftime("%d/%m/%Y")
            elif fieldName == "placeRezel":
                data_dict[k] = "Palaiseau"
            elif fieldName == "nameRezel":
                data_dict[k] = "Antonin Blot"
            elif fieldName == "fonctionRezel":
                data_dict[k] = "Président"
            elif fieldName == "adherentName":
                data_dict[k] = adherent_name
        fillpdfs.write_fillable_pdf(
            "resources/membership/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            "resources/membership/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            data_dict,
            flatten=False,
        )
        send_email(
            "Rezel - Ton adhésion FAI",
            """<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  </head>
  <body>
    <p>Bonjour,<br>
      <br>
      Tu as effectué une demande d'adhésion FAI à Rezel via le site
      <a href="https://fai.rezel.net">fai.rezel.net</a>.<br>
      <br>
      Afin de compléter le processus d'adhésion, il ne te reste plus
      qu'à :<br>
    </p>
    <ul>
      <li>nous retourner le <b>contrat de fourniture de service</b>
        complété (pages 2 et 7) et signé,</li>
      <li>t'acquitter du <b>premier mois de cotisation (20€)</b>, et</li>
      <li>nous verser <b>la caution de 50€</b> qui te sera réstituée à la fin de l'adhésion.</li>
    </ul>
    <p>Les <b>paiements de la cotisation et de la caution</b> peuvent se faire au choix :<br>
    </p>
    <ul>
      <li>En liquide aux locaux de l'association (Salle 0A316 à Télécom
        Paris au 19 Place Marguerite Perey). Pour s'assurer de la
        présence d'un membre aux locaux, merci de nous informer de la date
        et l'heure de ton passage.</li>
      <li>Par virement bancaire au RIB que tu trouveras ci-joint.
        ATTENTION : Tu dois impérativement mentionner ton nom et
        prénom dans le libellé du virement.</li>
    </ul>
    <p>A bientôt,<br>
      Le pôle FAI de Rezel<br>
    </p>
  </body>
</html>
""",
            to,
            attachments=[os.path.join("resources/membership", file) for file in os.listdir("resources/membership")],
            plain=False,
        )
        pdf_lock.release()
    except Exception as e:
        send_matrix_message(
            f"❌ Erreur lors de la génération du contrat pour {adherent_name}",
            "```",
            str(e),
            "```",
        )
