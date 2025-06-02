from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "ZENTORA"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", os.getenv("SECRET_KEY"))

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Email Settings (Brevo)
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_SENDER_EMAIL: str = os.getenv("BREVO_SENDER_EMAIL", "")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, env_file_encoding="utf-8")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._validate_email_settings()

    def _validate_email_settings(self):
        """Validar la configuración del email al iniciar la aplicación."""
        if not self.BREVO_API_KEY:
            logger.error("BREVO_API_KEY no está configurada en las variables de entorno")
        else:
            logger.info("BREVO_API_KEY está configurada")

        if not self.BREVO_SENDER_EMAIL:
            logger.error("BREVO_SENDER_EMAIL no está configurada en las variables de entorno")
        else:
            logger.info(f"BREVO_SENDER_EMAIL está configurada: {self.BREVO_SENDER_EMAIL}")

    @property
    def async_database_url(self) -> str:
        """Get async database URL."""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")


settings = Settings()
