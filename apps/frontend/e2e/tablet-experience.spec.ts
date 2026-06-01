import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPad Pro'] });

test.describe('Tablet Experience', () => {
  test('layout adapts to tablet size', async ({ page }) => {
    await page.goto('/');

    // Page should render appropriately for tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard is readable on tablet', async ({ page }) => {
    await page.goto('/dashboard');

    // Results should be displayed clearly
    await expect(page.locator('text=/whiskey|theme/i').first()).toBeVisible();
  });
});
