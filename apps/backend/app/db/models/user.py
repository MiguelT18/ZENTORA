import uuid
from datetime import datetime, UTC
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID

from ..base_class import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(
        SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.USER
    )
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )
