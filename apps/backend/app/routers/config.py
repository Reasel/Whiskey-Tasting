"""Configuration endpoints for whiskey tasting app."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.models import (
    LanguageConfigRequest,
    LanguageConfigResponse,
    ResetDatabaseRequest,
)
from app.database import db

router = APIRouter(prefix="/config", tags=["Configuration"])


def _get_config_path() -> Path:
    """Get path to config storage file."""
    return settings.config_path


def _load_config() -> dict:
    """Load config from file."""
    path = _get_config_path()
    if path.exists():
        return json.loads(path.read_text())
    return {}


def _save_config(config: dict) -> None:
    """Save config to file."""
    path = _get_config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, indent=2))






# Supported languages for i18n
SUPPORTED_LANGUAGES = ["en", "es", "zh", "ja"]


@router.get("/language", response_model=LanguageConfigResponse)
async def get_language_config() -> LanguageConfigResponse:
    """Get current language configuration."""
    stored = _load_config()

    # Support legacy single 'language' field migration
    legacy_language = stored.get("language", "en")

    return LanguageConfigResponse(
        ui_language=stored.get("ui_language", legacy_language),
        content_language=stored.get("content_language", legacy_language),
        supported_languages=SUPPORTED_LANGUAGES,
    )


@router.put("/language", response_model=LanguageConfigResponse)
async def update_language_config(
    request: LanguageConfigRequest,
) -> LanguageConfigResponse:
    """Update language configuration."""
    stored = _load_config()

    # Validate and update UI language
    if request.ui_language is not None:
        if request.ui_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported UI language: {request.ui_language}. Supported: {SUPPORTED_LANGUAGES}",
            )
        stored["ui_language"] = request.ui_language

    # Validate and update content language
    if request.content_language is not None:
        if request.content_language not in SUPPORTED_LANGUAGES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported content language: {request.content_language}. Supported: {SUPPORTED_LANGUAGES}",
            )
        stored["content_language"] = request.content_language

    # Save config
    _save_config(stored)

    # Support legacy single 'language' field migration
    legacy_language = stored.get("language", "en")

    return LanguageConfigResponse(
        ui_language=stored.get("ui_language", legacy_language),
        content_language=stored.get("content_language", legacy_language),
        supported_languages=SUPPORTED_LANGUAGES,
    )




@router.post("/reset")
async def reset_database_endpoint(request: ResetDatabaseRequest) -> dict:
    """Reset the database and clear all data.

    WARNING: This action is irreversible. It will:
    1. Truncate all database tables (themes, whiskeys, tastings, users)
    2. Delete all uploaded files

    Requires confirmation token for safety.

    Args:
        request: Request body containing confirmation token

    Returns:
        Success message

    Note:
        This is a local-only endpoint for single-user deployments.
        In production/multi-user scenarios, add proper authentication.
    """
    if request.confirm != "RESET_ALL_DATA":
        raise HTTPException(
            status_code=400,
            detail="Confirmation required. Pass confirm=RESET_ALL_DATA in request body.",
        )
    db.reset_database()
    return {"message": "Database and all data have been reset successfully"}
