import { test, expect } from '@playwright/test';

test.describe('Discover screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('has a visible root element', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    const root = page.locator('#root, [data-testid="root"], body > div').first();
    await expect(root).toBeVisible();
  });
});
