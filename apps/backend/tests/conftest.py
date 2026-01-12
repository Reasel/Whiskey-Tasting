"""Pytest configuration and fixtures."""

from pathlib import Path
import tempfile
from pathlib import Path

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
import httpx

from app.database import Database
from app.main import app as fastapi_app


@pytest.fixture
def temp_db_path():
    """Create a temporary database path for testing."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
        path = Path(f.name)
    yield path
    # Cleanup
    if path.exists():
        path.unlink()


@pytest.fixture
def test_db(temp_db_path):
    """Test database instance with temporary file."""
    db = Database(temp_db_path)
    yield db
    db.close()


@pytest.fixture
def sample_theme(test_db):
    """Create a sample theme for testing."""
    return test_db.create_theme("Test Theme", "A theme for testing")


@pytest.fixture
def sample_whiskeys(test_db, sample_theme):
    """Create sample whiskeys for the test theme."""
    whiskeys = []
    for i in range(3):
        whiskey = test_db.create_whiskey(
            theme_id=sample_theme["id"],
            name=f"Test Whiskey {i+1}",
            proof=40.0 + i * 5
        )
        whiskeys.append(whiskey)
    return whiskeys


@pytest.fixture
def sample_users(test_db):
    """Create sample users for testing."""
    users = []
    for name in ["Alice", "Bob", "Charlie"]:
        user = test_db.get_or_create_user(name)
        users.append(user)
    return users


@pytest.fixture
def test_client():
    """FastAPI test client with test database and sample data."""
    # Create test database
    temp_db_path = Path(tempfile.NamedTemporaryFile(suffix=".json", delete=False).name)
    test_db = Database(temp_db_path)

    # Create sample data
    sample_theme = test_db.create_theme("Test Theme", "A theme for testing")
    sample_whiskeys = []
    for i in range(3):
        whiskey = test_db.create_whiskey(
            theme_id=sample_theme["id"],
            name=f"Test Whiskey {i+1}",
            proof=40.0 + i * 5
        )
        sample_whiskeys.append(whiskey)

    sample_users = []
    for name in ["Alice", "Bob", "Charlie"]:
        user = test_db.get_or_create_user(name)
        sample_users.append(user)

    # Override the global db with test db
    import app.database
    original_db = app.database.db
    app.database.db = test_db

    # Make sample data available as attributes on the client
    with TestClient(fastapi_app) as client:
        client.sample_theme = sample_theme
        client.sample_whiskeys = sample_whiskeys
        client.sample_users = sample_users
        yield client

    # Restore original db
    app.database.db = original_db

    # Cleanup
    if temp_db_path.exists():
        temp_db_path.unlink()


@pytest.fixture
def sample_theme(test_client):
    """Get the sample theme from test client."""
    return test_client.sample_theme


@pytest.fixture
def sample_whiskeys(test_client):
    """Get the sample whiskeys from test client."""
    return test_client.sample_whiskeys


@pytest.fixture
def sample_users(test_client):
    """Get the sample users from test client."""
    return test_client.sample_users


@pytest_asyncio.fixture
async def api_client():
    """Async HTTP client for API testing."""
    async with httpx.AsyncClient(base_url="http://localhost:8010/api/v1") as client:
        yield client