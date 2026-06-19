#!/usr/bin/env ts-node
/**
 * Fresh backend cleanup — keeps user accounts + user-owned storage only.
 *
 * Firestore: preserves `users` (+ subcollections), `privacySettings`, `pushTokens`.
 *            Deletes every other root collection (events, communities, profiles, …).
 * Storage:   keeps `users/`, `avatars/`, `uploads/` (uid-scoped).
 *            Deletes events, profiles, communities, perks, and all other prefixes.
 *
 * Auth: uses `firebase login` refresh token, or GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Run from functions/:
 *   GOOGLE_CLOUD_PROJECT=culturepass-4f264 npx ts-node scripts/fresh-backend-cleanup.ts --confirm
 */

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { OAuth2Client } from 'google-auth-library';
import { FieldValue, Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'culturepass-4f264';
const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${PROJECT_ID}.firebasestorage.app`;
const CONFIRM = process.argv.includes('--confirm');

const KEEP_COLLECTIONS = new Set(['users', 'privacySettings', 'pushTokens']);
const KEEP_STORAGE_PREFIXES = ['users/', 'avatars/', 'uploads/'];

const USER_FIELDS_TO_CLEAR = [
  'communities',
  'communityIds',
  'joinedCommunities',
  'followingCommunityIds',
] as const;

async function createAuthClient(): Promise<OAuth2Client> {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    return client as OAuth2Client;
  }

  const configPath = join(homedir(), '.config/configstore/firebase-tools.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    tokens?: { access_token?: string; expires_at?: number };
  };
  const tokens = config.tokens;
  if (!tokens?.access_token) {
    throw new Error('Run `npx firebase-tools@latest login` or set GOOGLE_APPLICATION_CREDENTIALS.');
  }

  if (!tokens.expires_at || tokens.expires_at <= Date.now()) {
    throw new Error('Firebase CLI access token expired. Run any firebase command to refresh, or `npx firebase-tools@latest login --reauth`.');
  }

  const client = new OAuth2Client();
  client.setCredentials({ access_token: tokens.access_token, expiry_date: tokens.expires_at });
  return client;
}

async function deleteRootCollection(db: Firestore, name: string): Promise<number> {
  const col = db.collection(name);
  const countSnap = await col.count().get();
  const count = countSnap.data().count;
  if (count === 0) {
    console.log(`  skip ${name} (empty)`);
    return 0;
  }
  console.log(`  deleting ${name} (~${count} docs + subcollections)...`);
  await db.recursiveDelete(col);
  return count;
}

async function scrubUserCommunityFields(db: Firestore): Promise<number> {
  const snap = await db.collection('users').get();
  let updated = 0;
  const batchSize = 400;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const patch: Record<string, FieldValue> = {};
    let needsUpdate = false;

    for (const field of USER_FIELDS_TO_CLEAR) {
      if (field in data) {
        patch[field] = FieldValue.delete();
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      batch.update(doc.ref, patch);
      ops += 1;
      updated += 1;
      if (ops >= batchSize) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (ops > 0) await batch.commit();
  return updated;
}

function shouldKeepStorageObject(objectPath: string): boolean {
  return KEEP_STORAGE_PREFIXES.some((prefix) => objectPath.startsWith(prefix));
}

async function purgeStorage(storage: Storage): Promise<{ deleted: number; kept: number }> {
  const bucket = storage.bucket(BUCKET_NAME);
  let deleted = 0;
  let kept = 0;
  let pageToken: string | undefined;

  do {
    const [files, nextQuery] = await bucket.getFiles({
      autoPaginate: false,
      maxResults: 1000,
      pageToken,
    });

    const toDelete = files.filter((f) => !shouldKeepStorageObject(f.name));
    kept += files.length - toDelete.length;

    if (toDelete.length > 0) {
      await Promise.all(
        toDelete.map(async (file) => {
          try {
            await file.delete({ ignoreNotFound: true });
            deleted += 1;
          } catch (err) {
            console.error(`  failed to delete storage object ${file.name}:`, err);
          }
        }),
      );
      console.log(`  storage: deleted ${deleted} objects so far...`);
    }

    pageToken = (nextQuery as { pageToken?: string } | undefined)?.pageToken;
  } while (pageToken);

  return { deleted, kept };
}

async function main(): Promise<void> {
  if (!CONFIRM) {
    console.error('\nRefusing to run without --confirm (destructive production wipe).\n');
    console.error('  GOOGLE_CLOUD_PROJECT=culturepass-4f264 npx ts-node scripts/fresh-backend-cleanup.ts --confirm\n');
    process.exit(1);
  }

  console.log(`\nFresh backend cleanup — project: ${PROJECT_ID}`);
  console.log(`Storage bucket: ${BUCKET_NAME}`);
  console.log('Keeping Firestore:', [...KEEP_COLLECTIONS].join(', '));
  console.log('Keeping Storage prefixes:', KEEP_STORAGE_PREFIXES.join(', '));
  console.log('');

  const authClient = await createAuthClient();
  const db = new Firestore({ projectId: PROJECT_ID, authClient });
  const storage = new Storage({ projectId: PROJECT_ID, authClient });

  const rootCollections = await db.listCollections();
  const toDelete = rootCollections
    .map((c) => c.id)
    .filter((id) => !KEEP_COLLECTIONS.has(id))
    .sort();

  console.log(`Firestore: deleting ${toDelete.length} root collections...`);
  let deletedDocs = 0;
  for (const name of toDelete) {
    deletedDocs += await deleteRootCollection(db, name);
  }

  console.log('\nFirestore: scrubbing community fields on user documents...');
  const scrubbedUsers = await scrubUserCommunityFields(db);
  console.log(`  updated ${scrubbedUsers} user docs`);

  console.log('\nStorage: purging non-user prefixes...');
  const storageResult = await purgeStorage(storage);
  console.log(`  deleted ${storageResult.deleted} objects, kept ${storageResult.kept}`);

  const [userCount, privacyCount, tokenCount] = await Promise.all([
    db.collection('users').count().get(),
    db.collection('privacySettings').count().get(),
    db.collection('pushTokens').count().get(),
  ]);

  console.log('\nDone.');
  console.log(`  Firestore collections removed: ${toDelete.length} (~${deletedDocs} top-level docs)`);
  console.log(`  Users remaining: ${userCount.data().count}`);
  console.log(`  privacySettings remaining: ${privacyCount.data().count}`);
  console.log(`  pushTokens remaining: ${tokenCount.data().count}`);
  console.log(`  Storage objects deleted: ${storageResult.deleted}`);
  console.log('');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});