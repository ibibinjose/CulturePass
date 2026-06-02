# CulturePass

> **Belong anywhere.**
> Your one-stop lifestyle platform for cultural diaspora communities.

CulturePass is a **B2B2C cultural lifestyle marketplace** connecting diaspora communities worldwide. It bridges users to events, businesses, venues, and communities wherever they live — live since **15 April 2026** on iOS, Android, and Web.

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

**Council (LGA)** is a **location attribute only** — used for proximity filtering of events and businesses, not a governance or admin identity.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo `^55.0.15` · React `19.2.0` · React Native `0.83.4` |
| Routing | Expo Router `~55.0.12` (file-based, `src/` directory layout) |
| Animation | Reanimated `4.2.1` (UI-thread worklets) |
| Server state | TanStack Query `^5.99.0` |
| Backend | Firebase Cloud Functions (Express) · Node.js 22 · TypeScript |
| Database | Firestore |
| Payments | Stripe (Stripe Connect for host onboarding + platform-fee splits) |
| Hosting | Firebase Hosting (web) · EAS Build + Submit (native) |
| Auth | Firebase Auth (email, Google, Apple) |

---

## Quick start

```bash
# 1. Install
npm install
cd functions && npm install && cd ..

# 2. Start dev servers
npx expo start                    # iOS + Android + Web
firebase emulators:start --only functions,firestore,auth,storage

# 3. Seed local test org (optional — needs emulators running)
npm run emulator:seed:cap         # Creates "The CAP" org + 5 events in emulator
```

### Quality gates

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript (no emit)
npm run qa:solid      # Full gate: lint + typecheck + unit/integration/e2e + Functions build + web export + route hygiene
npm run qa:all        # Unit + integration + E2E smoke (skips Functions build + export)
```

### Environment variables

```bash
# Client — baked into bundle (prefix required)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=https://us-central1-culturepass-4f264.cloudfunctions.net/api/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

# Local dev — point at emulator
EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/

# Cloud Functions only — NEVER in EXPO_PUBLIC_*
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000    # 10% default
APP_URL=https://culturepass.app
```

Mirror all `EXPO_PUBLIC_*` vars in `eas.json` for EAS builds.

---

## Architecture

```
src/
  app/              Expo Router — tabs, domain, onboarding, admin, shortlinks
  modules/          Feature modules: discover, events, profile, host, contacts, network…
  components/       Shared UI — Discover rails, calendar, perks, widgets, browse
  design-system/    Single source of truth for tokens + M3 atomic UI
    tokens/         theme.ts (master export), colors, typography, spacing, elevation, animations
    ui/             Button, Card, Badge, Input, M3Button, M3Card, GlassView, …
  hooks/            useLayout, useColors, useRole, useCouncil, useLocations, …
  lib/              api.ts (typed client), auth.tsx, feature-flags, analytics, ical, …
  platform/api/     Namespace-factory layer composed into lib/api.ts
  repositories/     ContactsRepository (AsyncStorage), MembershipRepository
  contexts/         OnboardingContext, SavedContext, ContactsContext
  constants/        Data constants (NOT tokens): cities, cultures, categories, …

shared/             TypeScript types shared with Cloud Functions
functions/src/
  handlers/         33 domain routers (Express)
  services/         31 Firestore-backed services
  middleware/       auth (requireAuth, requireRole), moderation
  triggers/         Firestore event hooks, image upload, score updates
```

For the full directory map see [`AGENTS.md`](AGENTS.md). For architecture decisions see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Tab layout

| Visible in bottom bar | Hidden (`href=null`) |
|-----------------------|----------------------|
| Discover · Calendar · Community · City · My Space | CultureX · Host · Profile · Directory · Dashboard · Menu |

### Web layout

| Breakpoint | Layout |
|------------|--------|
| Desktop ≥ 1024px | 240px left sidebar (`WebSidebar.tsx`) with theme toggle, local time/date, and weather chrome; `topInset = 0` |
| Tablet 768–1023px | Bottom tab bar, `topInset = 0` |
| Mobile native | Bottom tab bar standard (49-64px + safe area), `topInset = insets.top` |

```ts
// Recommended
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
const insets = useSafeAreaInsetsWeb();
const topInset = insets.top;
```

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

| Token | Hex | Role |
|-------|-----|------|
| `CultureTokens.indigo` | `#4F46E5` | Primary brand — trust, platform identity |
| `CultureTokens.violet` | `#9333EA` | Active nav, gradient start, community |
| `CultureTokens.coral` | `#FF5E5B` | Action, movement, CTA |
| `CultureTokens.gold` | `#FFC857` | Brand warmth — gradient/membership chrome only, **not readable text** |
| `CultureTokens.teal` | `#0D9488` | Venues, free/live accents, global belonging |

**`SignatureGradient`** (alias `gradients.culturepassBrand`): violet `#9333EA` → coral `#FF5E5B`. Reserve for hero/onboarding/flagship CTAs — **max one per screen**.

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

### Always
- Call the backend through `api.*` from `src/lib/api.ts` — the only HTTP entry point
- Import images via `expo-image` for caching and glass-aware skeletons
- Wrap async-data screens with `<ErrorBoundary>`
- Handle 401s with `ApiError.isUnauthorized()`
- Add `accessibilityLabel` to every interactive element
- Test on iOS, Android, and Web before opening a PR

### API namespace pattern

```ts
// All calls go through namespaced methods on the api object
api.events.list({ city, category, page })
api.auth.me()
api.tickets.scan({ qrCode })
api.council.list()
api.indigenous.spotlight()
api.perks.list()
api.membership.get()
```

### Feature flags

EventCard rendering is flag-gated via `useFlagOverride('eventcard-v2')` in `src/modules/events/components/EventCard.tsx`. Defaults to `EventCardV1`; flipping the flag enables `EventCardV2` (Mode-C visual layer, same props). Flag plumbing: `src/lib/feature-flags.ts`.

---

## Build and deploy

**Deploy order**: Cloud Functions **before** the client app when API contracts change.

### iOS

```bash
npm run build:ios:production
npm run submit:ios:production
```

### Android

```bash
npm run build:android:production
npm run submit:android:production
```

### OTA updates (Expo Updates)

```bash
npm run update:preview        # preview channel
npm run update:production     # production channel
```

### Web (Firebase Hosting)

```bash
npm run deploy-web            # expo export → dist/ + firebase deploy --only hosting
```

### Full Firebase deploy (Functions + Hosting + rules/indexes)

```bash
npm run deploy                # typecheck → Functions build → web export → firebase deploy
npm run deploy:guarded        # qa:solid → backup commit → push → deploy functions + hosting
```

Requires production `EXPO_PUBLIC_FIREBASE_*` in `.env`. See [`CLAUDE.md`](CLAUDE.md) for the full client vs. secrets split.

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
users/{uid}           username, displayName, city, role, membership.tier, lgaCode?
events/{eventId}      title, date, city, category, cultureTag[], priceCents, tiers[],
                      entryType, organizerId, status, geoHash, lat/lng, lgaCode?
tickets/{ticketId}    eventId, userId, status, paymentStatus, qrCode, cpTicketId
profiles/{profileId}  entityType (community|business|venue|artist|organisation),
                      ownerId, isVerified, lgaCode?
councils/{councilId}  name, suburb, state, lgaCode — seeded from AllCouncilsList.csv
```

---

## Roadmap (post-launch, May–June 2026)

**In progress:**
- None (Phase 1 completed)

**Completed:**
- Android polish round (`removeClippedSubviews` + image-URI normalization)
- GeoHash backfill — geocode events missing `latitude` / `longitude` / `geoHash`
- Council LGA auto-select from GPS on onboarding (`/api/councils/nearest`)

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
- [ ] Firebase DataConnect migration (exploratory)

---

## Documentation

| Document | Description |
|----------|-------------|
| [`AGENTS.md`](AGENTS.md) | Master engineer reference — architecture, data models, all API patterns |
| [`CLAUDE.md`](CLAUDE.md) | AI agent quickstart — coding rules, token imports, layout rules |
| [`culturepass-rules.md`](culturepass-rules.md) | NEVER/ALWAYS list, event card rules, API patterns |
| [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) | Five core design laws |
| [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md) | Authoritative 2026 hex/component reference |
| [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) | Brand voice, color roles, typography, navigation |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design deep-dive |
| [`docs/API_ENDPOINTS.md`](docs/API_ENDPOINTS.md) | REST endpoint reference |
| [`docs/ROUTE_API_MATRIX.md`](docs/ROUTE_API_MATRIX.md) | Routes ↔ API mapping |
| [`docs/URL_STRUCTURE.md`](docs/URL_STRUCTURE.md) | Canonical URLs and deep links |
| [`docs/STORE_SUBMISSION.md`](docs/STORE_SUBMISSION.md) | EAS setup, build/submit commands, App Store Connect, troubleshooting |
| [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) | Version history |
| [`docs/security-roles.md`](docs/security-roles.md) | Role-to-permission mapping |
| [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md) | Maintenance guardrails |

---

## Platform coverage

| Platform | Distribution | Status |
|----------|-------------|--------|
| iOS | App Store via EAS Build | Live |
| Android | Google Play via EAS Build | Live |
| Web | Firebase Hosting | Live |

---

## License

Private — all rights reserved.
