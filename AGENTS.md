# AGENTS.md — CulturePass Master Engineer Reference

**Status**: Living document (Phase 0 Foundations)  
**Last Updated**: 2026-05 (post-launch)  
**Primary Sources**: `TheApp.md`, `docs/ARCHITECTURE.md`, shared schema, runtime code

> This is the **deep reference**. For day-to-day coding rules, start with `CLAUDE.md`.

---

## 1. Project at a Glance

**CulturePass** — B2B2C cultural diaspora lifestyle marketplace.  
"Belong anywhere."

- **Live since**: 15 April 2026 (iOS App Store, Google Play, Firebase Hosting web)
- **Platforms**: Universal (Expo 55 + React Native 0.83 + react-native-web + expo-router)
- **Users**: Attendees, hosts/organizers, communities, businesses, venues, artists, admins
- **Core surfaces**: Event discovery + ticketing, Community hub, Business directory, Memberships & Perks, HostSpace (creator platform), CultureX, Admin tooling

**Tagline surfaces**:
- Event Discovery (city / category / culture-tag / date / full-text)
- Stripe-backed Ticketing + QR wallet + Apple/Google Wallet passes
- Community Hub + posts (roadmap)
- LGA-proximity Business Directory
- Tier-gated Memberships, Perks, Cashback, Rewards
- First Nations Spotlight (Indigenous Australian culture rail)
- HostSpace: full creator lifecycle (apply → Layer 1 organizer role → profile creation → Layer 2 verification → publish)

---

## 2. Architecture Overview (Condensed from docs/ARCHITECTURE.md)

```
Clients (Expo + RN + Web)
        │ Authenticated Bearer ID token
        ▼
API Layer (Firebase Functions v2 https.onRequest → Express)
  handlers/ (33 thin routers) + middleware (auth, validation, rateLimit, moderation)
        ▼
Firebase Platform
  Auth (custom claims for roles) + Firestore + Storage + Triggers + Hosting
        ▼
External: Stripe (Checkout + Connect), Resend, PostHog, FCM
```

**Guiding Principles** (non-negotiable):
- Reliability & Trust First (creators' livelihoods depend on it)
- Documentation as Code
- Internal Tools Are Products
- Platform Thinking (stable primitives)
- Progressive Disclosure & Forgiveness
- Measure What Matters (host success funnels, verification times, error budgets)

**Key Architectural Decisions**:
- API over direct client Firestore (consistency + authorization + business logic).
- `shared/schema/` is the single contract between client and server (TypeScript + compiled JS for Functions).
- TanStack Query v5 (persisted) is the primary client data layer.
- Custom design system (M3 + cultural expression + Glass + Reanimated) instead of pure third-party library.
- Two-layer host verification (Layer 1 = organizer role; Layer 2 = regulated entity verification via `hostVerificationTasks`).

---

## 3. Directory Map (Canonical)

```
CulturePass/
├── src/
│   ├── app/                    # expo-router file-based routing
│   │   ├── (tabs)/             # Discover, Calendar, Community, City, My Space, Perks
│   │   ├── (onboarding)/       # 10-step flow (interests, location, council, etc.)
│   │   ├── (domain)/           # Public entity surfaces (event/, community/, business/, venue/, etc.)
│   │   ├── (shortlinks)/       # Deep link + handle resolution
│   │   ├── (static)/           # Legal, about, landing pages
│   │   ├── admin/              # 19 admin screens (applications, verification queue, users, finance...)
│   │   ├── hostspace/          # 8 core files + heavy module delegation
│   │   ├── create/, dashboard/, membership/, payment/, perks/, profile/, settings/, tickets/, etc.
│   │   └── _layout.tsx         # Root providers, WebSidebar (theme + time/date/weather chrome), ErrorBoundary, PostHog, etc.
│   │
│   ├── modules/                # Feature modules (strongest modularity in host/)
│   │   ├── events/ (46 files)
│   │   ├── host/ (157 files)   # FormWizard, drafts, verification, analytics, workspace...
│   │   ├── profile/ (53 files)
│   │   ├── communities/ (30 files)
│   │   ├── discover/, explore/, marketplace/, payment/, listings/, network/, onboarding/, admin/
│   │
│   ├── components/             # Shared UI (Discover rails, calendar, perks, widgets, browse)
│   ├── design-system/
│   │   ├── tokens/             # theme.ts (master), colors, typography, spacing, elevation, animations, material3, luxeHeritage, vitrineTheme
│   │   └── ui/                 # M3Button, M3Card, M3TopAppBar, GlassView, CultureImage, etc. (47 files)
│   │
│   ├── hooks/                  # useLayout, useColors, useM3Colors, useRole, useCouncil, useLocations, useHostDrafts...
│   ├── lib/                    # api.ts (only HTTP entry), auth.tsx, query-client, feature-flags, analytics, deep-link-resolver, etc.
│   ├── platform/api/           # 30+ typed endpoint factories (the "BFF" client layer)
│   ├── contexts/               # OnboardingContext, SavedContext, ContactsContext, NavigationStateContext...
│   ├── repositories/           # ContactsRepository, MembershipRepository (AsyncStorage-backed)
│   ├── services/               # Client-side services (notificationsService, searchService, ticketsService)
│   ├── shared/types/           # Thin client-only shared types
│   └── widgets/                # Apple Watch / iOS widgets + Live Activities
│
├── shared/                     # THE CONTRACT (TypeScript source + compiled JS for Functions)
│   ├── schema/                 # 40+ domain files (event, hostProfile, ticket, user, profile, perk, wallet...)
│   └── constants/
│
├── functions/src/
│   ├── index.ts                # exports the v2 https function
│   ├── app.ts                  # Express app (helmet, cors, rateLimit, global error handler)
│   ├── handlers/               # 33 thin domain routers (events, profiles, hostApplication, tickets, stripe, admin...)
│   ├── services/               # 31 business logic services (heavy lifting)
│   ├── middleware/             # auth (requireRole, isOwnerOrAdmin, token freshness), validation, rateLimit, moderation, requestId
│   ├── triggers/               # Firestore onWrite/onCreate side effects (image upload, scores, digest, waitlist...)
│   ├── jobs/                   # geohashBackfill, etc.
│   └── use-cases/admin/        # Admin-specific use cases with tests
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ADRs/ (001-host-creation-unification.md, 002-dx-strategy.md)
│   ├── FIXES-001-layout-deformities.md
│   ├── STORE_SUBMISSION.md, APP_STORE_PUBLISHING_CHECKLIST.md, etc.
│   └── (many living planning artifacts)
│
├── .agents/skills/             # Rich agent guidance (firebase-*, developing-genkit-*)
├── targets/                    # Native widget extensions (Swift + entitlements)
└── TheApp.md, CLAUDE.md, culturepass-rules.md (this file)
```

---

## 4. Data Model (High-Level)

All types live in `shared/schema/` and are re-exported via `shared/schema.ts`.

**Core collections** (Firestore):
- `users/{uid}` — username, displayName, city, role (custom claims mirror), membership.tier, lgaCode?
- `events/{eventId}` — title, date, city, category, cultureTag[], priceCents, tiers[], entryType, organizerId, status, geoHash, lat/lng, lgaCode?
- `tickets/{ticketId}` — eventId, userId, status, paymentStatus, qrCode, cpTicketId
- `profiles/{profileId}` — entityType (community|business|venue|artist|organisation|...), ownerId, isVerified, lgaCode? (public directory surface)
- `hostProfiles/{id}` — rich internal versioned entity (artist, business, venue, community, organizer, professional)
- `hostProfileDrafts/{id}` + `hostProfileVersions/{id}` — draft + immutable history
- `hostApplications/{id}` — Layer 1 application → organizer role on approval
- `hostVerificationTasks/{id}` — Layer 2 checklist + document review for regulated entities
- `councils/{lgaCode}` — seeded from AllCouncilsList.csv (name, suburb, state)
- `perks/`, `memberships/`, `wallets/`, `rewards/`, `feed/`, `reviews/`, `moderationReports/`, `auditLogs/`, `drafts/`, `supportTickets/`

**Important separation**:
- `hostProfiles` (internal, rich, versioned, draftable) ≠ `profiles` (public directory, denormalized for fast browse).

---

## 5. Complete API Surface (Client Namespaces)

All calls go through `api` from `@/lib/api`. Namespaces (as of latest):

**Core**
- `api.auth.*`, `api.users.*`, `api.uploads.*`, `api.media.*`

**Discovery & Content**
- `api.events.*`, `api.discover.*`, `api.discoverFlow.*`
- `api.search.*`, `api.searchFlow.*`
- `api.culture.*`, `api.cultureX.*`, `api.cultureExplorer.*`, `api.cultureToday.*`
- `api.feed.*`, `api.social.*`, `api.reviews.*`

**Transactions**
- `api.tickets.*`, `api.stripe.*`, `api.paymentMethods.*`, `api.wallet.*`, `api.rewards.*`
- `api.perks.*`, `api.perksClassify.*`

**Host & Profiles**
- `api.hostApplications.*`, `api.profiles.*` (rich entity profiles), `api.hostDrafts.*`
- `api.communities.*`

**Directory & Location**
- `api.restaurants.*`, `api.shopping.*`, `api.movies.*`, `api.activities.*`, `api.offerings.*`, `api.businesses.*`
- `api.council.*`, `api.locations.*`, `api.cities.*`

**Operational**
- `api.admin.*`, `api.reports.*`, `api.support.*`
- `api.notifications.*`, `api.notificationsResolve.*`
- `api.calendar.*`, `api.calendarFlow.*`, `api.calendarSettings.*`
- `api.deepLinks.*`, `api.widgets.*`, `api.waitlist.*`
- `api.ai.*`, `api.updates.*`, `api.rollout.*`, `api.cpid.*`, `api.communityHomeBanner.*`

**Raw escape hatches**
- `api.raw(requestConfig)` — for anything not yet namespaced
- `api.baseUrl()` — for constructing image/media URLs

**Backend handlers** live in `functions/src/handlers/` (one file per domain, thin delegation to services).

---

## 6. HostSpace — The Crown Jewel Subsystem

Most sophisticated part of the product (see `src/modules/host/` and internal `IMPLEMENTATION_SUMMARY.md` files).

**Flow**:
1. User applies → `hostApplications` (pending).
2. Admin approves (Layer 1) → `organizer` role granted via custom claims + Firestore `users/{uid}.role`.
3. User enters gated `HostspaceAccessGate`.
4. Creates profiles via `EntityTypeSelector` → workspace or `FormWizard`.
5. On publish of regulated entities → automatic `pending_verification` + `hostVerificationTask` creation (Layer 2).
6. Admin reviews verification (checklist + documents + evidence) → approve → profile becomes `published` + `verified`.

**Strengths**:
- Dual draft system (draft + version history)
- Entity polymorphism (6+ types with shared + specific fields)
- Strong accessibility utilities inside the wizard
- AI assist hooks
- Verification-aware UI

**Current Debt** (ADR-001):
- Two parallel creation paths (full `FormWizard` vs lighter `HostspaceCreateWorkspace` + dedicated forms).
- Decision: Unify rich profile creation around the FormWizard engine. Lighter paths remain for non-profile content (events, offers, marketplace listings).

---

## 7. Security & Authorization Model

**Client**:
- Firebase Auth (email/password, Google, Apple).
- ID token attached to every `api.*` call (module-level store in `query-client.ts`).
- Role surfaced via `useRole()` and `api.auth.me()`.

**Server** (`functions/src/middleware/auth.ts`):
- `authenticate` (global) — verifies signature + expiry (`checkRevoked: false` for perf).
- `requireAuth`, `requireRole('admin' | 'moderator' | 'cityAdmin' | 'organizer'...)`.
- `isOwnerOrAdmin(ownerId)`, `isOwnerOrCityAdmin(ownerId, resourceCity)`.
- `requireFresh(maxAgeSeconds)` — for sensitive mutations (payments, admin, deletion).
- Role ranks defined in `ROLE_RANK`.
- Bootstrap super-admins via env `SUPER_ADMIN_UIDS` / `SUPER_ADMIN_EMAILS`.

**Never** leak required role names or internal hierarchy in error messages to clients.

---

## 8. Performance & Quality Gates

**Web bundle budgets** (CI-enforced):
- Soft: 1.2 MB gzipped (warning)
- Hard: 1.8 MB gzipped (fail)

**Tools**:
- `npm run size:web` (via `scripts/check-web-bundle-size.js`)
- `expo-image` everywhere (caching + decoding)
- Lazy utilities in `src/lib/lazy.tsx` + host-specific performance helpers

**Gates**:
```bash
npm run typecheck
npm run lint
npm run qa:solid          # typecheck + lint + unit + Functions build + web export + route hygiene
npm run qa:all
npm test
```

---

## 9. Deployment & Environment

**Order matters**: Functions before client on contract changes.

**Client**:
- `npm run build:ios:production` + `submit:ios:production`
- Same for Android
- OTA: `npm run update:production`

**Web**:
- `npm run deploy-web` (export → `dist/` + `firebase deploy --only hosting`)

**Full**:
- `npm run deploy`
- `npm run deploy:guarded` (runs `qa:solid` + backup commit)

**Emulators** (required for local Functions + Firestore):
```bash
firebase emulators:start --only functions,firestore,auth,storage
npm run emulator:seed:cap
```

**Env split** (see CLAUDE.md + TheApp.md):
- `EXPO_PUBLIC_*` — client bundle (safe)
- Everything else (Stripe keys, webhook secrets, etc.) — Functions only, never in client.

---

## 10. Current Risks & Technical Debt (from ARCHITECTURE.md)

1. Developer Experience — complex local setup leads to "nuclear cleanup" culture.
2. Knowledge Silos — architecture docs were incomplete (this file + TheApp.md close the gap).
3. Host Creation Fragmentation (ADR-001 in progress).
4. Operational Scalability — Admin tooling lacks pagination, bulk actions, deep observability.
5. Observability — limited remote error tracking + distributed tracing.
6. Resilience — offline/conflict handling lags behind the excellent draft system.

---

## 11. How to Contribute (Process)

- Major architectural changes require an ADR in `docs/ADRs/`.
- Update `TheApp.md`, `AGENTS.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md` when boundaries or primitives change.
- Run full quality gates before PR.
- Test iOS + Android + Web (especially web desktop sidebar + responsive breakpoints).
- Visual hygiene: no raw hex outside `design-system/tokens/`.

---

## 12. References & Further Reading

| Document | Purpose |
|----------|---------|
| `TheApp.md` | Product vision, stack, quickstart commands, design tokens, engineering rules, roadmap |
| `CLAUDE.md` | Practical rules for AI agents and humans (imports, hooks, pitfalls) |
| `docs/ARCHITECTURE.md` | System design, principles, HostSpace deep dive, evolution plan |
| `docs/ADRs/` | Decision records (start with 001-host-creation-unification) |
| `docs/FIXES-001-layout-deformities.md` | Current visual + layout debt + process guardrails |
| `docs/STORE_SUBMISSION.md` + checklists | EAS, App Store, Play Store processes |
| `shared/schema/` | The single source of truth for every domain type |
| `src/modules/host/` (internal READMEs & IMPLEMENTATION_SUMMARY.md) | Deepest documentation of any subsystem |

**Agent skills** in `.agents/skills/` provide detailed guidance for Firebase, Genkit (JS/Dart/Go/Python), Crashlytics, Data Connect, etc.

---

*This document describes reality, not aspirations. Keep it honest. When it diverges from code, update it and open a discussion.*

**Questions?** Reference the relevant section + ADR or file in discussion.
