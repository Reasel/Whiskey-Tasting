"""Integration tests for full workflows."""

import pytest


class TestFullWorkflow:
    """Test complete whiskey tasting workflow."""

    def test_configuration_workflow(self, test_client):
        """Test configuration management workflow."""
        # Get initial config
        response = test_client.get("/api/v1/config/language")
        assert response.status_code == 200
        initial_config = response.json()

        # Update config
        update_payload = {"ui_language": "es", "content_language": "es"}
        response = test_client.put("/api/v1/config/language", json=update_payload)
        assert response.status_code == 200

        # Verify update
        response = test_client.get("/api/v1/config/language")
        assert response.status_code == 200
        updated_config = response.json()
        assert updated_config["ui_language"] == "es"
        assert updated_config["content_language"] == "es"

    def test_database_reset_workflow(self, test_client):
        """Test database reset workflow."""
        # Create some data
        theme_payload = {"name": "Reset Test", "notes": "Test", "num_whiskeys": 1}
        test_client.post("/api/v1/themes", json=theme_payload)

        # Verify data exists
        response = test_client.get("/api/v1/themes")
        assert len(response.json()["themes"]) > 0

        # Reset database
        reset_payload = {"confirm": "RESET_ALL_DATA"}
        response = test_client.post("/api/v1/config/reset", json=reset_payload)
        assert response.status_code == 200

        # Verify data is gone
        response = test_client.get("/api/v1/themes")
        assert len(response.json()["themes"]) == 0

    def test_health_and_status_workflow(self, test_client):
        """Test health and status endpoints."""
        # Health check
        response = test_client.get("/api/v1/health")
        assert response.status_code == 200
        health = response.json()
        assert health["status"] == "healthy"

        # Status check
        response = test_client.get("/api/v1/status")
        assert response.status_code == 200
        status = response.json()
        assert "database_stats" in status
        assert "status" in status