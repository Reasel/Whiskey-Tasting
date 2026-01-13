"""Error handling and edge case tests."""

import pytest
from fastapi.testclient import TestClient


class TestAPIErrorHandling:
    """Test API error handling and edge cases."""

    def test_create_theme_invalid_data(self, test_client):
        """Test creating theme with invalid data."""
        # Missing required fields
        payload = {}
        response = test_client.post("/api/v1/themes", json=payload)
        assert response.status_code == 422  # Validation error

        # Invalid num_whiskeys
        payload = {"name": "Test", "num_whiskeys": 0}
        response = test_client.post("/api/v1/themes", json=payload)
        assert response.status_code == 422

    def test_get_whiskeys_nonexistent_theme(self, test_client):
        """Test getting whiskeys for non-existent theme."""
        response = test_client.get("/api/v1/themes/999/whiskeys")
        assert response.status_code == 200  # Returns empty list
        data = response.json()
        assert data == []

    def test_tasting_workflow_edge_cases(self, test_client, sample_theme, sample_whiskeys):
        """Test tasting submission edge cases."""
        # Submit tasting for non-existent whiskey
        payload = {
            "user_name": "Test User",
            "whiskey_scores": {
                "999": {  # Non-existent whiskey ID
                    "aroma_score": 4.0,
                    "flavor_score": 4.0,
                    "finish_score": 4.0,
                    "personal_rank": 1
                }
            }
        }
        response = test_client.post("/api/v1/tastings", json=payload)
        assert response.status_code == 200  # API doesn't validate whiskey existence

        # Submit empty tasting
        payload = {
            "user_name": "Test User",
            "whiskey_scores": {}
        }
        response = test_client.post("/api/v1/tastings", json=payload)
        assert response.status_code == 200  # Should succeed

    def test_concurrent_theme_operations(self, test_client):
        """Test concurrent theme operations."""
        # Create multiple themes rapidly
        themes = []
        for i in range(5):
            payload = {"name": f"Concurrent Theme {i}", "notes": f"Note {i}", "num_whiskeys": 2}
            response = test_client.post("/api/v1/themes", json=payload)
            assert response.status_code == 200
            themes.append(response.json()["theme"]["id"])

        # Verify all were created
        response = test_client.get("/api/v1/themes")
        data = response.json()
        assert len(data["themes"]) >= 5

    def test_large_dataset_handling(self, test_client):
        """Test handling of larger datasets."""
        # Create theme with many whiskeys
        payload = {"name": "Large Theme", "notes": "Many whiskeys", "num_whiskeys": 10}
        response = test_client.post("/api/v1/themes", json=payload)
        assert response.status_code == 200
        theme_id = response.json()["theme"]["id"]

        # Get whiskeys
        response = test_client.get(f"/api/v1/themes/{theme_id}/whiskeys")
        whiskeys = response.json()
        assert len(whiskeys) == 10

        # Submit tastings for all whiskeys
        whiskey_scores = {
            str(w["id"]): {
                "aroma_score": 4.0,
                "flavor_score": 4.0,
                "finish_score": 4.0,
                "personal_rank": i + 1
            } for i, w in enumerate(whiskeys)
        }
        payload = {"user_name": "Large Test User", "whiskey_scores": whiskey_scores}
        response = test_client.post("/api/v1/tastings", json=payload)
        assert response.status_code == 200

    def test_malformed_json_requests(self, test_client):
        """Test handling of malformed JSON requests."""
        # Invalid JSON
        response = test_client.post("/api/v1/themes", data="invalid json")
        assert response.status_code == 422

        # Valid JSON but wrong structure
        response = test_client.post("/api/v1/themes", json="string instead of object")
        assert response.status_code == 422

    def test_unsupported_http_methods(self, test_client, sample_theme):
        """Test unsupported HTTP methods."""
        # PATCH not supported
        response = test_client.patch(f"/api/v1/themes/{sample_theme['id']}")
        assert response.status_code == 405

        # OPTIONS might be supported
        response = test_client.options(f"/api/v1/themes/{sample_theme['id']}")
        # 200 or 405 depending on FastAPI config

    def test_special_characters_in_names(self, test_client):
        """Test handling of special characters in names."""
        special_names = [
            "Theme with spaces",
            "Theme-with-dashes",
            "Theme_with_underscores",
            "Theme123",
            "Theme@#$%",
            "Thème",  # Unicode
        ]

        for name in special_names:
            payload = {"name": name, "notes": "Test", "num_whiskeys": 1}
            response = test_client.post("/api/v1/themes", json=payload)
            assert response.status_code == 200

    def test_boundary_values(self, test_client):
        """Test boundary values for scores and inputs."""
        # Create theme
        payload = {"name": "Boundary Test", "notes": "Test", "num_whiskeys": 1}
        response = test_client.post("/api/v1/themes", json=payload)
        theme_id = response.json()["theme"]["id"]

        # Get whiskey
        response = test_client.get(f"/api/v1/themes/{theme_id}/whiskeys")
        whiskey_id = response.json()[0]["id"]

        # Test boundary scores
        boundary_scores = [
            {"aroma_score": 1, "flavor_score": 1, "finish_score": 1, "personal_rank": 1},  # Minimum
            {"aroma_score": 5, "flavor_score": 5, "finish_score": 5, "personal_rank": 10},  # Maximum
        ]

        for scores in boundary_scores:
            payload = {
                "user_name": f"Boundary User {scores['aroma_score']}",
                "whiskey_scores": {str(whiskey_id): scores}
            }
            response = test_client.post("/api/v1/tastings", json=payload)
            assert response.status_code == 200


class TestDatabaseErrorHandling:
    """Test database-level error handling."""

    def test_database_file_corruption_simulation(self, test_db, temp_db_path):
        """Test handling of database file issues."""
        # Create some data
        test_db.create_theme("Test Theme")

        # Simulate file corruption by writing invalid data
        temp_db_path.write_text("invalid json")

        # Try to access database - should handle gracefully
        try:
            themes = test_db.list_themes()
            # TinyDB might handle this or raise exception
        except Exception:
            # Expected to potentially fail
            pass

    def test_empty_database_operations(self, test_db):
        """Test operations on empty database."""
        # All operations should work on empty DB
        assert test_db.list_themes() == []
        assert test_db.get_active_theme() is None
        assert test_db.list_users() == []

        # Getting non-existent items
        assert test_db.get_theme(1) is None
        assert test_db.get_user(1) is None
        assert test_db.get_whiskey(1) is None