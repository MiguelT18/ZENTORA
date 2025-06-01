from typing import AsyncGenerator

from redis.asyncio import Redis, from_url

from app.core.config import settings

async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency for getting Redis connection."""
    redis = from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True
    )
    try:
        yield redis
    finally:
        await redis.close()
