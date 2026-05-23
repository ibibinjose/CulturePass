import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const base = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5050';
const baseUrl = new URL(base);
const serverPort = baseUrl.port || '5050';

async function isServerHealthy(): Promise<boolean> {
  try {
    const res = await fetch(`${base}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    if (await isServerHealthy()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('server did not start in time');
}

async function run() {
  const alreadyRunning = await isServerHealthy();
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const proc = alreadyRunning
    ? null
    : spawn(npmCmd, ['run', 'server:dev'], {
        stdio: 'ignore',
        env: { ...process.env, PORT: serverPort },
      });

  try {
    await waitForServer();

    // Flow 1: discovery + community recommended events
    // GET /api/communities returns { communities: FirestoreProfile[] }
    const communitiesRes = await fetch(`${base}/api/communities`);
    assert.equal(communitiesRes.ok, true, 'GET /api/communities should return 200');
    const communitiesBody = await communitiesRes.json() as { communities: { id: string }[] };
    assert.ok(Array.isArray(communitiesBody.communities), 'communities should be an array');

    const communityId = communitiesBody.communities[0]?.id ?? 'nonexistent';
    const recEventsRes = await fetch(`${base}/api/communities/${encodeURIComponent(communityId)}/recommended-events`);
    assert.equal(recEventsRes.ok, true, 'GET /api/communities/:id/recommended-events should return 200');

    // Flow 2: profile directory + search
    // GET /api/profiles returns { profiles: FirestoreProfile[] }
    const profilesRes = await fetch(`${base}/api/profiles`);
    assert.equal(profilesRes.ok, true, 'GET /api/profiles should return 200');
    const profilesBody = await profilesRes.json() as { profiles: unknown[] };
    assert.ok(Array.isArray(profilesBody.profiles), 'profiles should be an array');

    const searchRes = await fetch(`${base}/api/search?q=${encodeURIComponent('culture')}`);
    assert.equal(searchRes.ok, true, 'GET /api/search should return 200');
    const search = await searchRes.json();
    assert.ok(typeof search === 'object' && search !== null, 'search response should be an object');

    // Flow 3: rollout config (public)
    const rolloutRes = await fetch(`${base}/api/rollout/config?userId=${encodeURIComponent('qa-smoke-user')}`);
    assert.equal(rolloutRes.ok, true, 'GET /api/rollout/config should return 200');
    const rollout = await rolloutRes.json() as Record<string, unknown>;
    assert.ok(typeof rollout === 'object' && rollout !== null, 'rollout config should be an object');
    assert.ok(typeof rollout.phase === 'string', 'rollout config should have a phase field');

    // Flow 4: cultural-intelligence endpoint requires auth — expect 401 when unauthenticated
    const ciRes = await fetch(`${base}/api/cultural-intelligence/${encodeURIComponent('qa-smoke-user')}`);
    assert.equal(ciRes.status, 401, 'GET /api/cultural-intelligence/:userId should require auth');

    console.log('e2e critical smoke checks passed');
  } finally {
    proc?.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
