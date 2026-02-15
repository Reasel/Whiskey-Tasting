# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whiskey Tasting is a web application for organizing whiskey tasting events. It allows administrators to set up themes and whiskeys for tastings, participants to submit ratings on aroma, flavor, and finish, and everyone to view results and rankings.

The application is designed to be simple and accessible, including for elderly users who may not be comfortable with technology. For this reason, it has minimal authentication—participants enter only their names to join a tasting, with no passwords, accounts, or complex login processes.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (React 19) with TypeScript, Tailwind CSS 4, deployed on port 3010
- **Backend**: FastAPI (Python 3.13) with TinyDB (file-based JSON database), deployed on port 8010
- **Deployment**: Docker multi-stage build, CI/CD via GitHub Actions

### Monorepo Structure
```
apps/
├── backend/          # FastAPI backend API
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point, router mounting
│   │   ├── database.py       # TinyDB wrapper with table accessors
│   │   ├── config.py         # Pydantic settings, CORS, ntfy notifications
│   │   ├── notifications.py  # ntfy notification logic
│   │   ├── routers/          # API route modules (themes, whiskeys, users, tastings, health, config)
│   │   └── schemas/          # Pydantic models for API requests/responses
│   ├── data/                 # TinyDB database storage (database.json)
│   ├── tests/                # Pytest test suite
│   └── pyproject.toml        # Python dependencies via pip/uv
└── frontend/         # Next.js SSR application
    ├── app/                  # Next.js App Router pages
    │   ├── (default)/        # Route group for main pages
    │   ├── administration/   # Admin panel
    │   ├── edit-themes/      # Theme management
    │   ├── new-theme/        # Create new theme
    │   ├── tasting-submission/  # Submit tasting scores
    │   ├── dashboard/        # Results dashboard
    │   ├── data-view/        # Raw data view
    │   ├── add-user/         # User management
    │   └── delete-user/      # User deletion
    ├── components/           # React components (ui/, common/, home/)
    ├── lib/                  # Utilities and API clients
    │   ├── api/              # API client modules (client.ts, themes.ts, users.ts, tastings.ts)
    │   ├── config/           # Configuration utilities
    │   └── utils/            # Helper functions
    └── package.json          # Node.js dependencies
```

### Data Flow & Key Concepts

**Active Theme**: The "active" theme is determined by the most recent `created_at` timestamp, not an explicit active flag. This is critical for understanding which theme is currently in use.

**Database**: TinyDB is a file-based JSON database stored in `apps/backend/data/database.json`. All operations are synchronous (TinyDB limitation), but FastAPI endpoints are async. The Database class in `database.py` provides table accessors: `themes`, `whiskeys`, `users`, `tastings`.

**API Communication**: Frontend uses centralized API client (`lib/api/client.ts`) that auto-configures based on environment:
- Development: `http://localhost:8010`
- Production: Configurable via `NEXT_PUBLIC_API_URL` env var (supports `relative` for reverse proxy setups)

**CORS Configuration**: Backend CORS is configured in `app/config.py` with default localhost origins plus optional additional origins via `CORS_ORIGINS_STR_ADDITIONAL` env var.

**Not All Routers Mounted**: The backend has router modules for tastings, whiskeys, users in `app/routers/`, but not all may be actively mounted in `main.py`. Check `main.py` to see which routers are included.

## Development Commands

### Backend

```bash
# Start dev server (from apps/backend)
uv sync
uv run uvicorn app.main:app --reload --port 8010

# Run tests
uv run --python python3 pytest

# Run specific test file
uv run --python python3 pytest tests/test_api.py

# Run tests with options
uv run --python python3 pytest -v -k "test_name" --tb=short

# NixOS users: wrap Python commands
nix-shell ./nix/pythonShell.nix --run "cd apps/backend && python3 -m pytest"
```

### Frontend

```bash
# Start dev server with turbopack (from apps/frontend)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Remote deployment example
HOST=192.168.1.100 docker-compose up -d
```

### Testing

**Backend Test Suite**: Comprehensive pytest suite covering unit tests, API tests, integration tests, and error handling.

Test files:
- `test_database.py`: Database operations and business logic
- `test_api.py`: REST API endpoints
- `test_integration.py`: Complete workflows
- `test_error_handling.py`: Edge cases and error conditions

All tests must pass before merging. Target coverage: >80%.

**Browser Testing (NixOS)**: Built-in browser tools fail on NixOS. Use custom Puppeteer script:
```bash
cd apps/frontend
node browser-test.js launch http://localhost:3010
node browser-test.js click <selector>
node browser-test.js type <selector> <text>
node browser-test.js close
```

## Environment Configuration

### Backend Environment Variables

- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8010`)
- `CORS_ORIGINS_STR_ADDITIONAL`: Additional CORS origins (comma-separated)
- `NTFY_URL`: ntfy notification server URL
- `NTFY_TOPIC`: ntfy topic for notifications
- `NTFY_AUTH_USER`: ntfy authentication username
- `NTFY_AUTH_PASS`: ntfy authentication password

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
  - Default: `http://localhost:8010`
  - Remote: `http://YOUR_HOST:8010`
  - Reverse proxy: `relative` (uses `/api/v1/*` paths)
- `PORT`: Next.js server port (default: `3010`)
- `HOSTNAME`: Next.js server hostname (default: `0.0.0.0` for containers)
- `ADMIN_PASSWORD`: Admin panel password (default: `admin`)

## Code Style & Patterns

**Prettier Config**:
- `semi: true`
- `singleQuote: true`
- `printWidth: 100`
- `tabWidth: 2`
- `trailingComma: es5`

**ESLint**: Next.js + TypeScript + Prettier

**Python**: Follow FastAPI and Pydantic patterns. All database operations use TinyDB Query API.

## NixOS Considerations

When modifying Python dependencies in `apps/backend/pyproject.toml` or `apps/backend/requirements.txt`, also update `nix/pythonShell.nix` to maintain consistency across environments.

All `uv` commands require `--python python3` flag on NixOS.

Windows-specific asyncio fix is included in `main.py` for Playwright compatibility.

## CI/CD Pipeline

- **Staging**: Auto-deployed on push to `master` → `reasel/whiskey-tasting:staging`
- **Production**: Auto-deployed on version tags (`v*`) → `reasel/whiskey-tasting:latest` and versioned tags
- GitHub releases created automatically for production deployments
- Tests run on all PRs and pushes to `master`

## Additional Documentation

- `AGENTS.md`: Detailed build/test commands and project patterns
- `SETUP.md`: Step-by-step local setup instructions
- `README.md`: Project overview and Docker deployment
- `NTFY.md`: Notification system configuration
