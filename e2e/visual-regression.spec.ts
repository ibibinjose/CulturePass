/**
 * Visual Regression Starter — FIXES-001
 *
 * These tests capture screenshots of high-risk layout surfaces identified in the 2026-05-26 QA pass.
 * They are intentionally narrow and run against the static web export (served by the playwright.config webServer).
 *
 * Usage:
 *   npm run build-web
 *   npx playwright test e2e/visual-regression.spec.ts
 *
 * To update baselines (use with care, only after intentional visual changes):
 *   npx playwright test e2e/visual-regression.spec.ts --update-snapshots
 *
 * See docs/FIXES-001-layout-deformities.md for the full remediation plan and risk files.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual regression — critical layout surfaces (FIXES-001)', () => {
  test('host apply / entity selector — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // /hostspace/apply removed - consolidated into /hostspace/create
    await page.goto('/hostspace/create');
    // Wait for the hero gradient and cards to settle
    await page.waitForSelector('text=Create Your Host Profile', { timeout: 10000 });
    await expect(page).toHaveScreenshot('host-apply-desktop.png', {
      fullPage: true,
      threshold: 0.25,
    });
  });

  test('host apply / entity selector — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14-ish
    // /hostspace/apply removed - consolidated into /hostspace/create
    await page.goto('/hostspace/create');
    await page.waitForSelector('text=Create Your Host Profile', { timeout: 10000 });
    await expect(page).toHaveScreenshot('host-apply-mobile.png', {
      fullPage: true,
      threshold: 0.25,
    });
  });

  test('admin user directory — desktop with filters', async ({ page }) => {
    // Note: Admin routes are typically gated. This test assumes a dev build that allows access
    // or a public fallback state. If the page redirects, the screenshot will capture the login/onboarding surface.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/users');
    // Give the directory or its fallback a moment
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot('admin-users-desktop.png', {
      fullPage: true,
      threshold: 0.3,
      // Mask dynamic areas if they cause noise (avatars, timestamps, counts)
      mask: [page.locator('img'), page.locator('text=/\\d+ users/i')],
    });
  });

  test('discover / city rail surface — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    // Wait for the first rail to render
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('discover-feed-mobile.png', {
      fullPage: true,
      threshold: 0.3,
    });
  });
});
