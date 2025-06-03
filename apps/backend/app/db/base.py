"""
Database configuration and session management.
All models should be imported here for Alembic to detect them.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings
from app.db.base_class import Base  # noqa: F401
from app.db.models.user import User  # noqa: F401

# Create async engine
engine = create_async_engine(settings.async_database_url, echo=settings.DEBUG, future=True)

# Create async session factory
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)

# Create the base class for models
Base = declarative_base()
