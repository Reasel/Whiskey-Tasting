# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build/Lint/Test Commands

- Backend testing via nix-shell: `nix-shell ./nix/pythonShell.nix --run "cd apps/backend && python3 -m pytest"` (fast local testing alternative to Docker rebuild; installs deps & runs tests via pip)
- Frontend dev with turbopack: `cd apps/frontend && npm run dev`
- In Nix environment: `nix-shell ./nix/pythonShell.nix -run "<Commands here>"` before running Python commands
- All uv commands require `--python python3` flag (uv sync/troubleshooting via pip if fails)

## Testing Suite

The backend includes a comprehensive test suite that must pass before any changes are merged. The test suite covers unit tests, API endpoint tests, integration tests, and error handling scenarios.

### Test Structure

- **Unit Tests** (`test_database.py`): Test individual database operations and business logic
- **API Tests** (`test_api.py`): Test all REST API endpoints using FastAPI TestClient
- **Integration Tests** (`test_integration.py`): Test complete workflows from theme creation to results
- **Error Handling Tests** (`test_error_handling.py`): Test edge cases, invalid inputs, and error conditions

### Running Tests

#### Full Test Suite
```bash
# Using Nix (recommended)
nix-shell ./nix/pythonShell.nix && cd apps/backend && python3 -m pip install -e .[dev] && pytest

# Using uv (if venv set up)
cd apps/backend && uv run --python python3 pytest

# Specific test file
cd apps/backend && uv run --python python3 pytest tests/test_api.py
```

#### Test Options
- `-v`: Verbose output
- `-k "test_name"`: Run tests matching pattern
- `--tb=short`: Shorter traceback format
- `-x`: Stop on first failure
- `--cov=app`: Generate coverage report (requires pytest-cov)

### Test Coverage

The test suite provides comprehensive coverage of:

- **Database Operations**: All CRUD operations for themes, whiskeys, users, and tastings
- **API Endpoints**: All REST endpoints including success and error cases
- **Business Logic**: Theme activation, scoring calculations, user management
- **Data Validation**: Input validation, boundary conditions, malformed data
- **Integration Flows**: Complete user workflows from setup to results
- **Error Scenarios**: Invalid inputs, missing data, concurrent operations

### Definition of Done

Before merging any backend changes:

1. All tests must pass: `pytest` returns exit code 0
2. No new test failures introduced
3. Test coverage maintained (target: >80%)
4. New features include corresponding tests
5. Edge cases and error conditions tested

### Adding New Tests

When adding new features:

1. Add unit tests for new database operations in `test_database.py`
2. Add API tests for new endpoints in `test_api.py`
3. Add integration tests for complete workflows in `test_integration.py`
4. Test error conditions in `test_error_handling.py`
5. Update fixtures in `conftest.py` if needed

### Test Fixtures

Common test fixtures available:

- `test_db`: Isolated database instance for each test
- `sample_theme`: Pre-created theme with default whiskeys
- `sample_whiskeys`: List of whiskeys for the sample theme
- `sample_users`: Pre-created test users
- `test_client`: FastAPI test client with isolated database

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
- Backend includes Windows-specific asyncio fix for Playwright compatibility
- When modifying Python dependencies in `apps/backend/pyproject.toml` or `apps/backend/requirements.txt`, also update `nix/pythonShell.nix` to maintain consistency across environments