"""User management endpoints."""

from fastapi import APIRouter, HTTPException

from app.database import db
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
        users = db.list_users()
        return UserListResponse(users=users)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list users: {str(e)}")