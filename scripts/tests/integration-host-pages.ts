/**
 * Integration test — Host Pages API (Create a Page flow)
 *
 * Run: npx tsx scripts/tests/integration-host-pages.ts
 * Requires: npm run server:dev (or INTEGRATION_BASE_URL)
 */

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const base = process.env.INTEGRATION_BASE_URL ?? 'http://127.0.0.1:5050';
const baseUrl = new URL(base);
const serverPort = baseUrl.port || '5050';

const ORGANIZER_HEADERS = {
  'Content-Type': 'application/json',
  'x-integration-test': 'organizer',
};

const ADMIN_HEADERS = {
  'Content-Type': 'application/json',
  'x-integration-test': 'admin',
};

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start in time');
}

async function json<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

async function run() {
  const proc = spawn(npmCommand(), ['run', 'server:dev'], {
    stdio: 'ignore',
    env: { ...process.env, PORT: serverPort, HOST_PAGES_V1: 'true' },
  });

  try {
    await waitForServer();

    // Feature flag exposes host-pages-v1
    const flagsRes = await fetch(`${base}/api/rollout/flags?userId=qa-host-pages`);
    assert.equal(flagsRes.ok, true, 'GET /api/rollout/flags should return 200');
    const flags = await json<{ flags: Record<string, boolean> }>(flagsRes);
    assert.equal(flags.flags['host-pages-v1'], true, 'host-pages-v1 should be enabled in internal/dev');

    // Save draft
    const draftRes = await fetch(`${base}/api/host-pages/drafts`, {
      method: 'POST',
      headers: ORGANIZER_HEADERS,
      body: JSON.stringify({
        entityType: 'venue',
        formData: {
          name: 'Integration Test Venue',
          bio: 'A test venue page created by integration-host-pages.ts for QA validation.',
          categoryTags: ['Venue'],
          culturalTags: ['Multicultural'],
          languageTags: ['English'],
          membershipModel: 'free',
        },
        currentStep: 2,
        completedSteps: [1],
      }),
    });
    assert.equal(draftRes.status, 200, 'POST /api/host-pages/drafts should succeed');
    const draftBody = await json<{ success: boolean; draftId: string }>(draftRes);
    assert.ok(draftBody.success);
    assert.ok(draftBody.draftId);

    // List drafts
    const draftsListRes = await fetch(`${base}/api/host-pages/drafts`, { headers: ORGANIZER_HEADERS });
    assert.equal(draftsListRes.ok, true);
    const draftsList = await json<{ drafts: { id: string }[] }>(draftsListRes);
    assert.ok(Array.isArray(draftsList.drafts));

    // Create page
    const createRes = await fetch(`${base}/api/host-pages`, {
      method: 'POST',
      headers: ORGANIZER_HEADERS,
      body: JSON.stringify({
        entityType: 'venue',
        templateId: 'indie-venue',
        formData: {
          name: 'Integration Test Venue',
          bio: 'A test venue page with sufficient bio length for publish validation in the integration suite.',
          categoryTags: ['Venue', 'Live Music'],
          culturalTags: ['Multicultural'],
          languageTags: ['English'],
          logoUrl: 'https://storage.googleapis.com/demo/logo.png',
          coverUrl: 'https://storage.googleapis.com/demo/cover.png',
          membershipModel: 'free',
          ctaLabel: 'Book',
          ctaAction: 'book',
        },
      }),
    });
    assert.equal(createRes.status, 201, 'POST /api/host-pages should return 201');
    const page = await json<{ id: string; status: string }>(createRes);
    assert.ok(page.id);
    assert.equal(page.status, 'draft');

    // Publish (venue → pending_verification + verification task)
    const publishRes = await fetch(`${base}/api/host-pages/${page.id}/publish`, {
      method: 'POST',
      headers: ORGANIZER_HEADERS,
    });
    assert.equal(publishRes.ok, true, 'POST /api/host-pages/:id/publish should succeed');
    const publishBody = await json<{
      success: boolean;
      verificationRequired: boolean;
      status: string;
    }>(publishRes);
    assert.equal(publishBody.verificationRequired, true);
    assert.equal(publishBody.status, 'pending_verification');

    // Admin verification queue includes page task
    const tasksRes = await fetch(`${base}/api/admin/verification/tasks?status=pending`, {
      headers: ADMIN_HEADERS,
    });
    assert.equal(tasksRes.ok, true);
    const tasksBody = await json<{
      tasks: { id: string; pageId?: string; checklist: { item: string }[] }[];
    }>(tasksRes);
    const pageTask = tasksBody.tasks.find((t) => t.pageId === page.id);
    assert.ok(pageTask, 'verification task should exist for published page');
    assert.ok(
      pageTask.checklist.some((c) => c.item.includes('Venue name')),
      'page-specific checklist should include venue items',
    );

    // Admin fetch host page
    const adminPageRes = await fetch(`${base}/api/admin/host-pages/${page.id}`, {
      headers: ADMIN_HEADERS,
    });
    assert.equal(adminPageRes.ok, true);
    const adminPage = await json<{ id: string; formData: { name: string } }>(adminPageRes);
    assert.equal(adminPage.id, page.id);
    assert.equal(adminPage.formData.name, 'Integration Test Venue');

    // Approve verification
    const approveRes = await fetch(`${base}/api/admin/verification/tasks/${pageTask.id}/approve`, {
      method: 'POST',
      headers: ADMIN_HEADERS,
      body: JSON.stringify({ adminNotes: 'Integration test approval' }),
    });
    assert.equal(approveRes.ok, true, 'admin approve should succeed');

    console.log('integration host-pages checks passed');
  } finally {
    proc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});