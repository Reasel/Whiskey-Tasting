"""Pytest configuration and fixtures."""

import pytest
import pytest_asyncio
import httpx


@pytest_asyncio.fixture
async def api_client():
    """Async HTTP client for API testing."""
    async with httpx.AsyncClient(base_url="http://localhost:8010/api/v1") as client:
        yield client