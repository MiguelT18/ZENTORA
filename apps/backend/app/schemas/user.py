from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.db.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "user"
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
