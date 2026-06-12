/**
 * Smoke test — canonical HostSpace create routes after URL consolidation.
 *
 *   EXPO_PUBLIC_E2E_FIXTURES=true npm run build-web
 *   npx playwright test e2e/hostspace-create-routes.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';
import { injectE2EAuth, mockHostPagesRollout } from './fixtures/host-pages-api';
import { mockEventWizardApi } from './fixtures/events-api';

test.describe('HostSpace create routes — smoke', () => {
  test.beforeEach(async ({ page }) => {
    await injectE2EAuth(page);
    await mockHostPagesRollout(page);
    await mockEventWizardApi(page, {});
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('/hostspace/create loads create catalog', async ({ page }) => {
    await page.goto('/hostspace/create');
    await expect(page.getByTestId('create-page-selector')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Which option is best for you?')).toBeVisible();
  });

  test('/hostspace/event/create loads event wizard', async ({ page }) => {
    await page.goto('/hostspace/event/create');
    await expect(page.getByText('Publishing as')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('event-wizard-continue')).toBeVisible();
  });

  test('/hostspace/community/create loads Page Pro wizard', async ({ page }) => {
    await page.goto('/hostspace/community/create');
    await expect(page.getByTestId('page-pro-wizard')).toBeVisible({ timeout: 20000 });
    await expect(page.getByLabel('Page name')).toBeVisible();
  });

  test('/hostspace/dining/create loads listing wizard', async ({ page }) => {
    await page.goto('/hostspace/dining/create');
    await expect(page.getByText('Identity', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  });

  test('/event/create redirects to /hostspace/event/create', async ({ page }) => {
    await page.goto('/event/create');
    await expect(page).toHaveURL(/\/hostspace\/event\/create/, { timeout: 20000 });
    await expect(page.getByText('Publishing as')).toBeVisible();
  });
});