# Testing Infrastructure Documentation

This document describes the comprehensive testing infrastructure for the Whiskey Tasting application.

## Overview

The testing infrastructure includes:
- **Backend Tests**: Unit, integration, performance, and extended API tests
- **Frontend Tests**: Unit tests for utilities and components using Vitest
- **E2E Tests**: Full user journey tests using Playwright
- **Integration Tests**: Cross-stack validation tests
- **CI/CD Integration**: Automated testing in GitHub Actions

## Backend Testing

### Running Tests

```bash
# Standard test run
cd apps/backend
python -m pytest

# With coverage reporting
python -m pytest --cov=app --cov-report=html --cov-report=term

# On NixOS (recommended)
nix-shell ./nix/pythonShell.nix --run "cd apps/backend && python3 -m pytest --cov=app"
```

### Test Structure

- `tests/test_database.py` - Database operations and business logic
- `tests/test_api.py` - REST API endpoints
- `tests/test_integration.py` - Complete workflows
- `tests/test_error_handling.py` - Edge cases and error conditions
- `tests/test_whiskeys_extended.py` - Extended whiskey management tests
- `tests/test_users_extended.py` - Extended user management tests
- `tests/test_tastings_scoring.py` - Score aggregation and ranking tests
- `tests/test_multi_user_scenarios.py` - Concurrent user workflows
- `tests/test_performance.py` - Performance benchmarks
- `tests/integration_e2e/test_full_user_journey.py` - Complete user flows

### Coverage Goals

- Target: >80% code coverage
- Current: Run `pytest --cov=app --cov-report=term` to check

### Known Issues

Some extended tests in `test_users_extended.py` and `test_whiskeys_extended.py` need adjustment to match actual API response formats:
- User creation returns `{message: "User created successfully"}` not user object
- User list returns `{users: [...]}` not bare array
- Whiskey updates require specific schema validation

These tests document expected behavior and can guide future API improvements.

## Frontend Testing

### Running Tests

```bash
cd apps/frontend

# Unit tests
npm run test

# With coverage
npm run test:coverage

# Interactive UI
npm run test:ui
```

### Test Structure

- `lib/utils.test.ts` - Utility functions (cn, formatDateRange)
- `lib/utils/text-formatter.test.tsx` - Text formatting with links
- `lib/api/client.test.ts` - API client functions
- `components/ui/button.test.tsx` - Button component
- `components/ui/input.test.tsx` - Input component
- `components/ui/dialog.test.tsx` - Dialog component

### MSW (Mock Service Worker)

API mocking is configured in `mocks/handlers.ts` and automatically enabled during tests. This provides:
- Consistent test data
- No external API dependencies
- Fast test execution

## E2E Testing

### Running E2E Tests

```bash
cd apps/frontend

# All browsers
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Specific project (browser)
npx playwright test --project=chromium
```

### Test Coverage

- `e2e/auth-flow.spec.ts` - User selection and authentication
- `e2e/theme-management.spec.ts` - Theme creation and editing
- `e2e/tasting-submission.spec.ts` - Score submission workflow
- `e2e/dashboard-viewing.spec.ts` - Results viewing
- `e2e/mobile-experience.spec.ts` - Mobile and tablet support

### Browser Support

Tests run on:
- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)
- Mobile (iPhone 12)

### NixOS Considerations

On NixOS, Playwright's bundled Chromium may not work. Use the custom browser-test.js script or configure Playwright to use system Chromium:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/run/current-system/sw/bin/chromium npm run test:e2e
```

## Docker Service Testing

### Running Service Tests

```bash
# Automated script (recommended)
./scripts/run-service-tests.sh

# Manual
docker-compose -f docker-compose.test.yml up -d
# Wait for health check
cd apps/frontend && BASE_URL=http://localhost:3011 npm run test:e2e
docker-compose -f docker-compose.test.yml down -v
```

This tests the fully containerized application.

## CI/CD Testing

Tests run automatically on:
- Every push to `master`
- Every pull request to `master`
- Every version tag (`v*`)

### Pipeline Structure

1. **test-backend**: Runs backend tests with coverage, uploads to Codecov
2. **test-frontend**: Runs frontend unit tests, linting, and build
3. **test-e2e**: Runs E2E tests against Docker container
4. **build-and-deploy**: Only runs after all tests pass

### Artifacts

- Backend coverage: Uploaded to Codecov
- Frontend coverage: Uploaded to Codecov
- Playwright reports: Available as GitHub Actions artifacts for 30 days

## Writing New Tests

### Backend Test Template

```python
def test_new_feature(test_client, test_db):
    """Test description."""
    # Arrange
    data = {"key": "value"}

    # Act
    response = test_client.post("/api/v1/endpoint", json=data)

    # Assert
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

### Frontend Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test('user can complete action', async ({ page }) => {
  await page.goto('/page');
  await page.click('button');
  await expect(page).toHaveURL(/result/);
});
```

## Debugging Tests

### Backend

```bash
# Run specific test
pytest tests/test_api.py::test_specific_function

# Verbose output
pytest -vv

# Stop on first failure
pytest -x

# Show print statements
pytest -s
```

### Frontend

```bash
# Run specific test file
npm run test -- utils.test.ts

# Watch mode
npm run test -- --watch

# UI mode for debugging
npm run test:ui
```

### E2E

```bash
# Debug mode (opens browser with DevTools)
npm run test:e2e:debug

# Headed mode (see browser)
npx playwright test --headed

# Specific test
npx playwright test -g "test name"
```

## Performance Benchmarks

Performance tests are in `apps/backend/tests/test_performance.py` and marked to skip by default.

Run manually:
```bash
pytest tests/test_performance.py -v
```

## Future Improvements

1. Adjust extended tests to match actual API contracts
2. Add visual regression testing with Playwright screenshots
3. Add load testing with Locust or similar
4. Expand mobile E2E test coverage
5. Add accessibility testing (axe-core)
6. Set up mutation testing for test quality validation

## Troubleshooting

### "Module not found" errors
- Ensure dependencies are installed: `npm ci` or `pip install -e .[dev]`
- On NixOS, use `nix-shell ./nix/pythonShell.nix`

### E2E tests timeout
- Check if dev server is running
- Increase timeout in `playwright.config.ts`
- Ensure ports 3010/8010 (or 3011/8011 for Docker tests) are available

### Coverage not generating
- Install coverage package: `pip install pytest-cov`
- On NixOS, rebuild shell: `nix-shell ./nix/pythonShell.nix`

### MSW handlers not working
- Check `vitest.setup.ts` imports `mocks/server`
- Verify MSW server starts in beforeAll hook
- Check handler URLs match API calls
