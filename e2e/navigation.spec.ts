import { test, expect } from '@playwright/test';

test.describe('Core navigation', () => {
  test('Discover tab loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveTitle(/error/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Calendar route is reachable', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Community route is reachable', async ({ page }) => {
    await page.goto('/community');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Search route is reachable', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Auth routes', () => {
  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Static pages', () => {
  test('About page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('body')).toBeVisible();
  });
});
