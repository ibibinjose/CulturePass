# Profile-first publishing & marketplace gaps

> Last reviewed: May 8, 2026.

Engineering map from **current CulturePass** toward the model: **User → Profile (canonical publisher) → Content (events, venues, offerings) → Engagement → Payments / payouts**.

Related schema additions (optional fields, backward compatible):

- `EventData.publisherProfileId`, `EventData.venueProfileId` — `shared/schema/event.ts`
- `Profile.stripeConnectAccountId`, `Profile.stripeConnectOnboardingStatus`, `Profile.payoutsEnabled` — `shared/schema/profile.ts`

---

## Current state (short)


| Concern                  | Today                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who published the event? | Primarily `**organizerId`** (user uid) on `EventData`; optional `**hostInfo` / artists / sponsors** with `profileId`.                                                |
| Where is the event?      | Mostly **denormalised** on the event: `venue`, `address`, `lat`/`lng`, `city`, etc. `**entityType: 'venue'`** profiles exist but are not required links from events. |
| Tickets / Stripe         | **Checkout** + webhooks; **Connect** (fee + destination) when publisher profile has a ready Express account; else platform-only.                                     |
| Offerings                | **Restaurants / shopping / activities / movies** are separate product surfaces; no single `Offering` collection.                                                     |


---

## Phase 1 — Canonical links on events (schema + writes)

**Goal:** Every published event can resolve **publisher profile** and optionally **venue profile** without breaking existing rows.


| Task      | Detail                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Firestore | Allow `publisherProfileId`, `venueProfileId` on `events/{id}` (optional).                                                                                                |
| API       | On create/update event, accept optional IDs; validate `profiles/{id}` exists and `ownerId` / role matches caller.                                                        |
| Rules     | Organiser/admin can write; public read unchanged.                                                                                                                        |
| Backfill  | Script: for events with `organizerId`, set `publisherProfileId` where a **single** obvious profile exists (e.g. user’s default organiser profile); leave null otherwise. |
| Indexes   | Composite queries as needed, e.g. `(publisherProfileId, status, date)`.                                                                                                  |


**Resolution order (client + API responses):**

1. `publisherProfileId` → profile doc (canonical “page” for dashboards, follow, verified badge).
2. Else fall back to `organizerId` → `users/{uid}` (current behaviour).

**Venue:**

1. `venueProfileId` → `profiles/{id}` with `entityType === 'venue'` (or policy-approved types).
2. Else use inline `venue` / `address` / coordinates (current behaviour).

---

## Phase 2 — Event create / edit UI


| Task    | Detail                                                                                      |
| ------- | ------------------------------------------------------------------------------------------- |
| Wizard  | Step: “Publishing as” → pick or create **organiser profile**; persist `publisherProfileId`. |
| Venue   | Pick existing **venue profile** or “one-off address” (no `venueProfileId`).                 |
| Display | Event detail + cards: show publisher from profile when `publisherProfileId` set.            |


---

## Phase 3 — Discovery & feeds


| Task          | Detail                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------- |
| Search / feed | Filter `events` by `publisherProfileId`, `venueProfileId`, existing tags/categories.          |
| “Following”   | If follow targets profiles, surface events where `publisherProfileId` in user’s followed set. |
| Analytics     | Attribute views/sales to `publisherProfileId` for organiser dashboards.                       |


---

## Phase 4 — Stripe Connect & payouts (marketplace)

**Goal:** Buyer pays; platform fee; net to **seller’s connected account** tied to a **profile** (or user, policy decision).

**Policy (locked in code):** Payout routing uses `**events.publisherProfileId` → `profiles/{id}`** (not `users/{uid}`). If the event has no publisher profile, or the profile has no ready Connect account, checkout stays **platform-only** (existing behaviour).


| Milestone | Status      | Detail                                                                                                                              |
| --------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| M1        | Done (code) | Express Connect; `stripeConnectAccountId` on `**profiles/{id}`**.                                                                   |
| M2        | Done (code) | Onboarding via `/api/stripe/connect/*`; `stripeConnectOnboardingStatus`, `payoutsEnabled` on profile.                               |
| M3        | Done (code) | Checkout Session with `**payment_intent_data.application_fee_amount`** + `**transfer_data.destination`** when seller is eligible.   |
| M4        | Done (code) | Webhook `**account.updated**` syncs profile flags; ticket payment webhooks unchanged. **You must subscribe in Stripe** (see below). |
| M5        | Deferred    | Holding period / delayed transfers after event end.                                                                                 |
| M6        | Deferred    | Refunds & chargebacks policy for Connect charges (partial refund paths).                                                            |


### Operational checklist (Stripe Dashboard + Firebase)

Do these once per environment (test vs live); repo code cannot toggle Connect for you.

1. **Enable Connect**
  Stripe Dashboard → **Settings → Connect** (or **Connect → Get started**). Complete platform profile / branding if required. The app creates **Express** connected accounts (`functions/src/routes/stripeConnect.ts`).
2. **Webhook: add `account.updated` to the existing endpoint**
  Use the **same** webhook destination URL and signing secret as today (e.g. `POST …/api/stripe/webhook` on your deployed API — see `functions/src/routes/stripe.ts`).  
  - **Developers → Webhooks →** (your endpoint) **→ Add events**  
  - Under **Connect**, select `**account.updated`**.  
  - Do **not** rotate `STRIPE_WEBHOOK_SECRET` unless you update Firebase/Functions config to match.  
   Alternative: a second endpoint pointing at the same `/api/stripe/webhook` path is unnecessary if one endpoint receives all required events.
3. **Firebase Functions config / secrets**
  Set in **Firebase Console → Functions →** your secrets / env, or `firebase functions:secrets:set`, mirroring `functions/.env.example`:
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (existing)  
  - `**APP_URL`** — canonical site URL for Connect **return/refresh** links (defaults in code try project `.web.app`; production should use `https://culturepass.app` or your real host).  
  - `**STRIPE_CONNECT_PLATFORM_FEE_BPS`** (optional) — integer basis points; default **1000** = **10%** platform fee (`functions/src/services/stripeConnect.ts`).
4. **Deploy**
  Deploy Cloud Functions **before** relying on new routes: `connect/create-account`, `connect/account-link`, `connect/status`, and extended checkout/webhook behaviour.
5. **Verify**
  After deploy: Stripe **Webhook → endpoint → Send test webhook** for `**account.updated`** (Connect) and confirm no 4xx/5xx in Functions logs; complete a test Express onboarding from **Organizer dashboard → Ticket payouts**.

**Note:** Until Connect is enabled and sellers finish onboarding, checkout remains **platform-only** for those events; profile Connect fields are inert until used.

---

## Phase 5 — Offerings (unified read model)

**Approach:** Keep **domain collections** (`restaurants`, `shops`, `activities`, `movies`) as source of truth; expose a **shared TypeScript model** (`UnifiedOffering`) and **mappers** plus a **read-only aggregate API**.


| Piece  | Detail                                                                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema | `shared/schema/offering.ts` — `OfferingKind`, `OfferingDomain`, `UnifiedOffering`, `buildUnifiedOfferings`, `filterUnifiedOfferings`.                                                               |
| Maps   | Restaurant → active **deals** + **menuHighlights**; shop → **deals**; activity → one row per published activity; movie → one row per **showtime** (`price` treated as whole AUD for label / cents). |
| API    | `GET /api/offerings?city=&country=&kinds=&domains=&limit=` — uses `Promise.allSettled` so one failing domain does not drop the whole response.                                                      |
| Client | `api.offerings.list`, Discover **Offers** chip → `/offerings`.                                                                                                                                      |


**Not in scope (future):** New Firestore `offerings` collection, structured restaurant menu SKUs, shop product catalog, or checkout — add when commerce needs justify migration.

---

## Quick checklist

- Deploy schema-compatible reads (ignore unknown fields already; TypeScript updated).
- Functions: validate `publisherProfileId` / `venueProfileId` on event write.
- Firestore indexes for new query patterns.
- Backfill job + monitoring.
- Client: event wizard + detail resolution order.
- Stripe Connect: enable in Dashboard, add `account.updated` to webhook, set `APP_URL` / `STRIPE_CONNECT_PLATFORM_FEE_BPS` in Functions (see Phase 4 checklist).
- Admin: link/unlink profile to user, fraud / verification.

---

## File references

- `shared/schema/event.ts` — `EventData`
- `shared/schema/profile.ts` — `Profile`
- `functions/src/routes/stripe.ts` — Checkout / webhooks (incl. `account.updated`)
- `functions/src/routes/stripeConnect.ts` — Connect onboarding routes
- `functions/src/services/stripeConnect.ts` — fee bps + profile sync helpers
- `functions/src/routes/events.ts` — event write paths (`publisherProfileId` / `venueProfileId`)
- `shared/schema/offering.ts` — unified offering types + mappers
- `functions/src/routes/offerings.ts` — `GET /api/offerings`
- `app/offerings/index.tsx` — unified browse screen