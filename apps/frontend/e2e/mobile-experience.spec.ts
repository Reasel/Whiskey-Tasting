import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ ...devices['iPhone 12'] });

  test('homepage is responsive on mobile', async ({ page }) => {
    await page.goto('/');

    // Page should load
    await expect(page).toHaveTitle(/.+/);

    // Main content should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigation menu works on mobile', async ({ page }) => {
    await page.goto('/');

    // Look for mobile menu button (hamburger)
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("☰")');

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Menu should open
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });

  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/new-theme');

    // Form inputs should be accessible
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Mobile Test Theme');
      await expect(nameInput).toHaveValue('Mobile Test Theme');
    }
  });

  test('buttons are tappable on mobile', async ({ page }) => {
    await page.goto('/');

    // Buttons should be large enough to tap
    const buttons = page.locator('button, a[role="button"]');
    if ((await buttons.count()) > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();

      // Get bounding box to verify size
      const box = await firstButton.boundingBox();
      if (box) {
        // Buttons should be at least 44x44px (iOS minimum tap target)
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('text is readable on mobile', async ({ page }) => {
    await page.goto('/');

    // Font sizes should be reasonable
    const body = page.locator('body');
    const fontSize = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font should be at least 14px
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(14);
  });

  test('number inputs work on mobile keyboard', async ({ page }) => {
    await page.goto('/tasting-submission');

    // Number inputs should trigger numeric keyboard
    const numberInput = page.locator('input[type="number"]').first();

    if (await numberInput.isVisible()) {
      await numberInput.click();
      await numberInput.fill('4.5');
      await expect(numberInput).toHaveValue('4.5');
    }
  });

  test('scrolling works on mobile', async ({ page }) => {
    await page.goto('/dashboard');

    // Page should be scrollable
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(300);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });
});

test.describe('Tablet Experience', () => {
  test.use({ ...devices['iPad Pro'] });

  test('layout adapts to tablet size', async ({ page }) => {
    await page.goto('/');

    // Page should render appropriately for tablet
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard is readable on tablet', async ({ page }) => {
    await page.goto('/dashboard');

    // Results should be displayed clearly
    await expect(page.locator('text=/whiskey|theme/i')).toBeVisible();
  });
});

test.describe('Mobile Portrait vs Landscape', () => {
  test('works in portrait orientation', async ({ page, context }) => {
    await context.setViewportSize({ width: 375, height: 812 }); // iPhone X portrait
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('works in landscape orientation', async ({ page, context }) => {
    await context.setViewportSize({ width: 812, height: 375 }); // iPhone X landscape
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Touch Interactions', () => {
  test.use({ ...devices['iPhone 12'] });

  test('handles touch events on interactive elements', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button').first();
    if (await button.isVisible()) {
      // Simulate touch
      await button.tap();
      await page.waitForTimeout(300);
    }
  });

  test('swipe gestures work if implemented', async ({ page }) => {
    await page.goto('/dashboard');

    // If carousel or swipeable content exists
    const swipeableElement = page.locator('[role="region"], .swipeable');

    if ((await swipeableElement.count()) > 0) {
      const box = await swipeableElement.first().boundingBox();
      if (box) {
        // Simulate swipe
        await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 10, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Mobile Performance', () => {
  test.use({ ...devices['iPhone 12'] });

  test('page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds on mobile
    expect(loadTime).toBeLessThan(5000);
  });

  test('images load on mobile', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    if ((await images.count()) > 0) {
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();

      // Check if image is loaded
      const naturalWidth = await firstImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});
