"""Unit tests for database operations."""

import pytest

from app.database import Database


class TestDatabaseThemes:
    """Test theme database operations."""

    def test_create_theme(self, test_db):
        """Test creating a theme."""
        theme = test_db.create_theme("Test Theme", "Test notes")
        assert theme["name"] == "Test Theme"
        assert theme["notes"] == "Test notes"
        assert "id" in theme
        assert "created_at" in theme

    def test_get_theme(self, test_db):
        """Test getting a theme by ID."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        retrieved = test_db.get_theme(theme["id"])
        assert retrieved == theme

    def test_get_theme_not_found(self, test_db):
        """Test getting a non-existent theme."""
        theme = test_db.get_theme(999)
        assert theme is None

    def test_list_themes(self, test_db):
        """Test listing all themes."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        themes = test_db.list_themes()
        assert len(themes) == 1
        assert themes[0] == theme

    def test_get_active_theme(self, test_db):
        """Test getting the active theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        active = test_db.get_active_theme()
        assert active == theme

    def test_set_active_theme(self, test_db):
        """Test setting a theme as active."""
        theme1 = test_db.create_theme("Theme 1")
        theme2 = test_db.create_theme("Theme 2")

        # Initially, theme2 should be active (most recent)
        active = test_db.get_active_theme()
        assert active["id"] == theme2["id"]

        # Set theme1 as active
        success = test_db.set_active_theme(theme1["id"])
        assert success

        active = test_db.get_active_theme()
        assert active["id"] == theme1["id"]

    def test_set_active_theme_not_found(self, test_db):
        """Test setting a non-existent theme as active."""
        success = test_db.set_active_theme(999)
        assert not success

    def test_update_theme(self, test_db):
        """Test updating a theme."""
        theme = test_db.create_theme("Test Theme", "Original notes")
        updates = {"name": "Updated Theme", "notes": "Updated notes"}
        updated = test_db.update_theme(theme["id"], updates)
        assert updated["name"] == "Updated Theme"
        assert updated["notes"] == "Updated notes"

    def test_update_theme_not_found(self, test_db):
        """Test updating a non-existent theme."""
        updated = test_db.update_theme(999, {"name": "Test"})
        assert updated is None

    def test_delete_theme(self, test_db):
        """Test deleting a theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        success = test_db.delete_theme(theme["id"])
        assert success

        # Theme should be gone
        retrieved = test_db.get_theme(theme["id"])
        assert retrieved is None

    def test_delete_theme_not_found(self, test_db):
        """Test deleting a non-existent theme."""
        success = test_db.delete_theme(999)
        assert not success


class TestDatabaseWhiskeys:
    """Test whiskey database operations."""

    def test_create_whiskey(self, test_db):
        """Test creating a whiskey."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        assert whiskey["name"] == "Test Whiskey"
        assert whiskey["proof"] == 45.0
        assert whiskey["theme_id"] == theme["id"]
        assert "id" in whiskey

    def test_get_whiskey(self, test_db):
        """Test getting a whiskey by ID."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        retrieved = test_db.get_whiskey(whiskey["id"])
        assert retrieved == whiskey

    def test_get_whiskey_not_found(self, test_db):
        """Test getting a non-existent whiskey."""
        whiskey = test_db.get_whiskey(999)
        assert whiskey is None

    def test_get_whiskeys_by_theme(self, test_db):
        """Test getting whiskeys by theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        test_db.create_whiskey(theme["id"], "Whiskey 1", 40.0)
        test_db.create_whiskey(theme["id"], "Whiskey 2", 45.0)
        test_db.create_whiskey(theme["id"], "Whiskey 3", 50.0)
        whiskeys = test_db.get_whiskeys_by_theme(theme["id"])
        assert len(whiskeys) == 3
        assert all(w["theme_id"] == theme["id"] for w in whiskeys)

    def test_update_whiskey(self, test_db):
        """Test updating a whiskey."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        updates = {"name": "Updated Whiskey", "proof": 50.0}
        updated = test_db.update_whiskey(whiskey["id"], updates)
        assert updated["name"] == "Updated Whiskey"
        assert updated["proof"] == 50.0

    def test_update_whiskey_not_found(self, test_db):
        """Test updating a non-existent whiskey."""
        updated = test_db.update_whiskey(999, {"name": "Test"})
        assert updated is None

    def test_delete_whiskeys_by_theme(self, test_db):
        """Test deleting whiskeys by theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        test_db.create_whiskey(theme["id"], "Whiskey 1", 40.0)
        test_db.create_whiskey(theme["id"], "Whiskey 2", 45.0)
        test_db.create_whiskey(theme["id"], "Whiskey 3", 50.0)
        count = test_db.delete_whiskeys_by_theme(theme["id"])
        assert count == 3

        # Whiskeys should be gone
        whiskeys = test_db.get_whiskeys_by_theme(theme["id"])
        assert len(whiskeys) == 0


class TestDatabaseUsers:
    """Test user database operations."""

    def test_get_or_create_user_new(self, test_db):
        """Test creating a new user."""
        user = test_db.get_or_create_user("New User")
        assert user["name"] == "New User"
        assert "id" in user

    def test_get_or_create_user_existing(self, test_db):
        """Test getting an existing user."""
        user1 = test_db.get_or_create_user("Alice")
        user2 = test_db.get_or_create_user("Alice")
        assert user2["name"] == "Alice"
        assert user2["id"] == user1["id"]

    def test_get_user(self, test_db):
        """Test getting a user by ID."""
        user = test_db.get_or_create_user("Alice")
        retrieved = test_db.get_user(user["id"])
        assert retrieved == user

    def test_get_user_not_found(self, test_db):
        """Test getting a non-existent user."""
        user = test_db.get_user(999)
        assert user is None

    def test_get_user_by_name(self, test_db):
        """Test getting a user by name."""
        user = test_db.get_or_create_user("Alice")
        retrieved = test_db.get_user_by_name("Alice")
        assert retrieved == user

    def test_get_user_by_name_not_found(self, test_db):
        """Test getting a non-existent user by name."""
        user = test_db.get_user_by_name("Nonexistent")
        assert user is None

    def test_list_users(self, test_db):
        """Test listing all users."""
        test_db.get_or_create_user("Alice")
        test_db.get_or_create_user("Bob")
        test_db.get_or_create_user("Charlie")
        users = test_db.list_users()
        assert len(users) == 3
        assert set(users) == {"Alice", "Bob", "Charlie"}


class TestDatabaseTastings:
    """Test tasting database operations."""

    def test_create_or_update_tasting_new(self, test_db):
        """Test creating a new tasting."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        user = test_db.get_or_create_user("Alice")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        tasting = test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=4.2,
            flavor_score=4.1,
            finish_score=3.5,
            personal_rank=2
        )
        assert tasting["user_id"] == user["id"]
        assert tasting["whiskey_id"] == whiskey["id"]
        assert tasting["aroma_score"] == 4.2
        assert tasting["flavor_score"] == 4.1
        assert tasting["finish_score"] == 3.5
        assert tasting["personal_rank"] == 2

    def test_create_or_update_tasting_update(self, test_db):
        """Test updating an existing tasting."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        user = test_db.get_or_create_user("Alice")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        # Create initial tasting
        tasting1 = test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=4.2,
            flavor_score=4.1,
            finish_score=3.5,
            personal_rank=2
        )

        # Update it
        tasting2 = test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=5.0,
            flavor_score=5.0,
            finish_score=4.0,
            personal_rank=1
        )

        assert tasting2["id"] == tasting1["id"]
        assert tasting2["aroma_score"] == 5.0
        assert tasting2["personal_rank"] == 1

    def test_get_tastings_by_theme(self, test_db):
        """Test getting tastings by theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        users = [test_db.get_or_create_user(f"User {i}") for i in range(3)]
        whiskeys = [test_db.create_whiskey(theme["id"], f"Whiskey {i}", 40.0 + i * 5) for i in range(3)]
        # Create some tastings
        for user in users:
            for whiskey in whiskeys:
                test_db.create_or_update_tasting(
                    user_id=user["id"],
                    whiskey_id=whiskey["id"],
                    aroma_score=4.0,
                    flavor_score=4.0,
                    finish_score=4.0,
                    personal_rank=1
                )

        tastings = test_db.get_tastings_by_theme(theme["id"])
        assert len(tastings) == 9  # 3 users * 3 whiskeys

    def test_get_user_tastings_for_theme(self, test_db):
        """Test getting user tastings for a theme."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        user = test_db.get_or_create_user("Alice")
        whiskeys = [test_db.create_whiskey(theme["id"], f"Whiskey {i}", 40.0 + i * 5) for i in range(3)]
        # Create tastings for user
        for whiskey in whiskeys:
            test_db.create_or_update_tasting(
                user_id=user["id"],
                whiskey_id=whiskey["id"],
                aroma_score=4.0,
                flavor_score=4.0,
                finish_score=4.0,
                personal_rank=1
            )

        tastings = test_db.get_user_tastings_for_theme(user["id"], theme["id"])
        assert len(tastings) == 3


class TestDatabaseStats:
    """Test database statistics."""

    def test_get_stats(self, test_db):
        """Test getting database statistics."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        test_db.create_whiskey(theme["id"], "Whiskey 1", 40.0)
        test_db.create_whiskey(theme["id"], "Whiskey 2", 45.0)
        test_db.create_whiskey(theme["id"], "Whiskey 3", 50.0)
        test_db.get_or_create_user("Alice")
        test_db.get_or_create_user("Bob")
        test_db.get_or_create_user("Charlie")
        stats = test_db.get_stats()
        assert stats["total_themes"] == 1
        assert stats["total_whiskeys"] == 3
        assert stats["total_users"] == 3
        assert stats["total_tastings"] == 0  # No tastings created yet

    def test_reset_database(self, test_db):
        """Test resetting the database."""
        theme = test_db.create_theme("Test Theme", "A theme for testing")
        user = test_db.get_or_create_user("Alice")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        # Create a tasting
        test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=4.0,
            flavor_score=4.0,
            finish_score=4.0,
            personal_rank=1
        )

        # Verify data exists
        assert len(test_db.list_themes()) == 1
        assert len(test_db.get_whiskeys_by_theme(theme["id"])) == 1
        assert len(test_db.list_users()) == 1
        assert len(test_db.get_tastings_by_theme(theme["id"])) == 1

        # Reset
        test_db.reset_database()

        # Verify all data is gone
        assert len(test_db.list_themes()) == 0
        assert len(test_db.get_whiskeys_by_theme(theme["id"])) == 0
        assert len(test_db.list_users()) == 0
        assert len(test_db.get_tastings_by_theme(theme["id"])) == 0