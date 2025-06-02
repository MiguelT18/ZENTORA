import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pydantic import EmailStr
from app.core.config import settings
import logging
from fastapi import HTTPException

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


async def send_verification_email(email: EmailStr, verification_token: str):
    """
    Envía un correo electrónico con el código de verificación al usuario usando Brevo.
    """
    try:
        # Verificar que las configuraciones necesarias estén presentes
        if not settings.BREVO_API_KEY:
            error_msg = "BREVO_API_KEY no está configurada"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        if not settings.BREVO_SENDER_EMAIL:
            error_msg = "BREVO_SENDER_EMAIL no está configurada"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        logger.debug(
            f"Configuración validada. BREVO_API_KEY: {'*' * 8}, BREVO_SENDER_EMAIL: {settings.BREVO_SENDER_EMAIL}"
        )
        logger.info(f"Iniciando envío de correo de verificación a {email}")

        # Crear el contenido HTML del correo
        html_content = f"""
        <html>
            <body>
                <h1>Bienvenido a {settings.PROJECT_NAME}!</h1>
                <p>Gracias por registrarte. Para verificar tu correo electrónico, usa el siguiente código:</p>
                <h2 style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 24px;">{verification_token}</h2>
                <p>Este código expirará en 24 horas.</p>
                <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
            </body>
        </html>
        """

        # Configurar el mensaje
        sender = {"name": settings.PROJECT_NAME, "email": settings.BREVO_SENDER_EMAIL}
        to = [{"email": email}]
        subject = f"Verifica tu correo electrónico - {settings.PROJECT_NAME}"

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, html_content=html_content, sender=sender, subject=subject)

        logger.debug("Objeto SendSmtpEmail creado correctamente")
        logger.info(f"Configuración del correo completada, intentando enviar a {email}")

        # Enviar el correo
        try:
            response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Correo enviado exitosamente a {email}. Respuesta: {response}")
            return True
        except ApiException as api_e:
            logger.error(f"Error de Brevo API al enviar correo a {email}")
            logger.error(f"Código de estado: {api_e.status}")
            logger.error(f"Razón: {api_e.reason}")
            logger.error(f"Body: {api_e.body}")
            raise HTTPException(status_code=500, detail=f"Error al enviar el correo de verificación: {api_e.reason}")

    except HTTPException as http_e:
        # Re-lanzar excepciones HTTP tal cual
        raise http_e
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo a {email}: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al enviar el correo de verificación")


async def send_password_reset_email(email: EmailStr, reset_token: str):
    """
    Envía un correo electrónico con el token de recuperación de contraseña usando Brevo.
    """
    try:
        # Verificar que las configuraciones necesarias estén presentes
        if not settings.BREVO_API_KEY:
            error_msg = "BREVO_API_KEY no está configurada"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        if not settings.BREVO_SENDER_EMAIL:
            error_msg = "BREVO_SENDER_EMAIL no está configurada"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)

        logger.info(f"Iniciando envío de correo de recuperación de contraseña a {email}")

        # Crear el contenido HTML del correo
        html_content = f"""
        <html>
            <body>
                <h1>Recuperación de Contraseña - {settings.PROJECT_NAME}</h1>
                <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:</p>
                <h2 style="background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 24px;">{reset_token}</h2>
                <p>Este código expirará en 15 minutos.</p>
                <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>
                <p>Por seguridad, si no fuiste tú quien solicitó este cambio, te recomendamos cambiar tu contraseña inmediatamente.</p>
            </body>
        </html>
        """

        # Configurar el mensaje
        sender = {"name": settings.PROJECT_NAME, "email": settings.BREVO_SENDER_EMAIL}
        to = [{"email": email}]
        subject = f"Recuperación de Contraseña - {settings.PROJECT_NAME}"

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, html_content=html_content, sender=sender, subject=subject)

        logger.debug("Objeto SendSmtpEmail creado correctamente")
        logger.info(f"Configuración del correo completada, intentando enviar a {email}")

        # Enviar el correo
        try:
            response = api_instance.send_transac_email(send_smtp_email)
            logger.info(f"Correo de recuperación enviado exitosamente a {email}. Respuesta: {response}")
            return True
        except ApiException as api_e:
            logger.error(f"Error de Brevo API al enviar correo a {email}")
            logger.error(f"Código de estado: {api_e.status}")
            logger.error(f"Razón: {api_e.reason}")
            logger.error(f"Body: {api_e.body}")
            raise HTTPException(status_code=500, detail=f"Error al enviar el correo de recuperación: {api_e.reason}")

    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        logger.error(f"Error inesperado al enviar correo de recuperación a {email}: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al enviar el correo de recuperación")
