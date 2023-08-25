"""Email module."""

import smtplib
import ssl

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
