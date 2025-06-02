from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.email_verification import cleanup_expired_unverified_users
from app.db.deps import get_db
from app.core.redis import get_redis

scheduler = AsyncIOScheduler()


async def cleanup_users_job():
    """Tarea programada para limpiar usuarios no verificados."""
    # Obtener conexiones de DB y Redis
    async for db in get_db():
        async for redis in get_redis():
            try:
                count = await cleanup_expired_unverified_users(db, redis)
                print(f"Tarea programada: Se eliminaron {count} usuarios no verificados")
            except Exception as e:
                print(f"Error en tarea programada de limpieza: {e}")
            finally:
                await db.close()
                await redis.close()


def init_scheduler(app: FastAPI):
    """Inicializa el scheduler y añade las tareas programadas."""

    # Añadir tarea de limpieza para ejecutar cada día a las 00:00
    scheduler.add_job(
        cleanup_users_job, CronTrigger(hour=0, minute=0), id="cleanup_unverified_users", replace_existing=True
    )

    # Eventos de inicio y apagado
    @app.on_event("startup")
    async def start_scheduler():
        scheduler.start()

    @app.on_event("shutdown")
    async def stop_scheduler():
        scheduler.shutdown()
