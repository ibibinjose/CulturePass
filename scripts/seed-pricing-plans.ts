/**
 * Seed optional Firestore pricing_plans overrides (emulator or production).
 *
 * Usage (emulators):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/seed-pricing-plans.ts
 *
 * Document IDs: `{MARKET}_{period}` e.g. AU_monthly, US_yearly
 */

import * as admin from 'firebase-admin';

const PROJECT_ID = process.env.SEED_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? 'culturepass-4f264';

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

const PLANS = [
  { id: 'AU_monthly', market: 'AU', period: 'monthly', amountCents: 799, currency: 'AUD' },
  { id: 'AU_yearly', market: 'AU', period: 'yearly', amountCents: 6900, currency: 'AUD' },
  { id: 'US_monthly', market: 'US', period: 'monthly', amountCents: 499, currency: 'USD' },
  { id: 'US_yearly', market: 'US', period: 'yearly', amountCents: 4900, currency: 'USD' },
  { id: 'GB_monthly', market: 'GB', period: 'monthly', amountCents: 499, currency: 'GBP' },
  { id: 'GB_yearly', market: 'GB', period: 'yearly', amountCents: 4900, currency: 'GBP' },
] as const;

async function main() {
  const batch = db.batch();
  const now = new Date().toISOString();
  for (const plan of PLANS) {
    const ref = db.collection('pricing_plans').doc(plan.id);
    batch.set(ref, {
      market: plan.market,
      period: plan.period,
      amountCents: plan.amountCents,
      currency: plan.currency,
      product: 'culturepass_plus',
      effectiveFrom: now,
      updatedAt: now,
    }, { merge: true });
  }
  await batch.commit();
  console.log(`[seed-pricing] upserted ${PLANS.length} pricing_plans documents`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});