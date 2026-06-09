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

const E2E_MAP_EVENTS = [
  {
    id: 'event-e2e-melbourne',
    title: 'Laneway Festival Preview',
    date: '2026-07-12',
    time: '18:00',
    city: 'Melbourne',
    venue: 'ACMI',
    lat: -37.8136,
    lng: 144.9631,
    imageUrl: null,
  },
  {
    id: 'event-e2e-sydney',
    title: 'Harbour Lights Concert',
    date: '2026-07-18',
    time: '19:30',
    city: 'Sydney',
    venue: 'Opera House Forecourt',
    lat: -33.8568,
    lng: 151.2153,
    imageUrl: null,
  },
  {
    id: 'event-e2e-brisbane',
    title: 'South Bank Night Market',
    date: '2026-07-20',
    time: '17:00',
    city: 'Brisbane',
    venue: 'South Bank Parklands',
    lat: -27.4748,
    lng: 153.0211,
    imageUrl: null,
  },
];

const E2E_DAILY_DEALS = [
  {
    id: 'deal-e2e-reward',
    title: 'Rewards & points',
    subtitle: 'Earn on tickets and redeem partner perks',
    kind: 'reward',
    href: '/payment/wallet',
    linkPolicy: 'public',
    startsAt: '2026-06-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.000Z',
    status: 'active',
    priority: 30,
    createdAt: '2026-06-01T00:00:00.000Z',
    createdBy: 'e2e',
    accentKey: 'teal',
    coverUrl: null,
  },
  {
    id: 'deal-e2e-plus',
    title: 'CulturePass+ exclusives',
    subtitle: 'Extra savings for subscribers',
    kind: 'offer',
    href: '/offers',
    linkPolicy: 'premium_required',
    startsAt: '2026-06-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.000Z',
    status: 'active',
    priority: 10,
    createdAt: '2026-06-01T00:00:00.000Z',
    createdBy: 'e2e',
    accentKey: 'violet',
    coverUrl: null,
  },
];

/** Stable CultureShop daily deals for tile layout regression (FIXES-001 P4). */
export async function mockCultureShopDealsApi(page: Page) {
  await page.route('**/api/culture-shop/daily-deals**', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ deals: E2E_DAILY_DEALS }),
    });
  });
}

/** Stable map events for desktop web map split layout (FIXES-001 P3). */
export async function mockMapEventsApi(page: Page) {
  await page.route('**/api/events**', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: E2E_MAP_EVENTS, total: E2E_MAP_EVENTS.length }),
    });
  });
}