/**
 * Seed Auth + Firestore on the Firebase Emulator for local QA:
 * - Test user (email/password from env)
 * - users/{uid} doc (organizer)
 * - profiles/{id} organisation "The CAP"
 * - 5 published events linked via publisherProfileId + organizerId
 *
 * Prerequisites:
 *   firebase emulators:start --only auth,firestore
 *
 * Run (from repo root or functions/):
 *   cd functions && npx tsx scripts/seed-emulator-cap-org.ts
 *
 * Env (optional):
 *   SEED_TEST_EMAIL, SEED_TEST_PASSWORD, SEED_PROJECT_ID,
 *   FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST
 */

import * as admin from 'firebase-admin';
import * as geofire from 'geofire-common';

const PROJECT_ID =
  process.env.SEED_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  process.env.FIREBASE_PROJECT_ID ??
  'culturepass-4f264';

const EMAIL = process.env.SEED_TEST_EMAIL ?? 'cap-emulator@test.local';
const PASSWORD = process.env.SEED_TEST_PASSWORD ?? 'CapEmulator1!';

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const auth = admin.auth();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const SEED_BATCH = 'cap-emulator';
const ORG_NAME = 'The CAP';

const SYDNEY = { lat: -33.8688, lng: 151.2093 };

function nowIso(): string {
  return new Date().toISOString();
}

function cpid(prefix: string): string {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CP-${prefix}-${n}`;
}

async function main(): Promise<void> {
  console.log(`[seed] project=${PROJECT_ID} auth=${process.env.FIREBASE_AUTH_EMULATOR_HOST} firestore=${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`[seed] email=${EMAIL}`);

  let user: admin.auth.UserRecord;
  try {
    user = await auth.createUser({
      email: EMAIL,
      password: PASSWORD,
      emailVerified: true,
      displayName: 'CAP Tester',
    });
    console.log(`[seed] created Auth user uid=${user.uid}`);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(EMAIL);
      console.log(`[seed] using existing Auth user uid=${user.uid}`);
    } else {
      throw e;
    }
  }

  const uid = user.uid;
  const now = nowIso();

  await db
    .collection('users')
    .doc(uid)
    .set(
      {
        id: uid,
        username: EMAIL.split('@')[0]!.replace(/[^a-z0-9_]/gi, '_').toLowerCase() || 'cap_tester',
        displayName: 'CAP Tester',
        email: EMAIL,
        role: 'organizer',
        culturePassId: cpid('USR'),
        city: 'Sydney',
        country: 'Australia',
        membership: { tier: 'free', isActive: true },
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  console.log(`[seed] upserted users/${uid}`);

  const ownedProfiles = await db.collection('profiles').where('ownerId', '==', uid).get();
  const orgDoc = ownedProfiles.docs.find(
    (d) => d.data().entityType === 'organisation' && d.data().name === ORG_NAME,
  );

  let profileId: string;
  if (orgDoc) {
    profileId = orgDoc.id;
    await orgDoc.ref.set(
      {
        name: ORG_NAME,
        description: 'Emulator seed organisation for CulturePass local testing.',
        city: 'Sydney',
        country: 'Australia',
        status: 'published',
        updatedAt: now,
      },
      { merge: true },
    );
    console.log(`[seed] updated profiles/${profileId} (${ORG_NAME})`);
  } else {
    const ref = db.collection('profiles').doc();
    profileId = ref.id;
    await ref.set({
      id: profileId,
      entityType: 'organisation',
      name: ORG_NAME,
      description: 'Emulator seed organisation for CulturePass local testing.',
      city: 'Sydney',
      country: 'Australia',
      ownerId: uid,
      isVerified: false,
      status: 'published',
      handleStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[seed] created profiles/${profileId} (${ORG_NAME})`);
  }

  const prior = await db.collection('events').where('organizerId', '==', uid).get();
  let removed = 0;
  for (const d of prior.docs) {
    const meta = d.data().metadata as { seedBatch?: string } | undefined;
    if (meta?.seedBatch === SEED_BATCH) {
      await d.ref.delete();
      removed += 1;
    }
  }
  if (removed) console.log(`[seed] removed ${removed} prior seed events`);

  const geoHash = geofire.geohashForLocation([SYDNEY.lat, SYDNEY.lng]);

  // Build realistic dates: today, tomorrow, this weekend (Sat & Sun), next week
  const todayDate = new Date();
  const dayOfWeek = todayDate.getDay(); // 0=Sun … 6=Sat
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7;
  const daysUntilSun = daysUntilSat + 1;

  function addDays(d: Date, n: number): string {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r.toISOString().split('T')[0]!;
  }

  const todayStr = addDays(todayDate, 0);
  const tomorrowStr = addDays(todayDate, 1);
  const saturdayStr = addDays(todayDate, daysUntilSat);
  const sundayStr = addDays(todayDate, daysUntilSun);
  const nextWeekStr = addDays(todayDate, 7);

  const EVENTS = [
    { title: 'Desi Beats Night',          date: todayStr,    time: '19:00', isFree: false, priceCents: 2500, priceLabel: '$25',  category: 'Music',     entryType: 'ticketed',  tags: ['Indian', 'Music', 'Nightlife'], desc: 'Live tabla and electronic fusion at The CAP Hall.' },
    { title: 'Community Potluck Lunch',    date: tomorrowStr, time: '12:00', isFree: true,  priceCents: 0,    priceLabel: 'Free', category: 'Community', entryType: 'free_open', tags: ['Community', 'Food', 'Family'], desc: 'Bring a dish from your culture. All ages welcome.' },
    { title: 'Weekend Art Market',         date: saturdayStr, time: '10:00', isFree: true,  priceCents: 0,    priceLabel: 'Free', category: 'Festival',  entryType: 'free_open', tags: ['Art', 'Market', 'Family', 'Shopping'], desc: 'Browse handmade art, crafts, and street food from diaspora creators.' },
    { title: 'Bollywood Dance Workshop',   date: saturdayStr, time: '14:00', isFree: false, priceCents: 3500, priceLabel: '$35',  category: 'Workshop',  entryType: 'ticketed',  tags: ['Indian', 'Dance', 'Workshop'], desc: 'Learn iconic Bollywood choreography with a professional instructor.' },
    { title: 'Sunday Cultural Brunch',     date: sundayStr,   time: '11:00', isFree: false, priceCents: 4500, priceLabel: '$45',  category: 'Food',      entryType: 'ticketed',  tags: ['Food', 'Brunch', 'Community'], desc: 'Multi-cultural brunch with live acoustic music.' },
    { title: 'Korean Film Screening',      date: sundayStr,   time: '18:00', isFree: true,  priceCents: 0,    priceLabel: 'Free', category: 'Film',      entryType: 'free_open', tags: ['Korean', 'Film', 'Free'], desc: 'Free screening of award-winning Korean cinema with subtitles.' },
    { title: 'Diaspora Networking Mixer',  date: nextWeekStr, time: '18:30', isFree: false, priceCents: 1500, priceLabel: '$15',  category: 'Networking', entryType: 'ticketed', tags: ['Professional', 'Networking', 'Community'], desc: 'Connect with professionals from diverse cultural backgrounds.' },
    { title: 'Kids Storytelling Hour',     date: saturdayStr, time: '10:30', isFree: true,  priceCents: 0,    priceLabel: 'Free', category: 'Kids & Youth', entryType: 'free_open', tags: ['Kids', 'Family', 'Children', 'Workshop', 'All Ages'], desc: 'Multicultural stories and craft activities for children 3-10.' },
  ];

  for (let i = 0; i < EVENTS.length; i += 1) {
    const e = EVENTS[i]!;
    const ref = db.collection('events').doc();
    await ref.set({
      id: ref.id,
      title: e.title,
      description: e.desc,
      communityId: 'emulator-seed',
      venue: `${ORG_NAME} Hall`,
      address: `${i + 1} Seed Street, Sydney NSW`,
      date: e.date,
      time: e.time,
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia',
      latitude: SYDNEY.lat,
      longitude: SYDNEY.lng,
      geoHash,
      category: e.category,
      eventType: e.category.toLowerCase().replace(/[^a-z]/g, '_'),
      entryType: e.entryType,
      cultureTag: e.tags,
      tags: e.tags,
      organizerId: uid,
      organizer: ORG_NAME,
      publisherProfileId: profileId,
      status: 'published',
      isFree: e.isFree,
      isFeatured: i < 3,
      priceCents: e.priceCents,
      priceLabel: e.priceLabel,
      capacity: 60 + i * 20,
      attending: Math.floor(Math.random() * 30) + 5,
      imageUrl: `https://picsum.photos/seed/cap${i + 1}/800/450`,
      imageColor: '#4F46E5',
      cpid: cpid('EVT'),
      metadata: { seedBatch: SEED_BATCH },
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[seed] created events/${ref.id} (${i + 1}/${EVENTS.length})`);
  }

  console.log('[seed] done. Sign in the app against emulators with the same email/password you set in env (or defaults).');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
