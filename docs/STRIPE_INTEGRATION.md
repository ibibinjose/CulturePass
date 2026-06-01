# Stripe Integration

CulturePass uses Stripe in three places:

- Hosted Checkout on web for event ticket purchases.
- PaymentSheet on iOS and Android through `@stripe/stripe-react-native`.
- Stripe Connect Express for marketplace payouts to host profiles.

## Required Keys

Client, in `.env.local`:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Functions, in `functions/.env` for emulators or Firebase secrets/config for deployed Functions:

```bash
STRIPE_API_KEY=rk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000
```

`STRIPE_SECRET_KEY` is still supported as a legacy fallback, but new Stripe accounts should use a restricted API key in `STRIPE_API_KEY`.

Subscription checkout also needs:

```bash
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
```

Never put `STRIPE_API_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in Expo env files. Only `EXPO_PUBLIC_*` values are safe for the app bundle.

## Webhook Endpoint

Stripe Dashboard endpoint:

```text
https://<firebase-functions-host>/api/stripe/webhook
```

For local testing with the Firebase emulator:

```bash
stripe listen --forward-to http://127.0.0.1:5001/<project-id>/us-central1/api/stripe/webhook
```

Copy the generated `whsec_...` value into `functions/.env` as `STRIPE_WEBHOOK_SECRET`.

Listen for these events:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `charge.refunded`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `account.updated`

## Smoke Test

```bash
npm run typecheck
cd functions && npm run build
API_URL=https://<firebase-functions-host>/api node scripts/stripe-webhook-smoke.mjs
```

Then buy a paid test ticket with Stripe test card `4242 4242 4242 4242`. The ticket should start as `paymentStatus: pending`, then the webhook should mark it `paid`.
