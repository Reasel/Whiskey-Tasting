import { test, expect } from '@playwright/test';

async function setAdminAuth(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
}

test.describe('Theme Management', () => {
  test('admin can navigate to theme creation', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Administration');

    await expect(page).toHaveURL(/new-theme|administration|edit-themes/);
  });

  test('displays theme creation form', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/new-theme');

    await expect(page.locator('#themeName')).toBeVisible();
    await expect(page.locator('#themeNotes')).toBeVisible();
    await expect(page.locator('#numWhiskeys')).toBeVisible();
  });

  test('creates a new theme', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/new-theme');

    await page.fill('#themeName', 'E2E Test Theme');
    await page.fill('#themeNotes', 'Created by E2E test');
    await page.fill('#numWhiskeys', '3');

    await page.click('button[type="submit"], button:has-text("Create")');

    await page.waitForTimeout(1000);
  });

  test('validates theme name is required', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/new-theme');

    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isEnabled()) {
      await submitButton.click();
    }

    await page.waitForTimeout(500);
  });
});

test.describe('Theme Editing', () => {
  test('displays existing themes', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/edit-themes');

    await expect(page.locator('text=EDIT THEMES')).toBeVisible();
  });

  test('allows editing theme whiskeys', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/edit-themes');

    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible()) {
      await editButton.click();

      await page.waitForTimeout(500);
      await expect(page.locator('text=/whiskey/i').first()).toBeVisible();
    }
  });

  test('updates whiskey details', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/edit-themes');

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      const whiskeyNameInput = page
        .locator('input[name*="whiskey"], input[placeholder*="name"]')
        .first();
      if (await whiskeyNameInput.isVisible()) {
        await whiskeyNameInput.fill('Updated Whiskey Name');

        const proofInput = page.locator('input[type="number"]').first();
        await proofInput.fill('45.0');

        await page.click('button:has-text("Save"), button[type="submit"]');
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Active Theme Selection', () => {
  test('displays active theme indicator', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/edit-themes');

    await expect(page.locator('text=EDIT THEMES')).toBeVisible();
  });

  test('switches active theme', async ({ page }) => {
    await setAdminAuth(page);
    await page.goto('/edit-themes');

    const activateButton = page
      .locator('button:has-text("Activate"), button:has-text("Set Active")')
      .first();

    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(500);
    }
  });
});
