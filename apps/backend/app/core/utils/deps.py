from fastapi import Depends, HTTPException, status, Request
from redis.asyncio import Redis
from app.core.redis import get_redis


async def get_current_token(
    request: Request,
) -> str:
    token = request.cookies.get("access_token")
    if token:
        return token

    auth_header = request.headers.get("Authorization")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No se proporcionó un token de autenticación válido",
    )


async def verify_token_not_blacklisted(
    token: str = Depends(get_current_token), redis: Redis = Depends(get_redis)
) -> str:
    """
    Verifica que el token de acceso no esté en la lista negra.
    """
    is_blacklisted = await redis.get(f"blacklisted_token:{token}")

    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )

    return token
