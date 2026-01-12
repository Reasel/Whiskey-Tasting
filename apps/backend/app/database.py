"""TinyDB database layer for whiskey tasting data."""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tinydb import Query, TinyDB
from tinydb.table import Table

from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """TinyDB wrapper for whiskey tasting data."""

    def __init__(self, db_path: Path | None = None):
        self.db_path = db_path or settings.db_path()
        logger.info(f"Initializing database at path: {self.db_path}")
        logger.info(f"Database directory exists: {self.db_path.parent.exists()}")
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        logger.info(f"Database directory created/exists: {self.db_path.parent.exists()}")
        logger.info(f"Database file exists: {self.db_path.exists()}")

        # Check permissions
        try:
            # Try to write a test file to check if directory is writable
            test_file = self.db_path.parent / ".write_test"
            test_file.write_text("test")
            test_file.unlink()
            logger.info("Database directory is writable")
        except Exception as e:
            logger.error(f"Database directory is not writable: {e}")

        self._db: TinyDB | None = None

    @property
    def db(self) -> TinyDB:
        """Lazy initialization of TinyDB instance."""
        if self._db is None:
            self._db = TinyDB(self.db_path)
        return self._db

    @property
    def themes(self) -> Table:
        """Themes table."""
        return self.db.table("themes")

    @property
    def whiskeys(self) -> Table:
        """Whiskeys table."""
        return self.db.table("whiskeys")

    @property
    def users(self) -> Table:
        """Users table."""
        return self.db.table("users")

    @property
    def tastings(self) -> Table:
        """Tastings table."""
        return self.db.table("tastings")

    def close(self) -> None:
        """Close database connection."""
        if self._db is not None:
            self._db.close()
            self._db = None

    # Theme operations
    def create_theme(self, name: str, notes: str = "") -> dict[str, Any]:
        """Create a new tasting theme."""
        logger.info(f"Creating theme: name='{name}', notes='{notes}'")
        now = datetime.now(timezone.utc).isoformat()

        doc = {
            "id": None,  # Will be set by autoincrement
            "name": name,
            "notes": notes,
            "created_at": now,
        }
        try:
            theme_id = self.themes.insert(doc)
            logger.info(f"Theme inserted with ID: {theme_id}")
            doc["id"] = theme_id
            self.themes.update({"id": theme_id}, doc_ids=[theme_id])
            logger.info(f"Theme creation successful: {doc}")
            return doc
        except Exception as e:
            logger.error(f"Failed to create theme: {e}")
            raise

    def get_theme(self, theme_id: int) -> dict[str, Any] | None:
        """Get theme by ID."""
        Theme = Query()
        result = self.themes.search(Theme.id == theme_id)
        return result[0] if result else None

    def get_current_theme(self) -> dict[str, Any] | None:
        """Get the most recent theme."""
        all_themes = self.themes.all()
        if not all_themes:
            return None
        # Sort by created_at descending and return the first (most recent)
        return sorted(all_themes, key=lambda x: x.get("created_at", ""), reverse=True)[0]

    def list_themes(self) -> list[dict[str, Any]]:
        """List all themes."""
        return list(self.themes.all())

    def get_active_theme(self) -> dict[str, Any] | None:
        """Get the active theme (alias for get_current_theme)."""
        return self.get_current_theme()

    def set_active_theme(self, theme_id: int) -> bool:
        """Set a theme as active by updating its timestamp."""
        theme = self.get_theme(theme_id)
        if not theme:
            return False

        # Update the theme's created_at to make it the most recent
        now = datetime.now(timezone.utc).isoformat()
        Theme = Query()
        self.themes.update({"created_at": now}, Theme.id == theme_id)
        return True

    def update_theme(self, theme_id: int, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update theme by ID."""
        Theme = Query()
        self.themes.update(updates, Theme.id == theme_id)
        return self.get_theme(theme_id)

    def delete_theme(self, theme_id: int) -> bool:
        """Delete theme by ID."""
        Theme = Query()
        removed = self.themes.remove(Theme.id == theme_id)
        if removed:
            # Also delete associated whiskeys and tastings
            self.delete_whiskeys_by_theme(theme_id)
            # Note: tastings are deleted via cascade when whiskeys are deleted
        return len(removed) > 0

    # Whiskey operations
    def create_whiskey(self, theme_id: int, name: str, proof: float | None = None) -> dict[str, Any]:
        """Create a new whiskey."""
        logger.info(f"Creating whiskey: theme_id={theme_id}, name='{name}', proof={proof}")
        now = datetime.now(timezone.utc).isoformat()

        doc = {
            "id": None,  # Will be set by autoincrement
            "theme_id": theme_id,
            "name": name,
            "proof": proof,
            "created_at": now,
        }
        try:
            whiskey_id = self.whiskeys.insert(doc)
            logger.info(f"Whiskey inserted with ID: {whiskey_id}")
            doc["id"] = whiskey_id
            self.whiskeys.update({"id": whiskey_id}, doc_ids=[whiskey_id])
            logger.info(f"Whiskey creation successful: {doc}")
            return doc
        except Exception as e:
            logger.error(f"Failed to create whiskey: {e}")
            raise

    def get_whiskey(self, whiskey_id: int) -> dict[str, Any] | None:
        """Get whiskey by ID."""
        Whiskey = Query()
        result = self.whiskeys.search(Whiskey.id == whiskey_id)
        return result[0] if result else None

    def get_whiskeys_by_theme(self, theme_id: int) -> list[dict[str, Any]]:
        """Get all whiskeys for a theme."""
        Whiskey = Query()
        return self.whiskeys.search(Whiskey.theme_id == theme_id)

    def update_whiskey(self, whiskey_id: int, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update whiskey by ID."""
        Whiskey = Query()
        self.whiskeys.update(updates, Whiskey.id == whiskey_id)
        return self.get_whiskey(whiskey_id)

    def delete_whiskeys_by_theme(self, theme_id: int) -> int:
        """Delete all whiskeys for a theme."""
        Whiskey = Query()
        removed = self.whiskeys.remove(Whiskey.theme_id == theme_id)
        return len(removed)

    # User operations
    def get_or_create_user(self, name: str) -> dict[str, Any]:
        """Get user by name or create if doesn't exist."""
        User = Query()
        result = self.users.search(User.name == name)
        if result:
            return result[0]

        # Create new user
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": None,
            "name": name,
            "created_at": now,
        }
        user_id = self.users.insert(doc)
        doc["id"] = user_id
        self.users.update({"id": user_id}, doc_ids=[user_id])
        return doc

    def get_user(self, user_id: int) -> dict[str, Any] | None:
        """Get user by ID."""
        User = Query()
        result = self.users.search(User.id == user_id)
        return result[0] if result else None

    def get_user_by_name(self, name: str) -> dict[str, Any] | None:
        """Get user by name."""
        User = Query()
        result = self.users.search(User.name == name)
        return result[0] if result else None

    def list_users(self) -> list[str]:
        """List all user names."""
        return [user["name"] for user in self.users.all()]

    # Tasting operations
    def create_or_update_tasting(
        self,
        user_id: int,
        whiskey_id: int,
        aroma_score: int,
        flavor_score: int,
        finish_score: int,
        personal_rank: int,
    ) -> dict[str, Any]:
        """Create or update a tasting entry."""
        now = datetime.now(timezone.utc).isoformat()

        Tasting = Query()
        existing = self.tastings.search(
            (Tasting.user_id == user_id) & (Tasting.whiskey_id == whiskey_id)
        )

        doc = {
            "user_id": user_id,
            "whiskey_id": whiskey_id,
            "aroma_score": aroma_score,
            "flavor_score": flavor_score,
            "finish_score": finish_score,
            "personal_rank": personal_rank,
            "updated_at": now,
        }

        if existing:
            # Update existing
            tasting_id = existing[0].doc_id
            self.tastings.update(doc, doc_ids=[tasting_id])
            doc["id"] = tasting_id
            doc["created_at"] = existing[0]["created_at"]
        else:
            # Create new
            doc["created_at"] = now
            tasting_id = self.tastings.insert(doc)
            doc["id"] = tasting_id
            self.tastings.update({"id": tasting_id}, doc_ids=[tasting_id])

        return doc

    def get_tastings_by_theme(self, theme_id: int) -> list[dict[str, Any]]:
        """Get all tastings for whiskeys in a theme."""
        # First get all whiskey IDs for this theme
        whiskeys = self.get_whiskeys_by_theme(theme_id)
        whiskey_ids = [w["id"] for w in whiskeys]

        if not whiskey_ids:
            return []

        Tasting = Query()
        return self.tastings.search(Tasting.whiskey_id.one_of(whiskey_ids))

    def get_user_tastings_for_theme(self, user_id: int, theme_id: int) -> list[dict[str, Any]]:
        """Get all tastings by a user for a theme."""
        whiskeys = self.get_whiskeys_by_theme(theme_id)
        whiskey_ids = [w["id"] for w in whiskeys]

        if not whiskey_ids:
            return []

        Tasting = Query()
        return self.tastings.search(
            (Tasting.user_id == user_id) & (Tasting.whiskey_id.one_of(whiskey_ids))
        )

    # Stats
    def get_stats(self) -> dict[str, Any]:
        """Get database statistics."""
        return {
            "total_themes": len(self.themes),
            "total_whiskeys": len(self.whiskeys),
            "total_users": len(self.users),
            "total_tastings": len(self.tastings),
        }

    def reset_database(self) -> None:
        """Reset the database by truncating all tables."""
        self.themes.truncate()
        self.whiskeys.truncate()
        self.users.truncate()
        self.tastings.truncate()


# Global database instance
db = Database()
