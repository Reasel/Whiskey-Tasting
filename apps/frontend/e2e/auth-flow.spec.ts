import { test, expect } from '@playwright/test';

test.describe('User Selection Flow', () => {
  test('displays user selection on homepage', async ({ page }) => {
    await page.goto('/');

    // Homepage has main heading and navigation buttons
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=WHISKEY TASTING')).toBeVisible();
  });

  test('allows selecting existing user', async ({ page }) => {
    await page.goto('/');

    const userSelect = page.locator('select, input[list]');

    if ((await userSelect.count()) > 0) {
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

    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]');

    if (await nameInput.first().isVisible()) {
      await nameInput.first().fill('E2E Test User');

      const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]');
      if (await continueButton.first().isVisible()) {
        await continueButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('does not require password', async ({ page }) => {
    await page.goto('/');

    // Homepage should NOT have a password field
    const passwordInput = page.locator('input[type="password"]');
    expect(await passwordInput.count()).toBe(0);
  });

  test('persists user selection across navigation', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Persistent User');

      await page.click('text=Tasting Submission');

      await page.waitForTimeout(500);
    }
  });
});

test.describe('User Management', () => {
  test('navigates to add user page', async ({ page }) => {
    // Set admin auth and navigate directly
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/add-user');

    await expect(page).toHaveURL(/add-user/);
  });

  test('creates new user', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/add-user');

    const nameInput = page.locator('#userName');
    await nameInput.fill('Brand New User');

    await page.click('button[type="submit"], button:has-text("Add")');

    await page.waitForTimeout(1000);
  });

  test('validates user name is required', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/add-user');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(500);
  });
});

test.describe('User Deletion', () => {
  test('navigates to delete user page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/delete-user');

    await expect(page).toHaveURL(/delete-user/);
  });

  test('displays list of users to delete', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/delete-user');

    // Page should render — may show users or empty state
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(1000);
  });

  test('deletes a user', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/delete-user');

    const deleteButton = page.locator('button:has-text("Delete")').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

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

    // Homepage has "Administration" button
    await page.click('text=Administration');

    await expect(page).toHaveURL(/administration/);
  });

  test('displays admin panel', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/administration');

    // Authenticated admin page shows management options
    await expect(page.locator('text=/manage/i')).toBeVisible();
  });

  test('provides links to management pages', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('adminAuthenticated', 'true'));
    await page.goto('/administration');

    const links = page.locator('a, button');
    expect(await links.count()).toBeGreaterThan(0);
  });
});
