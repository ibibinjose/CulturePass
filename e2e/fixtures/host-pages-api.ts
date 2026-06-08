import type { Page } from '@playwright/test';
import type { AuthSession } from '@/lib/auth';
import { E2E_PAGE_BRANDING_PATCH } from '@/lib/e2e-fixtures';

/** Organizer session injected before app boot (see src/lib/e2e-fixtures.ts). */
export const E2E_ORGANIZER_SESSION: AuthSession = {
  user: {
    id: 'e2e-organizer-1',
    username: 'e2e-organizer',
    email: 'e2e-organizer@culturepass.test',
    role: 'organizer',
    displayName: 'E2E Organizer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  accessToken: 'e2e-test-token',
  expiresAt: Date.now() + 60 * 60 * 1000,
};

export const E2E_ADMIN_SESSION: AuthSession = {
  user: {
    id: 'e2e-admin-1',
    username: 'e2e-admin',
    email: 'e2e-admin@culturepass.test',
    role: 'admin',
    displayName: 'E2E Admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  accessToken: 'e2e-admin-token',
  expiresAt: Date.now() + 60 * 60 * 1000,
};

export async function injectE2EAuth(page: Page, session = E2E_ORGANIZER_SESSION) {
  await page.addInitScript((s) => {
    window.__CP_E2E_AUTH__ = s;
  }, session);
}

/** Pre-fill branding URLs so publish E2E can skip file uploads. */
export async function injectE2EPageForm(page: Page, patch = E2E_PAGE_BRANDING_PATCH) {
  await page.addInitScript((p) => {
    window.__CP_E2E_PAGE_FORM__ = p;
  }, patch);
}

export async function mockHostPagesRollout(page: Page) {
  await page.route('**/api/rollout/flags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        rollout: { phase: 'internal', percentage: 100 },
        flags: { 'host-pages-v1': true },
        experiments: {},
        userSegment: 'guest',
      }),
    });
  });
}

export async function mockHostPagesApi(page: Page) {
  const drafts: Record<string, unknown> = {};
  let pageCounter = 0;

  await page.route(/\/api\/host-pages(\/|$|\?)/, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/drafts') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ drafts: Object.values(drafts) }),
      });
    }

    if (url.includes('/drafts') && method === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const draftId = `draft-${Date.now()}`;
      const saved = {
        id: draftId,
        userId: E2E_ORGANIZER_SESSION.user.id,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      };
      drafts[draftId] = saved;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          draftId,
          savedAt: saved.updatedAt,
          draft: saved,
        }),
      });
    }

    if (url.endsWith('/my') || url.includes('/my?')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pages: [] }),
      });
    }

    if (
      method === 'POST'
      && url.includes('/host-pages')
      && !url.includes('/publish')
      && !url.includes('/drafts')
      && !url.includes('/block')
      && !url.includes('/unblock')
    ) {
      pageCounter += 1;
      const pageId = `page-e2e-${pageCounter}`;
      const body = route.request().postDataJSON() as { entityType: string; formData: Record<string, unknown> };
      drafts[`create-${pageId}`] = body;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: pageId,
          entityType: body.entityType,
          ownerId: E2E_ORGANIZER_SESSION.user.id,
          formData: body.formData,
          status: 'draft',
          verificationStatus: 'not_started',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModifiedBy: E2E_ORGANIZER_SESSION.user.id,
        }),
      });
    }

    if (url.includes('/publish') && method === 'POST') {
      const pageId = url.split('/').slice(-2)[0] ?? 'page-e2e-1';
      let entityType = 'community';
      try {
        const createBody = drafts[`create-${pageId}`] as { entityType?: string } | undefined;
        if (createBody?.entityType) entityType = createBody.entityType;
      } catch {
        // use default
      }
      const verificationRequired = !['community', 'artist'].includes(entityType);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          pageId,
          status: verificationRequired ? 'pending_verification' : 'published',
          verificationRequired,
          estimatedReviewTime: verificationRequired ? '24–48 hours' : undefined,
        }),
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

  await page.route('**/api/host-applications/my**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ application: null }),
    });
  });
}

export async function mockAdminVerificationApi(page: Page, taskId = 'task-page-e2e-1') {
  const hostPage = {
    id: 'page-e2e-venue-1',
    entityType: 'venue',
    ownerId: E2E_ORGANIZER_SESSION.user.id,
    formData: {
      name: 'Indie Stage Sydney',
      bio: 'A grassroots venue for diaspora artists and intimate cultural nights in the inner west.',
      categoryTags: ['Venue', 'Live Music'],
      culturalTags: ['Multicultural'],
      languageTags: ['English'],
      logoUrl: 'https://storage.example.com/logo.png',
      coverUrl: 'https://storage.example.com/cover.png',
      membershipModel: 'free',
      ctaLabel: 'Book',
      ctaAction: 'book',
    },
    status: 'pending_verification',
    verificationStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastModifiedBy: E2E_ORGANIZER_SESSION.user.id,
  };

  const task = {
    id: taskId,
    pageId: hostPage.id,
    entityType: 'venue',
    submittedBy: E2E_ORGANIZER_SESSION.user.id,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    documents: [hostPage.formData.logoUrl, hostPage.formData.coverUrl],
    checklist: [
      { item: 'Venue name and location claims reviewed', checked: false },
      { item: 'Logo and cover represent the physical venue', checked: false },
      { item: 'Cultural programming tags verified', checked: false },
    ],
    adminNotes: '',
    slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  };

  await page.route('**/api/admin/verification/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pending: 1, inReview: 0, approved: 0, rejected: 0, moreInfoNeeded: 0, overdueSla: 0 }),
      });
    }
    if (url.includes('/tasks/') && !url.endsWith('/tasks')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(task) });
    }
    if (url.includes('/tasks')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tasks: [task] }) });
    }
    return route.continue();
  });

  await page.route('**/api/admin/host-pages/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(hostPage) });
  });
}