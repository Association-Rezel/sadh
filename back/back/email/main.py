"""Email module."""

import smtplib
import threading

from matrix_client.client import MatrixClient

from back.env import ENV


def send_admin_message(subject:str, body:str) -> None:
    """Send admin message."""
    threading.Thread(target=send_matrix, args=(subject, body)).start()
    threading.Thread(target=send_email, args=(subject, body, "faipp@rezel.net")).start()

def send_email(subject:str, body:str, to:str) -> None:
    """Send email."""
    try:
        with smtplib.SMTP("smtp.rezel.net", 25) as server:
            server.sendmail("faipp@rezel.net", to, f"Subject: {subject}\n\n{body}".encode())
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
