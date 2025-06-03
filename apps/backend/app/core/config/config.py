from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, PostgresDsn, validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv
import logging
import sys

# Configurar logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "ZENTORA"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "zentora_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")  # Permitir DATABASE_URL como alternativa

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")  # Permitir REDIS_URL como alternativa

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Email Settings (Brevo)
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL: str = os.getenv("BREVO_SENDER_EMAIL", "")

    # Email
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "test@example.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", PROJECT_NAME)
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    MAIL_USE_CREDENTIALS: bool = True
    MAIL_VALIDATE_CERTS: bool = True
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"

    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # GitHub OAuth Settings
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: Optional[str] = os.getenv(
        "GITHUB_REDIRECT_URI", "http://localhost/api/v1/auth/github/callback"
    )

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=True, env_file_encoding="utf-8", extra="allow"  # Permitir campos extra
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_email_settings()

    def _validate_email_settings(self):
        """Validar la configuración del email al iniciar la aplicación."""
        if not self.BREVO_API_KEY:
            logger.warning("BREVO_API_KEY no está configurada en las variables de entorno")
        else:
            logger.info("BREVO_API_KEY está configurada")

        if not self.BREVO_SENDER_EMAIL:
            logger.warning("BREVO_SENDER_EMAIL no está configurada en las variables de entorno")
        else:
            logger.info(f"BREVO_SENDER_EMAIL está configurada: {self.BREVO_SENDER_EMAIL}")

    @property
    def async_database_url(self) -> str:
        """Construye la URL de conexión asíncrona a la base de datos."""
        # Usar DATABASE_URL si está disponible
        if self.DATABASE_URL:
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

        # Construir la URL a partir de los componentes
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def get_redis_url(self) -> str:
        """Construye la URL de conexión a Redis."""
        # Usar REDIS_URL si está disponible
        if self.REDIS_URL:
            return self.REDIS_URL

        # Construir la URL a partir de los componentes
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()

# Verificar configuraciones críticas
if settings.GITHUB_CLIENT_ID:
    logger.info("GITHUB_CLIENT_ID está configurada")
else:
    logger.warning("GITHUB_CLIENT_ID no está configurada")

if settings.GITHUB_CLIENT_SECRET:
    logger.info("GITHUB_CLIENT_SECRET está configurada")
else:
    logger.warning("GITHUB_CLIENT_SECRET no está configurada")

if settings.GITHUB_REDIRECT_URI:
    logger.info(f"GITHUB_REDIRECT_URI está configurada: {settings.GITHUB_REDIRECT_URI}")
else:
    logger.warning("GITHUB_REDIRECT_URI no está configurada")
