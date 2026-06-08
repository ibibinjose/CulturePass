/**
 * Admin — Host Page verification review E2E
 */

import { test, expect } from '@playwright/test';
import {
  E2E_ADMIN_SESSION,
  injectE2EAuth,
  mockAdminVerificationApi,
} from './fixtures/host-pages-api';

const TASK_ID = 'task-page-e2e-1';

test.describe('Admin — Host Page verification', () => {
  test.beforeEach(async ({ page }) => {
    await injectE2EAuth(page, E2E_ADMIN_SESSION);
    await mockAdminVerificationApi(page, TASK_ID);
  });

  test('queue shows Page source type', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/admin/verification');
    await expect(page.getByText('Verification Queue')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(`verification-task-${TASK_ID}`)).toBeVisible();
    await expect(page.getByText(/HOST PAGE/i)).toBeVisible();
    await expect(page.getByText(/Page: page-e2e-venue-1/)).toBeVisible();
  });

  test('detail shows Host Page panel and page-specific checklist', async ({ page }) => {
    await page.goto(`/admin/verification/${TASK_ID}`);
    await expect(page.getByText('Verification Review')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Venue · Host Page')).toBeVisible();
    await expect(page.getByTestId('host-page-verification-panel').getByText('HOST PAGE', { exact: true })).toBeVisible();
    await expect(
      page.getByTestId('host-page-verification-panel').getByText('Indie Stage Sydney').first(),
    ).toBeVisible();
    await expect(page.getByText('Host Page Verification Checklist')).toBeVisible();
    await expect(page.getByText('Venue name and location claims reviewed')).toBeVisible();
    await expect(page.getByText('Your Page is your home on CulturePass')).toBeVisible();
  });

  test('admin can toggle checklist item', async ({ page }) => {
    await page.route(`**/api/admin/verification/tasks/${TASK_ID}/checklist`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto(`/admin/verification/${TASK_ID}`);
    await page.getByRole('checkbox', { name: /Venue name and location claims reviewed/ }).click();
    // Checkbox toggled — no error banner
    await expect(page.getByText('Failed')).not.toBeVisible();
  });
});