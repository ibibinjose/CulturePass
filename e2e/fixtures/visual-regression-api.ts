import type { Page } from '@playwright/test';

const E2E_USERS = [
  {
    id: 'user-e2e-1',
    username: 'priya_sharma',
    email: 'priya@culturepass.test',
    displayName: 'Priya Sharma',
    role: 'member',
    handle: 'priya-sharma',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
  {
    id: 'user-e2e-2',
    username: 'james_chen',
    email: 'james@culturepass.test',
    displayName: 'James Chen',
    role: 'organizer',
    handle: 'james-chen',
    createdAt: '2025-03-20T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
  },
];

/** Stable admin directory + stats for visual regression. */
export async function mockAdminDirectoryApi(page: Page) {
  await page.route('**/api/users**', async (route) => {
    if (route.request().method() !== 'GET') {
      return route.continue();
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2E_USERS),
    });
  });

  await page.route('**/api/admin/stats**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalUsers: E2E_USERS.length,
        totalEvents: 12,
        totalCommunities: 4,
        activeMembers: 2,
        revenueCents: 0,
      }),
    });
  });

  await page.route('**/api/admin/compliance**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ pendingReports: 0, resolvedReports: 0 }),
    });
  });

  await page.route('**/api/search**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [], users: [], events: [], communities: [] }),
    });
  });
}

/** Empty-but-valid discover payloads so the home feed layout stabilises. */
export async function mockDiscoverFeedApi(page: Page) {
  const emptyList = { status: 200, contentType: 'application/json', body: JSON.stringify({ events: [], total: 0 }) };
  const emptyArray = { status: 200, contentType: 'application/json', body: JSON.stringify([]) };

  await page.route('**/api/discover**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        trendingEvents: [],
        featuredCommunities: [],
        sections: [],
      }),
    });
  });

  await page.route('**/api/events**', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill(emptyList);
  });

  for (const path of [
    '**/api/communities**',
    '**/api/activities**',
    '**/api/perks**',
    '**/api/restaurants**',
    '**/api/movies**',
    '**/api/shopping**',
    '**/api/indigenous/**',
  ]) {
    await page.route(path, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      await route.fulfill(emptyArray);
    });
  }

  await page.route('**/api/council/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ council: null, events: [] }),
    });
  });
}