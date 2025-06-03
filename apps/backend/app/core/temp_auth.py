from redis.asyncio import Redis
from secrets import token_urlsafe
from datetime import datetime, UTC
import logging

logger = logging.getLogger(__name__)


async def generate_temporary_auth_code(redis: Redis, user_data: dict) -> str:
    """
    Genera un código temporal y almacena los datos del usuario en Redis.

    Args:
        redis: Instancia de Redis para almacenar los datos
        user_data: Diccionario con los datos del usuario a almacenar

    Returns:
        str: Código temporal generado

    Raises:
        Exception: Si hay un error al almacenar los datos en Redis
    """
    temp_code = token_urlsafe(32)
    redis_key = f"temp_auth:{temp_code}"

    logger.debug(f"Generando código temporal: {temp_code}")
    logger.debug(f"Redis key: {redis_key}")
    logger.debug(f"Datos a almacenar: {user_data}")

    # Convertir todos los valores a string para Redis
    redis_data = {k: str(v) for k, v in user_data.items()}

    try:
        await redis.hset(redis_key, mapping=redis_data)
        await redis.expire(redis_key, 300)  # 5 minutos
        logger.debug(f"Datos almacenados exitosamente en Redis con key: {redis_key}")
        return temp_code
    except Exception as e:
        logger.error(f"Error al almacenar datos en Redis: {str(e)}")
        raise


async def get_temp_auth_data(redis: Redis, temp_code: str) -> dict:
    """
    Recupera y elimina los datos temporales almacenados en Redis.

    Args:
        redis: Instancia de Redis para recuperar los datos
        temp_code: Código temporal a buscar

    Returns:
        dict: Datos almacenados o None si no se encuentran
    """
    redis_key = f"temp_auth:{temp_code}"
    logger.debug(f"Intentando recuperar datos con key: {redis_key}")

    try:
        # Verificar si la clave existe
        exists = await redis.exists(redis_key)
        logger.debug(f"¿La clave existe en Redis?: {exists}")

        if not exists:
            logger.error(f"Clave no encontrada en Redis: {redis_key}")
            return None

        # Obtener todos los campos del hash
        data = await redis.hgetall(redis_key)
        logger.debug(f"Datos recuperados de Redis: {data}")

        if data:
            # Eliminar la clave después de recuperar los datos
            await redis.delete(redis_key)
            logger.debug(f"Clave eliminada de Redis: {redis_key}")
            return data

        return None
    except Exception as e:
        logger.error(f"Error al recuperar datos de Redis: {str(e)}")
        return None
