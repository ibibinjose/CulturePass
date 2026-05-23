# 06 — Implementation Plan

> **Version**: 2.0 — May 2026
> **Status**: Phase 1 shipped. Post-launch roadmap active.
> **Audience**: Engineering, Product, Founder
> **Related**: [01-PRD](01-PRD.md) · [02-TRD](02-TRD.md) · [05-BACKEND_SCHEMA](05-BACKEND_SCHEMA.md) · [GO_TO_MARKET](GO_TO_MARKET.md)

---

## Status Summary

| Phase | Status | Period |
|---|---|---|
| Phase 0: Foundation | ✅ Complete | Jan–Feb 2026 |
| Phase 1: Core MVP | ✅ Complete | Feb–Apr 2026 |
| Phase 2: Launch Hardening | ✅ Complete | Apr 2026 |
| Phase 3: Post-Launch Growth | 🔄 In Progress | May–Jul 2026 |
| Phase 4: Market Expansion | 🗓 Planned | Aug–Dec 2026 |

---

## Phase 0: Foundation (Complete)

Everything required before a single feature could be built.

### 0.1 Project Bootstrap

- [x] Expo 55 + React Native 0.83 project init
- [x] TypeScript strict mode configured
- [x] ESLint + Prettier configured
- [x] Expo Router v5 file-based navigation wired
- [x] Firebase project created (`culturepass-4f264`)
- [x] Firebase SDK integrated (Auth, Firestore, Storage, FCM)
- [x] Cloud Functions Express app scaffolded (`functions/src/app.ts`)
- [x] EAS Build configured for iOS + Android
- [x] `eas.json` with development, preview, production channels
- [x] `shared/schema/` TypeScript type contracts (client/server shared)
- [x] Monorepo structure: `src/` (app) + `functions/` (backend) + `shared/` (types)

### 0.2 Design System

- [x] `src/design-system/tokens/theme.ts` — master token export
- [x] `CultureTokens` (indigo, violet, coral, gold, teal, emerald, purple)
- [x] `SignatureGradient` (violet → coral)
- [x] `useColors()` hook — dark/light mode semantic colours
- [x] `useLayout()` hook — responsive grid (mobile / tablet / desktop)
- [x] Typography scale (`TextStyles.*`)
- [x] Spacing + Radius scales (`Spacing`, `Radius`)
- [x] Elevation tokens
- [x] Animation tokens
- [x] `GlassView` platform component (iOS blur / Android solid / web CSS)
- [x] Atomic UI primitives: `Button`, `Card`, `Badge`, `Input`, `BackButton`, `BrandLockup`, `BrandWordmark`
- [x] M3 component set: `M3TopAppBar`, `M3Button`, `M3FilterChip`, `M3SectionHeader`, `M3Card`, `M3FAB`
- [x] `M3NavigationRail` (tablet)
- [x] `LikeToggle`, `SaveToggle`, `Checkbox`, `AnimatedFilterChip`, `FilterChips`

### 0.3 Auth + Routing Shell

- [x] Firebase Auth: email + Google + Apple Sign-In
- [x] `lib/auth.tsx` — `AuthProvider` + `useAuth()`
- [x] Auth gate in `_layout.tsx` (redirect unauthenticated users)
- [x] `OnboardingContext` — city, country, interests, isComplete
- [x] Onboarding wizard: cultures → location → communities
- [x] Bottom tab bar (`CustomTabBar.tsx`) — gradient pill active indicator, Reanimated spring
- [x] Tab header chrome (`TabHeaderChrome.tsx`) — logo + title + glass action buttons
- [x] Web sidebar (`WebSidebar.tsx`) — 240px, replaces tab bar on desktop
- [x] `useLayout()` responsive breakpoints wired

### 0.4 API Layer

- [x] `src/lib/api.ts` — typed namespace client
- [x] `src/platform/api/client.ts` — `ApiError` + `request()` wrapper
- [x] `src/platform/api/endpoints/` — namespace factories (events, membership, payment, wallet, rewards, perks, communities)
- [x] TanStack React Query configured (`lib/query-client.ts`)
- [x] `shared/schema.ts` — master TypeScript re-exports

---

## Phase 1: Core MVP (Complete)

All user-facing features required for a functional launch.

### 1.1 Discover Tab

- [x] Hero Carousel (`HeroCarousel.tsx`) — editorial events, aurora gradient overlay
- [x] Event Rails — Trending / Near You / By Culture / Free (horizontal scroll)
- [x] Community Rail
- [x] Category Rail
- [x] City Rail
- [x] Indigenous Spotlight section
- [x] Super App Links (CultureX, Host Hub, Communities)
- [x] Feed Cards (personalised activity feed)
- [x] `WebHeroCarousel` + `WebRailSection` (web variants)
- [x] Skeleton loading on all rails
- [x] `SectionHeader` with "See all" actions

### 1.2 Events

- [x] Event detail page (`event/[id].tsx`) — hero, description, venue map, ticket tiers, artists, sponsors
- [x] Events browse page (`events.tsx`) — filter bar: category + date + price
- [x] Category browse (`browse/[category].tsx`) — 2-column grid, BrowseCard, BrowseHeader
- [x] `EventCard` — flag dispatcher (V1 default / V2 Mode-C feature-flagged)
- [x] `EventCardV1.tsx` (production default)
- [x] `EventCardV2.tsx` (Mode-C — flag: `eventcard-v2`)
- [x] `NativeMapView` — native + web platform components
- [x] Culture tag filter chips
- [x] LikeToggle + LikesContext on event cards

### 1.3 Ticketing

- [x] Checkout flow (`checkout/[eventId].tsx`) — tier selection, Stripe card input
- [x] `createPaymentIntent` → Stripe → webhook → ticket creation
- [x] Ticket confirmation screen (`tickets/[id].tsx`) — QR code display
- [x] Add-to-Calendar (native: `expo-calendar`; web: `.ics` download)
- [x] QR scanner (`scanner.tsx`) — organisers/venue staff check-in
- [x] Ticket history in My Space

### 1.4 Calendar Tab

- [x] Month grid (`CalendarMonthGrid.tsx`) — event dots on dates
- [x] Day view (events list for selected date)
- [x] My Tickets segment
- [x] Civic reminders (public holidays, cultural dates)
- [x] Culture tag filter chips
- [x] `ical.ts` — `.ics` builder + webcal:// subscription URL

### 1.5 Community Tab

- [x] Community list — My Communities + Discover
- [x] Community detail (`(domain)/community/[id].tsx`) — cover, members, events
- [x] Join / leave community (`api.communities.join/leave`)
- [x] Community events rail
- [x] Members list with follow actions

### 1.6 City Tab

- [x] City selector
- [x] City destination page (`city/[name].tsx`) — hero, events, communities, businesses
- [x] Council/LGA area (`my-council.tsx`) — LGA proximity

### 1.7 My Space (Profile)

- [x] Upcoming tickets widget
- [x] Saved events
- [x] Joined communities
- [x] Perks balance chip
- [x] Membership status + upgrade CTA
- [x] Identity QR Card (`WidgetIdentityQRCard`)
- [x] Network section (followers/following)
- [x] Profile edit (name, bio, photo, social links)

### 1.8 Perks

- [x] Perks catalogue (`perks/`)
- [x] Perk detail — `PerkHero`, `PerkAbout`, `PerkDetails`, `PerkCouponModal`
- [x] Membership tier gate (lock overlay)
- [x] Redemption flow (`api.perks.redeem()`)
- [x] Indigenous perk cards (`PerkIndigenousCard`)

### 1.9 Business & Venue Directory

- [x] Directory browse (`directory.tsx`) — tabs: All / Events / Indigenous / Businesses / Venues / Organisations / Councils / Charities
- [x] Council filter chip (LGA proximity)
- [x] Business/venue detail pages
- [x] `PromotedRail` (featured businesses)

### 1.10 Host Hub (Organiser)

- [x] Host tab (`(tabs)/host.tsx` — hidden from tab bar)
- [x] Host Hub UI (`modules/host/components/`)
- [x] Event creation wizard (9 steps via `listing/create.tsx`)
- [x] Event management (edit, cancel, duplicate)
- [x] Organiser dashboard (`dashboard/organizer.tsx`)
- [x] Backstage per-event view (`dashboard/backstage/[id].tsx`)
- [x] Stripe Connect onboarding + payout status
- [x] Create profile wizard (venue / business / organisation / artist)

### 1.11 Membership

- [x] Tier display (Free → VIP)
- [x] Stripe subscription checkout (`membership/[tier].tsx`)
- [x] Webhook handler → Firestore tier update
- [x] Custom claims update (Firebase Admin SDK)
- [x] Upgrade/downgrade flow

### 1.12 Social + Network

- [x] Follow / unfollow (`api.social.*`)
- [x] Network screen (`network/`) — added / followers / following / suggestions
- [x] User profile (`user/[id].tsx`)
- [x] Contacts CRM (`contacts/`) — list, detail, pin/unpin, segments, notes, tags
- [x] Smart Business Cards (deep link + `WidgetIdentityQRCard`)

### 1.13 Search

- [x] Global search (`search/`) — multi-entity, filter chips
- [x] Firestore-backed `searchService` (bounded reads + in-memory match)
- [x] Results: events, profiles (community/business/venue/artist)

### 1.14 Admin Dashboard

- [x] 14 admin routes: users, audit-logs, moderation, finance, discover, import, handles, notifications, platform, data-compliance, updates, dashboard
- [x] Role guard: `requireRole('platformAdmin')`
- [x] Content moderation queue
- [x] Notification broadcast
- [x] Feature flag management

### 1.15 Push Notifications

- [x] FCM token registration (`expo-notifications`)
- [x] Tokens stored in `users/{uid}.fcmTokens[]`
- [x] Notification types: ticket confirmed, event reminder, new follower, admin broadcast
- [x] Notification list + mark-read (`notifications/`)

---

## Phase 2: Launch Hardening (Complete)

Delivered before public launch on 15 April 2026.

- [x] TypeScript — zero errors (`npm run typecheck`)
- [x] ESLint — zero warnings (`npm run lint`)
- [x] `npm run qa:solid` gate passing
- [x] Firebase production project configured (separate from dev)
- [x] Stripe live mode enabled
- [x] EAS secrets set (Firebase config, Stripe keys, Google Maps, Sentry DSN)
- [x] Privacy Policy live at `culturepass.app/privacy`
- [x] Terms of Service live at `culturepass.app/terms`
- [x] Community Guidelines live
- [x] Demo account created for App Review (`demo@culturepass.app`)
- [x] App Store Connect setup (screenshots, age rating, capabilities)
- [x] Google Play Console setup (data safety form, content rating)
- [x] iOS build submitted + approved (buildNumber: 2, version: 1.1.0)
- [x] Android build submitted + approved
- [x] Web deployed to Firebase Hosting (production)
- [x] Sentry DSN configured + wired
- [x] Firebase Crashlytics enabled (iOS + Android)
- [x] Firestore security rules audited
- [x] Firestore region: `australia-southeast1`
- [x] Composite indexes created
- [x] `AllCouncilsList.csv` seeded to `councils/` collection
- [x] Emulator seed script (`npm run emulator:seed:cap`) — CAP org + 5 events

---

## Phase 3: Post-Launch Growth (In Progress — May–July 2026)

### 3.1 Search: Algolia Integration (Month 1 — May 2026)

**Goal**: Replace Firestore-backed search with full-text Algolia for event/community/business discovery.

**Steps**:
1. Create Algolia application + indices: `events`, `profiles`, `communities`
2. Configure facets: `city`, `country`, `cultureTag`, `category`, `entryType`, `isFree`, `entityType`
3. Write Firestore → Algolia sync via `onWrite` Cloud Function triggers on `events/` and `profiles/`
4. Add `algoliasearch` to `src/lib/`
5. Update `src/lib/api.ts` — add `api.search.algolia()` namespace
6. Feature-flag rollout: `algolia-search` flag at 10% → 50% → 100%
7. Remove Firestore fallback after 2-week validation

### 3.2 GeoHash Backfill (Month 1 — May 2026)

**Goal**: Geocode all events missing `latitude` / `longitude` / `geoHash` for proximity queries.

**Steps**:
1. Run `functions/src/jobs/geohashBackfill.ts` against production `events/` collection
2. Google Maps Geocoding API: address → lat/lng → geohash
3. Batch writes in groups of 500 to avoid rate limits
4. Validate: query `events where geoHash == null` returns 0
5. Enable "Events Near You" rail on Discover (currently falls back to city match)

### 3.3 Council LGA Auto-Select from GPS (Month 1 — May 2026)

**Goal**: Auto-detect user's LGA on onboarding from GPS (no manual input required).

**Steps**:
1. Add `GET /api/councils/nearest?lat=&lng=` endpoint to `handlers/council.ts`
2. Service: reverse-geocode to LGA via Google Maps Geocoding or AU Open Data
3. Client: `useLocationPickerFlow` → after GPS permission granted → call `api.council.nearest()`
4. Write `lgaCode` to `users/{uid}` server-side
5. Show LGA name on onboarding confirmation step

### 3.4 Organiser Analytics Dashboard (Month 2 — June 2026)

**Goal**: Give organisers event-level analytics: attendance, revenue, referral sources.

**Steps**:
1. New route: `dashboard/event-analytics/[eventId].tsx`
2. Backend: `GET /api/events/:id/analytics` — aggregate tickets, revenue, check-ins by day
3. Charts: `react-native-chart-kit` or Recharts (web) — attendance timeline, revenue breakdown
4. Attendee list with search + export to CSV
5. Check-in rate calculation (checked-in / total paid tickets)

### 3.5 Promotional Codes (Month 2 — June 2026)

**Goal**: Organisers can create discount codes for their events; users apply at checkout.

**Steps**:
1. New Firestore collection: `promoCodes/{codeId}` — `{code, eventId, discountType, discountValue, maxUses, usedCount, expiresAt, status}`
2. Admin + organiser UI to create codes
3. Checkout: promo code input field → `POST /api/tickets/validate-promo` → apply discount to `priceCents`
4. Server-side validation: code exists, not expired, not over limit, applies to this event
5. `usedCount` incremented atomically on redemption

### 3.6 Community Posts (Month 3 — July 2026, Feature-Flagged)

**Goal**: Community members can post text + image updates within their community.

**Steps**:
1. Firestore subcollection: `communities/{id}/posts/{postId}` (schema in [05-BACKEND_SCHEMA](05-BACKEND_SCHEMA.md))
2. `POST /api/communities/:id/posts` — create post (authenticated community member only)
3. `GET /api/communities/:id/posts` — paginated feed
4. `POST /api/communities/:id/posts/:postId/like` — like/unlike
5. Frontend: community posts feed component (feature-flag: `community-posts`)
6. Content moderation: posts pass through `moderation.ts` middleware

### 3.7 Push Notification Deep Links + Per-Category Opt-Out (Month 3 — July 2026)

**Goal**: Tapping a push notification navigates to the relevant screen; users can opt out by category.

**Steps**:
1. Add `deepLink` field to all notification payloads
2. Client: `notifications/notificationResponseListener` → `router.push(deepLink)` on tap
3. Add `notificationPreferences: { [category]: boolean }` to `users/{uid}`
4. Settings screen: per-category toggle UI
5. Backend: filter notification send by `notificationPreferences`

### 3.8 Rewards Points Redemption UI (Month 3 — July 2026)

**Goal**: Users can redeem points at checkout for event ticket discounts.

**Steps**:
1. Checkout: show points balance chip if `wallet.pointsBalance > 0`
2. Toggle: "Use [X] points for [Y]% discount"
3. Backend: `POST /api/tickets/checkout` accepts `usePoints: number`
4. Validate: enough points, not exceeding ticket price
5. On payment success: deduct points from wallet, write `WalletTransaction`

---

## Phase 4: Market Expansion (Planned — August–December 2026)

### 4.1 International Markets

| Market | Month | Key Work |
|---|---|---|
| Auckland + Wellington, NZ | Aug 2026 | NZ onboarding city grouping; NZD currency support; NZ culture tags |
| Dubai, UAE | Sep 2026 | UAE city onboarding; AED currency; Arabic culture tags; UAE event categories |
| London, UK | Oct 2026 | UK city group; GBP currency; UK diaspora culture tags (Caribbean, South Asian, East African) |
| Toronto, CA | Dec 2026 | CA city group; CAD currency; Canadian diaspora tags |

### 4.2 Infrastructure Migration to Supabase (Month 8–12)

For users 10K–50K. Firestore → PostgreSQL migration.

**Steps** (full detail in [GO_TO_MARKET.md](GO_TO_MARKET.md) §7):
1. Design PostgreSQL schema from Firestore data model
2. Write migration scripts (Firestore export → PostgreSQL import)
3. Rewrite `functions/src/services/firestore.ts` → Supabase client
4. Feature-flag parallel writes: Firebase + Supabase (4-week validation)
5. Cut over — Supabase becomes primary, Firebase read deprecated
6. Keep Firebase Auth + FCM (supported by Supabase JWT auth)

### 4.3 Other Post-Launch Features

| Feature | Month |
|---|---|
| Organiser attendee messaging (FCM multicast + email) | Aug 2026 |
| Wallet top-up + Apple/Google Pay | Sep 2026 |
| Tiered perk gates (lock overlay + server 403) | Sep 2026 |
| Server-side iCal city subscription endpoint | Oct 2026 |
| Affiliate / referral program | Oct 2026 |
| Firebase DataConnect migration (exploratory) | Q4 2026 |

---

## Build Rules (Always Follow)

### Deploy Order

```
Cloud Functions FIRST → then app (native + web)
```

Never deploy app changes that depend on new API endpoints before those endpoints are live.

### Quality Gate (Required Before Every Deploy)

```bash
npm run qa:solid
# = lint + typecheck + scripted tests + Functions build + mock web export + route hygiene
```

Zero tolerance: any failure blocks deploy.

### API Changes

- New endpoint: add to `functions/src/handlers/[domain].ts` + `src/lib/api.ts` namespace + `shared/schema/` types
- Endpoint deprecation: keep old endpoint for 1 OTA cycle (2 weeks) before removing
- Breaking changes: feature-flag the new behaviour; parallel support for 1 OTA cycle

### Feature Flag Protocol

```typescript
// All new features behind a flag until validated:
useFlagOverride('feature-name')

// Rollout: 10% → 25% → 50% → 100% over 2-week periods
// Remove flag + old code path after 100% + 1 week stable
```

### Database Changes (Firestore)

- New fields: always optional initially; backfill in batches of 500
- New indexes: deploy via `firestore.indexes.json` before app change
- Schema changes: write migration script in `functions/src/migrations/`
- Never remove a field without confirming zero client reads (grep `shared/schema/`)

### Component Rules

- All tokens from `@/design-system/tokens/theme` — never hardcode hex
- All colours via `useColors()` at runtime
- All layout via `useLayout()` — never hardcode breakpoints
- Prefer design-system atomic components over raw `<View>` / `<Pressable>`
- `topInset = Platform.OS === 'web' ? 0 : insets.top` — always

---

## Task Tracking

See [TASKS.md](../TASKS.md) for current sprint tasks.
See [TASKS_EXECUTION.md](../TASKS_EXECUTION.md) for execution log.

---

*Last updated: May 2026 | Maintained by: CulturePass Engineering + Product*
