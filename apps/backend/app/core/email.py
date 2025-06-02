from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from app.core.config import settings
from pathlib import Path

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.PROJECT_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


async def send_verification_email(email: EmailStr, verification_token: str):
    """
    Envía un correo electrónico con el código de verificación al usuario.
    """
    # Configurar el mensaje
    message = MessageSchema(
        subject=f"Verifica tu correo electrónico - {settings.PROJECT_NAME}",
        recipients=[email],
        body=f"""
        <html>
            <body>
                <h1>Bienvenido a {settings.PROJECT_NAME}!</h1>
                <p>Gracias por registrarte. Para verificar tu correo electrónico, usa el siguiente código:</p>
                <h2 style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 24px;">{verification_token}</h2>
                <p>Este código expirará en 24 horas.</p>
                <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
            </body>
        </html>
        """,
        subtype=MessageType.html,
    )

    # Enviar el correo
    fm = FastMail(conf)
    await fm.send_message(message)
