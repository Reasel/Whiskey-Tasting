"""Application configuration using pydantic-settings."""

import logging
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8010

    # CORS Configuration
    cors_origins_str: str = ""
    cors_origins_str_additional: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """CORS origins from environment variables."""
        origins = [
            "http://localhost:3010",
            "http://127.0.0.1:3010",
            "http://localhost",
            "http://localhost:80",
            "http://127.0.0.1",
            "http://127.0.0.1:80",
        ]
        logger.info(f"CORS_ORIGINS_STR_ADDITIONAL: {self.cors_origins_str_additional}")
        if self.cors_origins_str:
            origins.extend(self.cors_origins_str.split(","))
        if self.cors_origins_str_additional:
            origins.extend(self.cors_origins_str_additional.split(","))
        return list(set(origins))  # Remove duplicates

    # Paths
    data_dir: Path = Path(__file__).parent.parent / "data"

    @property
    @property
    def config_path(self) -> Path:
        """Path to configuration file."""
        return self.data_dir / "config.json"

    def db_path(self) -> Path:
        """Path to TinyDB database file."""
        return self.data_dir / "database.json"


settings = Settings()
