import assert from 'node:assert/strict';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

import { app as functionsApp } from '../../functions/src/app';
import { canAssignAdministrativeRole, resolveAdminAuditActorId, sanitizeUserResponse } from '../../functions/src/handlers/utils';
import type { RequestUser } from '../../functions/src/middleware/auth';

function makeAuthedApp() {
  const wrapper = express();

  wrapper.use((req: Request, _res: Response, next: NextFunction) => {
    const roleHeader = req.headers['x-test-role'];
    if (!roleHeader) {
      next();
      return;
    }

    const role = String(roleHeader) as RequestUser['role'];
    const userId = String(req.headers['x-test-user-id'] ?? `test-${role}`);
    req.user = {
      id: userId,
      username: userId,
      role,
      email: `${userId}@example.com`,
      city: role === 'cityAdmin' ? 'Sydney' : undefined,
      country: role === 'cityAdmin' ? 'Australia' : undefined,
    };
    next();
  });

  wrapper.use(functionsApp);
  return wrapper;
}

async function waitForServer(baseUrl: string): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      // no-op
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('test server did not start in time');
}

function authedHeaders(role: RequestUser['role'], userId: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-test-role': role,
    'x-test-user-id': userId,
  };
}

const baseUser = {
  id: 'u-1',
  username: 'culturefan',
  displayName: 'Culture Fan',
  email: 'culturefan@example.com',
  role: 'user',
  membership: { tier: 'plus', isActive: true },
  interests: ['festivals'],
  languages: ['English'],
} satisfies Record<string, unknown>;

const owner: RequestUser = { id: 'u-1', username: 'culturefan', role: 'user' };
const admin: RequestUser = { id: 'admin-1', username: 'admin', role: 'admin' };
const moderator: RequestUser = { id: 'mod-1', username: 'moderator', role: 'moderator' };
const cityAdmin: RequestUser = { id: 'city-1', username: 'city-admin', role: 'cityAdmin' };

// sanitizeUserResponse
{
  const sanitized = sanitizeUserResponse(baseUser);
  assert.equal(sanitized.email, undefined);
  assert.equal(sanitized.role, undefined);
  assert.equal(sanitized.membership, undefined);
  assert.equal(sanitized.interests, undefined);
}

{
  const sanitized = sanitizeUserResponse(baseUser, owner);
  assert.equal(sanitized.email, 'culturefan@example.com');
  assert.equal(sanitized.role, 'user');
  assert.deepEqual(sanitized.membership, { tier: 'plus', isActive: true });
}

{
  const sanitized = sanitizeUserResponse(baseUser, admin);
  assert.equal(sanitized.email, 'culturefan@example.com');
  assert.equal(sanitized.role, 'user');
}

// resolveAdminAuditActorId
assert.equal(resolveAdminAuditActorId(cityAdmin, 'someone-else'), 'city-1');
assert.equal(resolveAdminAuditActorId(moderator, 'someone-else'), 'mod-1');
assert.equal(resolveAdminAuditActorId(admin, 'someone-else'), 'someone-else');

// canAssignAdministrativeRole
assert.equal(canAssignAdministrativeRole(admin, 'user', 'admin', 'other-user'), true);
assert.equal(canAssignAdministrativeRole(admin, 'user', 'platformAdmin', 'other-user'), false);
assert.equal(canAssignAdministrativeRole(admin, 'platformAdmin', 'user', 'platform-admin-user'), false);
assert.equal(canAssignAdministrativeRole(admin, 'user', 'moderator', 'admin-1'), false);
assert.equal(canAssignAdministrativeRole(
  { id: 'platform-1', username: 'platform', role: 'platformAdmin' },
  'user',
  'moderator',
  'other-user',
), true);
assert.equal(canAssignAdministrativeRole(
  { id: 'platform-1', username: 'platform', role: 'platformAdmin' },
  'user',
  'admin',
  'other-user',
), false);
assert.equal(canAssignAdministrativeRole(
  { id: 'platform-1', username: 'platform', role: 'platformAdmin' },
  'admin',
  'user',
  'admin-user',
), false);

async function run() {
  const app = makeAuthedApp();
  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('unable to determine test server address');
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await waitForServer(baseUrl);

    const discoverGuest = await fetch(`${baseUrl}/api/discover/u-1`);
    assert.equal(discoverGuest.status, 401);

    const discoverForbidden = await fetch(`${baseUrl}/api/discover/u-1`, {
      headers: authedHeaders('user', 'u-2'),
    });
    assert.equal(discoverForbidden.status, 403);

    const discoverAllowed = await fetch(`${baseUrl}/api/discover/u-1`, {
      headers: authedHeaders('user', 'u-1'),
    });
    assert.equal(discoverAllowed.status, 200);

    const intelligenceGuest = await fetch(`${baseUrl}/api/cultural-intelligence/u-1`);
    assert.equal(intelligenceGuest.status, 401);

    const intelligenceForbidden = await fetch(`${baseUrl}/api/cultural-intelligence/u-1`, {
      headers: authedHeaders('user', 'u-2'),
    });
    assert.equal(intelligenceForbidden.status, 403);

    const intelligenceAllowed = await fetch(`${baseUrl}/api/cultural-intelligence/u-1`, {
      headers: authedHeaders('user', 'u-1'),
    });
    assert.equal(intelligenceAllowed.status, 200);

    const feedbackGuest = await fetch(`${baseUrl}/api/discover/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'u-1', eventId: 'e1', signal: 'up' }),
    });
    assert.equal(feedbackGuest.status, 401);

    const feedbackForbidden = await fetch(`${baseUrl}/api/discover/feedback`, {
      method: 'POST',
      headers: authedHeaders('user', 'u-2'),
      body: JSON.stringify({ userId: 'u-1', eventId: 'e1', signal: 'up' }),
    });
    assert.equal(feedbackForbidden.status, 403);

    const feedbackAllowed = await fetch(`${baseUrl}/api/discover/feedback`, {
      method: 'POST',
      headers: authedHeaders('user', 'u-1'),
      body: JSON.stringify({ userId: 'u-1', eventId: 'e1', signal: 'up' }),
    });
    assert.equal(feedbackAllowed.status, 200);

    console.log('functions authz policy checks passed');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
