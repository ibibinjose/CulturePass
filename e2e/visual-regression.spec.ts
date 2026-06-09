/**
 * Visual Regression — FIXES-001
 *
 * Requires E2E build (auth injection):
 *   EXPO_PUBLIC_E2E_FIXTURES=true npm run build-web
 *   npx playwright test e2e/visual-regression.spec.ts
 *
 * Update baselines after intentional UI changes:
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test';
import {
  E2E_ADMIN_SESSION,
  injectE2EAuth,
  mockHostPagesApi,
  mockHostPagesRollout,
} from './fixtures/host-pages-api';
import {
  mockAdminDirectoryApi,
  mockDiscoverFeedApi,
  mockMapEventsApi,
  mockCultureShopDealsApi,
} from './fixtures/visual-regression-api';

test.describe('Visual regression — critical layout surfaces (FIXES-001)', () => {
  test.beforeEach(async ({ page }) => {
    await injectE2EAuth(page);
    await mockHostPagesRollout(page);
    await mockHostPagesApi(page);
  });

  test('host apply / entity selector — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/pages/create');
    await expect(page.getByTestId('create-page-selector')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Which option is best for you?')).toBeVisible();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('host-apply-desktop.png', {
      fullPage: true,
      threshold: 0.25,
      maxDiffPixels: 300,
      mask: [page.getByText(/\w{3}, \w{3} \d{1,2}/)],
    });
  });

  test('host apply / entity selector — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pages/create');
    await expect(page.getByTestId('create-page-selector')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Which option is best for you?')).toBeVisible();
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot('host-apply-mobile.png', {
      fullPage: true,
      threshold: 0.25,
      maxDiffPixels: 50,
    });
  });

  test('admin user directory — desktop with filters', async ({ page }) => {
    await injectE2EAuth(page, E2E_ADMIN_SESSION);
    await mockAdminDirectoryApi(page);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/users');
    await expect(page.getByText('User Directory').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('admin-users-desktop.png', {
      fullPage: true,
      threshold: 0.3,
      mask: [page.locator('img'), page.getByText(/\d+ users/i)],
    });
  });

  test('perks listing — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/perks');
    await expect(page.getByText('Perks', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('perks-list-mobile.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('discover / city rail surface — mobile', async ({ page }) => {
    await mockDiscoverFeedApi(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByText('Discover', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('discover-feed-mobile.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('CultureShop daily deals — mobile tile grid', async ({ page }) => {
    await mockCultureShopDealsApi(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/CultureShop');
    await expect(page.getByText('CultureShop').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Rewards & points').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('cultureshop-deals-mobile.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });

  test('map — desktop split layout with city chips', async ({ page }) => {
    await mockMapEventsApi(page);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/map');
    await expect(page.getByText('Map', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Melbourne').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('map-desktop-split.png', {
      fullPage: true,
      threshold: 0.3,
      mask: [page.locator('iframe')],
    });
  });
});