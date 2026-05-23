import * as admin from 'firebase-admin';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) throw new Error(`Missing required env var: ${name}`);
  return v.trim();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function deleteCollectionRecursively(col: FirebaseFirestore.CollectionReference, batchSize = 500) {
  // Delete in small batches to avoid timeouts.
  // Firestore requires ordering for pagination; __name__ is deterministic.
  while (true) {
    const snap = await col.orderBy(admin.firestore.FieldPath.documentId()).limit(batchSize).get();
    if (snap.empty) break;

    const batch = col.firestore.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
  }
}

async function wipeFirestore(db: FirebaseFirestore.Firestore) {
  const rootCollections = await db.listCollections();
  for (const col of rootCollections) {
    await deleteCollectionRecursively(col);
  }
}

async function wipeAuthUsers(auth: admin.auth.Auth) {
  let pageToken: string | undefined = undefined;
  // listUsers page size max is 1000
  do {
    const res = await auth.listUsers(1000, pageToken);
    const uids = res.users.map((u) => u.uid);
    for (const batchUids of chunk(uids, 1000)) {
      if (batchUids.length === 0) continue;
      await auth.deleteUsers(batchUids);
    }
    pageToken = res.pageToken;
  } while (pageToken);
}

async function wipeStorage(storage: admin.storage.Storage, bucketName: string) {
  const bucket = storage.bucket(bucketName);
  // force: true deletes files and ignores individual failures
  await bucket.deleteFiles({ force: true });
}

async function main() {
  const projectId = requireEnv('FIREBASE_PROJECT_ID');
  const confirm = requireEnv('CONFIRM_NUKE');
  if (confirm !== projectId) {
    throw new Error(`Refusing to wipe. Set CONFIRM_NUKE=${projectId} to proceed (got ${confirm}).`);
  }

  const bucketName = process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`;

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId,
      storageBucket: bucketName,
    });
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });

  const auth = admin.auth();
  const storage = admin.storage();

  // Firestore
  await wipeFirestore(db);

  // Auth
  await wipeAuthUsers(auth);

  // Storage
  await wipeStorage(storage, bucketName);

  // Note: This does not change any Functions/Hosting config; it only wipes data.
  console.log(`[fullRebuildWipe] Wiped Firestore + Auth + Storage for project ${projectId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

