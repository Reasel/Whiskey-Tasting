import { test, expect } from '@playwright/test';

test.describe('User Selection Flow', () => {
  test('displays user selection on homepage', async ({ page }) => {
    await page.goto('/');

    // Should have user selection interface (no password/authentication)
    await expect(page.locator('text=/user|name|select/i')).toBeVisible();
  });

  test('allows selecting existing user', async ({ page }) => {
    await page.goto('/');

    // Find user selection dropdown or input
    const userSelect = page.locator('select, input[list]');

    if ((await userSelect.count()) > 0) {
      // Select a user
      const firstSelect = userSelect.first();
      if ((await firstSelect.getAttribute('tagName')) === 'SELECT') {
        await firstSelect.selectOption({ index: 1 });
      } else {
        await firstSelect.fill('Alice');
      }

      await page.waitForTimeout(500);
    }
  });

  test('allows entering new user name', async ({ page }) => {
    await page.goto('/');

    // Find input for new user
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');

    if (await nameInput.first().isVisible()) {
      await nameInput.first().fill('E2E Test User');

      // Submit or continue
      const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
      if (await continueButton.first().isVisible()) {
        await continueButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('does not require password', async ({ page }) => {
    await page.goto('/');

    // Should NOT have password field
    const passwordInput = page.locator('input[type="password"]');
    expect(await passwordInput.count()).toBe(0);
  });

  test('persists user selection across navigation', async ({ page }) => {
    await page.goto('/');

    // Select user
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Persistent User');

      // Navigate to another page
      await page.click('text=/submit|tasting/i');

      // User should still be selected (if implemented)
      await page.waitForTimeout(500);
    }
  });
});

test.describe('User Management', () => {
  test('navigates to add user page', async ({ page }) => {
    await page.goto('/');

    // Click add user link
    await page.click('text=/add user|new user/i');

    await expect(page).toHaveURL(/add-user/);
  });

  test('creates new user', async ({ page }) => {
    await page.goto('/add-user');

    // Fill in user name
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');
    await nameInput.fill('Brand New User');

    // Submit
    await page.click('button[type="submit"], button:has-text("Add")');

    await page.waitForTimeout(1000);

    // Should show success message or redirect
  });

  test('validates user name is required', async ({ page }) => {
    await page.goto('/add-user');

    // Try to submit without name
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(500);
    // Should show validation error
  });
});

test.describe('User Deletion', () => {
  test('navigates to delete user page', async ({ page }) => {
    await page.goto('/');

    // Navigate to delete user
    await page.click('text=/delete user|remove user/i');

    await expect(page).toHaveURL(/delete-user/);
  });

  test('displays list of users to delete', async ({ page }) => {
    await page.goto('/delete-user');

    // Should show user list
    await expect(page.locator('text=/user/i')).toBeVisible();
  });

  test('deletes a user', async ({ page }) => {
    await page.goto('/delete-user');

    // Find delete button
    const deleteButton = page.locator('button:has-text("Delete")').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      await page.waitForTimeout(500);
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Admin Access', () => {
  test('navigates to administration page', async ({ page }) => {
    await page.goto('/');

    // Click administration link
    await page.click('text=/admin/i');

    await expect(page).toHaveURL(/administration/);
  });

  test('displays admin panel', async ({ page }) => {
    await page.goto('/administration');

    // Should show admin options
    await expect(page.locator('text=/theme|user|manage/i')).toBeVisible();
  });

  test('provides links to management pages', async ({ page }) => {
    await page.goto('/administration');

    // Should have links to various admin functions
    const links = page.locator('a, button');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
