/**
 * Seed `cultureQuests/{id}` with a starter set of admin-curated quests for
 * Sydney and Melbourne. These power the "Active quests" rail on /explore.
 *
 * Run (from functions/):
 *   npm run seed:quests
 *   # Or against the Firebase emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seedCultureQuests.ts
 *
 * Env:
 *   SEED_PROJECT_ID — defaults to GCLOUD_PROJECT or culturepass-4f264
 *   FIRESTORE_EMULATOR_HOST — when set, writes go to the emulator instead
 *
 * Idempotent: each quest has a deterministic id; re-running upserts.
 */

import * as admin from 'firebase-admin';
import type { CultureQuest } from '../../shared/schema';

const PROJECT_ID =
  process.env.SEED_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID ??
  'culturepass-4f264';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

function nowIso(): string {
  return new Date().toISOString();
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const QUESTS: CultureQuest[] = [
  // Sydney
  {
    id: 'sydney-lunar-explorer-2026',
    title: 'Lunar New Year explorer (Sydney)',
    description:
      'Visit 3 Lunar New Year events around Sydney over the next 60 days. Earn the Lunar Explorer badge and 250 bonus points.',
    cultureTag: 'lunar-new-year',
    city: 'Sydney',
    country: 'Australia',
    targetCount: 3,
    rewardPoints: 250,
    badgeId: 'lunar-explorer',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(60),
    status: 'active',
    createdAt: nowIso(),
  },
  {
    id: 'sydney-diwali-trail-2026',
    title: 'Diwali trail (Sydney)',
    description:
      'Attend 2 Diwali celebrations in greater Sydney. Bonus points and the Diwali Trail badge on completion.',
    cultureTag: 'punjabi',
    city: 'Sydney',
    country: 'Australia',
    targetCount: 2,
    rewardPoints: 200,
    badgeId: 'diwali-trail',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(90),
    status: 'active',
    createdAt: nowIso(),
  },
  {
    id: 'sydney-greek-tavernas-2026',
    title: 'Greek night out (Sydney)',
    description:
      'Try 2 Greek-hosted events or food experiences in Sydney. Earn the Greek Night Out badge.',
    cultureTag: 'greek',
    city: 'Sydney',
    country: 'Australia',
    targetCount: 2,
    rewardPoints: 180,
    badgeId: 'greek-night-out',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(60),
    status: 'active',
    createdAt: nowIso(),
  },

  // Melbourne
  {
    id: 'melbourne-lunar-explorer-2026',
    title: 'Lunar New Year explorer (Melbourne)',
    description:
      'Visit 3 Lunar New Year events around Melbourne over the next 60 days. Earn the Lunar Explorer badge.',
    cultureTag: 'lunar-new-year',
    city: 'Melbourne',
    country: 'Australia',
    targetCount: 3,
    rewardPoints: 250,
    badgeId: 'lunar-explorer',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(60),
    status: 'active',
    createdAt: nowIso(),
  },
  {
    id: 'melbourne-italian-aperitivo-2026',
    title: 'Italian aperitivo run (Melbourne)',
    description:
      'Hit 3 Italian-hosted events or aperitivo nights across Melbourne. Earn the Italian Aperitivo badge.',
    cultureTag: 'italian',
    city: 'Melbourne',
    country: 'Australia',
    targetCount: 3,
    rewardPoints: 250,
    badgeId: 'italian-aperitivo',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(90),
    status: 'active',
    createdAt: nowIso(),
  },
  {
    id: 'melbourne-vietnamese-night-market-2026',
    title: 'Vietnamese night markets (Melbourne)',
    description:
      'Visit 2 Vietnamese-hosted markets or food festivals around Melbourne. Earn the Vietnamese Night Market badge.',
    cultureTag: 'vietnamese',
    city: 'Melbourne',
    country: 'Australia',
    targetCount: 2,
    rewardPoints: 200,
    badgeId: 'vietnamese-night-market',
    startsAt: nowIso(),
    endsAt: isoDaysFromNow(60),
    status: 'active',
    createdAt: nowIso(),
  },
];

async function run() {
  const target =
    process.env.FIRESTORE_EMULATOR_HOST
      ? `emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
      : `project ${PROJECT_ID}`;
  console.log(`Seeding ${QUESTS.length} cultureQuests to ${target}...`);

  const batch = db.batch();
  for (const quest of QUESTS) {
    const ref = db.collection('cultureQuests').doc(quest.id);
    batch.set(ref, { ...quest, updatedAt: nowIso() }, { merge: true });
    console.log(`  • ${quest.id} — ${quest.title}`);
  }
  await batch.commit();

  console.log('Done.');
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
