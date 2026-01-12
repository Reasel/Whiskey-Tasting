"""Whiskey management endpoints."""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas.models import (
    ApiResponse,
    UpdateWhiskeysRequest,
    Whiskey,
)

router = APIRouter()


@router.get("/themes/{theme_id}/whiskeys", response_model=list[Whiskey])
async def get_whiskeys_by_theme(theme_id: int) -> list[Whiskey]:
    """Get all whiskeys for a theme."""
    try:
        whiskeys = db.get_whiskeys_by_theme(theme_id)
        return [Whiskey(**w) for w in whiskeys]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get whiskeys: {str(e)}")


@router.put("/themes/{theme_id}/whiskeys", response_model=ApiResponse)
async def update_whiskeys(theme_id: int, request: UpdateWhiskeysRequest) -> ApiResponse:
    """Update whiskeys for a theme."""
    try:
        # First, delete existing whiskeys for the theme
        db.delete_whiskeys_by_theme(theme_id)

        # Create new whiskeys
        for whiskey_data in request.whiskeys:
            db.create_whiskey(
                theme_id=theme_id,
                name=whiskey_data["name"],
                proof=whiskey_data.get("proof"),
            )

        return ApiResponse(message="Whiskeys updated successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update whiskeys: {str(e)}")