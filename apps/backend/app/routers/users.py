"""User management endpoints."""

from fastapi import APIRouter, HTTPException

from app.database import db
from app.notifications import send_notification
from app.schemas.models import UserListResponse, ApiResponse

router = APIRouter()


@router.post("/users", response_model=ApiResponse)
async def create_user(request: dict) -> ApiResponse:
    """Create a new user."""
    try:
        name = request.get("name")
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        user = db.get_or_create_user(name)
        return ApiResponse(message="User created successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.get("/users", response_model=UserListResponse)
async def list_users() -> UserListResponse:
    """List all users."""
    try:
        # Get full user objects instead of just names
        all_users = db.users.all()
        users = [user for user in all_users]  # Each user is already a dict with id, name, created_at
        return UserListResponse(users=users)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")


@router.delete("/users/{user_id}", response_model=ApiResponse)
async def delete_user(user_id: int) -> ApiResponse:
    """Delete a user by ID."""
    try:
        user = db.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        success = db.delete_user(user_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete user")

        # Send notification about user deletion
        send_notification(
            f"User '{user['name']}' (ID: {user_id}) has been deleted",
            title="User Deleted",
            priority="default"
        )

        return ApiResponse(message="User deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")