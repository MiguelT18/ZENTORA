from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from redis.asyncio import Redis
from app.core.redis import get_redis

security = HTTPBearer()


async def verify_token_not_blacklisted(
    credentials: HTTPAuthorizationCredentials = Depends(security), redis: Redis = Depends(get_redis)
) -> str:
    """
    Verifica que el token de acceso no esté en la lista negra.
    """
    token = credentials.credentials
    is_blacklisted = await redis.get(f"blacklisted_token:{token}")

    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return token
