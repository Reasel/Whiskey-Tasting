# NTFY Notifications Configuration

This document explains how to configure and use NTFY (Notify) notifications in the Whiskey Tasting application.

## Overview

NTFY is a simple HTTP-based pub-sub notification service. The application can send notifications for important events such as:
- New tasting submissions
- Theme activations
- User actions
- System alerts

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# URL of the ntfy server (e.g., https://ntfy.sh or self-hosted server)
NTFY_URL=https://ntfy.sh

# Topic name to send notifications to (alphanumeric, dashes, underscores only)
NTFY_TOPIC=whiskey-tastings

# Optional: Authentication username for private ntfy servers
NTFY_AUTH_USER=your_username

# Optional: Authentication password for private ntfy servers
NTFY_AUTH_PASS=your_password
```

### Docker Configuration

For Docker deployment, environment variables are passed through the `docker-compose.yml`:

```yaml
environment:
  - NTFY_URL=${NTFY_URL}
  - NTFY_TOPIC=${NTFY_TOPIC}
  - NTFY_AUTH_USER=${NTFY_AUTH_USER}
  - NTFY_AUTH_PASS=${NTFY_AUTH_PASS}
```

## Usage

### Subscribing to Notifications

To receive notifications, subscribe to your topic using one of these methods:

1. **Web Dashboard**: Visit `https://ntfy.sh/YOUR_TOPIC` (replace with your topic name)

2. **Mobile Apps**: Download ntfy apps for Android/iOS and subscribe to `https://ntfy.sh/YOUR_TOPIC`

3. **Command Line**:
   ```bash
   # Install ntfy CLI
   curl -fsSL https://bit.ly/install-ntfy | bash

   # Subscribe to topic
   ntfy subscribe https://ntfy.sh/YOUR_TOPIC
   ```

### Notification Types

The application sends different types of notifications with appropriate priorities:

- **Default Priority**: Regular notifications (user actions, submissions)
- **High Priority**: Important system events (errors, urgent updates)

### Self-Hosting NTFY

For complete control, you can self-host an ntfy server:

```bash
# Using Docker
docker run -p 80:80 binwiederhier/ntfy
```

Then configure your `NTFY_URL` to point to your self-hosted instance.

## Common Configuration Examples

### Using Public NTFY (ntfy.sh)

```env
NTFY_URL=https://ntfy.sh
NTFY_TOPIC=my-whiskey-app
```

### Self-Hosted NTFY

```env
NTFY_URL=http://localhost:80
NTFY_TOPIC=whiskey-notifications
```

### With Authentication (Self-Hosted)

```env
NTFY_URL=https://ntfy.your-domain.com
NTFY_TOPIC=secure-whiskey-app
NTFY_AUTH_USER=whiskeyuser
NTFY_AUTH_PASS=securepassword
```

## Troubleshooting

### Notifications Not Sending

1. **Check Configuration**: Ensure `NTFY_URL` and `NTFY_TOPIC` are set correctly
2. **Network Connectivity**: Verify the backend can reach the ntfy server
3. **Authentication**: If using authentication, ensure both user and password are set
4. **Server Logs**: Check application logs for notification errors

### Subscription Issues

1. **Topic Name**: Ensure you're subscribing to the exact topic name configured
2. **Access Permissions**: For private servers, ensure your credentials have access
3. **Network Connectivity**: Verify your device can reach the ntfy server

## Security Considerations

- Use HTTPS for ntfy URL when possible
- Consider authentication for private or sensitive notifications
- Choose topic names that are unique to avoid conflicts
- Monitor notification usage to prevent abuse

## Advanced Features

### Custom Priority Levels

Notifications support different priority levels:
- `min`, `low`, `default`, `high`, `urgent`

These are automatically set by the application based on the notification type.

### Notification Headers

The system includes appropriate titles and priorities with each notification for better organization in clients.