"""Pydantic models for whiskey tasting application."""

from typing import Any

from pydantic import BaseModel, Field


# Whiskey Tasting Models
class Theme(BaseModel):
    """Tasting theme/night information."""

    id: int | None = None
    name: str
    notes: str = ""
    created_at: str | None = None


class Whiskey(BaseModel):
    """Whiskey information."""

    id: int | None = None
    theme_id: int
    name: str
    proof: float | None = None
    created_at: str | None = None


class User(BaseModel):
    """Taster/user information."""

    id: int | None = None
    name: str
    created_at: str | None = None


class Tasting(BaseModel):
    """Individual tasting score submission."""

    id: int | None = None
    user_id: int
    whiskey_id: int
    aroma_score: int  # 1-5
    flavor_score: int  # 1-5
    finish_score: int  # 1-5
    personal_rank: int  # 1-N ranking
    created_at: str | None = None
    updated_at: str | None = None


# API Request/Response Models
class CreateThemeRequest(BaseModel):
    """Request to create a new tasting theme."""

    name: str
    notes: str = ""
    num_whiskeys: int = Field(..., ge=1, le=20)  # Number of whiskeys for the theme


class UpdateWhiskeysRequest(BaseModel):
    """Request to update whiskeys for a theme."""

    whiskeys: list[dict[str, Any]]  # List of {name: str, proof: float}


class SubmitTastingRequest(BaseModel):
    """Request to submit tasting scores."""

    user_name: str  # Will create user if doesn't exist
    whiskey_scores: dict[int, dict[str, int]]  # whiskey_id -> {aroma_score, flavor_score, finish_score, personal_rank}


class TastingScore(BaseModel):
    """Individual tasting score with calculated average."""

    user_name: str
    aroma_score: int
    flavor_score: int
    finish_score: int
    average_score: float
    personal_rank: int


class WhiskeyScores(BaseModel):
    """All scores for a whiskey."""

    whiskey_id: int
    whiskey_name: str
    proof: float | None
    scores: list[TastingScore]
    average_score: float
    rank_by_average: int


class ThemeScoresResponse(BaseModel):
    """Response with all scores for a theme."""

    theme: Theme
    whiskeys: list[WhiskeyScores]


class UserListResponse(BaseModel):
    """Response with list of users."""

    users: list[str]


# Config Models
class LanguageConfigRequest(BaseModel):
    """Request to update language settings."""

    ui_language: str | None = None  # en, es, zh, ja - for interface
    content_language: str | None = None  # en, es, zh, ja - for generated content


class LanguageConfigResponse(BaseModel):
    """Response for language settings."""

    ui_language: str = "en"  # Interface language
    content_language: str = "en"  # Generated content language
    supported_languages: list[str] = ["en", "es", "zh", "ja"]


class ResetDatabaseRequest(BaseModel):
    """Request to reset database with confirmation."""

    confirm: str | None = None


# Health/Status Models
class HealthResponse(BaseModel):
    """Health check response."""

    status: str


# API Response Models
class ApiResponse(BaseModel):
    """Generic API response."""

    message: str


class ThemeResponse(BaseModel):
    """Theme response model."""

    id: int
    name: str
    notes: str
    created_at: str


class ThemeCreateResponse(BaseModel):
    """Response for theme creation."""

    message: str
    theme: ThemeResponse


class ThemeListResponse(BaseModel):
    """Response for theme listing."""

    themes: list[ThemeResponse]


class ThemeUpdateRequest(BaseModel):
    """Request to update a theme."""

    name: str | None = None
    notes: str | None = None


class UserTastingsResponse(BaseModel):
    """Response with user's tastings for a theme."""

    user_name: str
    theme: Theme
    tastings: dict[int, dict[str, int]]  # whiskey_id -> {aroma_score, flavor_score, finish_score, personal_rank}
