from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.db.deps import get_db
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.db.models.user import User as UserModel
from fastapi.responses import JSONResponse
from app.core.redis import get_redis
from app.core.email_verification import (
    generate_verification_token,
    verify_email_token,
    cleanup_expired_unverified_users,
)

router = APIRouter(prefix="/auth")


@router.post("/register")
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    # Verificar si el email ya existe
    result = await db.execute(UserModel.__table__.select().where(UserModel.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

    # Crear el nuevo usuario
    db_user = UserModel(
        email=user_in.email,
        full_name=user_in.full_name,
        password=get_password_hash(user_in.password),
        role=user_in.role,
        bio=user_in.bio,
        avatar_url=user_in.avatar_url,
        is_verified=False,  # El usuario comienza sin verificar
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    # Generar token de verificación
    verification_token = await generate_verification_token(redis, user_in.email)

    success_msg = "Usuario creado exitosamente. Por favor, verifica tu correo."

    # Crear respuesta personalizada
    response_data = {
        "message": success_msg,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role,
            "bio": db_user.bio,
            "avatar_url": db_user.avatar_url,
            "is_verified": db_user.is_verified,
        },
        "verification_token": verification_token,
    }

    return JSONResponse(content=response_data, status_code=201)


@router.post("/verify-email/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    email = await verify_email_token(redis, token)

    if not email:
        raise HTTPException(status_code=400, detail="Token de verificación inválido o expirado")

    # Actualizar el estado de verificación del usuario
    result = await db.execute(
        UserModel.__table__.update().where(UserModel.email == email).values(is_verified=True).returning(UserModel)
    )

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.commit()

    return JSONResponse(
        content={
            "message": "Email verificado exitosamente",
            "user": {"id": user.id, "email": user.email, "is_verified": user.is_verified},
        },
        status_code=200,
    )


@router.delete("/unverified")
async def cleanup_expired_users(db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    """Elimina todos los usuarios no verificados que hayan expirado."""
    count = await cleanup_expired_unverified_users(db, redis)
    return JSONResponse(
        content={"message": f"Se eliminaron {count} usuarios no verificados", "deleted_count": count}, status_code=200
    )
