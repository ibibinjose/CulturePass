#!/usr/bin/env ts-node
/**
 * One-off Firestore cleanup: removes events written by retired third-party sync
 * (City of Sydney What's On scraper + legacy ingest), identified by:
 *   - document id prefix `cpass_wt_`, or
 *   - `tags` array contains `whatson`
 *
 * Default is dry-run (prints ids only). Pass `--execute` to delete.
 *
 * Run from `functions/`:
 *   npx ts-node scripts/deleteThirdPartySyncedEvents.ts
 *   npx ts-node scripts/deleteThirdPartySyncedEvents.ts --execute
 *
 * Requires Application Default Credentials (e.g. `gcloud auth application-default login`)
 * or GOOGLE_APPLICATION_CREDENTIALS. Set GOOGLE_CLOUD_PROJECT if not using default project.
 */

import * as admin from 'firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'culturepass-4f264';
const EXECUTE = process.argv.includes('--execute');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

async function collectTargets(): Promise<Set<string>> {
  const ids = new Set<string>();

  const prefixSnap = await db
    .collection('events')
    .orderBy(FieldPath.documentId())
    .startAt('cpass_wt_')
    .endAt('cpass_wt_\uf8ff')
    .get();
  prefixSnap.docs.forEach((d) => ids.add(d.id));

  const tagSnap = await db.collection('events').where('tags', 'array-contains', 'whatson').get();
  tagSnap.docs.forEach((d) => ids.add(d.id));

  return ids;
}

async function main() {
  const ids = await collectTargets();
  const list = [...ids].sort();

  if (list.length === 0) {
    console.log('No matching events found.');
    return;
  }

  console.log(`${EXECUTE ? 'Deleting' : 'Would delete'} ${list.length} event document(s).`);
  if (!EXECUTE) {
    console.log('Preview (first 50 ids):', list.slice(0, 50).join(', '));
    if (list.length > 50) console.log(`… and ${list.length - 50} more`);
    console.log('\nRe-run with --execute to delete.');
    return;
  }

  const BATCH = 450;
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = db.batch();
    const chunk = list.slice(i, i + BATCH);
    chunk.forEach((id) => batch.delete(db.collection('events').doc(id)));
    await batch.commit();
    console.log(`Deleted ${Math.min(i + BATCH, list.length)} / ${list.length}`);
  }
  console.log('Done.');
}

main().catch((e: unknown) => {
  console.error(e);
  const msg = e instanceof Error ? e.message : String(e);
  if (/default credentials|Could not load/i.test(msg)) {
    console.error(
      '\nFirestore needs credentials: `gcloud auth application-default login` or set GOOGLE_APPLICATION_CREDENTIALS.\n' +
        'For the emulator, set FIRESTORE_EMULATOR_HOST and use the emulator seed flow instead.',
    );
  }
  process.exit(1);
});
