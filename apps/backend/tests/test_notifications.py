"""Notification system tests."""

import pytest
from unittest.mock import Mock, patch
from app.notifications import send_notification
from app.config import Settings


class TestSendNotification:
    """Test notification sending functionality."""

    @patch('app.notifications.requests.post')
    def test_send_notification_not_configured(self, mock_post):
        """Test notification is skipped when ntfy is not configured."""
        # Test with empty settings
        with patch('app.notifications.settings', Settings(ntfy_url="", ntfy_topic="")):
            send_notification("Test message")
            mock_post.assert_not_called()

    @patch('app.notifications.requests.post')
    def test_send_notification_basic(self, mock_post):
        """Test sending a basic notification."""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with patch('app.notifications.settings', Settings(
            ntfy_url="https://ntfy.sh",
            ntfy_topic="test-topic",
            ntfy_auth_user="",
            ntfy_auth_pass=""
        )):
            send_notification("Test message")

        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[0][0] == "https://ntfy.sh/test-topic"
        assert call_args[1]['headers']['Title'] == "Whiskey Tasting Notification"
        assert call_args[1]['data'] == b"Test message"
        assert call_args[1]['auth'] is None

    @patch('app.notifications.requests.post')
    def test_send_notification_with_title_and_priority(self, mock_post):
        """Test notification with custom title and priority."""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with patch('app.notifications.settings', Settings(
            ntfy_url="https://ntfy.sh",
            ntfy_topic="test-topic",
            ntfy_auth_user="",
            ntfy_auth_pass=""
        )):
            send_notification("Test message", title="Custom Title", priority="high")

        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]['headers']['Title'] == "Custom Title"
        assert call_args[1]['headers']['Priority'] == "high"

    @patch('app.notifications.requests.post')
    def test_send_notification_with_auth(self, mock_post):
        """Test notification with authentication."""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        with patch('app.notifications.settings', Settings(
            ntfy_url="https://ntfy.sh",
            ntfy_topic="test-topic",
            ntfy_auth_user="user",
            ntfy_auth_pass="pass"
        )):
            send_notification("Test message")

        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]['auth'] == ("user", "pass")

    @patch('app.notifications.requests.post')
    def test_send_notification_request_exception(self, mock_post):
        """Test handling of request exceptions."""
        from requests.exceptions import RequestException
        mock_post.side_effect = RequestException("Network error")

        with patch('app.notifications.settings', Settings(
            ntfy_url="https://ntfy.sh",
            ntfy_topic="test-topic"
        )):
            # Should not raise exception, just log error
            send_notification("Test message")

        mock_post.assert_called_once()


class TestSettingsValidation:
    """Test ntfy configuration validation."""

    def test_valid_config(self):
        """Test valid ntfy configuration."""
        settings = Settings(
            ntfy_url="https://ntfy.sh",
            ntfy_topic="test-topic"
        )
        # Should not raise exception

    def test_missing_topic(self):
        """Test validation when topic is missing."""
        with pytest.raises(ValueError, match="NTFY_TOPIC must be set if NTFY_URL is provided"):
            Settings(ntfy_url="https://ntfy.sh", ntfy_topic="")

    def test_missing_url(self):
        """Test validation when URL is missing."""
        with pytest.raises(ValueError, match="NTFY_URL must be set if NTFY_TOPIC is provided"):
            Settings(ntfy_url="", ntfy_topic="test-topic")

    def test_partial_auth(self):
        """Test validation when only one auth field is set."""
        with pytest.raises(ValueError, match="Both NTFY_AUTH_USER and NTFY_AUTH_PASS must be set together"):
            Settings(
                ntfy_url="https://ntfy.sh",
                ntfy_topic="test-topic",
                ntfy_auth_user="user",
                ntfy_auth_pass=""
            )

        with pytest.raises(ValueError, match="Both NTFY_AUTH_USER and NTFY_AUTH_PASS must be set together"):
            Settings(
                ntfy_url="https://ntfy.sh",
                ntfy_topic="test-topic",
                ntfy_auth_user="",
                ntfy_auth_pass="pass"
            )