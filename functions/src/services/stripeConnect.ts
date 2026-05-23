/**
 * Stripe Connect helpers — marketplace payouts to seller profiles.
 * Platform fee: STRIPE_CONNECT_PLATFORM_FEE_BPS (basis points, default 1000 = 10%).
 */

import type Stripe from 'stripe';
import { db } from '../admin';
import { profilesService } from './profiles';

const DEFAULT_FEE_BPS = 1000;

export function getConnectPlatformFeeBps(): number {
  const raw = process.env.STRIPE_CONNECT_PLATFORM_FEE_BPS;
  const n = raw ? parseInt(raw, 10) : DEFAULT_FEE_BPS;
  if (!Number.isFinite(n) || n < 0) return DEFAULT_FEE_BPS;
  return Math.min(10000, n);
}

/** Application fee in smallest currency unit; leaves at least 1 unit for transfer when possible. */
export function computeApplicationFeeCents(totalCents: number, bps: number): number {
  if (totalCents <= 0 || bps <= 0) return 0;
  const raw = Math.floor((totalCents * bps) / 10000);
  const max = Math.max(0, totalCents - 1);
  return Math.min(max, raw);
}

export function mapConnectFieldsFromStripeAccount(account: Stripe.Account): {
  stripeConnectOnboardingStatus: 'not_started' | 'pending' | 'restricted' | 'complete';
  payoutsEnabled: boolean;
} {
  const charges = account.charges_enabled === true;
  const payouts = account.payouts_enabled === true;
  const disabledReason = account.requirements?.disabled_reason;

  if (charges && payouts) {
    return { stripeConnectOnboardingStatus: 'complete', payoutsEnabled: true };
  }
  if (disabledReason) {
    return { stripeConnectOnboardingStatus: 'restricted', payoutsEnabled: false };
  }
  return { stripeConnectOnboardingStatus: 'pending', payoutsEnabled: false };
}

/** Webhook: keep Firestore in sync when Stripe updates account capabilities. */
export async function handleStripeAccountUpdated(account: Stripe.Account): Promise<void> {
  const acctId = account.id;
  const snap = await db.collection('profiles').where('stripeConnectAccountId', '==', acctId).limit(25).get();
  if (snap.empty) return;
  const mapped = mapConnectFieldsFromStripeAccount(account);
  await Promise.all(
    snap.docs.map((doc) =>
      profilesService.update(doc.id, {
        stripeConnectOnboardingStatus: mapped.stripeConnectOnboardingStatus,
        payoutsEnabled: mapped.payoutsEnabled,
      }),
    ),
  );
}
