"""Email module."""

import datetime
import os
import smtplib
import threading
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from matrix_client.client import MatrixClient

from back.env import ENV


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


def send_email_contract(to: str) -> None:
    """Send email contract."""
    date_j_plus_8 = (datetime.date.today() + datetime.timedelta(days=8)).strftime("%m/%d/%Y")
    send_email(
        "Rezel - Votre adhésion FAI",
        f"""<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
  </head>
  <body>
    <p>Bonjour,<br>
      <br>
      Vous avez effectué une demande d'adhésion FAI à Rezel via le site
      <a href="https://fai.rezel.net">fai.rezel.net</a>.<br>
      <br>
      Afin de compléter le processus d'adhésion, il ne vous reste plus
      qu'à :<br>
    </p>
    <ul>
      <li>nous retourner le <b>contrat de fourniture de service</b>
        complété (pages 2 et 7) et signé,</li>
      <li>vous acquitter du <b>premier mois de cotisation (20€)</b>,</li>
      <li>nous indiquer <b>3 créneaux</b> sur lesquels vous êtes disponible pour l'installation de votre ligne à compter du {date_j_plus_8},
        et</li>
      <li>nous indiquer votre <b>numéro de téléphone</b></li>
    </ul>
    <p>Les horaires des créneaux d'installation possibles, du lundi au samedi, sont :</p>
    <ul>
      <li>de 8h à 10h</li>
      <li>de 10h à 12h</li>
      <li>de 13h à 15h</li>
      <li>de 15h à 17h</li>
    </ul>
    <p>Votre numéro de téléphone est indispensable pour que le
      technicien Orange qui installera votre ligne puisse vous
      contacter. Le rendez-vous devrait durer environ <b>30 minutes</b> dans le créneau.
      Un membre de Rezel sera présent afin de s'assurer du bon déroulement de l'installation.<br>
      <br>
      Comme mentionné dans le contrat, Rezel peut être facturé de 50€
      par Orange pour le déplacement du technicien Orange lors de
      l'installation de la ligne (même si la fibre existe déjà). Dans ce
      cas, <b>Rezel vous facturera ces 50€</b> que nous aurons dû
      avancer.<br>
      <br>
      Le <b>paiement de la cotisation</b> peut se faire au choix :<br>
    </p>
    <ul>
      <li>En liquide aux locaux de l'association (Salle 0A316 à Télécom
        Paris au 19 Place Marguerite Perey). Pour s'assurer de la
        présence d'un membre au local, merci de nous informer de la date
        et l'heure de votre passage.</li>
      <li>Par virement bancaire au RIB que vous trouverez ci-joint.
        ATTENTION : Vous devez impérativement mentionner votre nom et
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
