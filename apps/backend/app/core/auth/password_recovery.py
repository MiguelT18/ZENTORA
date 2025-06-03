import random
from datetime import timedelta
from redis.asyncio import Redis

TOKEN_LENGTH = 6
TOKEN_EXPIRY = timedelta(minutes=15)  # El token expira en 15 minutos


async def generate_password_reset_token(redis: Redis, email: str) -> str:
    """Genera y almacena un código de recuperación de contraseña de 6 dígitos."""
    # Generar código de 6 dígitos
    token = "".join(str(random.randint(0, 9)) for _ in range(TOKEN_LENGTH))

    # Almacenar el token en Redis con expiración
    await redis.set(f"password_reset:{token}", email, ex=int(TOKEN_EXPIRY.total_seconds()))

    return token


async def verify_password_reset_token(redis: Redis, token: str) -> str | None:
    """
    Verifica un token de recuperación de contraseña y retorna el email asociado si es válido.
    Retorna None si el token es inválido o ha expirado.
    """
    email = await redis.get(f"password_reset:{token}")
    if email:
        # No eliminamos el token aquí para permitir la verificación en el endpoint de reset
        return email.decode() if isinstance(email, bytes) else email
    return None


async def invalidate_password_reset_token(redis: Redis, token: str) -> bool:
    """
    Invalida un token de recuperación de contraseña después de su uso.
    Retorna True si el token existía y fue invalidado, False en caso contrario.
    """
    key = f"password_reset:{token}"
    if await redis.exists(key):
        await redis.delete(key)
        return True
    return False
