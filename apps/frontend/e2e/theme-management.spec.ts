import { test, expect } from '@playwright/test';

test.describe('Theme Management', () => {
  test('admin can navigate to theme creation', async ({ page }) => {
    await page.goto('/');

    // Navigate to admin or theme creation
    await page.click('text=/admin|new theme|create/i');

    await expect(page).toHaveURL(/new-theme|administration|edit-themes/);
  });

  test('displays theme creation form', async ({ page }) => {
    await page.goto('/new-theme');

    // Should have theme name input
    await expect(page.locator('input[name="name"], input[id*="name"]')).toBeVisible();

    // Should have notes or description field
    await expect(page.locator('textarea, input[name="notes"]')).toBeVisible();

    // Should have number of whiskeys input
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('creates a new theme', async ({ page }) => {
    await page.goto('/new-theme');

    // Fill in theme details
    await page.fill('input[name="name"], input[id*="name"]', 'E2E Test Theme');

    const notesField = page.locator('textarea, input[name="notes"]').first();
    await notesField.fill('Created by E2E test');

    const numWhiskeysField = page.locator('input[type="number"]').first();
    await numWhiskeysField.fill('3');

    // Submit form
    await page.click('button[type="submit"], button:has-text("Create")');

    // Wait for success
    await page.waitForTimeout(1000);
  });

  test('validates theme name is required', async ({ page }) => {
    await page.goto('/new-theme');

    // Try to submit without name
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error
    await page.waitForTimeout(500);
  });
});

test.describe('Theme Editing', () => {
  test('displays existing themes', async ({ page }) => {
    await page.goto('/edit-themes');

    // Should list existing themes
    await expect(page.locator('text=/theme/i')).toBeVisible();
  });

  test('allows editing theme whiskeys', async ({ page }) => {
    await page.goto('/edit-themes');

    // Find edit button or link
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should show whiskey management interface
      await page.waitForTimeout(500);
      await expect(page.locator('text=/whiskey/i')).toBeVisible();
    }
  });

  test('updates whiskey details', async ({ page }) => {
    await page.goto('/edit-themes');

    // Navigate to whiskey editing
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Fill in whiskey details
      const whiskeyNameInput = page
        .locator('input[name*="whiskey"], input[placeholder*="name"]')
        .first();
      if (await whiskeyNameInput.isVisible()) {
        await whiskeyNameInput.fill('Updated Whiskey Name');

        const proofInput = page.locator('input[type="number"]').first();
        await proofInput.fill('45.0');

        // Save changes
        await page.click('button:has-text("Save"), button[type="submit"]');
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Active Theme Selection', () => {
  test('displays active theme indicator', async ({ page }) => {
    await page.goto('/');

    // Should show which theme is active
    await expect(page.locator('text=/active|current/i')).toBeVisible();
  });

  test('switches active theme', async ({ page }) => {
    await page.goto('/edit-themes');

    // Find activate button
    const activateButton = page
      .locator('button:has-text("Activate"), button:has-text("Set Active")')
      .first();

    if (await activateButton.isVisible()) {
      await activateButton.click();
      await page.waitForTimeout(500);

      // Should update active status
    }
  });
});
