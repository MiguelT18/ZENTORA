import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pydantic import EmailStr
from app.core.config import settings
import logging
from fastapi import HTTPException
from typing import Any, Dict
import os
import jinja2

# Configurar logging con más detalle
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Configurar el cliente de Brevo
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = settings.BREVO_API_KEY

try:
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    logger.info("Cliente de Brevo API inicializado correctamente")
except Exception as e:
    logger.error(f"Error al inicializar el cliente de Brevo API: {str(e)}")
    raise

# Configurar Jinja2 para las plantillas
template_loader = jinja2.FileSystemLoader(settings.EMAIL_TEMPLATES_DIR)
template_env = jinja2.Environment(loader=template_loader)


async def send_email(
    email_to: str,
    subject: str,
    body: str,
    template_name: str | None = None,
    template_body: Dict[str, Any] | None = None,
) -> None:
    """
    Envía un correo electrónico usando la API de Brevo.

    Args:
        email_to: Dirección de correo del destinatario
        subject: Asunto del correo
        body: Cuerpo del correo (se usa si no se proporciona template)
        template_name: Nombre del template a usar (opcional)
        template_body: Datos para el template (opcional)
    """
    try:
        # Preparar el contenido HTML
        html_content = body
        if template_name and template_body:
            template = template_env.get_template(template_name)
            html_content = template.render(**template_body)

        # Crear el objeto de envío de correo
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email_to}],
            html_content=html_content,
            sender={"name": settings.PROJECT_NAME, "email": settings.BREVO_SENDER_EMAIL},
            subject=subject,
        )

        # Enviar el correo
        api_response = api_instance.send_transac_email(send_smtp_email)
        logger.info(f"Correo enviado exitosamente a {email_to}")
        logger.debug(f"Respuesta de Brevo API: {api_response}")

    except ApiException as e:
        logger.error(f"Error de Brevo API al enviar correo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo: {str(e)}")
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error inesperado al enviar el correo: {str(e)}")


async def send_verification_email(email_to: str, token: str) -> None:
    """
    Envía un correo de verificación.

    Args:
        email_to: Dirección de correo del destinatario
        token: Token de verificación
    """
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    template_data = {
        "project_name": settings.PROJECT_NAME,
        "verification_url": verification_url,
        "email": email_to,
    }

    await send_email(
        email_to=email_to,
        subject=f"{settings.PROJECT_NAME} - Verificación de correo electrónico",
        body="",  # No se usa porque usamos template
        template_name="email_verification.html",
        template_body=template_data,
    )


async def send_password_reset_email(email_to: str, token: str) -> None:
    """
    Envía un correo para restablecer la contraseña.

    Args:
        email_to: Dirección de correo del destinatario
        token: Token de restablecimiento
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    template_data = {
        "project_name": settings.PROJECT_NAME,
        "reset_url": reset_url,
        "email": email_to,
    }

    await send_email(
        email_to=email_to,
        subject=f"{settings.PROJECT_NAME} - Restablecer contraseña",
        body="",  # No se usa porque usamos template
        template_name="password_reset.html",
        template_body=template_data,
    )
