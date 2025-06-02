from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.db.deps import get_db
from app.core.deps import verify_token_not_blacklisted
from app.schemas.user import UserCreate, EmailRequest, UserLogin
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.db.models.user import User as UserModel
from fastapi.responses import JSONResponse
from app.core.redis import get_redis
from app.core.email_verification import (
    generate_verification_token,
    verify_email_token,
    cleanup_expired_unverified_users,
)
from app.core.email import send_verification_email
from sqlalchemy import select, update
from datetime import datetime, UTC
from uuid import UUID

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

    # Enviar email de verificación
    await send_verification_email(user_in.email, verification_token)

    success_msg = "Usuario creado exitosamente. Por favor, verifica tu correo electrónico."

    # Crear respuesta personalizada
    response_data = {
        "message": success_msg,
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role,
            "bio": db_user.bio,
            "avatar_url": db_user.avatar_url,
            "is_verified": db_user.is_verified,
        },
    }

    return JSONResponse(content=response_data, status_code=201)


@router.post("/verify-email/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    email = await verify_email_token(redis, token)

    if not email:
        raise HTTPException(status_code=400, detail="Token de verificación inválido o expirado")

    # Actualizar el estado de verificación del usuario
    stmt = update(UserModel).where(UserModel.email == email).values(is_verified=True)
    await db.execute(stmt)

    # Obtener el usuario actualizado
    stmt = select(UserModel).where(UserModel.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.commit()

    return JSONResponse(
        content={
            "message": "Email verificado exitosamente",
            "user": {"id": str(user.id), "email": user.email, "is_verified": user.is_verified},
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


@router.post("/resend-verification")
async def resend_verification_email(
    email_request: EmailRequest, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)
):
    """Reenvía el email de verificación para un usuario no verificado."""
    # Verificar si el usuario existe y no está verificado
    result = await db.execute(
        select(UserModel).where(
            UserModel.email == email_request.email,
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No se encontró un usuario con este correo electrónico")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Este usuario ya está verificado")

    # Generar nuevo token de verificación
    verification_token = await generate_verification_token(redis, email_request.email)

    # Enviar nuevo email de verificación
    await send_verification_email(email_request.email, verification_token)

    return JSONResponse(
        content={"message": "Se ha enviado un nuevo correo de verificación", "email": email_request.email},
        status_code=200,
    )


@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    """Endpoint para iniciar sesión y obtener tokens de acceso."""
    # Buscar usuario por email
    result = await db.execute(select(UserModel).where(UserModel.email == user_in.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    if not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Por favor, verifica tu correo electrónico antes de iniciar sesión")

    # Actualizar estado is_active
    await db.execute(update(UserModel).where(UserModel.id == user.id).values(is_active=True))
    await db.commit()

    # Crear tokens
    access_token_data = {"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"}
    refresh_token_data = {"sub": str(user.id), "type": "refresh"}

    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(refresh_token_data)

    # Crear hash con información del usuario y refresh token
    user_refresh_data = {
        "refresh_token": refresh_token,
        "user_id": str(user.id),
        "email": str(user.email),
        "full_name": str(user.full_name),
        "role": str(user.role),
        "is_active": "true",
        "created_at": datetime.now(UTC).isoformat(),
    }

    # Almacenar hash en Redis
    redis_key = f"refresh_token:{user.id}"
    await redis.hset(redis_key, mapping=user_refresh_data)

    # Establecer tiempo de expiración para todo el hash
    await redis.expire(redis_key, 7 * 24 * 60 * 60)  # 7 días en segundos

    return JSONResponse(
        content={
            "message": "Inicio de sesión exitoso",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_verified": user.is_verified,
                "is_active": True,
            },
        },
        status_code=200,
    )


@router.post("/logout/{user_id}")
async def logout(
    user_id: UUID,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para cerrar sesión."""
    # Actualizar estado is_active
    result = await db.execute(
        update(UserModel).where(UserModel.id == user_id).values(is_active=False).returning(UserModel)
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    await db.commit()

    # Eliminar refresh token de Redis
    redis_key = f"refresh_token:{user_id}"
    await redis.delete(redis_key)

    # Añadir el token actual a la lista negra
    await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

    return JSONResponse(content={"message": "Sesión cerrada exitosamente"}, status_code=200)
