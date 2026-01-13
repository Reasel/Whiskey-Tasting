"""API endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


class TestHealthAPI:
    """Test health check endpoints."""

    def test_health_check(self, test_client):
        """Test health check endpoint."""
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_status_endpoint(self, test_client):
        """Test status endpoint."""
        response = test_client.get("/api/v1/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database_stats" in data


class TestConfigAPI:
    """Test configuration endpoints."""

    def test_get_language_config(self, test_client):
        """Test getting language configuration."""
        response = test_client.get("/api/v1/config/language")
        assert response.status_code == 200
        data = response.json()
        assert "ui_language" in data
        assert "content_language" in data
        assert "supported_languages" in data

    def test_update_language_config(self, test_client):
        """Test updating language configuration."""
        payload = {"ui_language": "es", "content_language": "es"}
        response = test_client.put("/api/v1/config/language", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["ui_language"] == "es"
        assert data["content_language"] == "es"

    def test_update_language_config_invalid(self, test_client):
        """Test updating with invalid language."""
        payload = {"ui_language": "invalid"}
        response = test_client.put("/api/v1/config/language", json=payload)
        assert response.status_code == 400

    def test_reset_database(self, test_client):
        """Test resetting the database."""
        payload = {"confirm": "RESET_ALL_DATA"}
        response = test_client.post("/api/v1/config/reset", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_reset_database_invalid_confirm(self, test_client):
        """Test resetting with invalid confirmation."""
        payload = {"confirm": "wrong"}
        response = test_client.post("/api/v1/config/reset", json=payload)
        assert response.status_code == 400


class TestThemesAPI:
    """Test theme endpoints."""

    def test_create_theme(self, test_client):
        """Test creating a theme."""
        payload = {"name": "Test Theme", "notes": "Test notes", "num_whiskeys": 3}
        response = test_client.post("/api/v1/themes", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Theme created successfully"
        assert data["theme"]["name"] == "Test Theme"

    def test_list_themes(self, test_client, sample_theme):
        """Test listing themes."""
        response = test_client.get("/api/v1/themes")
        assert response.status_code == 200
        data = response.json()
        assert len(data["themes"]) == 1
        assert data["themes"][0]["name"] == sample_theme["name"]

    def test_get_active_theme(self, test_client, sample_theme):
        """Test getting active theme."""
        response = test_client.get("/api/v1/themes/active")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_theme["name"]

    def test_set_active_theme_not_found(self, test_client):
        """Test setting non-existent theme as active."""
        response = test_client.put("/api/v1/themes/999/active")
        assert response.status_code == 404

    def test_update_theme_not_found(self, test_client):
        """Test updating non-existent theme."""
        payload = {"name": "Updated Theme"}
        response = test_client.put("/api/v1/themes/999", json=payload)
        assert response.status_code == 404

    def test_delete_theme_not_found(self, test_client):
        """Test deleting non-existent theme."""
        response = test_client.delete("/api/v1/themes/999")
        assert response.status_code == 404


class TestWhiskeysAPI:
    """Test whiskey endpoints."""

    def test_get_whiskeys_by_theme(self, test_client, sample_theme, sample_whiskeys):
        """Test getting whiskeys by theme."""
        response = test_client.get(f"/api/v1/themes/{sample_theme['id']}/whiskeys")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert all(w["theme_id"] == sample_theme["id"] for w in data)

    def test_update_whiskeys(self, test_client, sample_theme):
        """Test updating whiskeys for a theme."""
        payload = {
            "whiskeys": [
                {"name": "Whiskey A", "proof": 40.0},
                {"name": "Whiskey B", "proof": 45.0}
            ]
        }
        response = test_client.put(f"/api/v1/themes/{sample_theme['id']}/whiskeys", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Whiskeys updated successfully"

        # Verify whiskeys were updated
        response = test_client.get(f"/api/v1/themes/{sample_theme['id']}/whiskeys")
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Whiskey A"


class TestUsersAPI:
    """Test user endpoints."""

    def test_create_user(self, test_client):
        """Test creating a user."""
        payload = {"name": "Test User"}
        response = test_client.post("/api/v1/users", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User created successfully"

class TestTastingsAPI:
    """Test tasting endpoints."""

    def test_submit_tasting(self, test_client, sample_theme, sample_whiskeys):
        """Test submitting a tasting."""
        payload = {
            "user_name": "Test User",
            "whiskey_scores": {
                str(sample_whiskeys[0]["id"]): {
                    "aroma_score": 4.2,
                    "flavor_score": 4.1,
                    "finish_score": 3.5,
                    "personal_rank": 2
                }
            }
        }
        response = test_client.post("/api/v1/tastings", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Tasting submitted successfully"

    def test_get_theme_scores_not_found(self, test_client):
        """Test getting scores for non-existent theme."""
        response = test_client.get("/api/v1/tastings/themes/999/scores")
        assert response.status_code == 404

    def test_get_user_tastings_theme_not_found(self, test_client):
        """Test getting user tastings for non-existent theme."""
        response = test_client.get("/api/v1/tastings/users/Test/themes/999")
        assert response.status_code == 404

    def test_get_user_tastings_user_not_found(self, test_client, sample_theme):
        """Test getting tastings for non-existent user."""
        response = test_client.get(f"/api/v1/tastings/users/Nonexistent/themes/{sample_theme['id']}")
        assert response.status_code == 404


class TestRootAPI:
    """Test root endpoint."""

    def test_root_endpoint(self, test_client):
        """Test root endpoint."""
        response = test_client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "docs" in data