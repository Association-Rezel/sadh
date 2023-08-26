"""Email module."""

import smtplib
import ssl
import threading

from matrix_client.client import MatrixClient

from back.env import ENV

context = ssl._create_unverified_context()


def send_email(subject:str, body:str, to:str="faipp@rezel.net") -> None:
    """Send email."""
    try:
        with smtplib.SMTP("smtp.rezel.net", 587) as server:
            server.starttls(context=context)
            server.sendmail("fai@rezel.net", to, f"Subject: {subject}\n\n{body}".encode())
    except Exception as e:
        print(e)
        print("Email not sent a backup should be implemented here.")
        # A BACKUP SHOULD BE IMPLEMENTED HERE
    threading.Thread(target=send_matrix, args=(subject, body)).start()

def send_matrix(subject:str, body:str) -> None:
    """Send matrix message."""
    print("Sending Matrix message")
    matrix_client = MatrixClient("https://matrix.rezel.net")
    token = matrix_client.login(username=ENV.matrix_user,
                                password=ENV.matrix_password,
    )
    print("Logged into Matrix")
    room = matrix_client.join_room("!jrAyfdcVwGsyJMXYny:matrix.rezel.net")
    room.send_text(
        f"---\n\n{subject}\n\n{body}",
    )
    matrix_client.logout()
    print("Matrix message sent")
