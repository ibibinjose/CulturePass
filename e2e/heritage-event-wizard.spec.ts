/**
 * Event create wizard — Gadigal + NAIDOC heritage E2E
 *
 * Requires E2E build:
 *   EXPO_PUBLIC_E2E_FIXTURES=true npm run build-web
 *   npx playwright test e2e/heritage-event-wizard.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';
import { injectE2EAuth } from './fixtures/host-pages-api';
import { mockEventWizardApi, type CapturedEventRequests } from './fixtures/events-api';

const EVENT_TITLE = 'NAIDOC Week on Gadigal Country';

async function continueWizard(page: Page) {
  const publish = page.getByTestId('event-wizard-publish');
  if (await publish.isVisible()) {
    await publish.click();
    return;
  }
  await page.getByTestId('event-wizard-continue').click();
}

async function advanceToCultureStep(page: Page) {
  await expect(page.getByText('Publishing as')).toBeVisible({ timeout: 15000 });
  await continueWizard(page);

  await expect(page.getByText('Event Details')).toBeVisible();
  await page.getByLabel('Event title').fill(EVENT_TITLE);
  await page.getByLabel('Event description').fill(
    'A community celebration on Gadigal Country during NAIDOC Week — storytelling, art, and shared culture.',
  );
  await page.getByLabel('Festival').click();
  await continueWizard(page);

  await expect(page.getByText('Event Image')).toBeVisible();
  await continueWizard(page);

  await expect(page.getByText('Where is it?')).toBeVisible();
  await page.getByLabel('City').fill('Sydney');
  await continueWizard(page);

  await expect(page.getByText('When is it?')).toBeVisible();
  await page.getByLabel('Event start date').fill('08/07/2026');
  await page.getByLabel('Event start time').fill('18:00');
  await continueWizard(page);

  await expect(page.getByText('Entry Type')).toBeVisible();
  await continueWizard(page);

  await expect(page.getByText('Core Team')).toBeVisible();
  await continueWizard(page);

  await expect(page.getByText('Cultural Tags')).toBeVisible({ timeout: 15000 });
}

test.describe('Event create — Gadigal NAIDOC heritage', () => {
  let capture: CapturedEventRequests;

  test.beforeEach(async ({ page }) => {
    capture = {};
    await injectE2EAuth(page);
    await mockEventWizardApi(page, capture);
  });

  test('culture step through publish sends indigenous heritage fields', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/hostspace/event/create');

    await advanceToCultureStep(page);

    const cultureFields = page.getByTestId('event-culture-indigenous-fields');
    await expect(cultureFields).toBeVisible();
    await cultureFields.getByText('Australian', { exact: true }).click();
    await cultureFields.getByText('Gadigal', { exact: true }).click();
    await cultureFields.getByText('NAIDOC', { exact: true }).click();

    await continueWizard(page);

    await expect(page.getByText('Review & Publish')).toBeVisible();
    await expect(page.getByText('Indigenous tags')).toBeVisible();
    await expect(page.getByText('Gadigal, NAIDOC')).toBeVisible();
    await expect(page.getByText('Nationality')).toBeVisible();
    await expect(page.getByText('Australian', { exact: true })).toBeVisible();
    await expect(page.getByText('Indigenous-owned')).toBeVisible();

    await page.getByTestId('event-wizard-publish').click();

    await expect(page.getByText('Published!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(EVENT_TITLE)).toBeVisible();

    await expect.poll(() => capture.createPayload).toBeTruthy();
    expect(capture.createPayload?.indigenousTags).toEqual(expect.arrayContaining(['gadigal', 'naidoc']));
    expect(capture.createPayload?.nationalityId).toBe('australian');
    expect(capture.createPayload?.isIndigenousOwned).toBe(true);
    expect(capture.createPayload?.title).toBe(EVENT_TITLE);

    await expect.poll(() => capture.publishedEventId).toBeTruthy();
    expect(capture.publishedEventId).toBe(capture.createdEventId);
  });
});