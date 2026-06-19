# CulturePass

> **Belong anywhere.**
> Your one-stop lifestyle platform for cultural diaspora communities.

CulturePass is a **B2B2C cultural lifestyle marketplace** connecting diaspora communities worldwide. It bridges users to events, businesses, venues, and communities wherever they live — live since **15 April 2026** on iOS, Android, and Web.

**App version**: `1.3.2` · **Firebase project**: `culturepass-4f264`

---

## What it is

| Surface | Description |
|---------|-------------|
| **Event Discovery** | City, category, culture-tag, and date-filtered event browsing with full-text search |
| **Ticketing** | Stripe-backed purchase, QR ticket wallet, Apple/Google Wallet passes |
| **Community Hub** | Join and manage cultural diaspora communities |
| **Business Directory** | Venues, restaurants, cultural businesses — LGA proximity-filtered |
| **Membership & Perks** | Tier-gated perks, cashback, and rewards redemption |
| **Host Space** | Creator hub for organizers to publish events, manage ticketing, and view analytics |
| **First Nations Spotlight** | Dedicated discovery rail surfacing Indigenous Australian culture |
| **CultureX** | Full-screen curated cultural content surface (hidden from tab bar, reached via in-app nav) |
| **Digital ID** | CPID-based public profiles (`/cpu/[id]`), business pass + lanyard cards, wallet integration |

**Council (LGA)** is a **location attribute only** — used for proximity filtering of events and businesses, not a governance or admin identity.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo `~56.0.9` · React `19.2.3` · React Native `0.85.3` |
| Routing | Expo Router `~56.2.9` (file-based, `src/` directory layout) |
| Animation | Reanimated `4.3.1` (UI-thread worklets) |
| Server state | TanStack Query `5.100.9` (persisted) |
| Backend | Firebase Cloud Functions v2 (Express) · Node.js 22 · TypeScript `6.0.3` |
| Region | **`australia-southeast1`** (Functions, Firestore, Hosting API rewrites) |
| Database | Firestore |
| Payments | Stripe (Stripe Connect for host onboarding + platform-fee splits) |
| Hosting | Firebase Hosting (dual sites — see Deploy) · EAS Build + Submit (native) |
| Auth | Firebase Auth (email, Google, Apple) |
| Analytics | PostHog |

**Node requirement**: `>=22.14.0 <23` (root `package.json` engines). Use `npm install --legacy-peer-deps` for dependency resolution.

---

## Quick start

```bash
# 1. Validate environment
npm run doctor

# 2. Install (both workspaces)
npm install --legacy-peer-deps
cd functions && npm install --legacy-peer-deps && cd ..

# 3. Sync native Firebase config (gitignored — required for native builds)
npm run google:sync

# 4. Start dev servers (run one emulator suite at a time across worktrees)
npm run emulator:start          # functions, firestore, auth, storage
npx expo start --clear          # iOS + Android + Web

# 5. Seed local test org (optional — needs emulators running)
npm run emulator:seed:cap       # "The CAP" org + 5 events
```

### Clean rebuild

For corruption, major upgrades, or new machines, follow [`REBUILD.md`](REBUILD.md): nuclear cleanup → `npm install --legacy-peer-deps` → `npx expo prebuild --clean --platform all` → CocoaPods → web export.

### Quality gates

```bash
npm run lint              # ESLint
npm run typecheck         # TypeScript (no emit)
npm run doctor            # Environment + config validation
npm run qa:solid          # typecheck + lint + hex/colour/truncation checks + unit tests
npm run qa:release        # qa:solid + web bundle size budget
npm run release:check     # doctor + qa:solid
```

`qa:solid` does **not** run E2E or web export. Use `npm run test:e2e` and `npm run build-web` separately before release.

### Environment variables

```bash
# Client — baked into bundle (EXPO_PUBLIC_ prefix required)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_SITE_ORIGIN=https://culturepass.app
EXPO_PUBLIC_API_URL=https://australia-southeast1-culturepass-4f264.cloudfunctions.net/api/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

# Local dev — point at emulator (region must match firebase.json)
EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/australia-southeast1/api/

# Cloud Functions only — NEVER in EXPO_PUBLIC_*
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000    # 10% default
APP_URL=https://culturepass.app
```

Mirror all `EXPO_PUBLIC_*` vars in `eas.json` for EAS builds (`npm run eas:env:push:production`).

**Emulator ports** (from `firebase.json`): UI `4000`, Hosting `5000`, Functions `5001`, Firestore `8080`, Auth `9099`, Storage `9199`. If ports are taken, stop other `firebase emulators:start` processes (including other worktrees).

---

## Architecture

```
src/
  app/              Expo Router — tabs, domain, onboarding, admin, shortlinks
  modules/          Feature modules: discover, events, profile, host, contacts, network…
  components/       Shared UI — Discover rails, calendar, perks, widgets, browse, onboarding
  design-system/    Single source of truth for tokens + M3 atomic UI
    tokens/         theme.ts (master export), colors, typography, spacing, elevation, animations
    ui/             Button, Card, Badge, Input, M3Button, M3Card, GlassView, …
  hooks/            useLayout, useColors, useRole, useCouncil, useNearestCouncil, useLocations, …
  lib/              api.ts (typed client), auth.tsx, feature-flags, analytics, ical, …
  platform/api/     Namespace-factory layer composed into lib/api.ts
  repositories/     ContactsRepository (AsyncStorage), MembershipRepository
  contexts/         OnboardingContext, SavedContext, ContactsContext
  constants/        Data constants (NOT tokens): cities, cultures, categories, navigation…

shared/             TypeScript contract shared with Cloud Functions
  schema/           40+ domain types
  location/         australian-postcodes.ts (canonical — imported by client + functions)

functions/src/
  handlers/         33 domain routers (Express)
  services/         31 Firestore-backed services
  middleware/       auth (requireAuth, requireRole), moderation
  triggers/         Firestore event hooks, image upload, score updates
  jobs/             geohashBackfill, etc.
```

**Functions build output**: `functions/lib/functions/src/index.js` (see `functions/package.json` `"main"`). Do not duplicate shared files under `functions/src/shared/` — import from `shared/` at repo root.

For the full directory map see [`AGENTS.md`](AGENTS.md). For architecture decisions see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Tab layout

| Visible in bottom bar | Hidden (`href=null`) |
|-----------------------|----------------------|
| Discover · Calendar · Community · City · My Space | CultureX · Host · Profile · Directory · Dashboard · Menu |

### Web layout

| Breakpoint | Layout |
|------------|--------|
| Desktop ≥ 1024px | Left sidebar (`WebSidebar.tsx`, 240px expanded / rail collapsed) · `topInset = 0` |
| Tablet 768–1023px | Bottom tab bar · `topInset = 0` |
| Mobile native | Bottom tab bar (49–64px + safe area) · `topInset = insets.top` |

**WebSidebar** (desktop chrome):
- Brand wordmark + gradient accent · theme toggle (light/dark)
- Local time/date + weather (Open-Meteo, default Sydney)
- **Search**: filter nav items inline; **Enter** → `/search?q=…`; **⌘K / Ctrl+K** focuses search
- Collapsible rail (persisted in `localStorage`)
- Council card → `/my-council` (from `useCouncil`)
- Role-aware nav: attendee, host hub, venue/sponsor dashboards, admin/superadmin sections
- Profile menu (edit, digital ID, network, wallet) with outside-click + route-change close
- Footer ack (collapsible) + social links

```ts
// Recommended safe-area helper on web
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
const insets = useSafeAreaInsetsWeb();
const topInset = insets.top;
```

### Auth screens (login / signup)

Onboarding auth uses variant palettes from `src/components/onboarding/authScreenTheme.ts`:

| Variant | Accent | Role |
|---------|--------|------|
| `login` | App blue `#009EDB` | Returning users |
| `signup` | Pass green `#00A651` | New accounts |
| `host` | Culture red `#f80020` | Host application entry |

`AuthAmbientBackground` and `AuthWebMarketingPanel` consume the palette; marketing split-panel layout on web.

---

## Design system

All tokens import from `@/design-system/tokens/theme` — **never** from `@/constants/theme`.

```ts
import {
  Colors, TextStyles, Elevation, Spacing, Radius,
  ButtonTokens, CardTokens, InputTokens, AvatarTokens,
  TabBarTokens, ChipTokens, HeaderTokens, ZIndex, IconSize,
  LiquidGlassTokens, LiquidGlassAccents, MaterialExpressive,
  SignatureGradient, CultureTokens, gradients, glass, neon,
} from '@/design-system/tokens/theme';
```

### Brand colors (2026)

**Wordmark palette** (canonical — `CulturePassWordmark` / WebSidebar header). See `docs/DESIGN_TOKENS.md`.

| Token | Hex | Wordmark | Role |
|-------|-----|----------|------|
| `CultureTokens.cultureRed` | `#f80020` | Culture | Heritage emphasis |
| `CultureTokens.passGreen` | `#00A651` | Pass | Belonging, community |
| `CultureTokens.appBlue` | `#009EDB` | .App | Primary chrome, active nav, links |

**Platform UI**

| Token | Hex | Role |
|-------|-----|------|
| `CultureTokens.indigo` | `#4F46E5` | M3 primary, trust |
| `CultureTokens.violet` | `#9333EA` | Community rails |
| `CultureTokens.coral` | `#FF5E5B` | Movement CTA |
| `CultureTokens.teal` | `#0D9488` | Venues, belonging |
| `BRAND_CYAN` | `#00ADEF` | Digital ID, wallet passes |

**`SignatureGradient`** (`gradients.culturepassBrand`): culture red `#f80020` → app blue `#009EDB`. Max one per screen (hero/onboarding/flagship CTA).

**Deprecated:** terracotta `#E36A4E`, saffron gold — do not use.

### Radius scale

`Radius.xs` 6 · `sm` 10 · `md` 16 · `lg` 20 · `xl` 24 · `full` 9999

### M3 component set

| Component | Purpose |
|-----------|---------|
| `M3TopAppBar` | Screen app bars with back/action buttons |
| `M3Button` | Filled / tonal / outlined / elevated / text |
| `M3FilterChip` | Selectable filter pills |
| `M3SectionHeader` | Section title + "See all" action |
| `M3Card` | Elevated / filled / outlined card surfaces |
| `M3FAB` | Floating action button |
| `M3NavigationRail` | Tablet vertical nav (≥ 768px) |
| `GlassView` | Platform glass: `BlurView` (iOS), solid elevated (Android), `backdrop-filter` (web) |

> Use `useM3Colors()` for M3 components. Do not mix `useColors()` and `useM3Colors()` in the same component.

### Event card text

Use `TextStyles.eventCardTitle` / `TextStyles.eventCardDate` with `useColors().eventDate` (light UI) or `useColors().eventDateOnMedia` (text on dark hero images). Never use gold/yellow for event dates or primary card labels.

### Event detail info document

Every event detail page renders **`EventInfoDocument`** with ticketing-style fields:

- **Organised by** (publisher / host name, links to community when applicable)
- **Contact Organiser** (in-app enquiry or email fallback)
- **Date And Time** — long range with timezone, e.g. `Sunday, 23 Aug @ 11:00 AM (AEST) - Sunday, 23 Aug @ 09:00 PM (AEST)`
- **Location** — street-first address line
- **Event Types** / **Event Category**
- **Add to Calendar** (ICS on web, native calendar on device)
- **Share With Friends** — Copy Link, Facebook, Twitter, LinkedIn, Pinterest

Desktop: right sidebar. Mobile: panel below hero. Full spec: [`docs/EVENT_DETAIL_UI.md`](docs/EVENT_DETAIL_UI.md). Fallbacks: `src/lib/presentation.ts`.

---

## Engineering rules

### Never
- Use `any` — use `Record<string, unknown>` or schema types from `shared/`
- Write raw `<Pressable>` for buttons — use `<Button>`
- Call `useAuth()` or `useColors()` outside a React component
- Use `AsyncStorage` directly — use `src/lib/storage.ts`
- Import `@sentry` — Sentry is removed; use `console.error` + `captureRouteError`
- Hardcode hex values — use design tokens
- Use `console.log` in production code — guard with `if (__DEV__)`
- Duplicate shared types under `functions/src/shared/` — use root `shared/`

### Always
- Truncate long copy in cards, tables, and list rows — use `TruncatedText` or `numberOfLines` (see `docs/FIXES-001-layout-deformities.md`)
- Call the backend through `api.*` from `src/lib/api.ts` — the only HTTP entry point
- Import images via `expo-image` for caching and glass-aware skeletons
- Wrap async-data screens with `<ErrorBoundary>`
- Handle 401s with `ApiError.isUnauthorized()`
- Add `accessibilityLabel` to every interactive element
- Test on iOS, Android, and Web before opening a PR
- Use lowercase route folders (`cpu/`, not `CPU/`) — Linux/Firebase Hosting is case-sensitive

### API namespace pattern

```ts
// All calls go through namespaced methods on the api object
api.events.list({ city, category, page })
api.auth.me()
api.tickets.scan({ qrCode })
api.council.nearest({ latitude, longitude, city, state })
api.council.list()
api.indigenous.spotlight()
api.perks.list()
api.membership.get()
```

### Feature flags

EventCard rendering is flag-gated via `useFlagOverride('eventcard-v2')` in `src/modules/events/components/EventCard.tsx`. Defaults to `EventCardV1`; flipping the flag enables `EventCardV2` (Mode-C visual layer, same props). Flag plumbing: `src/lib/feature-flags.ts`.

---

## Creation flows

CulturePass has **three creation tiers** — pick the right surface for the entity type.

| Tier | Surface | Best for |
|------|---------|----------|
| **Org & community form** | `OrganisationCommunityCreateForm` (`/hostspace/create/page`) | **One form** for all 9 org types — category **dropdown** + full page fields |
| **Profile wizard** | `FormWizard` (`/hostspace/create/[category]`) | Rich entities: venue, business, artist, organiser — drafts, auto-save, Layer 2 verification |
| **Embedded create forms** | `HostspaceCreateHub` (`/hostspace/create`) | Quick-publish: events, activities, offers, CultureMarket listings |
| **Intake / submit** | `SubmitCard` + `SubmitField` (`src/components/submit/`) | Lightweight public submissions |

### Entry points

```
/hostspace/create              Creation Lab catalog (category grid)
/hostspace/create/[category]   FormWizard for profile entities
/hostspace/event/create        Full event wizard
/create/:type                  Legacy redirect → Creation Lab or wizard
```

Gated by `HostspaceAccessGate` (organizer role or application in progress).

### Reusable form kit (`src/components/forms/`)

Shared primitives for HostSpace embedded create forms — **one implementation, dark-mode aware**:

| Component | Purpose |
|-----------|---------|
| `CreateFormSection` | Icon + title section card (Muji palette) |
| `CreateFormField` | Label, required asterisk, hint, error |
| `CreateFormInput` | Themed `TextInput` |
| `CreateFormDraftInput` | Bound string field with a11y label |
| `CreateChoiceChip` | Single/multi-select chip |
| `CreateFormChipGrid` | Wrapping chip layout |
| `CreateFormTwoCol` | Responsive two-column grid (web) |
| `useCreateFormTheme()` | Light Muji + dark mode token merge |

**Consumers**: `HostspaceEventCreateForm`, `HostspaceActivityCreateForm`, `HostspaceOfferCreateForm`, `HostspaceCommunityCreateForm`.

**Also exported** as aliases: `Section`, `Field`, `FormField`, `FormInput`, `DraftInput`, `ChoiceChip` from `@/components/forms`.

For auth/onboarding and general app chrome, use `Input` from `@/design-system/ui/Input` (indigo focus ring). For public intake cards, use `SubmitField` from `@/components/submit/FormPrimitives`.

### ADR-001 (host creation unification)

Rich profile creation is consolidating on **FormWizard**. Lighter embedded forms remain for events, offers, activities, and marketplace listings. Legacy dedicated community form shows a deprecation banner linking to the wizard.

---

## Location, GeoHash & Council (LGA)

**Slice 2** (completed — see `docs/SLICE2-GEOHASH-NEAREST-COUNCIL.md`):

| Capability | Implementation |
|------------|----------------|
| GeoHash on write | `functions/src/triggers.ts` auto-computes when lat/lng present |
| GeoHash backfill | `POST /api/admin/jobs/geohash-backfill` (admin UI in `admin/platform.tsx`) |
| Nearest council | `GET /api/council/nearest` — coordinate haversine + city/state fallback |
| Client hook | `useNearestCouncil` → `api.council.nearest()` |
| Onboarding | `location.tsx` — "Detect my council" wired to GPS + API |
| Host creation | `LocationField.tsx` — nearest council assist |

Response shape includes `distanceKm`, `matchMethod` (`coordinate` \| `city-state` \| `none`), and confidence scoring.

Australian postcode lookup lives in `shared/location/australian-postcodes.ts` (single canonical copy).

---

## Build and deploy

**Deploy order**: Cloud Functions **before** the client app when API contracts change.

### iOS

```bash
npm run build:ios:production
npm run submit:ios:production
```

Bundle ID: `au.culturepass.app`

### Android

```bash
npm run build:android:production
npm run submit:android:production
```

Package: `au.culturepass.app`

### OTA updates (Expo Updates)

```bash
npm run update:preview        # preview channel
npm run update:production     # production channel
```

### Web (Firebase Hosting)

Project `culturepass-4f264` has **two hosting sites** (same `dist/` build):

| Site ID | Default URL | Role |
|---------|-------------|------|
| `culturepass` | **https://culturepass.web.app** | Primary branded hosting |
| `culturepass-4f264` | https://culturepass-4f264.web.app | Legacy / project-default site |

Custom domain **https://culturepass.app** (and `www`) points at the primary site. Both sites share identical headers, CSP, and `/api/**` rewrites to `api` in `australia-southeast1`.

```bash
npm run deploy-web            # assert env → expo export → deploy BOTH hosting sites
npx firebase-tools deploy --only hosting:culturepass   # primary site only
```

`predeploy-web` runs `scripts/assert-firebase-web-export.mjs` — production Firebase env required. For CI-only throwaway exports: `npm run build-web:with-mock-firebase`.

Web export produces ~240+ static routes into `dist/`.

### Full Firebase deploy (Functions + Hosting + rules/indexes)

```bash
npm run deploy                # build-web + firebase deploy (all targets)
npm run deploy:guarded        # qa:solid → deploy
npm run deploy-functions      # functions only
```

Requires production `EXPO_PUBLIC_FIREBASE_*` in `.env`. See [`CLAUDE.md`](CLAUDE.md) for the full client vs. secrets split.

**Auth/OAuth**: If both hosting URLs stay live, register **both** `culturepass.web.app` and `culturepass-4f264.web.app` (plus `culturepass.app`) in Firebase Auth authorized domains and Google/Apple OAuth consoles.

**Monorepo note**: Do not run `git init` inside `functions/` — it belongs to this repo only.

---

## Payments (Stripe)

1. Client calls `POST /api/events/:id/checkout`
2. App opens Stripe-hosted URL via `WebBrowser`
3. Webhook `checkout.session.completed` marks ticket `paid`, increments `attending`
4. **Stripe Connect**: host onboarding + platform-fee splits — default 10% (`STRIPE_CONNECT_PLATFORM_FEE_BPS=1000`)

---

## Firestore data model (summary)

```
users/{uid}           username, displayName, city, role, membership.tier, lgaCode?, culturePassId
events/{eventId}      title, date, city, category, cultureTag[], priceCents, tiers[],
                      entryType, organizerId, status, geoHash, lat/lng, lgaCode?
tickets/{ticketId}    eventId, userId, status, paymentStatus, qrCode, cpTicketId
profiles/{profileId}  entityType (community|business|venue|artist|organisation),
                      ownerId, isVerified, lgaCode?
councils/{lgaCode}    name, suburb, state, latitude/longitude — seeded from AllCouncilsList.csv
```

Full schema: `shared/schema/`.

---

## Roadmap (post-launch, June 2026)

**In progress:**
- Phase 0 Foundations — DX (`doctor`), documentation alignment, governance

**Completed (recent):**
- Android polish round (`removeClippedSubviews` + image-URI normalization)
- **Slice 2**: GeoHash backfill + council LGA auto-select (`GET /api/council/nearest`) + onboarding wiring
- Web sidebar UX — search, ⌘K, collapsible rail, council card, a11y
- Auth screen colour theming (login blue / signup green / host red)
- Dual Firebase Hosting sites (`culturepass.web.app` + legacy)
- Shared location canonical path (`shared/location/australian-postcodes.ts`)
- Functions region consolidation to `australia-southeast1`

**Near-term:**
- [ ] Promotional code system (`promoCodes/` collection + checkout validation)
- [ ] Organizer event analytics dashboard (`dashboard/event-analytics/[eventId]`)
- [ ] Organizer attendee messaging (FCM multicast + email queue)
- [ ] Tiered perk gates (lock overlay + server-side 403 on `/api/perks/:id/redeem`)
- [ ] Rewards points redemption UI (Perks tab balance chip + checkout toggle)
- [ ] Push notification deep links + per-category opt-out
- [ ] Community posts (`communities/{id}/posts/`, feature-flagged)
- [ ] Wallet top-up + Apple/Google Pay UI
- [ ] Server-side `calendar/city.ics` subscription endpoint (currently client-only)
- [ ] Expand city groupings on onboarding (NZ, UAE, UK, CA, and beyond)
- [ ] Scheduled geoHash backfill (Cloud Scheduler)
- [ ] Firebase DataConnect migration (exploratory)

---

## Documentation

| Document | Description |
|----------|-------------|
| [`AGENTS.md`](AGENTS.md) | Master engineer reference — architecture, data models, all API patterns |
| [`CLAUDE.md`](CLAUDE.md) | AI agent quickstart — coding rules, token imports, layout rules |
| [`culturepass-rules.md`](culturepass-rules.md) | NEVER/ALWAYS list, event card rules, API patterns |
| [`REBUILD.md`](REBUILD.md) | Nuclear cleanup + clean install + prebuild recovery |
| [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) | Five core design laws |
| [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md) | Authoritative 2026 hex/component reference |
| [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) | Brand voice, color roles, typography, navigation |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design deep-dive |
| [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | REST endpoint reference |
| [`docs/ROUTE_API_MATRIX.md`](docs/ROUTE_API_MATRIX.md) | Routes ↔ API mapping |
| [`docs/URL_STRUCTURE.md`](docs/URL_STRUCTURE.md) | Canonical URLs and deep links |
| [`docs/SLICE2-GEOHASH-NEAREST-COUNCIL.md`](docs/SLICE2-GEOHASH-NEAREST-COUNCIL.md) | GeoHash + nearest council implementation |
| [`docs/STORE_SUBMISSION.md`](docs/STORE_SUBMISSION.md) | EAS setup, build/submit commands, App Store Connect |
| [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) | Version history |
| [`docs/security-roles.md`](docs/security-roles.md) | Role-to-permission mapping |
| [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) | Maintenance guardrails |

---

## Platform coverage

| Platform | Distribution | Primary URL / ID | Status |
|----------|-------------|----------------|--------|
| iOS | App Store via EAS Build | `au.culturepass.app` | Live |
| Android | Google Play via EAS Build | `au.culturepass.app` | Live |
| Web | Firebase Hosting | https://culturepass.app · https://culturepass.web.app | Live |

---

## License

Private — all rights reserved.