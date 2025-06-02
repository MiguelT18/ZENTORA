import secrets
from datetime import timedelta
from redis.asyncio import Redis

TOKEN_LENGTH = 32
TOKEN_EXPIRY = timedelta(hours=24)  # El token expira en 24 horas


async def generate_verification_token(redis: Redis, email: str) -> str:
    """Genera y almacena un token de verificación para un email."""
    token = secrets.token_urlsafe(TOKEN_LENGTH)

    # Almacenar el token en Redis con expiración
    await redis.set(
        f"email_verification:{token}",
        email,
        ex=int(TOKEN_EXPIRY.total_seconds())
    )

    return token


async def verify_email_token(redis: Redis, token: str) -> str | None:
    """
    Verifica un token y retorna el email asociado si es válido.
    Retorna None si el token es inválido o ha expirado.
    """
    email = await redis.get(f"email_verification:{token}")
    if email:
        # Eliminar el token después de usarlo
        await redis.delete(f"email_verification:{token}")
    return email
