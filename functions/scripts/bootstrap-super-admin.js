#!/usr/bin/env node
/**
 * Bootstrap CulturePass app superadmin using the Firebase CLI login session.
 *
 * This is useful on machines where `firebase login` is available but
 * Application Default Credentials are not configured for firebase-admin.
 */

const { execFileSync } = require('node:child_process');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'culturepass-4f264';
const UID = process.env.SUPER_ADMIN_UID || '1VLiq1SEUzWNM7J2XScWn3UbFI52';
const EMAIL = process.env.SUPER_ADMIN_EMAIL || 'jiobaba369@gmail.com';
const ROLE = 'superAdmin';

function getAccessToken() {
  const output = execFileSync('firebase', ['login:list', '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(output);
  const token = parsed?.result?.[0]?.tokens?.access_token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Firebase CLI is not logged in. Run `firebase login` first.');
  }
  return token;
}

async function requestJson(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = body?.error?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function setAuthClaim(token) {
  const lookupUrl = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`;
  const updateUrl = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`;

  let user;
  try {
    const lookup = await requestJson(lookupUrl, token, {
      method: 'POST',
      body: JSON.stringify({ localId: [UID] }),
    });
    user = lookup?.users?.[0];
  } catch (err) {
    if (err.status === 404) return false;
    throw err;
  }

  if (!user) return false;

  const existingClaims = user.customAttributes ? JSON.parse(user.customAttributes) : {};
  await requestJson(updateUrl, token, {
    method: 'POST',
    body: JSON.stringify({
      localId: UID,
      customAttributes: JSON.stringify({ ...existingClaims, role: ROLE }),
    }),
  });
  return true;
}

async function setFirestoreRole(token) {
  const documentPath = `projects/${PROJECT_ID}/databases/(default)/documents/users/${UID}`;
  const masks = ['email', 'role', 'updatedAt']
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&');
  const url = `https://firestore.googleapis.com/v1/${documentPath}?${masks}`;

  await requestJson(url, token, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: {
        email: { stringValue: EMAIL },
        role: { stringValue: ROLE },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
}

async function run() {
  const token = getAccessToken();
  const authUpdated = await setAuthClaim(token);
  await setFirestoreRole(token);

  console.log(`Firestore users/${UID} role set to ${ROLE}.`);
  console.log(authUpdated
    ? `Firebase Auth custom claim for ${UID} set to ${ROLE}.`
    : `Firebase Auth user ${UID} was not found in ${PROJECT_ID}; custom claim was not set.`);
}

run().catch((err) => {
  console.error('Bootstrap failed:', err.message);
  process.exit(1);
});
