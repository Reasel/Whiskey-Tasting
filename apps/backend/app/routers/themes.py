"""Theme management endpoints."""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.database import db
from app.schemas.models import (
    ApiResponse,
    ThemeCreateRequest,
    ThemeCreateResponse,
    ThemeListResponse,
    ThemeResponse,
    ThemeUpdateRequest,
)

router = APIRouter()


@router.post("/themes", response_model=ThemeCreateResponse)
async def create_theme(request: ThemeCreateRequest) -> ThemeCreateResponse:
    """Create a new tasting theme."""
    try:
        theme = db.create_theme(
            name=request.name,
            notes=request.notes,
        )
        return ThemeCreateResponse(
            message="Theme created successfully",
            theme=ThemeResponse(**theme),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create theme: {str(e)}")


@router.get("/themes", response_model=ThemeListResponse)
async def list_themes() -> ThemeListResponse:
    """List all themes."""
    try:
        themes = db.list_themes()
        return ThemeListResponse(
            themes=[ThemeResponse(**theme) for theme in themes]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list themes: {str(e)}")


@router.get("/themes/active", response_model=ThemeResponse | None)
async def get_active_theme() -> ThemeResponse | None:
    """Get the active theme."""
    try:
        theme = db.get_active_theme()
        return ThemeResponse(**theme) if theme else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active theme: {str(e)}")


@router.put("/themes/{theme_id}/active")
async def set_active_theme(theme_id: str) -> ApiResponse:
    """Set a theme as active."""
    try:
        success = db.set_active_theme(theme_id)
        if not success:
            raise HTTPException(status_code=404, detail="Theme not found")
        return ApiResponse(message="Theme set as active")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set active theme: {str(e)}")


@router.put("/themes/{theme_id}", response_model=ThemeResponse)
async def update_theme(theme_id: str, request: ThemeUpdateRequest) -> ThemeResponse:
    """Update a theme."""
    try:
        updates = request.model_dump(exclude_unset=True)
        theme = db.update_theme(theme_id, updates)
        if not theme:
            raise HTTPException(status_code=404, detail="Theme not found")
        return ThemeResponse(**theme)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update theme: {str(e)}")


@router.delete("/themes/{theme_id}")
async def delete_theme(theme_id: str) -> ApiResponse:
    """Delete a theme."""
    try:
        success = db.delete_theme(theme_id)
        if not success:
            raise HTTPException(status_code=404, detail="Theme not found")
        return ApiResponse(message="Theme deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete theme: {str(e)}")