"""Email module."""

import datetime
import os
import smtplib
import threading
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fillpdf import fillpdfs
from matrix_client.client import MatrixClient

from back.env import ENV

pdf_lock = threading.Lock()


def send_admin_message(subject: str, body: str) -> None:
    """Send admin message."""
    threading.Thread(target=send_matrix, args=(subject, body)).start()


def send_email(
    subject: str,
    body: str,
    to: str,
    attachments: list[str] | None = None,
    bcc: str = "faipp@rezel.net",
    plain: bool = True,
) -> None:
    """Send email."""
    try:
        message = MIMEMultipart("mixed")
        message["From"] = "FAI Rezel <faipp@rezel.net>"
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
            server.sendmail("faipp@rezel.net", [to, bcc] if bcc else to, message.as_string())
    except Exception as e:
        print(f"Error while sending email {e}")
        # TODO: "Implement backup email sending"


def send_matrix(subject: str, body: str) -> None:
    """Send matrix message."""
    try:
        print("Sending Matrix message")
        matrix_client = MatrixClient("https://matrix.rezel.net")
        token = matrix_client.login(
            username=ENV.matrix_user,
            password=ENV.matrix_password,
        )
        room = matrix_client.join_room("!jrAyfdcVwGsyJMXYny:matrix.rezel.net")
        room.send_text(
            f"----\n\n{subject}\n\n{body}",
        )
        matrix_client.logout()
        print("Matrix message sent")
    except Exception as e:
        print(f"Error while sending Matrix message {e}")
        send_email(subject, body, "faipp@rezel.net")


def send_email_contract(to: str, client_name: str) -> None:
    """Send email contract."""
    pdf_lock.acquire()
    try:
        data_dict = {}
        for k in fillpdfs.get_form_fields(
            "back/email/files/subscription/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            sort=False,
            page_number=None,
        ):
            fieldName = str(k.encode("utf-8")[4:]).replace("\\x00", "")[2:-1]
            if fieldName == "dateRezel":
                data_dict[k] = datetime.date.today().strftime("%d/%m/%Y")
            elif fieldName == "placeRezel":
                data_dict[k] = "Palaiseau"
            elif fieldName == "nameRezel":
                data_dict[k] = "Thomas PUJOL"
            elif fieldName == "fonctionRezel":
                data_dict[k] = "Président"
            elif fieldName == "adherentName":
                data_dict[k] = client_name
        r = fillpdfs.write_fillable_pdf(
            "back/email/files/subscription/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            "back/email/files/subscription/Contrat_de_fourniture_de_service_-_Acces_a_Internet.pdf",
            data_dict,
            flatten=False,
        )
    except Exception as e:
        send_admin_message(
            "Erreur lors de la génération du contrat",
            f"Erreur lors de la génération du contrat pour {client_name}: {e}",
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
    <p>Comme mentionné dans le contrat, Rezel peut être facturé de 50€
      par Orange pour le déplacement du technicien Orange lors de
      l'installation de la ligne (même si la fibre existe déjà). Dans ce
      cas, <b>Rezel te facturera ces 50€</b> que nous aurons dû
      avancer.<br>
      <br>
      Les <b>paiements de la cotisation et de la caution</b> peuvent se faire au choix :<br>
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
        attachments=[
            os.path.join("back/email/files/subscription", file) for file in os.listdir("back/email/files/subscription")
        ],
        plain=False,
    )
    pdf_lock.release()

def send_email_signed_contract(to: str, attachment_path: str) -> None:
    """Send email signed contract."""
    send_email(
        "Rezel - Ton adhésion FAI - contrat",
        """<!DOCTYPE html>
<html>
    <body>
        <p>Bonjour,<br>
        <br>
        Tu as récemment adhéré à Rezel via <a href="https://fai.rezel.net">https://fai.rezel.net</a>.<br>
        <br>
        Tu trouveras ci-joint le contrat signé. Tu peux également le retrouver à tout moment sur <a href="https://fai.rezel.net/contract">https://fai.rezel.net/contract</a>.<br>
        <br>
        A bientôt,<br>
        Le pôle FAI de Rezel<br>
    </body>
</html>
""", to, attachments=[attachment_path], plain=False)
