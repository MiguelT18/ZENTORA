from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Column, String, DateTime, Enum, Boolean, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.db.base_class import Base
from app.core.utils.enums import UserRole, UserStatus, AuthProvider


class User(Base):
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=True)  # Nullable para login social
    full_name = Column(String)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.USER)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    status = Column(Enum(UserStatus, values_callable=lambda x: [e.value for e in x]), default=UserStatus.INACTIVE)
    provider = Column(Enum(AuthProvider, values_callable=lambda x: [e.value for e in x]), default=AuthProvider.LOCAL)
    provider_id = Column(String, nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
    )
