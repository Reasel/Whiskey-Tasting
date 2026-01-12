"""Application configuration using pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # CORS Configuration - comma-separated list of additional allowed origins
    cors_origins_additional_str: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string and add defaults."""
        origins = [origin.strip() for origin in self.cors_origins_additional_str.split(",") if origin.strip()]
        # Always include localhost origins for development
        default_origins = ["http://localhost:3010", "http://127.0.0.1:3010"]
        return list(set(default_origins + origins))  # Use set to avoid duplicates

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
