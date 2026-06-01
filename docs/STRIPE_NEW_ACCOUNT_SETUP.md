# New Stripe Account Setup

Use this when moving CulturePass to a fresh Stripe account for ticket sales, host payouts, paid perks, and CulturePass+.

## 1. Create And Activate The Stripe Account

1. Create the Stripe account for the legal CulturePass operator.
2. Complete business verification, payout bank account, tax details, and support contact details.
3. In Dashboard branding, set CulturePass name, icon/logo, support email, statement descriptor, and public business URL.
4. Keep test mode and live mode separate. Finish all steps in test mode first, then repeat live values.

## 2. Payment Methods

In Dashboard -> Settings -> Payment methods:

- Enable Cards, Link, Apple Pay, Google Pay, and any eligible local methods you want Stripe to show dynamically.
- Do not hardcode payment method lists in code. CulturePass omits `payment_method_types` so Stripe can choose eligible methods from Dashboard settings.

Apple Pay:

- Merchant ID: `merchant.au.culturepass.app`
- Register and verify web domains for hosted web checkout:
  - `culturepass.app`
  - `www.culturepass.app`
- Keep the Apple Developer Merchant ID linked to the iOS app entitlement.

Google Pay:

- Local/test builds use `EXPO_PUBLIC_STRIPE_ANDROID_PAY_MODE=test`.
- Store/live builds should use `EXPO_PUBLIC_STRIPE_ANDROID_PAY_MODE=production`.

## 3. API Keys

Create separate test and live keys. Prefer a restricted API key (`rk_...`) over a broad secret key.

Firebase Functions secrets:

```bash
firebase functions:secrets:set STRIPE_API_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRICE_MONTHLY_ID
firebase functions:secrets:set STRIPE_PRICE_YEARLY_ID
```

Expo/EAS public env:

```bash
eas env:create --environment production --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_live_...
eas env:create --environment production --name EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER --value merchant.au.culturepass.app
eas env:create --environment production --name EXPO_PUBLIC_STRIPE_ANDROID_PAY_MODE --value production
```

For local development, put test values in `.env.local` and `functions/.env`.

## 4. CulturePass+ Billing

In Stripe Products:

1. Create product: `CulturePass+`.
2. Create a monthly recurring Price. Put its ID in `STRIPE_PRICE_MONTHLY_ID`.
3. Create a yearly recurring Price. Put its ID in `STRIPE_PRICE_YEARLY_ID`.
4. Optional: create a first-subscriber coupon and set `STRIPE_COUPON_FIRST_PREMIUM_HALF_OFF`.
5. Configure Billing Customer Portal so users can update payment methods, view invoices, cancel, and change plans.

CulturePass uses Checkout Sessions for new subscriptions and a Billing Portal session endpoint for self-service subscription management.

## 5. Ticket Sales And Paid Perks

Ticket sales:

- Web uses Stripe-hosted Checkout.
- iOS/Android use PaymentSheet backed by server-created PaymentIntents.
- Marketplace ticket revenue uses Connect destination charges when a publisher profile has payouts enabled.

Paid perks:

- Paid perk checkout uses Stripe-hosted Checkout.
- Webhook fulfillment records the redemption after `checkout.session.completed`.

## 6. Host Payouts

CulturePass host payouts use Stripe Connect onboarding from HostSpace profiles.

Dashboard setup:

1. Enable Connect for the Stripe account.
2. Complete platform profile and required Connect settings.
3. Confirm platform fee basis points: `STRIPE_CONNECT_PLATFORM_FEE_BPS`.
4. Test a host onboarding flow from HostSpace.
5. Confirm the host profile stores a connected account id and `payoutsEnabled: true`.
6. Buy a test ticket for an event attached to that publisher profile and confirm the destination charge routes funds correctly.

## 7. Webhooks

Add endpoint:

```text
https://australia-southeast1-culturepass-4f264.cloudfunctions.net/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `charge.refunded`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `account.updated`

Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

Local test:

```bash
stripe listen --forward-to http://127.0.0.1:5001/culturepass-4f264/australia-southeast1/api/stripe/webhook
```

## 8. Verification Checklist

Run:

```bash
npm run typecheck
cd functions && npm run build
```

Then test in Stripe test mode:

- Paid event ticket on web Checkout
- Paid event ticket on iOS PaymentSheet with Apple Pay
- Paid event ticket on Android PaymentSheet with Google Pay
- Free ticket / points-redemption path
- CulturePass+ monthly subscription
- CulturePass+ yearly subscription
- Billing Portal session
- Host Connect onboarding
- Destination-charge payout to a connected host
- Refund webhook

Only switch live keys after every test-mode path passes.

