import random
from datetime import timedelta
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.models.user import User as UserModel

TOKEN_LENGTH = 6
TOKEN_EXPIRY = timedelta(hours=24)  # El token expira en 24 horas
VERIFICATION_WINDOW = timedelta(hours=24)  # Ventana de tiempo para verificar el email


async def generate_verification_token(redis: Redis, email: str) -> str:
    """Genera y almacena un código de verificación numérico de 6 dígitos."""
    # Generar código de 6 dígitos
    token = "".join(str(random.randint(0, 9)) for _ in range(TOKEN_LENGTH))

    # Almacenar el token en Redis con expiración
    await redis.set(f"email_verification:{token}", email, ex=int(TOKEN_EXPIRY.total_seconds()))

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


async def cleanup_expired_unverified_users(db: AsyncSession, redis: Redis) -> int:
    """
    Elimina todos los usuarios no verificados que hayan expirado.
    Retorna el número de usuarios eliminados.
    """
    # Buscar usuarios no verificados
    result = await db.execute(
        select(UserModel).where(UserModel.is_verified == False, UserModel.created_at <= VERIFICATION_WINDOW)
    )
    users = result.scalars().all()

    count = 0
    for user in users:
        # Eliminar el usuario de la base de datos
        await db.execute(delete(UserModel).where(UserModel.email == user.email, UserModel.is_verified == False))

        # Eliminar todos los tokens asociados al email
        pattern = f"email_verification:*"
        async for key in redis.scan_iter(pattern):
            token_email = await redis.get(key)
            if token_email == user.email:
                await redis.delete(key)

        count += 1

    await db.commit()
    return count
