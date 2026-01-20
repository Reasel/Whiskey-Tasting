"""Health check and status endpoints."""

from fastapi import APIRouter

from app.database import db
from app.notifications import send_notification
from app.schemas.models import ApiResponse, HealthResponse

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


@router.post("/test-notification", response_model=ApiResponse)
async def test_notification(message: str = "Test notification from Whiskey Tasting API") -> ApiResponse:
    """Send a test notification (if NTFY is configured)."""
    try:
        send_notification(message, title="Test Notification", priority="default")
        return ApiResponse(message="Test notification sent (if configured)")
    except Exception as e:
        return ApiResponse(message=f"Failed to send test notification: {str(e)}")
