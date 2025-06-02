from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from app.db.deps import get_db
from app.core.deps import verify_token_not_blacklisted
from app.schemas.user import (
    UserCreate,
    EmailRequest,
    UserLogin,
    PasswordResetRequest,
    PasswordResetVerify,
    PasswordChange,
    DeleteAccount,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiration,
)
from app.db.models.user import User as UserModel
from fastapi.responses import JSONResponse
from app.core.redis import get_redis
from app.core.email_verification import (
    generate_verification_token,
    verify_email_token,
    cleanup_expired_unverified_users,
)
from app.core.email import send_verification_email, send_password_reset_email
from app.core.password_recovery import (
    generate_password_reset_token,
    verify_password_reset_token,
    invalidate_password_reset_token,
)
from sqlalchemy import select, update
from datetime import datetime, UTC, timedelta
from uuid import UUID
import logging

router = APIRouter(prefix="/auth")

logger = logging.getLogger(__name__)


@router.post("/register")
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

        # 3. Intentar enviar el correo ANTES de crear el usuario
        logger.debug(f"Intentando enviar correo de verificación a {user_in.email}")
        email_sent = False
        try:
            await send_verification_email(user_in.email, verification_token)
            email_sent = True
            logger.info(f"Correo de verificación enviado exitosamente a {user_in.email}")
        except Exception as e:
            logger.error(f"Error al enviar correo de verificación: {str(e)}")
            await redis.delete(f"email_verification:{verification_token}")
            raise HTTPException(status_code=500, detail=f"Error al enviar el correo de verificación: {str(e)}")

        if not email_sent:
            logger.error("El correo no se envió pero no se detectó ninguna excepción")
            await redis.delete(f"email_verification:{verification_token}")
            raise HTTPException(status_code=500, detail="No se pudo enviar el correo de verificación")

        # 4. Solo si el correo se envió correctamente, crear el usuario
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

        return JSONResponse(
            content={
                "message": "Usuario creado exitosamente. Por favor, verifica tu correo electrónico.",
                "user": {
                    "id": str(db_user.id),
                    "email": db_user.email,
                    "full_name": db_user.full_name,
                    "role": db_user.role,
                    "bio": db_user.bio,
                    "avatar_url": db_user.avatar_url,
                    "is_verified": db_user.is_verified,
                },
            },
            status_code=201,
        )

    except HTTPException as http_error:
        logger.error(f"Error HTTP durante el registro: {http_error.detail}")
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado durante el registro: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado durante el proceso de registro: {str(e)}")


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
async def login(
    response: Response, user_in: UserLogin, db: AsyncSession = Depends(get_db), redis: Redis = Depends(get_redis)
):
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
    await redis.expire(redis_key, 7 * 24 * 60 * 60)  # 7 días en segundos

    # Configurar cookie segura para el refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 días en segundos
        path="/auth/refresh",  # Solo accesible en el endpoint de refresh
    )

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
    response: Response,
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

    # Eliminar la cookie del refresh token
    response.delete_cookie(key="refresh_token", path="/auth/refresh", secure=True, httponly=True)

    return JSONResponse(content={"message": "Sesión cerrada exitosamente"}, status_code=200)


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    token: str | None = None,
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
        "is_active": "true",
        "created_at": datetime.now(UTC).isoformat(),
    }

    # Almacenar nuevo hash en Redis
    await redis.delete(redis_key)  # Eliminar el hash anterior
    await redis.hset(redis_key, mapping=user_refresh_data)
    await redis.expire(redis_key, 7 * 24 * 60 * 60)  # 7 días en segundos

    # Actualizar la cookie con el nuevo refresh token
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 días en segundos
        path="/auth/refresh",
    )

    # Añadir el token anterior a la lista negra
    await redis.set(f"blacklisted_token:{token_to_use}", "true", ex=3600)

    response_data = {
        "message": "Tokens renovados exitosamente",
        "access_token": new_access_token,
        "token_type": "bearer",
        "user": {
            "id": user_data["user_id"],
            "email": user_data["email"],
            "full_name": user_data["full_name"],
            "role": user_data["role"],
            "is_active": True,
        },
    }

    # Añadir advertencia si el token está próximo a expirar
    if time_until_expiry <= warning_threshold:
        response_data["warning"] = (
            f"Su sesión expirará en {time_until_expiry.days} días y {time_until_expiry.seconds // 3600} horas. Considere iniciar sesión nuevamente."
        )

    return JSONResponse(
        content=response_data,
        status_code=200,
    )


@router.get("/me")
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

        return JSONResponse(
            content={
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "bio": user.bio,
                    "avatar_url": user.avatar_url,
                    "is_verified": user.is_verified,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat(),
                    "updated_at": user.updated_at.isoformat(),
                }
            },
            status_code=200,
        )

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al obtener información del usuario: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail=f"Error inesperado al obtener información del usuario: {str(e)}")


@router.post("/forgot-password")
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
            return JSONResponse(
                content={
                    "message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"
                },
                status_code=200,
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=400,
                detail="La cuenta no está verificada. Por favor, verifica tu correo electrónico primero",
            )

        # Generar token de recuperación
        reset_token = await generate_password_reset_token(redis, reset_request.email)

        # Enviar correo con el token
        await send_password_reset_email(reset_request.email, reset_token)

        return JSONResponse(
            content={"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"},
            status_code=200,
        )

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado en recuperación de contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        # Por seguridad, no revelamos detalles del error
        return JSONResponse(
            content={"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña"},
            status_code=200,
        )


@router.put("/reset-password")
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

        return JSONResponse(
            content={
                "message": "Contraseña actualizada exitosamente. Por favor, inicia sesión con tu nueva contraseña."
            },
            status_code=200,
        )

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al restablecer la contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al restablecer la contraseña")


@router.patch("/change-password")
async def change_password(
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
                is_active=False,
                updated_at=datetime.now(UTC),
            )
        )
        await db.commit()

        # Invalidar todas las sesiones activas del usuario por seguridad
        redis_key = f"refresh_token:{user_id}"
        await redis.delete(redis_key)

        # Añadir el token actual a la lista negra
        await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

        return JSONResponse(
            content={
                "message": "Contraseña actualizada exitosamente. Por favor, inicia sesión nuevamente con tu nueva contraseña."
            },
            status_code=200,
        )

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al cambiar la contraseña: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al cambiar la contraseña")


@router.delete("/delete-account")
async def delete_account(
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

        # Eliminar todas las sesiones del usuario en Redis
        redis_key = f"refresh_token:{user_id}"
        await redis.delete(redis_key)

        # Añadir el token actual a la lista negra
        await redis.set(f"blacklisted_token:{token}", "true", ex=3600)  # expira en 1 hora

        # Eliminar el usuario de la base de datos
        await db.execute(UserModel.__table__.delete().where(UserModel.id == user_id))
        await db.commit()

        return JSONResponse(
            content={"message": "Cuenta eliminada exitosamente"},
            status_code=200,
        )

    except HTTPException as http_error:
        raise http_error
    except Exception as e:
        logger.error(f"Error inesperado al eliminar la cuenta: {str(e)}")
        logger.exception("Stacktrace completo:")
        raise HTTPException(status_code=500, detail="Error inesperado al eliminar la cuenta")
