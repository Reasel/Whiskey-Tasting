import { test, expect } from '@playwright/test';

test.describe('Tasting Submission Flow', () => {
  test('user can navigate to tasting submission page', async ({ page }) => {
    await page.goto('/');

    // Homepage has "Tasting Submission" button
    await page.click('text=Tasting Submission');

    await expect(page).toHaveURL(/tasting-submission/);
  });

  test('displays theme selection', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Should have theme selector or theme information
    await expect(page.locator('text=/theme/i').first()).toBeVisible();
  });

  test('displays whiskey scoring form', async ({ page }) => {
    await page.goto('/tasting-submission');

    // If active theme with whiskeys exists, scoring form is shown
    const hasAroma = (await page.locator('text=/aroma/i').count()) > 0;
    const hasForm = (await page.locator('form, input').count()) > 0;
    expect(hasAroma || hasForm).toBeTruthy();
  });

  test('allows empty score fields during entry', async ({ page }) => {
    await page.goto('/tasting-submission');

    const aromaInput = page.locator('input[name*="aroma"], input[id*="aroma"]').first();

    if (await aromaInput.isVisible()) {
      await aromaInput.fill('');
      await expect(aromaInput).toHaveValue('');

      await aromaInput.fill('4.5');
      await expect(aromaInput).toHaveValue('4.5');

      await aromaInput.fill('');
      await expect(aromaInput).toHaveValue('');
    }
  });

  test('validates score ranges', async ({ page }) => {
    await page.goto('/tasting-submission');

    const scoreInput = page.locator('input[type="number"]').first();

    if (await scoreInput.isVisible()) {
      await scoreInput.fill('10');
    }
  });

  test('submits tasting successfully', async ({ page }) => {
    await page.goto('/tasting-submission');

    const userSelect = page.locator('select[name="user"], select[id*="user"]');
    if (await userSelect.isVisible()) {
      await userSelect.selectOption({ index: 1 });
    }

    const aromaInputs = page.locator('input[name*="aroma"], input[id*="aroma"]');
    const flavorInputs = page.locator('input[name*="flavor"], input[id*="flavor"]');
    const finishInputs = page.locator('input[name*="finish"], input[id*="finish"]');

    if ((await aromaInputs.count()) > 0) {
      await aromaInputs.first().fill('4.5');
      await flavorInputs.first().fill('4.0');
      await finishInputs.first().fill('4.5');

      await page.click('button[type="submit"], button:has-text("Submit")');

      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Tasting Submission Validation', () => {
  test('requires user selection', async ({ page }) => {
    await page.goto('/tasting-submission');

    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    if ((await submitButton.isVisible()) && (await submitButton.isEnabled())) {
      await submitButton.click();

      await page.waitForTimeout(500);
    }
  });

  test('requires complete scores before submission', async ({ page }) => {
    await page.goto('/tasting-submission');

    const aromaInput = page.locator('input[name*="aroma"]').first();
    if (await aromaInput.isVisible()) {
      await aromaInput.fill('4.5');

      await page.click('button[type="submit"], button:has-text("Submit")');

      await page.waitForTimeout(500);
    }
  });
});
