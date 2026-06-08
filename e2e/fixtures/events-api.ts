import type { Page } from '@playwright/test';
import { E2E_ORGANIZER_SESSION } from './host-pages-api';

export interface CapturedEventRequests {
  createPayload?: Record<string, unknown>;
  publishedEventId?: string;
  createdEventId?: string;
}

/** Stub profiles + events API for the event create wizard. */
export async function mockEventWizardApi(page: Page, capture: CapturedEventRequests = {}) {
  let eventCounter = 0;

  await page.route(/\/api\/events(\/|$|\?)/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (method === 'POST' && /\/publish$/.test(pathname)) {
      const segments = pathname.split('/').filter(Boolean);
      const eventId = segments[segments.length - 2] ?? `event-e2e-${eventCounter}`;
      capture.publishedEventId = eventId;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }

    if (method === 'POST' && pathname.endsWith('/events')) {
      eventCounter += 1;
      const body = route.request().postDataJSON() as Record<string, unknown>;
      capture.createPayload = body;
      const eventId = `event-e2e-${eventCounter}`;
      capture.createdEventId = eventId;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: eventId,
          ...body,
          status: 'draft',
          organizerId: E2E_ORGANIZER_SESSION.user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    }

    if (pathname.includes('/nearby') || pathname.includes('/popular')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [], total: 0, radiusKm: 25 }),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/profiles/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profiles: [] }),
    });
  });

  await page.route(/\/api\/profiles(\/|$|\?)/, async (route) => {
    const url = route.request().url();
    if (url.includes('/my') || url.includes('/drafts')) {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profiles: [] }),
    });
  });
}