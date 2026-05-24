import { test, expect } from '@playwright/test';

test.describe('Discover screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      console.error('Browser error:', err.message);
      errors.push(err.message);
    });

    // Catch console errors which might include fetch failures in some browsers
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('access control checks')) {
        // We only track actual JS errors in the 'errors' array to avoid failing
        // on harmless console warnings, but we log them for debugging.
        console.error('Console error:', msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    expect(errors, `Found ${errors.length} browser errors: ${errors.join(', ')}`).toHaveLength(0);
  });

  test('has a visible root element', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root, [data-testid="root"], body > div').first();
    await expect(root).toBeVisible();
  });
});
