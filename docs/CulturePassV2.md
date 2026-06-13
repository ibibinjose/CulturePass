# CulturePass V2 — Full Rebuild Plan

**Status:** Strategic blueprint  
**Version:** 2.0.0 (target)  
**Current app:** 1.3.2 (V1 — strangler migration source)  
**Audience:** Engineering, product, design, new hires  
**Companion docs:** `docs/ARCHITECTURE.md`, `docs/ADRs/`, `docs/DESIGN_TOKENS.md`

---

## 1. Executive summary

CulturePass V2 is **not a throwaway rewrite**. It is a **strangler rebuild**: same product vision, same Firebase/Stripe stack, same HostSpace investment — with **one folder per feature**, **one home API**, **one design contract**, and **market-aware configuration**.

| V1 problem | V2 fix |
|------------|--------|
| 6 layers per feature (`app/`, `modules/`, `components/`, `features/`, `services/`, `lib/`) | **One `features/<domain>/` per product area** |
| Discover = 10–15 HTTP calls on open | **`GET /v2/discover/home`** returns full feed |
| Events list fetches 1000 docs, filters in RAM | **Cursor pagination + search index** |
| Australia hardcoded (Sydney, councils, sync IDs) | **`markets/{code}` config documents** |
| 7+ EventCard components | **One `EventCard` with variants** |
| Zod v3 (functions) vs v4 (client) | **Shared `shared/contracts/` (Zod v4)** |
| Dual host creation paths | **Single FormWizard engine (ADR-001, enforced)** |

**Timeline (indicative):** 6–9 months phased; Phase 1 (Discover + events) delivers user-visible wins in ~8 weeks.

---

## 2. Product scope — what V2 must include

### 2.1 Consumer surfaces (tabs & core journeys)

| Surface | Route (V2) | Responsibility |
|---------|------------|----------------|
| **Discover** | `/(tabs)/` | Home feed, location/time context, rails, filters |
| **Calendar** | `/(tabs)/calendar` | Dates, tickets, council filter, ICS subscribe |
| **Community** | `/(tabs)/community` | Hubs, join/follow, local-first discovery |
| **My City** | `/(tabs)/city` | City command center, personal rails |
| **Profile** | `/(tabs)/profile` | Account, digital ID, membership, settings |
| **Event detail** | `/e/[id]` | Info doc, external/native ticketing, RSVP |
| **Search** | `/search` | Directory + trending, LGA-scoped |
| **Map** | `/map` | GPS-centered, nearby merge |
| **Explore / CultureX** | `/explore` | Culture passport, vibe filters, quests |
| **Checkout** | `/checkout` | Stripe native; external redirect + analytics |
| **My Council** | `/my-council` | LGA context, civic events |
| **CultureMarket** | `/CultureMarket` | Marketplace listings |
| **Activities** | `/activities` | Classes, fitness, workshops |
| **CPU / public profile** | `/cpu/[id]` | CPID, handle, digital pass |

### 2.2 Host & creator surfaces

| Surface | Route | Responsibility |
|---------|-------|----------------|
| **HostSpace** | `/hostspace` | Gated creator home |
| **FormWizard** | `/hostspace/create` | **Canonical** profile creation (all entity types) |
| **Event create** | `/hostspace/event` | Content under a profile |
| **Listing create** | `/hostspace/listing` | CultureMarket listing |
| **Verification** | `/hostspace/verify` | Layer-2 tasks |
| **Admin** | `/admin/*` | Ops, moderation, sync config |

### 2.3 Platform capabilities (non-UI)

- Firebase Auth + custom claims (roles)
- Firestore (writes, tickets, profiles, drafts)
- Cloud Functions API (`australia-southeast1` → split in Phase 3)
- Stripe Checkout / PaymentIntents / Connect
- External sync: Eventbrite, Eventik (config-driven)
- PostHog + Sentry
- iOS widgets + wallet passes
- Expo web static export → Firebase Hosting

---

## 3. Architecture roots (non-negotiable rules)

### 3.1 Layer diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  app/                    Thin routes only (re-export screens)    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  features/               Product domains (ALL new code here)     │
│    discover/  events/  communities/  host/  marketplace/ ...    │
│      screens/  components/  hooks/  api.ts  types.ts           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  platform/               Cross-cutting infrastructure            │
│    api/  auth/  location/  analytics/  query/                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│  design-system/          Tokens + primitives (no product logic)  │
└─────────────────────────────────────────────────────────────────┘

shared/
  contracts/               Zod schemas → inferred TS types
  location/                Postcodes, geo helpers (market plugins)

functions/
  http/                    Thin Express handlers
  domain/                  Use-cases (business logic)
  infra/                   Firestore, Stripe, email
  workers/                 Sync, digest, materialized feeds
```

### 3.2 Dependency rules

1. **`features/*` may import `platform/*` and `design-system/*` — never another feature's internals**
2. **`app/*` may only import `features/*/screens`**
3. **No new code in `src/components/<Domain>/` or duplicate `modules/<domain>/` paths**
4. **Server validates every write with `shared/contracts` Zod**
5. **Client never reads Firestore directly** (except auth SDK + uploads)
6. **One GPS read per session** → `platform/location/LocationProvider`
7. **One EventCard** → `features/events/components/EventCard.tsx`

### 3.3 V2 repository layout (target)

```
CulturePass/                          # Rename optional; same repo
├── app.config.js
├── src/
│   ├── app/                          # expo-router (thin)
│   ├── features/
│   │   ├── discover/
│   │   ├── events/
│   │   ├── communities/
│   │   ├── calendar/
│   │   ├── city/
│   │   ├── explore/
│   │   ├── marketplace/
│   │   ├── host/                     # migrate from modules/host/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── checkout/
│   │   ├── admin/
│   │   └── onboarding/
│   ├── platform/
│   │   ├── api/                      # transport + ApiError
│   │   ├── auth/
│   │   ├── location/
│   │   ├── market/                   # MarketContext (AU, IN, …)
│   │   └── analytics/
│   └── design-system/
├── shared/
│   ├── contracts/                    # Zod v4 — source of truth
│   │   ├── event.ts
│   │   ├── user.ts
│   │   ├── hostProfile.ts
│   │   ├── discover.ts
│   │   ├── market.ts
│   │   └── index.ts
│   └── location/
│       ├── au/
│       └── types.ts
├── functions/
│   ├── http/
│   ├── domain/
│   ├── infra/
│   └── workers/
└── docs/
    └── CulturePassV2.md              # this document
```

### 3.4 Provider tree (V2)

```
PersistQueryClientProvider
  PostHogProvider
    AuthProvider
      MarketProvider          ← country, currency, sync config, council resolver
        LocationProvider      ← GPS, effective city, council nearest
          SavedProvider
            App routes
```

---

## 4. Colour system (V2 canonical)

**Rule:** No raw hex outside `design-system/tokens/`. `npm run hex:check` + `npm run colors:ban:check` stay in CI.

### 4.1 Wordmark palette (brand identity)

| Token | Hex | RGB | Wordmark part | Usage |
|-------|-----|-----|---------------|-------|
| `cultureRed` | `#f80020` | 248, 0, 32 | **Culture** | Heritage emphasis, cultural highlights |
| `passGreen` | `#00A651` | 0, 166, 81 | **Pass** | Belonging, growth, community |
| `appBlue` | `#009EDB` | 0, 158, 219 | **.App** | Primary chrome, links, focus, CTAs |

**Source:** `brandWordmarkPalette.ts`

### 4.2 Platform UI palette

| Token | Hex | Role |
|-------|-----|------|
| `indigo` | `#4F46E5` | M3 primary, trust, platform identity |
| `violet` | `#4F46E5` | Unified with indigo (no standalone purple) |
| `coral` | `#FF5E5B` | Movement, secondary CTA, artist |
| `teal` | `#0D9488` | Venues, council, global belonging |
| `emeraldHarmony` | `#0A8C7F` | Events, trust sections |
| `richIndigo` | `#4A5EBF` | Stories, map pins, links |
| `emerald` | `#10B981` | Success states |
| `error` | `#BA1A1A` | Errors, destructive |
| `BRAND_CYAN` | `#00ADEF` | Digital ID, wallet, premium badges |
| `BRAND_CYAN_DEEP` | `#00A7EF` | Secondary accent |
| `BRAND_CYAN_LIGHT` | `#4DD4FF` | Gradient highlights |
| `JET_BLACK` | `#000000` | OLED backgrounds |
| `JET_BLACK_SOFT` | `#0A0A0A` | Ink on bright surfaces |

**Legacy names (API compat only — map to cyan):** `gold`, `deepSaffron`, `heritageGold` → cyan family.

### 4.3 Surfaces (light / dark)

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#FAF9F6` | `#0C0A09` |
| `surface` | `#FFFFFF` | `#1C1917` |
| `surfaceVariant` | M3 derived | M3 derived |
| `onSurface` | near-black | near-white |

Use `useM3Colors()` / `useColors()` — never hardcode surfaces.

### 4.4 Signature gradients

| Name | Stops | Rule |
|------|-------|------|
| `culturepassBrand` | `#f80020` → `#009EDB` | Max **one per screen** (hero, onboarding) |
| `culturalBlend` | culture red → pass green → app blue | Flagship marketing only |

### 4.5 Category colours (Discover filters, chips)

| Category | Token / Hex | Discover filter id |
|----------|-------------|-------------------|
| Events | `emeraldHarmony` `#0A8C7F` | `events` |
| Art | `heritageGold` → cyan `#00ADEF` | `art` |
| Movies | `violet` `#4F46E5` | `movies` |
| Dining | `coral` `#FF5E5B` | `dining` |
| Shopping | `emerald` `#10B981` | `shopping` |
| Hubs | `indigo` `#4F46E5` | `hubs` |
| Activities | `teal` `#0D9488` | `activities` |
| Classes | `coral` `#FF5E5B` | `classes` |
| Travel | `richIndigo` `#4A5EBF` | `travel` |
| Offers | `BRAND_CYAN` `#00ADEF` | `offers` |
| Directory | `emeraldHarmony` | `directory` |
| Indigenous | dedicated accent | `indigenous` |

### 4.6 Entity type colours (cards, directory)

| Entity | Hex (via token) |
|--------|-----------------|
| event | `emeraldHarmony` |
| venue | `richIndigo` |
| community | cyan (`heritageGold` alias) |
| organizer | `BRAND_CYAN_DEEP` |
| host | `appBlue` |
| council | `teal` |
| business | `emeraldHarmony` |
| charity | `coral` |

### 4.7 Banned colours (never reintroduce)

`#F5A623`, `#D4A017`, `#FFC857`, `#E5A93B`, `#FFD54F`, `#FFB300`, terracotta family — enforced by `scripts/check-banned-colors.mjs`.

---

## 5. Field catalog (data model)

V2 uses **`shared/contracts/`** (Zod) as runtime + compile-time truth. Below is the logical field map migrated from V1 `shared/schema/`.

### 5.1 Locatable primitive (all geo entities)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `country` | string | yes | ISO market name, e.g. `Australia` |
| `state` | string | AU: NSW/VIC/… | Market-specific |
| `city` | string | yes | Marketplace city hub |
| `suburb` | string | no | Finer local label |
| `address` | string | no | Street line |
| `lat` | number | no | WGS84 |
| `lng` | number | no | WGS84 |
| `geoHash` | string | no | Server-computed for nearby |
| `lgaCode` | string | AU | ABS LGA code |
| `councilId` | string | no | `councils/{id}` reference |
| `timezone` | string | no | IANA, e.g. `Australia/Sydney` |

### 5.2 Event (`EventData`)

**Identity & publishing**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Firestore doc id |
| `slug` | string? | Public URL `/e/{slug}` |
| `title` | string | |
| `description` | string | Rich text / markdown subset |
| `status` | `draft \| published \| cancelled` | |
| `publisherProfileId` | string? | Canonical directory page |
| `organizerId` | string? | Legacy user id |
| `communityId` | string? | Hub-owned event |
| `venueProfileId` | string? | Linked venue profile |
| `createdBy` | string? | UID |

**Schedule**

| Field | Type | Notes |
|-------|------|-------|
| `date` | string | `YYYY-MM-DD` |
| `time` | string? | `HH:MM` or `h:mm am/pm` |
| `endDate` | string? | Multi-day |
| `endTime` | string? | |
| `timezone` | string? | Display + calendar export |

**Location** — all Locatable fields + `venue`, `locationType` (`physical \| virtual \| hybrid`), `meetingLink`

**Ticketing**

| Field | Type | Notes |
|-------|------|-------|
| `entryType` | `ticketed \| free_open` | |
| `priceCents` | number? | Native checkout |
| `priceLabel` | string? | Display override |
| `isFree` | boolean? | |
| `tiers` | `{ name, priceCents, available }[]` | Empty for external |
| `externalTicketUrl` | string? | Eventbrite/Eventik |
| `externalUrl` | string? | Fallback outbound |
| `sourceSystem` | string? | `eventbrite`, `eventik`, `culturepass` |
| `metadata` | object? | `ticketProvider`, `eventbriteId`, `externalTicketingOnly` |
| `maxTicketsPerOrder` | number? | |
| `ticketClickCount` | number? | Analytics |

**Culture & discovery**

| Field | Type | Notes |
|-------|------|-------|
| `eventType` | EventType enum | festival, workshop, … |
| `category` | string? | Legacy bucket |
| `tags` | string[]? | |
| `cultureTag` / `cultureTags` | string[]? | Taxonomy |
| `languageTags` | string[]? | |
| `nationalityId` | string? | Flag display |
| `indigenousTags` | string[]? | |
| `isIndigenousOwned` | boolean? | |
| `isFeatured` | boolean? | Editorial |
| `attending` | number? | Social proof |
| `popularityScore` | number? | Rank input |

**Media**

| Field | Type | Notes |
|-------|------|-------|
| `imageUrl` | string? | |
| `heroImageUrl` | string? | Detail hero |
| `thumbhash` | string? | Placeholder |
| `imageColor` | string? | Dominant colour |

**Host & registration**

| Field | Type | Notes |
|-------|------|-------|
| `hostInfo` | object? | name, email, phone, website |
| `artists` | EventArtist[]? | |
| `eventSponsors` | EventSponsor[]? | |
| `registrationFields` | `{ name, email, phone, company }` | |
| `customQuestions` | string[]? | |
| `waitlistEnabled` | boolean? | |
| `requireApproval` | boolean? | |

### 5.3 User (`User`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Firebase UID |
| `username` | string | |
| `handle` | string? | `+handle` display |
| `handleStatus` | `pending \| approved \| rejected` | |
| `culturePassId` | string? | `CP-XXXXXX` |
| `displayName` | string? | |
| `email` | string? | |
| `avatarUrl` | string? | |
| `city` / `country` | string? | Profile market |
| `role` | UserRole | claims + doc |
| `culturalIdentity` | CulturalIdentity | See below |
| `calendarSettings` | object? | sync prefs |
| `subscribedCities` | array? | Multi-city |

**CulturalIdentity**

| Field | Type | Notes |
|-------|------|-------|
| `nationalityId` | string? | e.g. `indian` |
| `cultureIds` | string[]? | Roots |
| `exploringCultureIds` | string[]? | CultureX passport |
| `languageIds` | string[]? | |
| `diasporaGroupIds` | string[]? | |

### 5.4 Council (`CouncilData`) — AU market plugin

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `name` | string | LGA display name |
| `state` | AU state enum | |
| `lgaCode` | string | ABS code |
| `suburb` | string | |
| `postcode` | number | |
| `verificationStatus` | enum | |
| `logoUrl` / `bannerUrl` | string? | |

### 5.5 Discover feed (`DiscoverFeedContract` — V2 primary home payload)

| Field | Type | Notes |
|-------|------|-------|
| `meta.userId` | string | |
| `meta.generatedAt` | ISO string | |
| `meta.source` | `cache \| live` | |
| `meta.marketId` | string | **V2:** `AU`, `IN`, … |
| `meta.location` | object? | **V2:** city, lat, lng, councilId |
| `rankedEvents` | RankedEventResult[] | |
| `forYouEvents` | RankedEventResult[]? | Culture-matched |
| `trendingEvents` | EventData[] | |
| `suggestedCommunities` | string[] | ids |
| **V2 rails** | | |
| `nearbyEvents` | EventData[]? | GPS radius |
| `councilEvents` | EventData[]? | LGA |
| `startingSoon` | EventData[]? | Time buckets |
| `communities` | Community[]? | Local-first |
| `perks` | PerkData[]? | |
| `activities` | ActivityData[]? | |
| `movies` / `restaurants` / `shopping` | arrays? | Optional verticals |

### 5.6 Host profile (FormWizard — keep V1 depth)

| Entity type | Key field groups |
|-------------|------------------|
| `community` | identity, culture tags, chapter cities, languages |
| `organiser` | legal name, ABN, insurance, event history |
| `venue` | capacity, accessibility, hours, geo |
| `business` | offerings, cuisine/culture tags |
| `artist` | genres, repertoire, rider |
| `professional` | credentials, services |

**Shared host fields:** `entityType`, `displayName`, `slug`, `bio`, `media`, `socialLinks`, `location` (Locatable), `verificationStatus`, `draftId`, `version`.

### 5.7 Market config (`markets/{code}`) — **V2 new**

| Field | Type | Example (AU) |
|-------|------|--------------|
| `code` | string | `AU` |
| `name` | string | `Australia` |
| `defaultCity` | string | `Sydney` |
| `currency` | string | `AUD` |
| `locale` | string | `en-AU` |
| `dateFormat` | string | `DD/MM/YYYY` |
| `councilProvider` | string | `abs-lga` |
| `syncJobs` | object[] | Eventbrite, Eventik configs |
| `featuredCities` | string[] | |
| `stripeAccountRegion` | string | |

---

## 6. API design (V2)

### 6.1 Versioning

- **V1:** `api/events`, `api/discover/:userId` (keep during migration)
- **V2:** `api/v2/*` — new contracts only
- Mount path: `/api/v2` (single function initially; split in Phase 3)

### 6.2 Core endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v2/discover/home` | **Single home payload** (all rails) |
| GET | `/v2/events` | Cursor list (`cursor`, `limit`, filters) |
| GET | `/v2/events/nearby` | lat, lng, radius |
| GET | `/v2/events/:id` | Detail + `myRsvp` |
| POST | `/v2/events/:id/ticket-click` | External analytics |
| GET | `/v2/communities` | Local-first list |
| GET | `/v2/search` | Index-backed directory |
| GET | `/v2/markets/:code` | Market config (public) |
| GET | `/v2/council/nearest` | GPS → LGA |
| POST | `/v2/checkout/session` | Stripe |
| *host* | `/v2/host/*` | Profiles, drafts, verify |

### 6.3 Query budget

| Screen | V1 calls | V2 target |
|--------|----------|-----------|
| Discover open | 10–15 | **1** (+ optional weather client-side) |
| Event detail | 2–4 | 2 |
| Community tab | 3–5 | 2 |
| Calendar month | 2 | 2 |

---

## 7. How to rebuild (strangler migration)

### Phase 0 — Freeze & align (weeks 1–4)

**Goals:** Stop new debt; align tooling.

| Task | Owner | Done when |
|------|-------|-----------|
| ADR-005: V2 folder rules | Eng lead | Merged |
| `features/` scaffold + empty `discover` | Eng | CI green |
| Zod v4 in functions | Backend | Single version |
| Remove unused deps (io-ts, fp-ts, zustand if unused) | Eng | package.json clean |
| Codemod plan: `@/lib/api` → feature `api.ts` | Eng | Script ready |
| Test gates: events handler, checkout, discover | Eng | Coverage thresholds |

**Do not delete V1 paths yet.**

### Phase 1 — Discover & events (weeks 5–12) ★ highest ROI

| Task | Deliverable |
|------|-------------|
| Implement `GET /v2/discover/home` | Materialized + live fallback |
| `features/discover/` screen | One `useDiscoverHome()` query |
| Deprecate `useDiscoverQueries` parallel fan-out | 80% traffic on V2 |
| Events cursor pagination | Remove `FETCH_CAP` |
| Unified `EventCard` | All rails migrated |
| Split `handlers/events.ts` | &lt;300 lines per file |

**User-visible:** Faster home, correct local-first rails, stable calendar.

### Phase 2 — Host platform (weeks 13–22)

| Task | Deliverable |
|------|-------------|
| Enforce ADR-001 | All profiles → FormWizard |
| `features/host/` migration | Move from `modules/host/` |
| Shared Zod host contracts | Client + server validation |
| Break entity field files | &lt;200 lines each |
| E2E per entity type | Playwright green |

### Phase 3 — Multi-market & infra (weeks 23–34)

| Task | Deliverable |
|------|-------------|
| `markets/AU` Firestore docs | Sync IDs externalized |
| `MarketProvider` | No hardcoded Australia in UI |
| Search index (Typesense/Algolia) | `/v2/search` |
| Split Cloud Functions | `api-core`, `workers` |
| Precomputed `discoverFeeds/{marketId}` | Cron + triggers |

### Phase 4 — Decommission V1 (weeks 35+)

| Task | Deliverable |
|------|-------------|
| Delete `components/Discover/` | Empty imports |
| Delete duplicate EventCards | One component |
| Delete `modules/discover/` after move | |
| Redirect V1 API → V2 or remove | |
| Admin decomposition | `features/admin/` |

---

## 8. What to keep from V1 (do not rewrite)

| Asset | Path | Reason |
|-------|------|--------|
| FormWizard engine | `modules/host/components/FormWizard/` | Best-in-class drafts, a11y, verification |
| `platform/api/endpoints/*` | Transport pattern | Rename/refactor, don't replace |
| `shared/schema/` types | Migrate → `shared/contracts/` | Domain knowledge |
| External ticketing | `externalTicketing.ts`, sync jobs | Correct boundary |
| Design tokens | `design-system/tokens/` | Brand + CI guards |
| Auth + AuthGuard | `lib/auth`, `providers/AuthGuard` | Security model works |
| Wallet / tickets | `modules/payment`, wallet scripts | Operational investment |
| QA pipeline | `qa:solid`, Playwright, emulators | Release discipline |
| LocationContext | `contexts/LocationContext.tsx` | Move to `platform/location/` |

---

## 9. What to delete (after migration)

| Asset | When |
|-------|------|
| `src/components/Discover/*` | Phase 4 |
| `src/modules/discover/` (after move) | Phase 4 |
| `useDiscoverQueries` 15-query hook | Phase 1 complete |
| `useLocationFilter.ts` | Unused |
| Duplicate EventCards (V1, V2, Luxe, …) | Phase 1 |
| `FETCH_CAP` in-memory event filter | Phase 1 |
| Hardcoded sync community IDs in source | Phase 3 → Remote Config |
| `@/lib/api` facade | Phase 2–4 |

---

## 10. Quality gates (V2 CI)

```bash
npm run typecheck          # strict TS
npm run lint               # eslint, max-warnings 0 on release
npm run hex:check          # no raw hex outside tokens
npm run colors:ban:check   # no deprecated gold/saffron
npm run test:unit          # Jest + functions tests
npm run test:e2e           # Playwright critical paths
npm run qa:solid           # all above
```

**V2 additions:**

- `contracts:check` — Zod parse golden fixtures
- `features:boundaries` — eslint plugin: no cross-feature imports
- `api:budget` — discover home ≤ 2 requests (integration test)
- Coverage floor: `features/discover`, `features/events`, `functions/http/events`

---

## 11. Team & ownership (recommended)

| Squad | Owns |
|-------|------|
| **Core** | `platform/*`, `design-system`, auth, location, market |
| **Discovery** | `features/discover`, `features/events`, `features/calendar`, `features/search` |
| **Community** | `features/communities`, `features/city`, `features/explore` |
| **Host** | `features/host`, verification, admin host tools |
| **Commerce** | `features/marketplace`, checkout, Stripe, sync workers |
| **Infra** | functions split, indexes, search, feeds materialization |

---

## 12. Success metrics

| Metric | V1 baseline | V2 target |
|--------|-------------|-----------|
| Discover HTTP calls on open | ~15 | ≤ 2 |
| Discover TTFB (p95) | measure | &lt; 800ms |
| Event list query cost | 1000 doc read cap | cursor + index |
| God files &gt;1000 lines | 10+ | 0 |
| Cross-feature import violations | many | 0 (lint) |
| Host create paths | 2 | 1 (FormWizard) |
| Markets in production | 1 (AU de facto) | 2+ (config-driven) |
| Test coverage `features/*` | ~7% | ≥ 40% critical paths |

---

## 13. Decision log (V2 ADRs to write)

| ADR | Title |
|-----|-------|
| ADR-005 | V2 feature-folder law |
| ADR-006 | Discover BFF `/v2/discover/home` |
| ADR-007 | Shared Zod contracts package |
| ADR-008 | Market config documents |
| ADR-009 | Search index provider |
| ADR-010 | Cloud Functions split strategy |

---

## 14. Quick start for V2 contributors

1. Read this doc + `docs/DESIGN_TOKENS.md`
2. New UI → `features/<domain>/components/`
3. New API call → `features/<domain>/api.ts` only
4. New field → add to `shared/contracts/<entity>.ts` + migration note
5. New colour → `design-system/tokens/` only; run `hex:check`
6. Never import from another feature's `components/` or `hooks/`

---

## 15. Appendix — V1 → V2 file mapping (Discover example)

| V1 | V2 |
|----|-----|
| `src/app/(tabs)/index.tsx` | `src/app/(tabs)/index.tsx` (re-export) |
| | `src/features/discover/screens/DiscoverScreen.tsx` |
| `modules/discover/hooks/useDiscoverData.ts` | `features/discover/hooks/useDiscoverHome.ts` |
| `modules/discover/hooks/useDiscoverQueries.ts` | **Deleted** (server BFF) |
| `components/Discover/*` | `features/discover/components/*` |
| `contexts/LocationContext.tsx` | `platform/location/LocationContext.tsx` |
| `functions/.../discoverDomain.ts` | `functions/domain/discover/buildHomeFeed.ts` |

---

*CulturePass V2 — one product, one architecture, one palette, one field contract. Build the future around the HostSpace you already built.*