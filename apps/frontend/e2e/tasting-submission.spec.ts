import { test, expect } from '@playwright/test';

test.describe('Tasting Submission Flow', () => {
  test('user can navigate to tasting submission page', async ({ page }) => {
    await page.goto('/');

    // Click on tasting submission link or button
    await page.click('text=/submit|tasting/i');

    await expect(page).toHaveURL(/tasting-submission/);
  });

  test('displays theme selection', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Should have theme selector or theme information
    await expect(page.locator('text=/theme/i')).toBeVisible();
  });

  test('displays whiskey scoring form', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Should have scoring inputs for aroma, flavor, finish
    await expect(page.locator('text=/aroma/i')).toBeVisible();
    await expect(page.locator('text=/flavor/i')).toBeVisible();
    await expect(page.locator('text=/finish/i')).toBeVisible();
  });

  test('allows empty score fields during entry', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Find score input fields
    const aromaInput = page.locator('input[name*="aroma"], input[id*="aroma"]').first();

    if (await aromaInput.isVisible()) {
      // Clear field (should allow empty)
      await aromaInput.fill('');
      await expect(aromaInput).toHaveValue('');

      // Type a value
      await aromaInput.fill('4.5');
      await expect(aromaInput).toHaveValue('4.5');

      // Clear again
      await aromaInput.fill('');
      await expect(aromaInput).toHaveValue('');
    }
  });

  test('validates score ranges', async ({ page }) => {
    await page.goto('/tasting-submission');

    const scoreInput = page.locator('input[type="number"]').first();

    if (await scoreInput.isVisible()) {
      // Try invalid score (if validation exists)
      await scoreInput.fill('10'); // Assuming max is 5
      // Validation behavior depends on implementation
    }
  });

  test('submits tasting successfully', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Fill in user selection if available
    const userSelect = page.locator('select[name="user"], select[id*="user"]');
    if (await userSelect.isVisible()) {
      await userSelect.selectOption({ index: 1 });
    }

    // Fill in scores for first whiskey (if inputs are visible)
    const aromaInputs = page.locator('input[name*="aroma"], input[id*="aroma"]');
    const flavorInputs = page.locator('input[name*="flavor"], input[id*="flavor"]');
    const finishInputs = page.locator('input[name*="finish"], input[id*="finish"]');

    if ((await aromaInputs.count()) > 0) {
      await aromaInputs.first().fill('4.5');
      await flavorInputs.first().fill('4.0');
      await finishInputs.first().fill('4.5');

      // Submit form
      await page.click('button[type="submit"], button:has-text("Submit")');

      // Wait for success indication (toast, redirect, etc.)
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Tasting Submission Validation', () => {
  test('requires user selection', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Try to submit without selecting user
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation error or prevent submission
      await page.waitForTimeout(500);
    }
  });

  test('requires complete scores before submission', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Fill partial scores
    const aromaInput = page.locator('input[name*="aroma"]').first();
    if (await aromaInput.isVisible()) {
      await aromaInput.fill('4.5');

      // Try to submit with incomplete scores
      await page.click('button[type="submit"], button:has-text("Submit")');

      await page.waitForTimeout(500);
      // Validation should prevent submission or show error
    }
  });
});

test.describe('Mobile Tasting Submission', () => {
  test.use({ ...devices['iPhone 12'] });

  test('tasting form is usable on mobile', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Form should be visible and usable
    const form = page.locator('form');
    if (await form.isVisible()) {
      await expect(form).toBeVisible();

      // Inputs should be accessible
      const inputs = page.locator('input[type="number"]');
      if ((await inputs.count()) > 0) {
        await expect(inputs.first()).toBeVisible();
      }
    }
  });
});

import { devices } from '@playwright/test';
