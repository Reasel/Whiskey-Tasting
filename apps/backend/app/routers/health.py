"""Health check and status endpoints."""

from fastapi import APIRouter

from app.database import db
from app.schemas.models import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Basic health check endpoint."""
    try:
        # Check database connectivity
        db_stats = db.get_stats()
        return HealthResponse(
            status="healthy",
        )
    except Exception:
        return HealthResponse(
            status="unhealthy",
        )


@router.get("/status")
async def get_status() -> dict:
    """Get comprehensive application status.

    Returns:
        - Database statistics
        - Application readiness
    """
    try:
        db_stats = db.get_stats()
        return {
            "status": "ready",
            "database_stats": db_stats,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }
