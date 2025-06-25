from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.db.deps import get_db
from app.core.utils.deps import verify_token_not_blacklisted
from app.core.auth.social_auth import verify_social_token
from app.core.auth.temp_auth import generate_temporary_auth_code, get_temp_auth_data
from app.schemas.user import (
    UserCreate,
    EmailRequest,
    UserLogin,
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordChange,
    DeleteAccount,
    RevokeAllSessions,
    ActiveSessionsList,
    ActiveSession,
    SocialLoginRequest,
    UserStatus,
    AuthProvider,
    UserRole,
    ReactivateAccount,
    UserProfileUpdate,
)
from app.core.auth.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiration,
)
from app.db.models.user import User as UserModel
from fastapi.responses import JSONResponse, RedirectResponse
from app.core.redis import get_redis
from app.core.email.email_verification import (
    generate_verification_token,
    verify_email_token,
    cleanup_expired_unverified_users,
)
from app.core.email.email import send_verification_email, send_password_reset_email
from app.core.auth.password_recovery import (
    generate_password_reset_token,
    verify_password_reset_token,
    invalidate_password_reset_token,
)
from sqlalchemy import select, update
from datetime import datetime, UTC, timedelta
from uuid import UUID
import logging
import httpx
from app.core.config.config import settings
from secrets import token_urlsafe
from pydantic import BaseModel

router = APIRouter(prefix="/auth")

logger = logging.getLogger(__name__)


class ExchangeCodeRequest(BaseModel):
    """Modelo para intercambiar el código temporal por tokens."""

    temp_code: str


@router.post("/register", status_code=201)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    """Endpoint para registrar un nuevo usuario."""
    logger.info(f"Iniciando proceso de registro para {user_in.email}")

    try:
        # 1. Verificar si el email ya existe
        logger.debug(f"Verificando si el email {user_in.email} ya existe")
        result = await db.execute(UserModel.__table__.select().where(UserModel.email == user_in.email))
        if result.scalar_one_or_none():
            logger.warning(f"Intento de registro con email existente: {user_in.email}")
            raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")

        # 2. Generar token de verificación
        logger.debug("Generando token de verificación")
        verification_token = await generate_verification_token(redis, user_in.email)
        logger.info(f"Token de verificación generado para {user_in.email}")

        # 3. Crear el usuario primero
        logger.debug("Creando usuario en la base de datos")
        try:
            db_user = UserModel(
                email=user_in.email,
                full_name=user_in.full_name,
                password=get_password_hash(user_in.password),
                role=user_in.role,
                bio=user_in.bio,
                avatar_url=user_in.avatar_url,
                is_verified=False,
                status=UserStatus.INACTIVE,
                provider=AuthProvider.LOCAL,
            )

            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
            logger.info(f"Usuario creado exitosamente: {db_user.id}")

        except Exception as db_error:
            logger.error(f"Error al crear usuario en la base de datos: {str(db_error)}")
            await redis.delete(f"email_verification:{verification_token}")
            raise HTTPException(
                status_code=500, detail=f"Error al crear el usuario en la base de datos: {str(db_error)}"
            )

        # 4. Intentar enviar el correo después de crear el usuario
        logger.debug(f"Intentando enviar correo de verificación a {user_in.email}")
        email_sent = False
        try:
            await send_verification_email(user_in.email, verification_token, db)
            email_sent = True
            logger.info(f"Correo de verificación enviado exitosamente a {user_in.email}")
        except Exception as e:
            logger.error(f"Error al enviar correo de verificación: {str(e)}")
            # No eliminamos el usuario creado, solo el token
            await redis.delete(f"email_verification:{verification_token}")
            raise HTTPException(status_code=500, detail=f"Error al enviar el correo de verificación: {str(e)}")

        if not email_sent:
            logger.error("El correo no se envió pero no se detectó ninguna excepción")
            await redis.delete(f"email_verification:{verification_token}")
            raise HTTPException(status_code=500, detail="No se pudo enviar el correo de verificación")

        return {
            "message": "Usuario creado exitosamente. Por favor, verifica tu correo electrónico.",
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "full_name": db_user.full_name,
                "role": db_user.role,
                "bio": db_user.bio,
                "avatar_url": db_user.avatar_url,
                "is_verified": db_user.is_verified,
                "status": db_user.status,
                "provider": db_user.provider,
            },
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado durante el registro: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado durante el proceso de registro: {str(e)}")


@router.post("/verify-email/{token}", status_code=200)
async def verify_email(
    token: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    email = await verify_email_token(redis, token)

    if not email:
        raise HTTPException(status_code=400, detail="Token de verificación inválido o expirado")

    # Actualizar el estado de verificación del usuario
    stmt = (
        update(UserModel)
        .where(UserModel.email == email)
        .values(is_verified=True, status=UserStatus.ACTIVE, updated_at=datetime.now(UTC))
    )
    await db.execute(stmt)
    await db.commit()

    # Obtener el usuario actualizado
    result = await db.execute(select(UserModel).where(UserModel.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Generar tokens de sesión
    access_token_data = {"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"}
    refresh_token_data = {"sub": str(user.id), "type": "refresh"}

    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(refresh_token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(key="is_logged_in", value="true", max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS, path="/")

    # Almacenar información del refresh token en Redis
    user_refresh_data = {
        "refresh_token": refresh_token,
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": str(user.role),
        "status": user.status,
        "created_at": datetime.now(UTC).isoformat(),
    }

    redis_key = f"refresh_token:{user.id}"
    await redis.hset(redis_key, mapping=user_refresh_data)
    await redis.expire(redis_key, settings.REFRESH_TOKEN_EXPIRE_SECONDS)

    response_data = {
        "message": "Email verificado exitosamente",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_verified": user.is_verified,
            "status": user.status,
        },
    }

    return response_data


@router.delete("/unverified", status_code=200)
async def cleanup_expired_users(db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)):
    """Elimina todos los usuarios no verificados que hayan expirado."""
    count = await cleanup_expired_unverified_users(db, redis)
    return {"message": f"Se eliminaron {count} usuarios no verificados", "deleted_count": count}


@router.post("/resend-verification", status_code=200)
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
    await send_verification_email(email_request.email, verification_token, db)

    return {"message": "Se ha enviado un nuevo correo de verificación", "email": email_request.email}


@router.post("/login", status_code=200)
async def login(
    response: Response, user_in: UserLogin, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)
):
    """Endpoint para iniciar sesión y obtener tokens de acceso."""
    # Buscar usuario por email
    result = await db.execute(select(UserModel).where(UserModel.email == user_in.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    # Verificar si el usuario se registró con un proveedor social
    if user.provider != AuthProvider.LOCAL:
        raise HTTPException(
            status_code=400,
            detail=f"Esta cuenta fue registrada usando {user.provider}. Por favor, use ese método para iniciar sesión",
        )

    if not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Por favor, verifica tu correo electrónico antes de iniciar sesión")

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Esta cuenta está suspendida")
    elif user.status == UserStatus.DELETED:
        raise HTTPException(status_code=403, detail="Esta cuenta ha sido eliminada")

    # Actualizar estado y última fecha de login
    await db.execute(
        update(UserModel)
        .where(UserModel.id == user.id)
        .values(status=UserStatus.ACTIVE, last_login_at=datetime.now(UTC))
    )
    await db.commit()

    # Crear tokens
    access_token_data = {"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"}
    refresh_token_data = {"sub": str(user.id), "type": "refresh"}

    access_token = create_access_token(access_token_data)
    refresh_token = create_refresh_token(refresh_token_data)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(key="is_logged_in", value="true", max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS, path="/")

    # Crear hash con información del usuario y refresh token
    user_refresh_data = {
        "refresh_token": refresh_token,
        "user_id": str(user.id),
        "email": str(user.email),
        "full_name": str(user.full_name),
        "role": str(user.role),
        "status": user.status,
        "created_at": datetime.now(UTC).isoformat(),
    }

    # Almacenar hash en Redis
    redis_key = f"refresh_token:{user.id}"
    await redis.hset(redis_key, mapping=user_refresh_data)
    await redis.expire(redis_key, settings.REFRESH_TOKEN_EXPIRE_SECONDS)

    return {
        "message": "Inicio de sesión exitoso",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_verified": user.is_verified,
            "status": user.status,
            "provider": user.provider,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        },
    }


@router.post("/logout")
async def logout(
    response: Response,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para cerrar sesión."""
    # Decodificar el token para obtener el ID del usuario
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Token inválido o mal formado")

    user_id = payload["sub"]

    # Actualizar estado is_active
    result = await db.execute(
        update(UserModel).where(UserModel.id == user_id).values(status=UserStatus.INACTIVE).returning(UserModel)
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

    # Eliminar la cookie del refresh token
    response.delete_cookie(key="refresh_token", path="/auth/refresh", secure=True, httponly=True)
    response.delete_cookie(key="is_logged_in", path="/")

    return {"message": "Sesión cerrada exitosamente"}


@router.post("/refresh", status_code=201)
async def refresh_token(
    request: Request,
    response: Response,
    token: str = Depends(verify_token_not_blacklisted),
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint para renovar los tokens de acceso usando el refresh token."""
    # Obtener el refresh token de la cookie
    refresh_token = request.cookies.get("refresh_token")

    # Usar el token de la cookie si está disponible, sino usar el token del header
    token_to_use = refresh_token or token

    if not token_to_use:
        raise HTTPException(status_code=400, detail="No se proporcionó token de refresco")

    # Decodificar el token
    payload = decode_token(token_to_use)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Token de refresco inválido")

    # Verificar expiración
    expiration = get_token_expiration(token_to_use)
    if not expiration:
        raise HTTPException(status_code=400, detail="Token de refresco inválido o mal formado")

    if expiration <= datetime.now(UTC):
        raise HTTPException(
            status_code=401, detail="El token de refresco ha expirado. Por favor, inicie sesión nuevamente."
        )

    # Calcular tiempo restante hasta expiración
    time_until_expiry = expiration - datetime.now(UTC)
    warning_threshold = timedelta(days=1)  # Advertir cuando quede 1 día o menos

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Token de refresco inválido")

    # Verificar si el refresh token existe en Redis
    redis_key = f"refresh_token:{user_id}"
    stored_token = await redis.hget(redis_key, "refresh_token")

    if not stored_token or stored_token != token_to_use:
        raise HTTPException(status_code=400, detail="Token de refresco inválido o expirado")

    # Obtener información del usuario de Redis
    user_data = await redis.hgetall(redis_key)
    if not user_data:
        raise HTTPException(status_code=400, detail="Información de sesión no encontrada")

    # Crear nuevos tokens
    access_token_data = {
        "sub": user_data["user_id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "type": "access",
    }
    refresh_token_data = {"sub": user_data["user_id"], "type": "refresh"}

    new_access_token = create_access_token(access_token_data)
    new_refresh_token = create_refresh_token(refresh_token_data)

    # Actualizar el refresh token en Redis
    user_refresh_data = {
        "refresh_token": new_refresh_token,
        "user_id": user_data["user_id"],
        "email": user_data["email"],
        "full_name": user_data["full_name"],
        "role": user_data["role"],
        "status": user_data["status"],
        "created_at": datetime.now(UTC).isoformat(),
    }

    # Almacenar nuevo hash en Redis
    await redis.delete(redis_key)  # Eliminar el hash anterior
    await redis.hset(redis_key, mapping=user_refresh_data)
    await redis.expire(redis_key, settings.REFRESH_TOKEN_EXPIRE_SECONDS)

    # Actualizar la cookie con el nuevo refresh token
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    # Actualizar la cookie con el nuevo access token
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False if settings.ENVIRONMENT == "development" else True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
        path="/",
    )

    response.set_cookie(key="is_logged_in", value="true", max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS, path="/")

    # Añadir el token anterior a la lista negra
    await redis.set(f"blacklisted_token:{token_to_use}", "true", ex=3600)

    response_data = {
        "message": "Tokens renovados exitosamente",
        "user": {
            "id": user_data["user_id"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "status": user_data["status"],
        },
    }

    # Añadir advertencia si el token está próximo a expirar
    if time_until_expiry <= warning_threshold:
        response_data["warning"] = (
            f"Su sesión expirará en {time_until_expiry.days} días y {time_until_expiry.seconds // 3600} horas. Considere iniciar sesión nuevamente."
        )

    return response_data


@router.get("/me", status_code=200)
async def get_current_user(token: str = Depends(verify_token_not_blacklisted), db: AsyncSession = Depends(get_db)):
    """Endpoint para obtener información del usuario autenticado."""
    try:
        # Decodificar el token para obtener el ID del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        user_id = payload["sub"]

        # Buscar el usuario en la base de datos
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
                "status": user.status,
                "provider": user.provider,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            }
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al obtener información del usuario: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado al obtener información del usuario: {str(e)}")


@router.post("/forgot-password", status_code=200)
async def forgot_password(
    reset_request: PasswordResetRequest, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)
):
    """Endpoint para solicitar un token de recuperación de contraseña."""
    try:
        # Verificar si el usuario existe
        result = await db.execute(select(UserModel).where(UserModel.email == reset_request.email))
        user = result.scalar_one_or_none()

        if not user:
            # Por seguridad, no revelamos si el email existe o no
            return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}

        # Verificar si el usuario se registró con un proveedor social
        if user.provider != AuthProvider.LOCAL:
            # Por seguridad, devolvemos el mismo mensaje pero logueamos el intento
            logger.warning(
                f"Intento de recuperación de contraseña para cuenta social: {user.email} (provider: {user.provider})"
            )
            return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}

        if not user.is_verified:
            raise HTTPException(
                status_code=400,
                detail="La cuenta no está verificada. Por favor, verifica tu correo electrónico primero",
            )

        # Generar token de recuperación
        reset_token = await generate_password_reset_token(redis, reset_request.email)

        # Enviar correo con el token
        await send_password_reset_email(reset_request.email, reset_token, db)

        return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado en recuperación de contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        # Por seguridad, no revelamos detalles del error
        return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"}


@router.put("/reset-password", status_code=200)
async def reset_password(
    reset_data: PasswordResetVerify, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)
):
    """Endpoint para restablecer la contraseña usando el token de verificación."""
    try:
        # Verificar el token y obtener el email asociado
        email = await verify_password_reset_token(redis, reset_data.token)
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Token inválido o expirado. Por favor, solicita un nuevo código de recuperación.",
            )

        # Buscar el usuario por email
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # Invalidar el token si el usuario no existe
            await invalidate_password_reset_token(redis, reset_data.token)
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Verificar si el usuario se registró con un proveedor social
        if user.provider != AuthProvider.LOCAL:
            await invalidate_password_reset_token(redis, reset_data.token)
            raise HTTPException(
                status_code=400,
                detail=f"No se puede restablecer la contraseña para cuentas registradas con {user.provider}",
            )

        # Actualizar la contraseña
        hashed_password = get_password_hash(reset_data.new_password)
        await db.execute(
            update(UserModel)
            .where(UserModel.email == email)
            .values(password=hashed_password, updated_at=datetime.now(UTC))
        )
        await db.commit()

        # Invalidar el token después de usarlo
        await invalidate_password_reset_token(redis, reset_data.token)

        # Invalidar todas las sesiones activas del usuario por seguridad
        redis_key = f"refresh_token:{user.id}"
        await redis.delete(redis_key)

        return {"message": "Contraseña actualizada exitosamente. Por favor, inicia sesión con tu nueva contraseña."}

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al restablecer la contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al restablecer la contraseña")


@router.post("/resend-password-verification", status_code=200)
async def resend_reset_password(
    reset_request: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para reenviar el token de recuperación de contraseña."""
    try:
        # Verificar si el usuario existe
        result = await db.execute(select(UserModel).where(UserModel.email == reset_request.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Generar token de recuperación
        reset_token = await generate_password_reset_token(redis, reset_request.email)

        # Enviar correo con el token
        await send_password_reset_email(reset_request.email, reset_token, db)

        return {"message": "Se ha enviado un nuevo token de recuperación de contraseña"}
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado en reenvío de token de recuperación de contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500, detail="Error inesperado en reenvío de token de recuperación de contraseña"
        )


@router.patch("/change-password", status_code=200)
async def change_password(
    response: Response,
    password_data: PasswordChange,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para cambiar la contraseña del usuario autenticado."""
    try:
        # Decodificar el token para obtener el ID del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        user_id = payload["sub"]

        # Buscar el usuario en la base de datos
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Verificar si el usuario se registró con un proveedor social
        if user.provider != AuthProvider.LOCAL:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede cambiar la contraseña para cuentas registradas con {user.provider}",
            )

        # Verificar la contraseña actual
        if not verify_password(password_data.current_password, user.password):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

        # Verificar que la nueva contraseña sea diferente de la actual
        if verify_password(password_data.new_password, user.password):
            raise HTTPException(status_code=400, detail="La nueva contraseña debe ser diferente de la actual")

        # Actualizar la contraseña
        hashed_password = get_password_hash(password_data.new_password)
        await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(
                password=hashed_password,
                status=UserStatus.INACTIVE,
                updated_at=datetime.now(UTC),
            )
        )
        await db.commit()

        # Invalidar todas las sesiones activas del usuario por seguridad
        redis_key = f"refresh_token:{user_id}"
        await redis.delete(redis_key)

        # Añadir el token actual a la lista negra
        await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

        response.delete_cookie(key="is_logged_in", path="/")

        return {
            "message": "Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña."
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al cambiar la contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al cambiar la contraseña")


@router.delete("/delete-account", status_code=200)
async def delete_account(
    response: Response,
    delete_data: DeleteAccount,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para eliminar permanentemente la cuenta del usuario."""
    try:
        # Decodificar el token para obtener el ID del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        user_id = payload["sub"]

        # Buscar el usuario en la base de datos
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Verificar la contraseña actual
        if not verify_password(delete_data.current_password, user.password):
            raise HTTPException(status_code=400, detail="La contraseña es incorrecta")

        # Marcar la cuenta como eliminada en lugar de eliminarla físicamente
        await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(status=UserStatus.DELETED, updated_at=datetime.now(UTC))
        )
        await db.commit()

        # Eliminar todas las sesiones del usuario en Redis
        redis_key = f"refresh_token:{user_id}"
        await redis.delete(redis_key)

        # Añadir el token actual a la lista negra
        await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

        response.delete_cookie(key="is_logged_in", path="/")

        return {"message": "Cuenta eliminada exitosamente"}

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al eliminar la cuenta: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al eliminar la cuenta")


@router.delete("/revoke", status_code=200)
async def revoke_all_sessions(
    response: Response,
    revoke_data: RevokeAllSessions,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para revocar todas las sesiones activas del usuario."""
    try:
        # Decodificar el token para obtener el ID del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        user_id = payload["sub"]

        # Buscar el usuario en la base de datos
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Verificar la contraseña actual
        if not verify_password(revoke_data.current_password, user.password):
            raise HTTPException(status_code=400, detail="La contraseña es incorrecta")

        # Marcar al usuario como inactivo
        await db.execute(
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(status=UserStatus.INACTIVE, updated_at=datetime.now(UTC))
        )
        await db.commit()

        # Eliminar todas las sesiones del usuario en Redis
        redis_key = f"refresh_token:{user_id}"
        await redis.delete(redis_key)

        # Añadir el token actual a la lista negra
        await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

        response.delete_cookie(key="is_logged_in", path="/")

        return {"message": "Todas las sesiones han sido revocadas exitosamente. Por favor, inicia sesión nuevamente."}

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al revocar sesiones: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al revocar las sesiones")


@router.get("/sessions", response_model=ActiveSessionsList)
async def list_active_sessions(
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para listar todas las sesiones activas. Solo accesible para administradores."""
    try:
        # Decodificar el token para obtener el ID y rol del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload or "role" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        # Verificar que el usuario sea administrador
        if payload["role"].lower() != "admin":
            raise HTTPException(
                status_code=403,
                detail="No tienes permisos suficientes para acceder a esta información",
            )

        # Obtener todas las claves de refresh tokens
        refresh_keys = []
        async for key in redis.scan_iter("refresh_token:*"):
            refresh_keys.append(key)

        active_sessions = []
        # Procesar cada sesión activa
        for key in refresh_keys:
            session_data = await redis.hgetall(key)
            if session_data:
                try:
                    created_at = datetime.fromisoformat(session_data.get("created_at", ""))
                    # Crear una instancia de ActiveSession usando el modelo Pydantic
                    session = ActiveSession(
                        user_id=UUID(session_data.get("user_id", "")),
                        email=session_data.get("email", ""),
                        full_name=session_data.get("full_name", ""),
                        role=session_data.get("role", ""),
                        created_at=created_at,
                        is_active=session_data.get("is_active", "false").lower() == "true",
                    )
                    active_sessions.append(session)
                except (ValueError, TypeError) as e:
                    logger.error(f"Error al procesar sesión {key}: {str(e)}")
                    continue

        # Ordenar las sesiones por fecha de creación (más recientes primero)
        active_sessions.sort(key=lambda x: x.created_at, reverse=True)

        # Crear la respuesta usando el modelo Pydantic
        response = ActiveSessionsList(total=len(active_sessions), sessions=active_sessions)

        # FastAPI automáticamente serializará el modelo Pydantic a JSON
        return response

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al listar sesiones activas: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al listar las sesiones activas")


@router.post("/reactivate")
async def reactivate_account(
    response: Response,
    reactivate_data: ReactivateAccount,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para reactivar una cuenta que fue eliminada."""
    try:
        # Buscar el usuario por email
        result = await db.execute(select(UserModel).where(UserModel.email == reactivate_data.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="No se encontró ninguna cuenta con este correo electrónico")

        if user.status != UserStatus.DELETED:
            raise HTTPException(status_code=400, detail="Esta cuenta no está eliminada")

        # Verificar la contraseña
        if not verify_password(reactivate_data.password, user.password):
            raise HTTPException(status_code=400, detail="La contraseña es incorrecta")

        # Reactivar la cuenta
        await db.execute(
            update(UserModel)
            .where(UserModel.id == user.id)
            .values(status=UserStatus.ACTIVE, updated_at=datetime.now(UTC), last_login_at=datetime.now(UTC))
        )
        await db.commit()
        await db.refresh(user)

        # Crear tokens para el inicio de sesión automático
        access_token_data = {"sub": str(user.id), "email": user.email, "role": user.role, "type": "access"}
        refresh_token_data = {"sub": str(user.id), "type": "refresh"}

        access_token = create_access_token(access_token_data)
        refresh_token = create_refresh_token(refresh_token_data)

        # Almacenar información en Redis
        user_refresh_data = {
            "refresh_token": refresh_token,
            "user_id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": str(user.role),
            "status": user.status,
            "created_at": datetime.now(UTC).isoformat(),
        }

        redis_key = f"refresh_token:{user.id}"
        await redis.hset(redis_key, mapping=user_refresh_data)
        await redis.expire(redis_key, 7 * 24 * 60 * 60)  # 7 días

        response.set_cookie(key="is_logged_in", value="true", max_age=7 * 24 * 60 * 60, path="/")

        return {
            "message": "Cuenta reactivada exitosamente",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "is_verified": user.is_verified,
                "status": user.status,
                "provider": user.provider,
                "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            },
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al reactivar la cuenta: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado al reactivar la cuenta: {str(e)}")


@router.get("/github/login")
async def github_login():
    """Endpoint para iniciar el flujo de autenticación con GitHub."""
    try:
        logger.info("Generando URL de autorización de GitHub")

        if not settings.GITHUB_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client ID de GitHub no configurado",
            )

        # Agregar un parámetro state para seguridad
        state = token_urlsafe(32)

        github_auth_url = (
            "https://github.com/login/oauth/authorize"
            f"?client_id={settings.GITHUB_CLIENT_ID}"
            f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
            f"&scope=user:email"
            f"&state={state}"
        )

        logger.debug(f"URL de autorización generada: {github_auth_url}")
        logger.debug(f"Client ID usado: {settings.GITHUB_CLIENT_ID}")
        logger.debug(f"Redirect URI configurado: {settings.GITHUB_REDIRECT_URI}")

        return {
            "authorization_url": github_auth_url,
            "state": state,
        }
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al generar URL de autorización: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al generar URL de autorización",
        )


@router.post("/exchange-temp-code")
async def exchange_temp_code(
    request: ExchangeCodeRequest,
    response: Response,
    redis: Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint para intercambiar el código temporal por los tokens de acceso."""
    try:
        logger.debug(f"Recibido código temporal para intercambio: {request.temp_code}")

        # Verificar que el código no esté vacío
        if not request.temp_code:
            raise HTTPException(status_code=400, detail="El código temporal no puede estar vacío")

        # Recuperar datos temporales
        auth_data = await get_temp_auth_data(redis, request.temp_code)

        if not auth_data:
            # Verificar si el código existe en Redis (para mejor debugging)
            redis_key = f"temp_auth:{request.temp_code}"
            exists = await redis.exists(redis_key)
            logger.error(f"Verificación adicional - ¿La clave existe?: {exists}")

            if exists:
                all_keys = await redis.hkeys(redis_key)
                logger.error(f"Las claves disponibles en el hash son: {all_keys}")
                raise HTTPException(status_code=500, detail="Error al recuperar los datos temporales")
            else:
                logger.error(f"Código temporal no encontrado: {request.temp_code}")
                raise HTTPException(
                    status_code=400,
                    detail="Código temporal inválido o expirado. Asegúrate de usar el código exacto sin el prefijo 'temp_auth:'",
                )

        logger.debug(f"Datos temporales recuperados exitosamente: {auth_data}")

        try:
            # Actualizar estado del usuario a activo
            logger.debug(f"Actualizando estado del usuario {auth_data['user_id']} a ACTIVE")
            result = await db.execute(
                update(UserModel)
                .where(UserModel.id == UUID(auth_data["user_id"]))
                .values(status=UserStatus.ACTIVE, updated_at=datetime.now(UTC))
                .returning(UserModel)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"No se encontró el usuario con ID {auth_data['user_id']}")
                raise HTTPException(status_code=404, detail="Usuario no encontrado")

            await db.commit()
            logger.debug(f"Estado del usuario actualizado exitosamente a {user.status}")

        except Exception as e:
            logger.error(f"Error al actualizar el estado del usuario: {str(e)}")
            await db.rollback()
            raise HTTPException(status_code=500, detail="Error al actualizar el estado del usuario")

        # Almacenar información del refresh token en Redis
        user_refresh_data = {
            "refresh_token": auth_data["jwt_refresh_token"],
            "user_id": auth_data["user_id"],
            "email": auth_data["email"],
            "full_name": auth_data["full_name"],
            "role": auth_data["role"],
            "status": UserStatus.ACTIVE.value,  # Usar el valor del enum
            "created_at": datetime.now(UTC).isoformat(),
        }

        redis_key = f"refresh_token:{auth_data['user_id']}"
        await redis.hset(redis_key, mapping=user_refresh_data)
        await redis.expire(redis_key, 7 * 24 * 60 * 60)  # 7 días

        # Configurar cookie del refresh token
        response.set_cookie(
            key="refresh_token",
            value=auth_data["jwt_refresh_token"],
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,  # 7 días
            path="/auth/refresh",
        )

        response.set_cookie(key="is_logged_in", value="true", max_age=7 * 24 * 60 * 60, path="/")

        # Devolver respuesta con tokens y datos del usuario actualizados
        return {
            "message": "Inicio de sesión exitoso",
            "user": {
                "id": auth_data["user_id"],
                "email": auth_data["email"],
                "full_name": auth_data["full_name"],
                "avatar_url": auth_data.get("avatar_url", ""),
                "provider": auth_data["provider"],
                "role": auth_data["role"],
                "status": UserStatus.ACTIVE.value,  # Usar el valor actualizado
            },
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error al intercambiar código temporal: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado al procesar el código temporal: {str(e)}",
        )


@router.get("/github/callback")
async def github_callback(
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Endpoint para manejar el callback de GitHub y obtener el token de acceso."""
    try:
        if not settings.GITHUB_CLIENT_ID:
            logger.error("Client ID no configurado")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client ID de GitHub no configurado",
            )

        if not settings.GITHUB_CLIENT_SECRET:
            logger.error("Client Secret no configurado")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client Secret de GitHub no configurado",
            )

        logger.info(f"Iniciando intercambio de código por token de acceso. Code length: {len(code)}")
        logger.debug(f"Código recibido: {code}")
        logger.debug(f"State recibido: {state}")
        logger.debug(f"URL configurada: {settings.GITHUB_REDIRECT_URI}")
        logger.debug(f"URL actual de la petición: {request.url}")
        logger.debug(f"Client ID configurado: {settings.GITHUB_CLIENT_ID}")

        # Intercambiar el código por un token de acceso
        async with httpx.AsyncClient() as client:
            request_data = {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            }

            # Log seguro (ocultando el client secret)
            safe_log_data = request_data.copy()
            safe_log_data["client_secret"] = "***" + settings.GITHUB_CLIENT_SECRET[-4:]
            logger.debug(f"Datos de la petición a GitHub: {safe_log_data}")

            github_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={
                    "Accept": "application/json",
                },
                data=request_data,
                timeout=30.0,
            )

            logger.debug(f"Respuesta de GitHub - Status: {github_response.status_code}")
            logger.debug(f"Respuesta de GitHub - Headers: {github_response.headers}")
            logger.debug(f"Respuesta de GitHub - Body: {github_response.text}")

            if github_response.status_code != 200:
                logger.error(f"Error en la respuesta de GitHub: {github_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error al obtener el token de acceso de GitHub. Status: {github_response.status_code}, Response: {github_response.text}",
                )

            try:
                token_data = github_response.json()
            except Exception as e:
                logger.error(f"Error al parsear la respuesta JSON: {github_response.text}")
                logger.exception("Error detallado:")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al procesar la respuesta de GitHub: {str(e)}",
                )

            if "error" in token_data:
                logger.error(f"Error en token_data: {token_data}")
                error_message = token_data.get("error_description", token_data["error"])
                if "incorrect or expired" in error_message:
                    error_message += ". Por favor, inicia el proceso de autorización nuevamente desde /github/login"
                raise HTTPException(
                    status_code=400,
                    detail=f"Error de GitHub: {error_message}",
                )

            access_token = token_data.get("access_token")
            if not access_token:
                logger.error("No se encontró access_token en la respuesta")
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo obtener el token de acceso",
                )

            # Usar el flujo de social_login para crear/actualizar el usuario
            social_login_data = SocialLoginRequest(provider=AuthProvider.GITHUB, access_token=access_token)

            # Obtener información del perfil de GitHub
            social_profile = await verify_social_token(social_login_data.provider, social_login_data.access_token)

            if not social_profile.email:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo obtener un email verificado del proveedor social",
                )

            # Buscar si el usuario ya existe
            result = await db.execute(select(UserModel).where(UserModel.email == social_profile.email))
            user = result.scalar_one_or_none()

            if not user:
                # Crear nuevo usuario
                user = UserModel(
                    email=social_profile.email,
                    full_name=social_profile.full_name or "",
                    password="",  # No se requiere contraseña para login social
                    role=UserRole.USER,
                    avatar_url=social_profile.avatar_url,
                    is_verified=True,  # Los usuarios de login social se consideran verificados
                    status=UserStatus.INACTIVE,  # Inicialmente inactivo hasta completar el exchange
                    provider=social_login_data.provider,
                    provider_id=social_profile.provider_id,
                    last_login_at=datetime.now(UTC),
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            else:
                # Verificar si el usuario ya está registrado con otro proveedor social
                if user.provider != social_login_data.provider:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Este correo electrónico ya está registrado usando {user.provider}. Por favor, inicie sesión con ese método.",
                    )

                # Actualizar información del usuario si es necesario
                update_data = {
                    "last_login_at": datetime.now(UTC),
                    "status": UserStatus.INACTIVE,  # Establecer como inactivo hasta completar el exchange
                }

                if social_profile.avatar_url and not user.avatar_url:
                    update_data["avatar_url"] = social_profile.avatar_url
                if social_profile.full_name and not user.full_name:
                    update_data["full_name"] = social_profile.full_name
                if not user.provider_id:
                    update_data["provider_id"] = social_profile.provider_id

                await db.execute(
                    update(UserModel).where(UserModel.id == user.id).values(**update_data, updated_at=datetime.now(UTC))
                )
                await db.commit()
                await db.refresh(user)

            # Crear tokens JWT para la sesión
            access_token_data = {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "type": "access",
            }
            refresh_token_data = {"sub": str(user.id), "type": "refresh"}

            jwt_access_token = create_access_token(access_token_data)
            jwt_refresh_token = create_refresh_token(refresh_token_data)

            # Crear un objeto con los datos necesarios
            auth_data = {
                "jwt_access_token": jwt_access_token,
                "jwt_refresh_token": jwt_refresh_token,
                "user_id": str(user.id),
                "email": user.email,
                "full_name": user.full_name or "",
                "avatar_url": user.avatar_url or "",
                "provider": user.provider,
                "role": user.role,
            }

            # Generar código temporal
            temp_code = await generate_temporary_auth_code(redis, auth_data)

            # Redirigir al frontend solo con el código temporal
            frontend_url = "http://localhost/"
            redirect_url = f"{frontend_url}?temp_code={temp_code}"

            redirect_response = RedirectResponse(url=redirect_url, status_code=303)
            redirect_response.set_cookie(
                key="is_logged_in",
                value="true",
                max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            redirect_response.set_cookie(
                key="access_token",
                value=jwt_access_token,
                httponly=True,
                secure=False if settings.ENVIRONMENT == "development" else True,
                samesite="lax",
                max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            redirect_response.set_cookie(
                key="refresh_token",
                value=jwt_refresh_token,
                httponly=True,
                secure=False if settings.ENVIRONMENT == "development" else True,
                samesite="lax",
                max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            return redirect_response

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado en el callback de GitHub: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado durante la autenticación con GitHub: {str(e)}",
        )


@router.get("/google/login")
async def google_login(redis: Redis = Depends(get_redis)):
    """Endpoint para iniciar el flujo de autenticación con Google."""
    try:
        logger.info("Generando URL de autorización de Google")

        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client ID de Google no configurado",
            )

        # Generar estado para seguridad
        state = token_urlsafe(32)

        # Almacenar el state en Redis con expiración de 10 minutos
        await redis.set(f"oauth_state:{state}", "google", ex=600)

        # Construir la URL de autorización de Google
        google_auth_url = (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
            f"&response_type=code"
            f"&scope=email profile"
            f"&access_type=offline"
            f"&state={state}"
        )

        logger.debug(f"URL de autorización generada: {google_auth_url}")
        logger.debug(f"Client ID usado: {settings.GOOGLE_CLIENT_ID}")
        logger.debug(f"Redirect URI configurado: {settings.GOOGLE_REDIRECT_URI}")
        logger.debug(f"State generado: {state}")

        return {
            "authorization_url": google_auth_url,
            "state": state,
        }
    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al generar URL de autorización: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500,
            detail="Error inesperado al generar URL de autorización",
        )


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: str,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    state: str | None = None,
):
    """Endpoint para manejar el callback de Google y obtener el token de acceso."""
    try:
        if not settings.GOOGLE_CLIENT_ID:
            logger.error("Client ID no configurado")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client ID de Google no configurado",
            )

        if not settings.GOOGLE_CLIENT_SECRET:
            logger.error("Client Secret no configurado")
            raise HTTPException(
                status_code=500,
                detail="Error de configuración: Client Secret de Google no configurado",
            )

        # Verificar el state si está presente
        if state:
            stored_provider = await redis.get(f"oauth_state:{state}")
            if not stored_provider or stored_provider != "google":
                logger.error(f"State inválido o expirado: {state}")
                raise HTTPException(
                    status_code=400,
                    detail="Estado de autenticación inválido o expirado",
                )
            # Eliminar el state usado
            await redis.delete(f"oauth_state:{state}")

        logger.info(f"Iniciando intercambio de código por token de acceso. Code length: {len(code)}")
        logger.debug(f"Código recibido: {code}")
        logger.debug(f"State recibido: {state}")
        logger.debug(f"URL configurada: {settings.GOOGLE_REDIRECT_URI}")
        logger.debug(f"URL actual de la petición: {request.url}")
        logger.debug(f"Client ID configurado: {settings.GOOGLE_CLIENT_ID}")

        # Intercambiar el código por un token de acceso
        async with httpx.AsyncClient() as client:
            token_request_data = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }

            # Log seguro (ocultando el client secret)
            safe_log_data = token_request_data.copy()
            safe_log_data["client_secret"] = "***" + settings.GOOGLE_CLIENT_SECRET[-4:]
            logger.debug(f"Datos de la petición a Google: {safe_log_data}")

            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_request_data,
                timeout=30.0,
            )

            logger.debug(f"Respuesta de Google - Status: {token_response.status_code}")
            logger.debug(f"Respuesta de Google - Headers: {token_response.headers}")
            logger.debug(f"Respuesta de Google - Body: {token_response.text}")

            if token_response.status_code != 200:
                logger.error(f"Error en la respuesta de Google: {token_response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error al obtener el token de acceso de Google. Status: {token_response.status_code}",
                )

            try:
                token_data = token_response.json()
            except Exception as e:
                logger.error(f"Error al parsear la respuesta JSON: {token_response.text}")
                logger.exception("Error detallado:")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al procesar la respuesta de Google: {str(e)}",
                )

            access_token = token_data.get("access_token")
            if not access_token:
                logger.error("No se encontró access_token en la respuesta")
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo obtener el token de acceso",
                )

            # Usar el flujo de social_login para crear/actualizar el usuario
            social_login_data = SocialLoginRequest(provider=AuthProvider.GOOGLE, access_token=access_token)

            # Obtener información del perfil de Google
            social_profile = await verify_social_token(social_login_data.provider, social_login_data.access_token)

            if not social_profile.email:
                raise HTTPException(
                    status_code=400,
                    detail="No se pudo obtener un email verificado del proveedor social",
                )

            # Buscar si el usuario ya existe
            result = await db.execute(select(UserModel).where(UserModel.email == social_profile.email))
            user = result.scalar_one_or_none()

            if not user:
                # Crear nuevo usuario
                user = UserModel(
                    email=social_profile.email,
                    full_name=social_profile.full_name or "",
                    password="",  # No se requiere contraseña para login social
                    role=UserRole.USER,
                    avatar_url=social_profile.avatar_url,
                    is_verified=True,  # Los usuarios de login social se consideran verificados
                    status=UserStatus.INACTIVE,  # Inicialmente inactivo hasta completar el exchange
                    provider=social_login_data.provider,
                    provider_id=social_profile.provider_id,
                    last_login_at=datetime.now(UTC),
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
            else:
                # Verificar si el usuario ya está registrado con otro proveedor social
                if user.provider != social_login_data.provider:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Este correo electrónico ya está registrado usando {user.provider}. Por favor, inicie sesión con ese método.",
                    )

                # Actualizar información del usuario si es necesario
                update_data = {
                    "last_login_at": datetime.now(UTC),
                    "status": UserStatus.INACTIVE,  # Establecer como inactivo hasta completar el exchange
                }

                if social_profile.avatar_url and not user.avatar_url:
                    update_data["avatar_url"] = social_profile.avatar_url
                if social_profile.full_name and not user.full_name:
                    update_data["full_name"] = social_profile.full_name
                if not user.provider_id:
                    update_data["provider_id"] = social_profile.provider_id

                await db.execute(
                    update(UserModel).where(UserModel.id == user.id).values(**update_data, updated_at=datetime.now(UTC))
                )
                await db.commit()
                await db.refresh(user)

            # Crear tokens JWT para la sesión
            access_token_data = {
                "sub": str(user.id),
                "email": user.email,
                "role": user.role,
                "type": "access",
            }
            refresh_token_data = {"sub": str(user.id), "type": "refresh"}

            jwt_access_token = create_access_token(access_token_data)
            jwt_refresh_token = create_refresh_token(refresh_token_data)

            # Crear un objeto con los datos necesarios
            auth_data = {
                "jwt_access_token": jwt_access_token,
                "jwt_refresh_token": jwt_refresh_token,
                "user_id": str(user.id),
                "email": user.email,
                "full_name": user.full_name or "",
                "avatar_url": user.avatar_url or "",
                "provider": user.provider,
                "role": user.role,
            }

            # Generar código temporal
            temp_code = await generate_temporary_auth_code(redis, auth_data)

            # Redirigir al frontend solo con el código temporal
            frontend_url = "http://localhost/"
            redirect_url = f"{frontend_url}?temp_code={temp_code}"

            redirect_response = RedirectResponse(url=redirect_url, status_code=303)
            redirect_response.set_cookie(
                key="is_logged_in",
                value="true",
                max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            redirect_response.set_cookie(
                key="access_token",
                value=jwt_access_token,
                httponly=True,
                secure=False if settings.ENVIRONMENT == "development" else True,
                samesite="lax",
                max_age=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            redirect_response.set_cookie(
                key="refresh_token",
                value=jwt_refresh_token,
                httponly=True,
                secure=False if settings.ENVIRONMENT == "development" else True,
                samesite="lax",
                max_age=settings.REFRESH_TOKEN_EXPIRE_SECONDS,
                path="/",
            )
            return redirect_response

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado en el callback de Google: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(
            status_code=500,
            detail=f"Error inesperado durante la autenticación con Google: {str(e)}",
        )


@router.patch("/me/update")
async def update_profile(
    profile_update: UserProfileUpdate,
    token: str = Depends(verify_token_not_blacklisted),
    db: AsyncSession = Depends(get_db),
):
    """Endpoint para actualizar la información del perfil del usuario."""
    try:
        # Decodificar el token para obtener el ID del usuario
        payload = decode_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido o mal formado")

        user_id = payload["sub"]

        # Buscar el usuario en la base de datos
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Preparar los datos de actualización
        update_data = {}
        if profile_update.full_name is not None:
            update_data["full_name"] = profile_update.full_name
        if profile_update.bio is not None:
            update_data["bio"] = profile_update.bio
        if profile_update.avatar_url is not None:
            update_data["avatar_url"] = profile_update.avatar_url

        if not update_data:
            raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")

        # Actualizar el usuario
        update_data["updated_at"] = datetime.now(UTC)
        await db.execute(update(UserModel).where(UserModel.id == user_id).values(**update_data))
        await db.commit()
        await db.refresh(user)

        return {
            "message": "Perfil actualizado exitosamente",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "bio": user.bio,
                "avatar_url": user.avatar_url,
                "role": user.role,
                "is_verified": user.is_verified,
                "status": user.status,
                "provider": user.provider,
                "updated_at": user.updated_at.isoformat(),
            },
        }

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al actualizar el perfil: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado al actualizar el perfil: {str(e)}")
