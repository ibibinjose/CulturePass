#!/usr/bin/env ts-node
/**
 * Seed real Firestore demo fixtures (scanner, CPID lookup, gate check-in).
 *
 * Usage (from functions/):
 *   npx ts-node scripts/seed-demo-fixtures.ts
 *   npx ts-node scripts/seed-demo-fixtures.ts --organizer-uid=YOUR_FIREBASE_UID
 *
 * After seeding gate tickets, set the demo event organizer to your signed-in
 * organizer account UID (flag above) so ticket scan authorization passes.
 */

import * as admin from 'firebase-admin';
import {
  DEMO_USER_VIKRAM,
  DEMO_USER_AARAV,
  DEMO_PROFILE_DARLING,
  DEMO_GATE_EVENT,
  DEMO_ORGANIZER_SEED_ID,
  DEMO_TICKET_QR_VALID,
  DEMO_TICKET_QR_USED,
  DEMO_TICKET_QR_CANCELLED,
  DEMO_EVENT_GATE_ID,
} from '../src/dev/demoFixtures';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'culturepass-4f264';
const organizerUidArg = process.argv.find((a) => a.startsWith('--organizer-uid='));
const organizerUid = organizerUidArg?.split('=')[1]?.trim() || DEMO_ORGANIZER_SEED_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();
const now = new Date().toISOString();

async function upsert(collection: string, id: string, data: Record<string, unknown>) {
  await db.collection(collection).doc(id).set({ ...data, updatedAt: now }, { merge: true });
  console.log(`  ✓ ${collection}/${id}`);
}

async function seedDailyDeals() {
  const today = new Date();
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const startsIso = start.toISOString();
  const endsIso = end.toISOString();

  const deals = [
    {
      id: 'demo-deal-rewards',
      title: 'Rewards & points',
      subtitle: 'Earn on tickets and redeem partner perks',
      kind: 'reward',
      href: '/payment/wallet',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 30,
      createdAt: startsIso,
      createdBy: 'system',
    },
    {
      id: 'demo-deal-offers',
      title: 'Member offers',
      subtitle: 'Browse cultural perks near you',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'public',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 20,
      createdAt: startsIso,
      createdBy: 'system',
    },
    {
      id: 'demo-deal-plus',
      title: 'CulturePass+ exclusives',
      subtitle: 'Extra savings for subscribers',
      kind: 'offer',
      href: '/offers',
      linkPolicy: 'premium_required',
      startsAt: startsIso,
      endsAt: endsIso,
      status: 'active',
      priority: 10,
      createdAt: startsIso,
      createdBy: 'system',
    },
  ];

  for (const deal of deals) {
    const { id, ...rest } = deal;
    await upsert('dailyDeals', id, rest);
  }
}

async function seedTickets(eventId: string, eventTitle: string, eventVenue: string) {
  const base = {
    eventId,
    eventTitle,
    eventDate: DEMO_GATE_EVENT.date,
    eventTime: DEMO_GATE_EVENT.time,
    eventVenue,
    userId: DEMO_USER_AARAV.id,
    tierName: 'General Admission',
    priceCents: 2500,
    paymentStatus: 'paid',
    paymentIntentId: 'pi_demo_seed',
    history: [],
    createdAt: now,
  };

  await upsert('tickets', 'demo-ticket-valid', {
    ...base,
    qrCode: DEMO_TICKET_QR_VALID,
    cpTicketId: DEMO_TICKET_QR_VALID,
    status: 'confirmed',
    tierName: 'VIP Lounge',
  });

  await upsert('tickets', 'demo-ticket-used', {
    ...base,
    qrCode: DEMO_TICKET_QR_USED,
    cpTicketId: DEMO_TICKET_QR_USED,
    status: 'used',
    tierName: 'General Admission',
  });

  await upsert('tickets', 'demo-ticket-cancelled', {
    ...base,
    qrCode: DEMO_TICKET_QR_CANCELLED,
    cpTicketId: DEMO_TICKET_QR_CANCELLED,
    status: 'cancelled',
    tierName: 'VIP Lounge',
  });
}

async function main() {
  console.log(`\nSeeding demo fixtures → project ${PROJECT_ID}`);
  console.log(`Gate event organizerId: ${organizerUid}\n`);

  await upsert('users', DEMO_USER_VIKRAM.id, { ...DEMO_USER_VIKRAM, createdAt: now });
  await upsert('users', DEMO_USER_AARAV.id, { ...DEMO_USER_AARAV, createdAt: now });
  await upsert('users', DEMO_ORGANIZER_SEED_ID, {
    displayName: 'Demo Gate Organizer',
    username: 'demogate',
    role: 'organizer',
    culturePassId: 'CP-DEMOGATE',
    city: 'Sydney',
    country: 'Australia',
    createdAt: now,
  });

  await upsert('profiles', DEMO_PROFILE_DARLING.id, { ...DEMO_PROFILE_DARLING, createdAt: now });

  await upsert('events', DEMO_EVENT_GATE_ID, {
    ...DEMO_GATE_EVENT,
    organizerId: organizerUid,
    createdBy: organizerUid,
    description: 'Demo gate-check event for scanner QA.',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    attending: 42,
    createdAt: now,
  });

  await seedTickets(DEMO_EVENT_GATE_ID, DEMO_GATE_EVENT.title, DEMO_GATE_EVENT.venue!);
  await seedDailyDeals();

  console.log('\nDemo fixture codes (real Firestore data):');
  console.log(`  Identity scan: ${DEMO_USER_VIKRAM.culturePassId} (Vikram), ${DEMO_USER_AARAV.culturePassId} (Aarav)`);
  console.log(`  Business CPID: ${DEMO_PROFILE_DARLING.cpid}`);
  console.log(`  Ticket valid:  ${DEMO_TICKET_QR_VALID}`);
  console.log(`  Ticket used:   ${DEMO_TICKET_QR_USED}`);
  console.log(`  Ticket void:   ${DEMO_TICKET_QR_CANCELLED}`);
  if (organizerUid === DEMO_ORGANIZER_SEED_ID) {
    console.log(
      '\nTip: re-run with --organizer-uid=YOUR_FIREBASE_UID so gate scan auth matches your signed-in host.',
    );
  }
  console.log('');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});