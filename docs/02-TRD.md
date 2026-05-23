# 02 — Technical Requirements Document (TRD)

> **Version**: 2.0 — May 2026
> **Status**: Live — v1.1.0
> **Audience**: Engineering, DevOps, Technical Investors
> **Related**: [01-PRD](01-PRD.md) · [05-BACKEND_SCHEMA](05-BACKEND_SCHEMA.md) · [AGENTS.md](../AGENTS.md) · [ARCHITECTURE](ARCHITECTURE.md)

---

## 1. Tech Stack (Current — Production)

### Frontend / App

| Layer | Technology | Version |
|---|---|---|
| Framework | Expo | `^55.0.15` |
| Language | TypeScript | 5.x |
| UI Runtime | React Native | `0.83.4` |
| Web Runtime | React | `19.2.0` |
| Router | Expo Router | `~55.0.12` |
| Animation | Reanimated | `4.2.1` |
| State — Server | TanStack React Query | `^5.99.0` |
| State — Auth | Firebase Auth + Context | `^12.12.1` |
| State — UI | `useState` / `useReducer` | React built-in |
| Payments | `@stripe/stripe-react-native` | latest |
| Maps | `react-native-maps` + Google Maps API | — |
| Push | Firebase Cloud Messaging (FCM) | — |
| Blur / Glass | `expo-blur` (iOS) / CSS backdrop-filter (web) | — |
| Calendar | `expo-calendar` (native) / `ical.ts` builder | — |
| Error Monitoring | Sentry (`sentry-expo`) | — |
| Analytics | PostHog + Firebase Analytics | — |
| Haptics | `expo-haptics` | — |
| Build / CI | EAS Build + EAS Submit | — |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Firebase Cloud Functions (Node.js 20) |
| API Framework | Express.js |
| Database | Cloud Firestore (NoSQL) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Web Hosting | Firebase Hosting |
| Push | Firebase Cloud Messaging (FCM) |
| Payments | Stripe (subscriptions + Connect + one-off) |
| Search | Firestore-backed `searchService` (bounded reads + in-memory match); Algolia planned Month 1 |
| Job Queue | N/A (triggers via Firestore onWrite); SQS planned for Month 3 |
| Image Processing | Sharp + job queue in `server/` Docker service (not required for main dev) |
| Analytics | PostHog (self-hosted roadmap) + Firebase Analytics |

---

## 2. Repository Structure

```
/                       Monorepo root — Expo app
├── src/                App source (components, hooks, modules, lib, design-system)
├── shared/             TypeScript types shared with Cloud Functions (no imports from src/)
├── functions/          Firebase Cloud Functions (Express API)
├── server/             Docker image-processing service (Sharp)
├── dataconnect/        Firebase DataConnect GraphQL schema (exploratory)
├── assets/             Static assets (images, fonts, icons)
├── docs/               Project documentation
└── data/               Static data (AllCouncilsList.csv)
```

**Monorepo rule**: Do NOT run `git init` inside `functions/` — Cloud Functions belong to this repo only.

---

## 3. Environment Configuration

### Client Variables (baked into bundle — prefix `EXPO_PUBLIC_`)

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=https://us-central1-culturepass-4f264.cloudfunctions.net/api/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
```

### Server-Only Variables (Cloud Functions — NEVER in `EXPO_PUBLIC_`)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
APP_URL=https://culturepass.app
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000   # default 10%
```

All `EXPO_PUBLIC_*` vars must be mirrored in `eas.json` `build.*.env`.

### Local Development

```bash
EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/
```

---

## 4. Authentication

### Providers

| Provider | Platform | Implementation |
|---|---|---|
| Email + Password | All | `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` |
| Google Sign-In | iOS + Android + Web | `expo-auth-session` + `@react-native-google-signin/google-signin` |
| Apple Sign-In | iOS + Web | `expo-apple-authentication` |
| Biometric (Face ID / Fingerprint) | iOS + Android | `expo-local-authentication` via `useBiometricAuth` |

### Auth Flow

```
1. Firebase Auth (email/Google/Apple) → Firebase ID token (JWT)
2. onAuthStateChanged in lib/auth.tsx → token stored via setAccessToken()
3. Every apiRequest() attaches: Authorization: Bearer <idToken>
4. Functions middleware → verifyIdToken() → req.user = { uid, email, role }
5. Token auto-refreshed every 50 minutes
6. Custom claims: { role, membershipTier } — synced on subscription change
```

### Role Hierarchy

```
user → organizer → moderator → cityAdmin → admin → platformAdmin
```

Roles enforced server-side via `requireRole()` middleware. Never trust client-side role claims alone.

---

## 5. API Architecture

### Client Access

```typescript
// ONLY correct way to call the backend
import { api, ApiError } from '@/lib/api';
// Never use raw fetch() or axios directly
```

`src/lib/api.ts` — typed namespace client composed from `src/platform/api/endpoints/`:
- `api.events.*` — event CRUD, search, publish, cancel
- `api.tickets.*` — purchase, validate, history
- `api.profiles.*` — community, business, venue, artist, organisation CRUD
- `api.membership.*` — subscribe, cancel, upgrade, status
- `api.payment.*` — Stripe customer, methods, checkout
- `api.wallet.*` — balance, transactions, top-up
- `api.rewards.*` — points balance, redeem
- `api.perks.*` — list, claim, redeem
- `api.communities.*` — join, leave, list, posts
- `api.council.*` — list, nearest, by LGA code
- `api.search.*` — global search
- `api.social.*` — follow, unfollow, followers, following, suggestions
- `api.notifications.*` — list, mark read, preferences
- `api.admin.*` — admin-only routes (requires `platformAdmin` role)

### Backend Routes

150+ routes in `functions/src/handlers/` — one file per domain:

```
activities · admin · auth · calendar · cities · council · cultureToday
discovery · events · feed · indigenous · locations · membership
misc · movies · offerings · perks · profiles · restaurants · rewards
search · shopping · social · stripe · stripeConnect · tickets · updates
uploads · users · utils · validation · wallet
```

### API Response Pattern

```typescript
// Success
{ data: T, meta?: { total, page, pageSize } }

// Error
throw new ApiError(statusCode, 'message', errorCode?)
```

---

## 6. Payment Architecture (Stripe)

### Subscriptions (CulturePass+)

- Stripe Products + Prices (monthly + annual per tier)
- `stripe.subscriptions.create` → webhook → Firestore `users/{uid}.membership`
- Custom claims updated via Firebase Admin SDK on webhook events
- Webhook events handled: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`

### Ticket Payments (One-Off)

- Stripe PaymentIntent via `api.payment.createCheckoutSession`
- Webhook: `payment_intent.succeeded` → Firestore `tickets/{id}.paymentStatus = 'paid'`
- QR code generated server-side after payment confirmation

### Stripe Connect (Organiser Payouts)

- Organisers onboard via Stripe Connect Express
- `STRIPE_CONNECT_PLATFORM_FEE_BPS` deducted on each payout (default 10%)
- Payout to organiser's bank on T+2 schedule
- Dashboard: `dashboard/stripeConnect` for organiser connect status

---

## 7. Data Layer

### Firestore

- Database: Cloud Firestore (NoSQL document store)
- Region: `australia-southeast1` (primary)
- Security: rules enforce owner-read, role-write; tickets are owner-read-only (Admin SDK writes)
- Composite indexes: `[city, date, status]`, `[lgaCode, date]`, `[organizerId, status]`

### TanStack React Query

- All server data fetched via `useQuery` / `useMutation`
- Query keys namespaced by endpoint + params: `['/api/events', city, country]`
- Stale time: 60 seconds (events); 300 seconds (static data like cities, categories)
- Mutation invalidates related query keys on success

### AsyncStorage

- `ContactsRepository` — saved contacts (CPID-keyed)
- `SavedContext` — saved events, joined communities (offline-first)
- Onboarding completion state

---

## 8. Search

### Current (Live)

`GET /api/search` — Firestore-backed `searchService.globalSearch`
- Bounded reads + in-memory trigram/keyword match
- Query params: `q`, `city`, `country`, `category`, `cultureTag`, `entryType`, `pageSize`
- Returns: `events`, `profiles`, `movies`, `users` (users currently empty)
- Limitation: no full-text fuzzy search; exact/prefix match only

### Planned (Month 1 Post-Launch)

Algolia full-text search:
- Index: `events`, `businesses`, `communities`, `venues`
- Facets: `city`, `country`, `cultureTag`, `category`, `entryType`, `isFree`
- Client: `algoliasearch` in `src/lib/`
- Firestore trigger: `onWrite` on `events/` and `profiles/` → Algolia index sync

---

## 9. Push Notifications

- Provider: Firebase Cloud Messaging (FCM)
- Token registration: `expo-notifications` → stored in `users/{uid}.fcmTokens[]`
- Dispatch: `functions/src/handlers/notifications.ts` via `firebase-admin` Messaging
- Topics: city-based broadcast (`sydney`, `melbourne`, etc.)
- Deep link routing: on notification tap → Expo Router `router.push(deepLink)` (Month 3)
- Per-category opt-out: `users/{uid}.notificationPreferences` (Month 3)

---

## 10. Media / Image Pipeline

### Upload Flow

1. Client: `useImageUpload` hook → `POST /api/uploads/image`
2. Server: `functions/src/handlers/uploads.ts` → Firebase Storage
3. Optional processing: `server/` Docker Sharp service (resize, compress, AVIF/WebP conversion)
4. CDN: Firebase Hosting serves static assets; Storage CDN for media

### Supported Formats

- Event images: JPEG/PNG/WebP, max 10MB input → resized to 1200×630px hero
- Profile images: JPEG/PNG, max 5MB → 400×400px avatar
- Media utilities: `src/lib/image-manipulator.{ts,native.ts,web.ts}`

---

## 11. Real-Time Features

| Feature | Implementation |
|---|---|
| Live event attendance count | Firestore `onSnapshot` listener on `events/{id}.attending` |
| Ticket scan status | Firestore `onSnapshot` on `tickets/{id}.status` |
| Notification badge count | Firestore `onSnapshot` on `users/{uid}` notification count |
| Community activity | Feed service polling (TanStack Query refetchInterval) |

---

## 12. Performance Requirements

| Metric | Target |
|---|---|
| App startup (cold) | ≤ 3s on iPhone 12 / mid-range Android |
| API p50 latency | ≤ 300ms |
| API p99 latency | ≤ 1500ms |
| First Contentful Paint (web) | ≤ 1.5s |
| Discover tab rail load | ≤ 1.5s (with skeleton placeholders) |
| Ticket QR generation | ≤ 2s post payment confirmation |
| Image load (hero) | ≤ 1s (WebP + CDN) |

---

## 13. Security Requirements

- All API calls over HTTPS; no HTTP in production
- Firebase ID token required on all authenticated endpoints
- Role validation server-side — never trust client claims
- `STRIPE_SECRET_KEY` and webhook secret never exposed to client bundle
- Firestore security rules: users own their doc; events/profiles public read; tickets owner-read-only
- Content moderation middleware: `functions/src/middleware/moderation.ts`
- Rate limiting: Express rate limiter on auth endpoints
- XSS: no `dangerouslySetInnerHTML` in React Native; sanitise all HTML in web-rendered content
- SQL injection: N/A (Firestore is NoSQL; no raw query strings)
- Image upload validation: MIME type + size check before Storage write

---

## 14. Accessibility Requirements

- WCAG 2.1 AA target (audit recommended pre-launch)
- All interactive elements: minimum 44×44pt touch targets
- Screen reader: `accessibilityLabel` on all icon-only buttons
- Contrast: minimum 4.5:1 text-on-background for body copy
- Font scaling: `useWindowDimensions` responsive; no fixed `fontSize` without scale-aware variants
- Keyboard navigation: web surfaces support Tab/Enter/Escape on modals

---

## 15. Build & Deploy Pipeline

```bash
# Development
npm install && cd functions && npm install && cd ..
npx expo start                      # native + web
firebase emulators:start            # local backend
npm run emulator:seed:cap           # seed test data

# Quality gates
npm run typecheck                   # zero errors required
npm run lint                        # zero warnings required
npm run qa:solid                    # full gate: lint + typecheck + scripted tests + Functions build + mock web export + route hygiene
npm run qa:all                      # broader: unit + integration + e2e:smoke + route hygiene

# Native builds
npm run build:ios:production        # EAS Build → App Store
npm run build:android:production    # EAS Build → Google Play

# OTA updates
npm run update:production           # Expo Updates → production channel
npm run update:preview              # Expo Updates → preview channel

# Web
npm run deploy-web                  # expo export → dist/ + firebase deploy --only hosting

# Full deploy
npm run deploy:guarded              # qa:solid → backup commit → push → deploy functions + hosting
```

**Deploy order**: Cloud Functions MUST deploy before app (new API endpoints must exist before client references them).

---

## 16. Local Development Setup

```bash
# 1. Clone and install
npm install && cd functions && npm install && cd ..

# 2. Copy env
cp .env.example .env
# Fill in EXPO_PUBLIC_* values from Firebase Console

# 3. Start emulators
firebase emulators:start --only functions,firestore,auth,storage

# 4. Override API URL for emulator
EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/

# 5. Start app
npx expo start

# 6. (Optional) Seed test data
npm run emulator:seed:cap
```

---

## 17. Testing Strategy

| Type | Tool | Coverage |
|---|---|---|
| Type checking | TypeScript (`tsc --noEmit`) | 100% — zero errors |
| Lint | ESLint | 100% — zero warnings |
| Unit | Jest | Core utilities (`dateUtils`, `ical`, `currency`, `format`) |
| Integration | Jest + Firebase emulator | API handlers, service layer |
| E2E smoke | Playwright | Checkout flow, event creation, ticket scan |
| Route hygiene | Custom script | All Expo Router routes resolve without 404 |
| QA gate | `npm run qa:solid` | Full pre-deploy gate |

---

## 18. Monitoring & Observability

| Concern | Tool |
|---|---|
| Error tracking | Sentry (`sentry-expo`, wired in `_layout.tsx` + `lib/reporting.ts`) |
| Performance | Sentry performance traces (Month 1) |
| Analytics | PostHog + Firebase Analytics |
| Crash reporting | Firebase Crashlytics (Android/iOS) |
| API health | Firebase Functions metrics in Firebase Console |
| Uptime | Firebase Hosting SLA |

---

## 19. Infrastructure Migration Roadmap

| Stage | Users | Platform | Action |
|---|---|---|---|
| Launch → 10K | 0–10K | Firebase | Stay. Add Algolia. Add composite indexes. |
| Growth | 10K–50K | Supabase (PostgreSQL) | Migrate Firestore → PostgreSQL. Keep Firebase Auth + FCM. |
| Scale | 50K–500K | AWS | Containerise API, Aurora PostgreSQL, S3 + CloudFront, SQS. Multi-region. |

See [GO_TO_MARKET.md](GO_TO_MARKET.md) §6 for full migration options and cost comparison.

---

## 20. Third-Party Dependencies (Key)

| Package | Purpose | Risk Level |
|---|---|---|
| `firebase` `^12.12.1` | Auth, Firestore, Storage, FCM | Core — high coupling |
| `@stripe/stripe-react-native` | Payment UI | Core — high coupling |
| `expo-router` `~55.0.12` | Navigation | Core — high coupling |
| `react-native-reanimated` `4.2.1` | Animations | High value, low migration risk |
| `@tanstack/react-query` `^5.99.0` | Server state | High value, swappable |
| `expo-blur` | Glass surfaces (iOS) | Replaces with CSS on web |
| `expo-calendar` | Device calendar sync | Native-only, graceful degradation on web |
| `sentry-expo` | Error monitoring | Swappable |
| `posthog-react-native` | Product analytics | Swappable |

---

*Last updated: May 2026 | Maintained by: CulturePass Engineering*
