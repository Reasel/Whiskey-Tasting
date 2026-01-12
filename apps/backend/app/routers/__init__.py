"""API routers."""

from app.routers.config import router as config_router
from app.routers.health import router as health_router
from app.routers.tastings import router as tastings_router
from app.routers.themes import router as themes_router
from app.routers.users import router as users_router
from app.routers.whiskeys import router as whiskeys_router

__all__ = [
    "config_router",
    "health_router",
    "tastings_router",
    "themes_router",
    "users_router",
    "whiskeys_router",
]
