# Whiskey Tasting Setup Guide

Welcome! This guide will walk you through setting up the Whiskey Tasting application on your local machine.

---

## Prerequisites

Make sure you have these installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| **Python** | 3.13+ | `python --version` |
| **Node.js** | 22+ | `node --version` |
| **npm** | 10+ | `npm --version` |
| **uv** | Latest | `uv --version` |
| **Git** | Any | `git --version` |

Install `uv` (Python package manager):
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# NixOs
# Wrap all python commands with:
nix-shell ./nix/pythonShell.nix --run "<YOUR COMMAND HERE>"
# Or simply open a new shell for use with
nix-shell ./nix/pythonShell.nix
# note for all python commands using nix
# All uv commands require `--python python3` flag (uv sync/troubleshooting via pip if fails)
```

---

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone and enter directory
git clone https://github.com/reasel/Whiskey-Tasting.git
cd Whiskey-Tasting

# 2. Start backend (Terminal 1)
cd apps/backend
uv sync
uv run uvicorn app.main:app --reload --port 8010

# 3. Start frontend (Terminal 2)
cd apps/frontend
npm install
npm run dev
```

Open **<http://localhost:3010>** - you're ready to go!

---

## Step-by-Step Setup

### 1. Clone Repository
```bash
git clone https://github.com/reasel/Whiskey-Tasting.git
cd Whiskey-Tasting
```

### 2. Backend Setup
```bash
cd apps/backend
uv sync  # Install dependencies
uv run uvicorn app.main:app --reload --port 8010
```

### 3. Frontend Setup
```bash
cd apps/frontend
npm install  # Install dependencies
npm run dev  # Start dev server
```

---

## Docker Setup (Alternative)

### Using Pre-built Image
For quick deployment without building from source, you can use the pre-built Docker image. Create a `docker-compose.yml` file with the following content:

```yaml
services:
  whiskey-tasting:
    image: reasel/whiskey-tasting:0.0.3
    container_name: whiskey-tasting
    ports:
      - 3010:3010
      - 8010:8010
    volumes:
      - whiskey-data:/app/backend/data
    environment:
      - NODE_ENV=production
      - HOSTNAME=0.0.0.0
      - HOST=<YourHostnameHere>
      - PORT=3010
      - NEXT_PUBLIC_API_URL=${HOST}:8010
      - CORS_ORIGINS_STR_ADDITIONAL=${HOST}:${PORT}
      - ADMIN_PASSWORD=your-secure-password # Administration password (defaults to 'admin' if not set)
    restart: unless-stopped
    healthcheck:
      test:
        - CMD
        - curl
        - -f
        - http://localhost:8010/api/v1/health
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
volumes:
  whiskey-data:
    driver: local
```

Then run:
```bash
# Replace <YourHostnameHere> with your actual hostname/IP
HOST=localhost docker-compose up -d

# Or for remote deployment
HOST=yourdomain.com docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Local Development
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Remote Deployment
For deploying on a remote machine, specify the host IP or domain:

```bash
# Set the HOST environment variable to your server's IP or domain
HOST=192.168.1.47 docker-compose up -d

# Or for a domain
HOST=yourdomain.com docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The application will automatically configure API calls and CORS to use the specified host.

---

## Using the Application

1. **Admin Setup**: Go to **<http://localhost:3010/admin>**
   - Create a tasting theme (e.g., "Bourbon Night")
   - Add whiskeys to the theme
   - Set theme as "active"

2. **Tasting**: Go to **<http://localhost:3010/tasting>**
   - Select your name (or add new)
   - Rate whiskeys on aroma/flavor/finish (1-5)
   - Add personal ranking

3. **View Scores**: Go to **<http://localhost:3010/scores>**
   - See rankings and statistics
   - Sort by different criteria
   - Filter by user

---

## Common Commands

### Backend
```bash
cd apps/backend
uv sync                    # Install deps
uv run uvicorn app.main:app --reload --port 8010  # Start dev server
```

### Frontend
```bash
cd apps/frontend
npm install               # Install deps
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter
```

### Database
```bash
cd apps/backend
ls data/                  # View database files
rm -rf data/             # Reset all data
```

### Testing
```bash
cd apps/backend
uv run pytest tests/                   # Run all tests
```

---

## Troubleshooting

**Backend won't start:**
```bash
# Make sure you're using uv
uv run uvicorn app.main:app --reload
```

**Frontend connection issues:**
- Ensure backend is running on port 8010
- Check CORS settings if needed

**Database issues:**
```bash
# Check permissions
ls -la apps/backend/data/
```

---

## Project Structure

```
Whiskey-Tasting/
├── apps/
│   ├── backend/          # FastAPI backend
│   │   ├── app/          # Application code
│   │   └── data/         # Database storage
│   └── frontend/         # Next.js frontend
│       ├── app/          # Pages (admin, tasting, scores)
│       └── components/   # UI components
├── docs/                 # Documentation
└── docker-compose.yml    # Docker setup
```

---

Happy whiskey tasting! 🥃
