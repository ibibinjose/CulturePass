# CulturePass Architecture (Expo + Firebase)

> **Last updated**: 2026-05-08
> **Stack**: Expo 55 · React Native 0.83 · Expo Router 5 · Reanimated 4 · Firebase 11

---

## Product Identity

CulturePass is a **B2B2C cultural lifestyle marketplace** — not a government portal.

- **Users** discover events, join communities, earn perks
- **Organisers/Businesses** list events, manage tickets, grow audiences
- **Council (LGA)** is a **location attribute** for proximity services only

The app targets diaspora communities worldwide — any city, any culture.

---

## Runtime Targets

Single codebase via Expo + React Native:

| Platform | Distribution | Build |
|----------|-------------|-------|
| iOS | App Store (`au.culturepass.app`) | EAS Build |
| Android | Google Play | EAS Build |
| Web | Firebase Hosting | `expo export --platform web` |

---

## System Layers

### 1) Presentation Layer

- `app/` — Expo Router file-based screens
- `components/` — reusable UI building blocks
- `src/design-system/tokens/theme.ts` — **SINGLE IMPORT POINT** for all design tokens
- `hooks/useColors.ts` — theme-aware color access (dark default on native, light on web)
- `hooks/useLayout.ts` — responsive layout: `isDesktop`, `hPad`, `width`, `sidebarWidth`, `columnWidth()`

#### Tab Navigation (5 tabs)
```
Discover  →  app/(tabs)/index.tsx
Calendar  →  app/(tabs)/calendar.tsx
Community →  app/(tabs)/community.tsx
Perks     →  app/(tabs)/perks.tsx
Profile   →  app/(tabs)/profile.tsx
```
Additional tab-group screens: `directory.tsx`, `explore.tsx`

#### Key Screens
```
app/events.tsx              All Events page — single-line filter bar (category + date + price)
app/(tabs)/explore.tsx      Explore — category pills + 2-column event grid (pixel-width columns)
app/(tabs)/directory.tsx    Directory — All/Events/Indigenous/Businesses/Venues/Organisations/Councils/Government/Charities
app/event/[id].tsx          Event detail + ticket purchase
app/event/create.tsx        9-step event creation wizard
app/admin/dashboard.tsx     Admin panel — users, audit logs, notifications
app/dashboard/organizer.tsx Organizer dashboard
```

#### Web Desktop Layout
- **Left sidebar**: `components/web/WebSidebar.tsx` (240px fixed)
- **No top bar** — sidebar replaces old 64px top nav
- **Top inset**: always `0` on web: `const topInset = Platform.OS === 'web' ? 0 : insets.top`

#### Design Token System

All tokens export from `@/design-system/tokens/theme`:

```typescript
import { CultureTokens, ButtonTokens, CardTokens, InputTokens, gradients, SignatureGradient } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';

CultureTokens.indigo   // #4F46E5 — primary brand
CultureTokens.violet   // #9333EA — active nav, gradient start
CultureTokens.coral    // #FF5E5B — movement / action
CultureTokens.gold     // #FFC857 — premium chrome (not body/datetime text)
CultureTokens.teal     // #0D9488 — belonging, venues

SignatureGradient      // violet → coral — hero / onboarding (max one per screen)
gradients.culturepassBrand  // same as SignatureGradient
```

**Never hardcode hex values.** Use `useColors()` for theme-aware values.

---

### 2) Client State + Session Layer

| Concern | Solution |
|---------|----------|
| Server data | TanStack React Query (`useQuery`, `useMutation`) |
| Auth state | `lib/auth.tsx` → `useAuth()` |
| Onboarding | `contexts/OnboardingContext` (city, country, interests, isComplete) |
| Saved items | `contexts/SavedContext` |
| Contacts | `contexts/ContactsContext` |
| UI state | `useState` / `useReducer` local to component |

---

### 3) Data Access Layer

- `lib/api.ts` — **ONLY** way to call backend (150+ typed endpoints, namespace pattern)
- `lib/query-client.ts` — TanStack React Query setup + `apiRequest()` transport
- `shared/schema.ts` — shared client/server TypeScript contracts (master re-export)
- `shared/schema/` — domain schemas: event, user, ticket, profile, notification, perk, wallet, social, media, moderation

```typescript
// Always use api.* — never raw fetch()
import { api, ApiError } from '@/lib/api';

const { data } = useQuery({
  queryKey: ['/api/events', city, country],
  queryFn: () => api.events.list({ city, country, pageSize: 50 }),
});
```

---

### 4) Backend Layer

- `functions/src/app.ts` — Express app (150+ routes, 6500+ lines)
- `functions/src/middleware/auth.ts` — Firebase ID token verification + role guards
- `functions/src/middleware/moderation.ts` — content moderation
- `functions/src/services/firestore.ts` — typed Firestore services
- `functions/src/services/search.ts` — weighted full-text + trigram search
- `functions/src/services/cache.ts` — in-memory TTL cache (60s default)
- `functions/src/services/rollout.ts` — feature flag phased rollout

---

## Auth + Request Flow

```
1. Firebase Auth (email/Google/Apple) → ID token
2. onAuthStateChanged in lib/auth.tsx → token stored via setAccessToken()
3. Every apiRequest() → Authorization: Bearer <idToken>
4. Functions middleware → verifyIdToken() → req.user = { uid, email, role }
5. Token auto-refreshed every 50 minutes
```

---

## Firestore Data Model

```
users/{uid}
  username, displayName, email, city, country
  role: 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin'
  membership: { tier: 'free'|'plus'|'elite', expiresAt }
  stripeCustomerId, stripeSubscriptionId
  isSydneyVerified, interests[], culturePassId (CP-USR-xxx)
  lgaCode?           ← user's local government area (location service)

events/{eventId}
  title, description, venue, address, date, time, endDate?, endTime?
  city, country, imageUrl, heroImageUrl?
  cultureTag[], tags[], category
  entryType: 'ticketed' | 'free'
  priceCents, tiers[], isFree, isFeatured
  artists?: EventArtist[]       ← performers (name, role, bio, imageUrl)
  eventSponsors?: EventSponsor[] ← sponsors with tier (gold/silver/bronze)
  hostInfo?: EventHostInfo       ← host contact details
  organizerId, capacity, attending
  lgaCode?           ← council LGA for proximity matching
  councilId?         ← linked council record
  status: 'draft' | 'published' | 'cancelled'
  cpid (CP-EVT-xxx), geoHash, deletedAt (soft delete)

tickets/{ticketId}
  eventId, userId, tierName, quantity
  totalPriceCents, priceCents
  status: 'pending' | 'confirmed' | 'cancelled' | 'used'
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed'
  qrCode, cpTicketId (CP-TKT-xxx)
  cashbackCents, rewardPoints
  stripeSessionId?, stripePaymentIntentId?
  history[]: { at, status, note? }

profiles/{profileId}
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation'
  name, description, imageUrl, city, country
  ownerId, isVerified, rating
  lgaCode?           ← council LGA for location services
  socialLinks: { website, instagram, facebook, twitter }

councils/{councilId}
  name, suburb, state, lgaCode, country
  websiteUrl?, phone?, addressLine1?
  verificationStatus: 'verified' | 'unverified'
  description?
  ← ~1000 AU LGAs seeded from functions/src/data/AllCouncilsList.csv
```

---

## Council as Location Service

Council (LGA) is a **location attribute** in CulturePass — never a governance identity.

### Where council data appears
1. **Directory** (`app/(tabs)/directory.tsx`) — browsable Council filter chip; council records from `api.council.list` merged into directory profiles
2. **Discover** (`app/(tabs)/index.tsx`) — "Events in Your Area" rail filters events by user's `lgaCode`
3. **Calendar** (`app/(tabs)/calendar.tsx`) — civic reminders tagged with council context
4. **Admin** (`app/admin/dashboard.tsx`) — council data management via admin panel (no dedicated council page)

### API surface (kept, UI governance screens removed)
```typescript
api.council.list({ pageSize, sortBy, q, state })   // Directory + admin
api.council.getSelected()                           // User's saved LGA
api.council.select(councilId)                       // Set user's LGA
```

### Removed (2026-03)
- `app/(tabs)/council.tsx` — council tab
- `app/council/[id].tsx` — council detail
- `app/council/claim.tsx` — claim flow
- `app/council/select.tsx` — selection screen
- `app/dashboard/council.tsx` — council ops dashboard
- `app/admin/council-management.tsx` — admin UI
- `app/admin/council-claims.tsx` — claims admin

---

## Event Creation Wizard (9 Steps)

`app/event/create.tsx` — conditional step flow:

```
Step 1: Basics       (title, description, category)
Step 2: Image        (hero image upload → Firebase Storage temp path)
Step 3: Location     (venue, address, city, country)
Step 4: Date & Time  (start date/time, end date/time, locale-aware format)
Step 5: Entry Type   (ticketed vs free — toggles step 6)
Step 6: Tickets      [only if ticketed] (multi-tier builder, price, capacity)
Step 7: Core Team    (artists/performers, sponsors with tiers, host info)
Step 8: Culture      (culture tags, additional tags)
Step 9: Review       → SuccessScreen on submit
```

---

## Responsive Layout Patterns

```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, width, sidebarWidth } = useLayout();

// 2-column grid (Explore page) — explicit pixel widths, not percentages:
const colGap = 12;
const gridCols = isDesktop ? 4 : 2;
const colWidth = Math.floor((width - hPad * 2 - colGap * (gridCols - 1)) / gridCols);
```

**Never use percentage strings** (`width: '50%'`) in flex layouts with `gap` — use explicit pixel widths.

---

## Scalability + Performance

- Centralized config validation in `lib/config.ts`
- API URL normalization to prevent `/api/api/...` duplication
- Firestore-backed persistence: wallets, notifications, perks, tickets, reports, media
- Query retry policy: no retry on 4xx, exponential back-off on 5xx
- In-memory TTL cache for high-frequency read paths
- React Compiler enabled (`babel-plugin-react-compiler`) — avoid manual memoization unless profiling shows need
- `expo-image` for all image rendering — disk cache + transition animations
- `FlatList` with `getItemLayout` + `removeClippedSubviews` for event rails

---

## Current Feature Surface

| Feature | Status |
|---------|--------|
| Discover (events, communities, indigenous) | ✅ |
| Events page (all events, single-line filter) | ✅ |
| Explore (category grid, 2-col mobile layout) | ✅ |
| Directory (All/Events/Indigenous/Business/Venue/Org/Council/Gov/Charity) | ✅ |
| Event detail + ticket purchase | ✅ |
| Event creation wizard (9 steps) | ✅ |
| Calendar (month view, event dots, civic reminders) | ✅ |
| Communities | ✅ |
| Perks + redemption | ✅ |
| Profile + membership tiers | ✅ |
| Stripe payment + webhook | ✅ |
| Push notifications (FCM) | ✅ |
| QR ticket scanner | ✅ |
| Admin dashboard | ✅ |
| Organizer dashboard | ✅ |
| Web desktop layout (sidebar) | ✅ |
| Council as LGA location service | ✅ |
| Geolocation geoHash queries | ⏳ stored, not queried |
| Algolia full-text search | ⏳ planned |
| Firebase DataConnect (GraphQL) | ⏳ exploratory |

---

## Recommended Next Scalability Upgrades

1. **Firestore composite indexes** — add indexes for `[city, date, status]` and `[lgaCode, date]` event queries
2. **Geolocation geoHash queries** — implement Firestore geo queries using stored `geoHash` field
3. **Algolia** — index events + profiles for full-text search with cultural tag facets
4. **Council LGA auto-detect** — derive `lgaCode` from user GPS coordinates on onboarding
5. **Route-level Zod validation** — validate all write endpoint payloads with Zod schemas
6. **Playwright E2E** — web-focused end-to-end tests for critical paths (checkout, event creation)
7. **Sentry performance traces** — structured telemetry on API latency + screen render times
8. **Split large route screens** — event detail, event creation into feature sub-modules
