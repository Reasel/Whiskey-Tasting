# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Lint/Test Commands

- Backend testing via nix-shell: `nix-shell ./nix/pythonShell.nix && cd apps/backend && python3 -m pip install -e .[dev] && pytest` (fast local testing alternative to Docker rebuild; installs deps & runs tests via pip)
- Run single test (if venv set up): `cd apps/backend && uv run --python python3 pytest tests/test_seed_data.py`
- Frontend dev with turbopack: `cd apps/frontend && npm run dev`
- In Nix environment: `nix-shell ./nix/pythonShell.nix` before running Python commands
- All uv commands require `--python python3` flag (uv sync/troubleshooting via pip if fails)

## Browser Testing (NixOS)

The built-in browser tool fails on NixOS due to incompatible Chromium binaries. Use the custom Puppeteer script for browser automation and testing:

- Install dependencies: `cd apps/frontend && npm install` (includes Puppeteer)
- Run browser tests: `cd apps/frontend && node browser-test.js <action> [args]`
  - `launch <url>`: Launch browser and navigate to URL, saves screenshot
  - `click <selector>`: Click element by CSS selector
  - `type <selector> <text>`: Type text into input field
  - `close`: Close browser
- Example: `cd apps/frontend && node browser-test.js launch http://localhost:3001`
- Screenshots are saved in `apps/frontend/` for visual verification
- Use with dev server running for live feedback on frontend changes

## Code Style

- Prettier: semi: true, singleQuote: true, printWidth: 100, tabWidth: 2, trailingComma: es5
- ESLint: Next.js + TypeScript + Prettier

## Project-Specific Patterns

- Backend uses TinyDB (file-based JSON database) stored in `apps/backend/data/`
- Active theme determined by most recent `created_at` timestamp, not explicit active flag
- Database operations are synchronous (TinyDB), but FastAPI endpoints are async
- Not all router modules are mounted in `main.py` (tastings, whiskeys, users routers exist but not included)
- Test seed data references unimplemented endpoints (e.g., PUT `/themes/{theme_id}/whiskeys`)
- Backend includes Windows-specific asyncio fix for Playwright compatibility