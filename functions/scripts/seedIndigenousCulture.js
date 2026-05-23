 
 
const admin = require('firebase-admin');

const {
  indigenousOrganisationsSeed,
  culturalFestivalsSeed,
  indigenousBusinessesSeed,
} = require('../lib/functions/src/data/indigenousCultureSeed');

function validateUniqueIds(records, label) {
  const seen = new Set();
  for (const item of records) {
    if (!item || !item.id) {
      throw new Error(`[seed:indigenous] ${label} has missing id`);
    }
    if (seen.has(item.id)) {
      throw new Error(`[seed:indigenous] ${label} duplicate id: ${item.id}`);
    }
    seen.add(item.id);
  }
}

async function upsertCollection(db, collectionName, records) {
  let batch = db.batch();
  let count = 0;
  let written = 0;

  for (const record of records) {
    const ref = db.collection(collectionName).doc(record.id);
    batch.set(ref, record, { merge: true });
    count += 1;
    written += 1;

    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  return written;
}

async function run() {
  if (!admin.apps.length) {
    const options = {};
    if (process.env.FIREBASE_PROJECT_ID) {
      options.projectId = process.env.FIREBASE_PROJECT_ID;
    }
    admin.initializeApp(options);
  }
  const db = admin.firestore();
  const dryRun = process.argv.includes('--dry-run');

  validateUniqueIds(indigenousOrganisationsSeed, 'indigenousOrganisations');
  validateUniqueIds(culturalFestivalsSeed, 'culturalFestivals');
  validateUniqueIds(indigenousBusinessesSeed, 'indigenousBusinesses');

  console.log(`[seed:indigenous] organisations: ${indigenousOrganisationsSeed.length}`);
  console.log(`[seed:indigenous] festivals: ${culturalFestivalsSeed.length}`);
  console.log(`[seed:indigenous] businesses: ${indigenousBusinessesSeed.length}`);

  if (dryRun) {
    console.log('[seed:indigenous] dry-run complete (no writes).');
    return;
  }

  const writtenOrgs = await upsertCollection(db, 'indigenousOrganisations', indigenousOrganisationsSeed);
  const writtenFestivals = await upsertCollection(db, 'culturalFestivals', culturalFestivalsSeed);
  const writtenBusinesses = await upsertCollection(db, 'indigenousBusinesses', indigenousBusinessesSeed);

  await db.collection('_meta').doc('indigenousCultureDataset').set({
    updatedAt: new Date().toISOString(),
    organisations: writtenOrgs,
    festivals: writtenFestivals,
    businesses: writtenBusinesses,
    source: 'functions/src/data/indigenousCultureSeed.ts',
    uploadedBy: process.env.INDIGENOUS_DATASET_UPLOADED_BY || 'script',
    collections: ['indigenousOrganisations', 'culturalFestivals', 'indigenousBusinesses'],
  }, { merge: true });

  console.log('[seed:indigenous] write complete.');
}

run().catch((error) => {
  console.error('[seed:indigenous] failed:', error);
  process.exitCode = 1;
});
