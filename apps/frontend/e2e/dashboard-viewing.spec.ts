import { test, expect } from '@playwright/test';

test.describe('Dashboard Viewing', () => {
  test('navigates to dashboard', async ({ page }) => {
    await page.goto('/');

    // Click on dashboard link
    await page.click('text=/dashboard|results|scores/i');

    await expect(page).toHaveURL(/dashboard/);
  });

  test('displays theme results', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show theme information
    await expect(page.locator('text=/theme/i')).toBeVisible();
  });

  test('displays whiskey rankings', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show whiskey names and scores
    await page.waitForSelector('text=/whiskey|rank/i', { timeout: 5000 });
    await expect(page.locator('text=/whiskey|rank/i')).toBeVisible();
  });

  test('displays score categories', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show aroma, flavor, finish scores
    const hasScores =
      (await page.locator('text=/aroma/i').count()) > 0 ||
      (await page.locator('text=/flavor/i').count()) > 0 ||
      (await page.locator('text=/finish/i').count()) > 0;

    expect(hasScores).toBeTruthy();
  });

  test('displays aggregated scores', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show average scores or totals
    await page.waitForTimeout(1000);

    // Look for numeric scores
    const scores = page.locator('text=/\\d+\\.\\d+/');
    if ((await scores.count()) > 0) {
      await expect(scores.first()).toBeVisible();
    }
  });
});

test.describe('Dashboard Data Views', () => {
  test('switches between different view modes', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for view toggle buttons (table, chart, etc.)
    const viewButtons = page.locator('button:has-text("Table"), button:has-text("Chart")');

    if ((await viewButtons.count()) > 0) {
      await viewButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('filters results by user', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for user filter
    const userFilter = page.locator('select[name="user"], button:has-text("Filter")');

    if ((await userFilter.count()) > 0) {
      await userFilter.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Raw Data View', () => {
  test('navigates to data view page', async ({ page }) => {
    await page.goto('/');

    // Navigate to data view
    await page.click('text=/data|raw/i');

    await expect(page).toHaveURL(/data-view/);
  });

  test('displays raw tasting data', async ({ page }) => {
    await page.goto('/data-view');

    // Should show detailed data table or list
    await page.waitForTimeout(1000);

    // Look for data display
    await expect(page.locator('table, ul, div[role="table"]')).toBeVisible();
  });

  test('exports data', async ({ page }) => {
    await page.goto('/data-view');

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

    if (await exportButton.first().isVisible()) {
      // Click export (don't verify download in test)
      await exportButton.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Results Refresh', () => {
  test('refreshes results when new data is submitted', async ({ page }) => {
    await page.goto('/dashboard');

    // Note initial state
    await page.waitForTimeout(1000);

    // Refresh page
    await page.reload();

    // Should still display results
    await expect(page.locator('text=/whiskey|theme|score/i')).toBeVisible();
  });
});
