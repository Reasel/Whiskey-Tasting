"""Notification utilities using ntfy."""
import logging
from typing import Optional

import requests

from app.config import settings

logger = logging.getLogger(__name__)


def send_notification(message: str, title: Optional[str] = None, priority: Optional[str] = None) -> None:
    """Send a notification via ntfy."""
    logger.info(f"NTFY Debug - URL: '{settings.ntfy_url}', Topic: '{settings.ntfy_topic}'")
    if not settings.ntfy_url or not settings.ntfy_topic:
        logger.info("Ntfy not configured, skipping notification")
        return

    url = f"{settings.ntfy_url}/{settings.ntfy_topic}"

    headers = {"Title": title or "Whiskey Tasting Notification"}
    if priority:
        headers["Priority"] = priority

    auth = None
    if settings.ntfy_auth_user and settings.ntfy_auth_pass:
        auth = (settings.ntfy_auth_user, settings.ntfy_auth_pass)

    try:
        response = requests.post(url, headers=headers, data=message.encode('utf-8'), auth=auth, timeout=10)
        response.raise_for_status()
        logger.info(f"Notification sent: {message}")
    except requests.RequestException as e:
        logger.error(f"Failed to send notification: {e}")