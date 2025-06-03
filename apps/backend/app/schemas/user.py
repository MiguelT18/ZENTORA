from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.core.utils.enums import UserRole, UserStatus, AuthProvider


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE
    provider: AuthProvider = AuthProvider.LOCAL
    provider_id: Optional[str] = None
    last_login_at: Optional[datetime] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER
    bio: str | None = None
    avatar_url: str | None = None


class UserUpdate(UserBase):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    password: str


class EmailRequest(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetVerify(BaseModel):
    token: str
    new_password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class DeleteAccount(BaseModel):
    current_password: str = Field(..., min_length=8, description="Contraseña actual del usuario")


class RevokeAllSessions(BaseModel):
    current_password: str = Field(
        ..., min_length=8, description="Contraseña actual del usuario para verificar la identidad"
    )


class ActiveSession(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime
    status: UserStatus


class ActiveSessionsList(BaseModel):
    total: int
    sessions: list[ActiveSession]


class SocialLoginRequest(BaseModel):
    provider: AuthProvider
    access_token: str


class SocialProfile(BaseModel):
    provider_id: str
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None
    provider: AuthProvider


class ReactivateAccount(BaseModel):
    """Esquema para reactivar una cuenta eliminada."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Contraseña del usuario")
