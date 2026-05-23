#!/usr/bin/env node
/**
 * Stripe webhook ops smoke — hits deployed API /health and prints Stripe CLI checklist.
 *
 * Usage:
 *   API_URL=https://us-central1-PROJECT.cloudfunctions.net/api/ node scripts/stripe-webhook-smoke.mjs
 *
 * Or rely on EXPO_PUBLIC_API_URL from the environment (.env not loaded automatically — export vars yourself).
 */

function normalizeApiBase(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  return s.replace(/\/+$/, '') + '/';
}

async function main() {
  const base =
    normalizeApiBase(process.env.API_URL) ||
    normalizeApiBase(process.env.EXPO_PUBLIC_API_URL) ||
    normalizeApiBase('https://us-central1-culturepass-4f264.cloudfunctions.net/api');

  const healthUrl = new URL('health', base);
  console.log(`GET ${healthUrl.toString()}`);

  try {
    const res = await fetch(healthUrl.toString(), { method: 'GET' });
    const text = await res.text();
    console.log(`→ ${res.status} ${res.statusText}`);
    if (text.length > 0 && text.length < 500) console.log(text);
    if (!res.ok) process.exitCode = 1;
  } catch (e) {
    console.error('Health check failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }

  console.log(`
── Stripe webhook checklist (deployed API) ───────────────────────────────────

1) Dashboard test (no CLI)
   • Stripe Dashboard → Developers → Webhooks → your endpoint for:
       POST ${base.replace(/\/+$/, '')}/stripe/webhook
   • Send test events at minimum:
       checkout.session.completed (payment + subscription modes as needed)
       customer.subscription.updated
       account.updated        ← required for Connect profile sync

2) Stripe CLI → forward to PRODUCTION/DEPLOYED URL (uses your live signing secret on Stripe’s side)
   • stripe login
   • stripe listen --forward-to ${base.replace(/\/+$/, '')}/stripe/webhook
   • Leave that running; copy the webhook signing secret ONLY if you create a *second*
     endpoint — production should keep using STRIPE_WEBHOOK_SECRET from the Dashboard endpoint.

   Trigger samples (CLI emits events to your listener’s destination):
   • stripe trigger checkout.session.completed
   • stripe trigger customer.subscription.updated
   • stripe trigger invoice.payment_failed

3) Paid perks (CulturePass callable checkout)
   • Metadata includes perkId + userId; webhook runs checkout.session.completed (payment)
     branch → Firestore redemption + optional notification.
   • Confirm Firestore: redemptions doc with stripeCheckoutSessionId + perk usedCount bump.

4) Tickets + CulturePass+
   • Paid tickets: metadata.ticketId on Checkout session (Express /stripe/create-checkout-session).
   • Membership: subscription Checkout from POST /membership/subscribe.

Secrets on Cloud Functions (see functions/.env.example): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
STRIPE_PRICE_MONTHLY_ID, STRIPE_PRICE_YEARLY_ID, APP_URL, optional STRIPE_CONNECT_PLATFORM_FEE_BPS.
`);
}

main();
