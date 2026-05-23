#!/usr/bin/env ts-node
/**
 * Assign Role Script — CulturePass
 *
 * Sets a Firebase custom claim (role) on a user by email or UID and syncs
 * the Firestore users/{uid} document so the app picks it up immediately.
 *
 * Run from the `functions/` directory:
 *
 *   npx ts-node scripts/assign-role.ts <email-or-uid> <role>
 *
 * Example — make jiobaba369@gmail.com an app superadmin:
 *   npx ts-node scripts/assign-role.ts jiobaba369@gmail.com superAdmin
 *
 * Valid roles:
 *   user | organizer | business | sponsor | cityAdmin | moderator | admin | platformAdmin | superAdmin
 *
 * Prerequisites:
 *   - Run `firebase login` first (or set GOOGLE_APPLICATION_CREDENTIALS)
 *   - GOOGLE_CLOUD_PROJECT env var OR update PROJECT_ID below
 */

import * as admin from 'firebase-admin';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'culturepass-4f264';

const VALID_ROLES = [
  'user', 'organizer', 'business', 'sponsor',
  'cityAdmin', 'moderator', 'admin', 'platformAdmin', 'superAdmin',
] as const;
type ValidRole = typeof VALID_ROLES[number];

const [,, lookup, role] = process.argv;

if (!lookup || !role) {
  console.error('Usage: npx ts-node scripts/assign-role.ts <email-or-uid> <role>');
  console.error('Valid roles:', VALID_ROLES.join(' | '));
  process.exit(1);
}

if (!VALID_ROLES.includes(role as ValidRole)) {
  console.error(`❌ Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const auth = admin.auth();
const db = admin.firestore();

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

async function run() {
  console.log(`\n🔍 Looking up user: ${lookup}`);

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = looksLikeEmail(lookup)
      ? await auth.getUserByEmail(lookup)
      : await auth.getUser(lookup);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('Could not load the default credentials')) {
      console.error('❌ Firebase credentials are not available. Run `gcloud auth application-default login`, `firebase login`, or set GOOGLE_APPLICATION_CREDENTIALS.');
      console.error('   Original error:', message);
      process.exit(1);
    }
    console.error(`❌ No Firebase Auth user found for ${looksLikeEmail(lookup) ? 'email' : 'UID'}: ${lookup}`);
    console.error('   Make sure the user has signed up in the app first, or pass the Firebase Auth UID from the console.');
    process.exit(1);
  }

  const uid = userRecord.uid;
  const existingClaims = userRecord.customClaims ?? {};
  const existingRole = existingClaims['role'] ?? 'user';

  console.log(`✅ Found user: ${userRecord.displayName ?? userRecord.email}`);
  console.log(`   UID:          ${uid}`);
  console.log(`   Current role: ${existingRole}`);
  console.log(`   New role:     ${role}`);

  // 1. Set Firebase custom claims (read by auth middleware on every request)
  await auth.setCustomUserClaims(uid, { ...existingClaims, role });
  console.log('\n✅ Custom claims updated (Firebase Auth)');

  // 2. Sync to Firestore users/{uid} (read by /api/auth/me response)
  await db.collection('users').doc(uid).set({ role }, { merge: true });
  console.log('✅ Firestore users/{uid} synced');

  console.log(`\n🎉 Done! ${userRecord.email ?? uid} is now: ${role}`);
  console.log('   The user must sign out and back in for the role to take effect in the app.');
}

run().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
