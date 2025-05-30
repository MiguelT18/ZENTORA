import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base, engine

logger = logging.getLogger(__name__)

async def init_db() -> None:
    """Initialize database."""
    try:
        # Create database tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

async def main() -> None:
    """Main function to initialize database."""
    logger.info("Creating initial data")
    await init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    asyncio.run(main())
