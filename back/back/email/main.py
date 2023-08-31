"""Email module."""

import os
import smtplib
import threading
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from matrix_client.client import MatrixClient

from back.env import ENV


def send_admin_message(subject:str, body:str) -> None:
    """Send admin message."""
    threading.Thread(target=send_matrix, args=(subject, body)).start()

def send_email(subject:str, body:str, to:str, attachments:list[str] | None=None, bcc:str="faipp@rezel.net") -> None:
    """Send email."""
    try:
        message = MIMEMultipart("mixed")
        message["From"] = "Pôle FAI Rezel <faipp@rezel.net>"
        message["To"] = to
        if bcc:
            message["Bcc"] = bcc
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
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

def send_matrix(subject:str, body:str) -> None:
    """Send matrix message."""
    try:
        print("Sending Matrix message")
        matrix_client = MatrixClient("https://matrix.rezel.net")
        token = matrix_client.login(username=ENV.matrix_user,
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

def send_email_contract(to:str) -> None:
    """Send email contract."""
    send_email(
        "Rezel - Votre adhésion FAI",
        """Bonjour,

Vous avez effectué une demande d'adhésion FAI à Rezel via le site fai.rezel.net.

Afin de compléter le processus d'adhésion, il ne vous reste plus qu'à :
•	nous retourner le contrat de fourniture de service complété (pages 2 et 7) et signé,
•	vous acquitter du premier mois de cotisation (20€),
•	nous indiquer si vous êtes disponible le samedi 9 ou 16 septembre de 15h à 18h pour l'installation de votre ligne, et
•	nous indiquer votre numéro de téléphone
Votre numéro de téléphone est indispensable pour que le technicien Orange qui installera votre ligne puisse vous contacter. Le rendez-vous devrait durer environ 30min dans le créneau 15h-18h. Un membre de Rezel sera présent afin de s'assurer du bon déroulement de l'installation.

Comme mentionné dans le contrat, Rezel peut être facturé de 50€ par Orange pour le déplacement du technicien Orange lors de l'installation de la ligne (même si la fibre existe déjà). Dans ce cas, Rezel vous facturera ces 50€ que nous aurons dû avancer.

Le paiement de la cotisation peut se faire au choix :
•	En liquide aux locaux de l'association (Salle 0A316, Télécom Paris au 19 Place Marguerite Perey). Pour s'assurer de la présence d'un membre au local, merci de nous informer de la date et l'heure de votre passage.
•	Par virement bancaire au RIB que vous trouverez ci-joint. ATTENTION : Vous devez impérativement mentionner votre nom et prénom dans le libellé du virement.

A bientôt,
Le pôle FAI de Rezel
""",
        to, attachments=[os.path.join("back/email/files/subscription", file) for file in os.listdir("back/email/files/subscription")])
