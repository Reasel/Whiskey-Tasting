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

    # CORS Configuration
    cors_origins: list[str] = [
        "http://localhost:3010",
        "http://127.0.0.1:3010",
    ]

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
