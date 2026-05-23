# Focused engineering review — Auth & payments

**Scope:** Static review of auth and Stripe-related paths prior to May 2026 market milestones. Evidence is from Cloud Functions middleware/handlers and the client Auth provider—not exhaustive penetration testing.

---

## Architecture map

| Layer | Responsibility |
|--------|----------------|
| Client `src/lib/auth.tsx` | Firebase Auth observer, Bearer token injection into `query-client`, retries `GET api/auth/me` to materialise Firestore profile |
| Client `src/lib/query-client.ts` | Resolves API base URL; 401 refresh via `setTokenRefresher` |
| Functions `authenticate` middleware | Optional Bearer verify via Admin SDK (`verifyIdToken`, `checkRevoked: false` by default) |
| Functions `handlers/auth.ts` | `GET /api/auth/me` bootstraps `users/{uid}`; optional `POST /api/auth/register` |
| Functions `handlers/stripe.ts` | Checkout session creation, refunds, webhook, Connect registration |
| Functions `payments/stripeCheckout.ts` | Callable **perk** checkout (gen1 `createCheckoutSession` + gen2 `createCheckoutSessionV2`) |

---

## Auth — strengths

1. **Token refresh boundary:** `AuthProvider` sets `setTokenRefresher(() => getIdToken(true))` so API calls can recover from expired tokens without hook misuse.
2. **Profile bootstrap:** `GET /auth/me` creates Firestore profile if missing (`handlers/auth.ts`), reducing reliance on older `POST /register` flows.
3. **Sensitive Stripe routes:** `requireAuth` + **`requireRevocationCheck`** on `create-checkout-session` and `stripe/refund` — second `verifyIdToken(..., true)` catches revoked/disabled accounts before payment actions.
4. **Role leaks:** `requireRole` / `requireOwnerOrAdmin` return generic “Insufficient permissions” where intended (`middleware/auth.ts`).
5. **Global `authenticate`:** Uses `checkRevoked: false` for latency; revocation is intentionally opt-in on payment routes — documented tradeoff.

## Auth — watch items

1. **`isSuperAdmin` vs `SUPER_ADMIN_UIDS`:** `userRank()` grants elevated rank for UIDs in `SUPER_ADMIN_UIDS`, but `isSuperAdmin()` only returns true when `user.role === 'platformAdmin'`. Routes that use `requireSuperAdmin` may not treat env-listed super-admins the same as `requireMinRank`/`userRank` paths — confirm intended behaviour when adding platform-only tools.
2. **Custom claims vs Firestore:** Role in JWT may lag after admin role changes until token refresh — acceptable but support should know symptoms (403 until re-login).
3. **`SUPER_ADMIN_UIDS` env:** Bypasses normal role ranks; guard env assignments and auditing.
4. **CORS credentials:** Allowed origins include production domains plus dev/ngrok/expo preview patterns — any new branded domain must be added in `functions/src/app.ts` or `CORS_EXTRA_ORIGINS`.

---

## Payments — strengths

1. **Checkout pricing:** `create-checkout-session` resolves totals with **`resolveTicketOrderPricingWithPromo`** server-side — client cannot set arbitrary amounts (validated in scripted tests).
2. **Webhook security:** Uses `express.json` **`verify`** to retain `req.rawBody`; `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` rejects tampered payloads.
3. **Idempotency:** `stripeEvents/{event.id}` guards double-processing Stripe retries.
4. **Connect routing:** Organizer Connect account retrieval wrapped in try/catch so checkout degradation is observable without necessarily failing open on misconfiguration.

## Payments — watch items

1. **Webhook URL parity:** Stripe must POST to the same deployment that holds the matching webhook secret (`/api/stripe/webhook` under Hosting rewrite vs direct `cloudfunctions.net` URL). Misconfiguration = paid users without ticket fulfillment — verify Dashboard after infra changes.
2. **Dual perk checkout surfaces:** Callable functions in `payments/stripeCheckout.ts` vs HTTP routes in Express — confirm the client calls the intended path after refactors so success URLs and webhook metadata stay consistent.
3. **Gen1 vs Gen2 callable:** Both `createCheckoutSession` and `createCheckoutSessionV2` exported — confirm Firebase console / client SDK targets the deployed version to avoid orphaned endpoints.
4. **`success_url` in callable perk checkout:** Hardcoded `https://culturepass.app/p/{perkId}` — staging/preview bundles must align or use env-driven base URL in a future change.

---

## Suggested recurring checks

- Run **`npm run qa:solid`** on every merge to protected branches (CI enforced).
- After Stripe or Firebase deploy: one **live-mode test transaction** per release train with webhook log confirmation.
- Re-verify **Apple / Google OAuth** redirect URIs whenever `culturepass.app` routing or Hosting sites change.
