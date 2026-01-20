"""Application configuration using pydantic-settings."""

import logging
from pathlib import Path

import requests
from requests.auth import HTTPBasicAuth
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
def db_path(self) -> Path:
        """Path to TinyDB database file."""
        return self.data_dir / "database.json"

    # ntfy Configuration
    ntfy_url: str = "https://ntfy.sh"
    ntfy_topic: str = ""
    ntfy_default_topic: str = ""
    ntfy_auth_user: str = ""
    ntfy_auth_pass: str = ""

    @property
    def ntfy_topic_final(self) -> str:
        """Final topic to use for notifications, preferring explicit topic then default."""
        return self.ntfy_topic or self.ntfy_default_topic


def send_delete_notification(message: str, settings: Settings) -> None:
    """Send a delete notification via ntfy if configured."""
    topic = settings.ntfy_topic or settings.ntfy_default_topic
    if not settings.ntfy_url or not topic:
        return

    url = f"{settings.ntfy_url}/{topic}"

    headers = {"Content-Type": "text/plain"}

    auth = None
    if settings.ntfy_auth_user and settings.ntfy_auth_pass:
        auth = HTTPBasicAuth(settings.ntfy_auth_user, settings.ntfy_auth_pass)

    try:
        response = requests.post(url, data=message, headers=headers, auth=auth, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.warning(f"Failed to send ntfy notification: {e}")


settings = Settings()
