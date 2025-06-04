from typing import AsyncGenerator
from redis.asyncio import Redis, ConnectionPool
from functools import lru_cache
from app.core.config import settings


@lru_cache()
def get_redis_pool() -> ConnectionPool:
    return ConnectionPool.from_url(settings.get_redis_url, decode_responses=True)


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency for getting Redis connection."""
    async with Redis(connection_pool=get_redis_pool()) as redis:
        yield redis
