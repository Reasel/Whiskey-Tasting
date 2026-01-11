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
uv run uvicorn app.main:app --reload --port 8000

# 3. Start frontend (Terminal 2)
cd apps/frontend
npm install
npm run dev
```

Open **<http://localhost:3000>** - you're ready to go!

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
uv run uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd apps/frontend
npm install  # Install dependencies
npm run dev  # Start dev server
```

---

## Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## Using the Application

1. **Admin Setup**: Go to **<http://localhost:3000/admin>**
   - Create a tasting theme (e.g., "Bourbon Night")
   - Add whiskeys to the theme
   - Set theme as "active"

2. **Tasting**: Go to **<http://localhost:3000/tasting>**
   - Select your name (or add new)
   - Rate whiskeys on aroma/flavor/finish (1-5)
   - Add personal ranking

3. **View Scores**: Go to **<http://localhost:3000/scores>**
   - See rankings and statistics
   - Sort by different criteria
   - Filter by user

---

## Common Commands

### Backend
```bash
cd apps/backend
uv sync                    # Install deps
uv run uvicorn app.main:app --reload --port 8000  # Start dev server
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

---

## Troubleshooting

**Backend won't start:**
```bash
# Make sure you're using uv
uv run uvicorn app.main:app --reload
```

**Frontend connection issues:**
- Ensure backend is running on port 8000
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
