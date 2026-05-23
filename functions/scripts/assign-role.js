#!/usr/bin/env node
/**
 * Assign Role Script — CulturePass
 *
 * Plain JS variant so role assignment can run without ts-node/tsx loaders.
 *
 * Usage:
 *   node scripts/assign-role.js <email-or-uid> <role>
 */

const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'culturepass-4f264';

const VALID_ROLES = [
  'user',
  'organizer',
  'business',
  'sponsor',
  'cityAdmin',
  'moderator',
  'admin',
  'platformAdmin',
  'superAdmin',
];

const [, , lookup, role] = process.argv;

if (!lookup || !role) {
  console.error('Usage: node scripts/assign-role.js <email-or-uid> <role>');
  console.error('Valid roles:', VALID_ROLES.join(' | '));
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();

function looksLikeEmail(value) {
  return value.includes('@');
}

async function run() {
  console.log(`\nLooking up user: ${lookup}`);

  let userRecord;
  try {
    userRecord = looksLikeEmail(lookup)
      ? await auth.getUserByEmail(lookup)
      : await auth.getUser(lookup);
  } catch (err) {
    const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : '';
    if (message.includes('Could not load the default credentials')) {
      console.error('Firebase credentials are not available. Run `gcloud auth application-default login`, `firebase login`, or set GOOGLE_APPLICATION_CREDENTIALS.');
      console.error('Original error:', message);
      process.exit(1);
    }
    console.error(`No Firebase Auth user found for ${looksLikeEmail(lookup) ? 'email' : 'UID'}: ${lookup}`);
    console.error('Make sure the user has signed up in the app first, or pass the Firebase Auth UID from the console.');
    process.exit(1);
  }

  const uid = userRecord.uid;
  const existingClaims = userRecord.customClaims || {};
  const existingRole = existingClaims.role || 'user';

  console.log(`Found user: ${userRecord.displayName || userRecord.email || uid}`);
  console.log(`  UID:          ${uid}`);
  console.log(`  Current role: ${existingRole}`);
  console.log(`  New role:     ${role}`);

  await auth.setCustomUserClaims(uid, { ...existingClaims, role });
  console.log('\nCustom claims updated.');

  await db.collection('users').doc(uid).set({ role }, { merge: true });
  console.log('Firestore users/{uid} synced.');

  console.log(`\nDone. ${userRecord.email || uid} is now: ${role}`);
  console.log('Sign out and back in for the role to take effect in the app.');
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
