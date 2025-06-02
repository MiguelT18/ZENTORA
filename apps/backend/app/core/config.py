from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from dotenv import load_dotenv

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

    # Email Settings
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = 587
    MAIL_SERVER: str = os.getenv("MAIL_SERVER")
    MAIL_FROM_NAME: str = PROJECT_NAME

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, env_file_encoding="utf-8")

    @property
    def async_database_url(self) -> str:
        """Get async database URL."""
        return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")


settings = Settings()
