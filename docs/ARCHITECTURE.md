# CulturePass Architecture

**Status**: Living Document  
**Last Updated**: Current session (Phase 0 Foundations)  
**Owners**: Engineering + Product  
**Audience**: Current team, new hires, future contributors, auditors

This document describes how CulturePass is actually built, why key decisions were made, and the principles that guide future evolution.

---

## 1. Vision & Principles

CulturePass is a universal (iOS, Android, Web) platform that enables cultural creators, venues, businesses, communities, and organizers to reach diaspora audiences, sell experiences and products, build communities, and manage their presence with world-class tools.

**Guiding Principles** (inspired by the standards of Apple, Google, Amazon, x.com, and SpaceX):

- **Reliability & Trust First**: Creators depend on this platform for their livelihood. Lost drafts, broken publishing flows, or unclear verification states are unacceptable.
- **Documentation as Code**: Architectural decisions are written down, reviewed, and versioned alongside the code.
- **Internal Tools Are Products**: The admin and moderation surfaces deserve the same level of craft as the consumer experience.
- **Platform Thinking**: Stable, well-bounded primitives (auth, verification, forms, design, observability) enable fast, safe product development.
- **Progressive Disclosure & Forgiveness**: Complex domains (legal requirements, verification, international nuances) must feel guided and recoverable.
- **Measure What Matters**: Host success funnels, verification resolution times, time-to-first-publish, admin operational metrics, and error budgets drive prioritization.

---

## 2. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients (Universal)                       │
│  Expo 56 + React Native + react-native-web + expo-router        │
│  - iOS / Android (EAS)                                           │
│  - Web (static export → Firebase Hosting)                        │
│  - Apple Widgets / Live Activities (targets/)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Authenticated HTTP (Bearer ID token)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Layer (BFF Pattern)                      │
│  Firebase Functions (v2 https.onRequest) → Express (app.ts)     │
│  - Typed endpoints (platform/api/endpoints/*)                    │
│  - Middleware: auth, validation, rateLimit, moderation           │
│  - Region: australia-southeast1                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Firebase Platform                            │
│  - Auth (primary identity + custom claims for roles)             │
│  - Firestore (hostProfiles, hostApplications, hostVerificationTasks, 
│    events, profiles, users, auditLogs, drafts, etc.)             │
│  - Storage (media, documents)                                    │
│  - Triggers (onImageUpload, reviews, waitlist, digest, scores)   │
│  - Hosting (SPA + /api/** → Functions)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
│  - Stripe (payments, Connect)                                    │
│  - Resend (email)                                                │
│  - PostHog (product analytics + session replay)                  │
│  - FCM (push)                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions** (see `docs/ADRs/`):
- API over direct client Firestore access (consistency, authorization, business logic enforcement).
- Shared `shared/schema/` as the contract between client and server.
- TanStack Query as the primary data layer (with persistence).
- Custom design system (M3 + cultural expression) rather than pure third-party UI library.

---

## 3. Frontend Architecture (Client)

### Directory Structure (Key Parts)
- `src/app/` — File-based routing (expo-router). Groups: `(tabs)`, `(onboarding)`, `(domain)`, `admin/`, `hostspace/`, etc.
- `src/modules/` — Feature modularity (strongest in `host/`).
- `src/platform/api/` — Typed API client factories.
- `src/lib/` — Cross-cutting (api, query-client, auth, config, deep links).
- `src/design-system/` — Tokens + UI primitives (M3 + cultural variants + platform splits).
- `src/hooks/queries/` — Domain-specific data hooks with structured keys.
- `shared/` — Single source of truth for domain models (imported via alias).

### Data & State
- **Primary**: TanStack React Query v5 (persisted to AsyncStorage, 5min stale default, 401 self-healing).
- **Auth**: Firebase Auth client SDK + module-level token store (to obey hook rules) injected into API layer.
- **Local/Ephemeral**: React Contexts (limited) + form state inside complex wizards.
- **No heavy global store** (Zustand is in deps but minimally used).

### Event detail surface
- **`EventInfoDocument`** (`src/modules/events/components/detail/EventInfoDocument.tsx`) — canonical sidebar/mobile panel: organiser, contact, date/time range (with timezone), address, event type & category, calendar export, and social share row. Spec: `docs/EVENT_DETAIL_UI.md`.
- **Display fallbacks** — `src/lib/presentation.ts` centralises “show what you have” copy for communities, cards, and detail rows when API fields are missing.

### Cross-Platform Strategy
- `useLayout()` hook drives responsive behavior (compact/medium/expanded + `isDesktop`).
- Platform-specific files (`.native.tsx`, `.web.tsx`).
- Web: Static export + Firebase Hosting rewrites.
- Native: EAS builds with Apple target extensions for widgets.

### Error Handling & Resilience (Current State)
- `ErrorBoundary` + `ErrorFallback` on major screens (with limited auto-retry).
- Strong `ApiError` classification in `platform/api/client.ts`.
- `inline-retry-manager.ts` exists but is not fully wired in production UI.

---

## 4. Backend Architecture (Firebase Functions)

### Structure
- `functions/src/index.ts` → exports `api` (v2 HTTPS).
- `functions/src/app.ts` → Express app (helmet, cors, rate limiting, global error handler).
- `handlers/` — Thin routers per domain (auth, validation, ownership checks).
- `services/` — Business logic (profileService, verificationService, draftService, events, etc.).
- `middleware/` — `requireAuth`, `requireRole`, `rateLimit`, validation.
- `triggers/` — Firestore event-driven side effects.

### Security & Authorization
- Firebase ID tokens verified on every request (`checkRevoked: false` for perf, with freshness helpers for sensitive actions).
- Role system via custom claims + `users/{uid}.role` (ranks defined in `middleware/auth.ts`).
- `requireRole('admin')` on the admin router; moderator+ for host applications.

### Data Model Highlights
- `hostApplications` (Layer 1 approval → organizer role).
- `hostProfiles` + `hostProfileDrafts` + `hostProfileVersions` (rich, versioned, draftable entities).
- `hostVerificationTasks` (Layer 2 — triggered on publish for regulated entities).
- Strong separation between internal rich `hostProfiles` and public directory `profiles`.
- `users/{uid}.culturePassId` — format `CP-[A-Z0-9]{6,}` — resolved via `GET /api/cpid/lookup/:cpid`.

---

## 6. Public Profile System (CPU — CulturePass User)

### Route Architecture
Public user profiles are served at `/cpu/[id]`. All route folders are lowercase — critical for case-sensitive Linux/Firebase Hosting (macOS is case-insensitive, so bugs only appear in production).

```
src/app/cpu/[id].tsx              → delegates to user/[id].tsx
src/app/(shortlinks)/cpu/[id].tsx → delegates to user/[id].tsx
src/app/user/[id].tsx             → canonical renderer
```

The renderer resolves `[id]` as: CPID (`CP-XXXXXX`) → handle → Firebase UID, in that order.

### Contact Privacy
Email and phone on public profiles use `SwipeToReveal` — masked by default, real values only rendered when `currentUserId` is truthy. Bots and unauthenticated users see `j***@***.com` only.

### Digital Business Pass
Bottom of every public profile shows a mini Digital Business Pass card linking to `/profile/qr`.

---

## 6a. Digital ID System (`/profile/qr`)

Two pass formats: landscape Business Pass (330×210) and portrait Event Lanyard (330×440).

**Print/Save as PDF**: Uses `openPrintWindow()` to open an isolated popup window containing only the card HTML, sized exactly to the card, with auto-triggered print dialog. Filename suggested as `culturepass-@username-business-pass`.

> Never use `window.print()` from the main app — it prints the entire React Native Web shell.

---

## 6b. Payment & Wallet Surface Map

| Route | Single Responsibility |
|---|---|
| `/payment/wallet` | Balance, cashback, rewards, loyalty, quick nav |
| `/payment/transactions` | Full transaction history |
| `/tickets` / `/tickets/[id]` | Ticket list + per-ticket Apple/Google Wallet |
| `/profile/qr` | Digital ID + business card wallet add |
| `/membership/upgrade` | Tier upgrades |

---

## 6c. Web Security (Firebase Hosting)

`firebase.json` headers on both sites:
- `Content-Security-Policy` (with `unsafe-inline` + `unsafe-eval` for RN Web + Reanimated)
- `Strict-Transport-Security` (2-year HSTS with preload)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

> **Never set CSP via `<meta>` tag** — it breaks Metro `eval()` in dev and Reanimated in prod.

---

## 6d. SEO & Structured Data

- **Global** (`+html.tsx`): Schema.org Organization + WebSite + MobileApplication, full OG + Twitter cards, hreflang, Apple Smart App Banner
- **Per-profile** (`user/[id].tsx`): Schema.org Person with CPID identifier, `og:profile:username`, `og:image:alt` with "Digital Business Pass" branding

---

## 7. The HostSpace System (Current Crown Jewel)

This is the most sophisticated subsystem in the product.

**Flow**:
1. User applies (`hostApplications` collection) → pending.
2. Admin approves (Layer 1) → `organizer` role granted via custom claims.
3. User enters gated HostSpace (`HostspaceAccessGate`).
4. Creates profiles via EntityTypeSelector → workspace or FormWizard.
5. On publish of certain entities → automatic `pending_verification` + `hostVerificationTask` creation (Layer 2).
6. Admin reviews verification (checklist + documents) → approve → profile becomes `published` + `verified`.

**Strengths**: Excellent internal documentation, strong separation of concerns, dual draft system, entity polymorphism, verification pipeline, accessibility utilities.

**Current Architectural Debt** (see ADR-001):
- The full 6-step `FormWizard` is mature but not the primary runtime path in `/hostspace/create`. Lighter dedicated forms + `HostspaceCreateWorkspace` dominate. This creates duplication and inconsistent mental models.

---

## 6. Admin & Operational Surfaces

Admin is protected by client-side role checks + server `requireRole('admin')` (moderator+ for host applications).

Current surfaces include:
- Host Applications (Layer 1)
- Verification Queue + Detail (Layer 2) — recently completed with full backend routes
- Moderation/Reports
- User Directory, Finance, Discovery config, Promo codes, Audit Logs, System Health, etc.

**Current State**: Good for a small-to-medium team. Lacks pagination, server-side search, bulk actions, deep observability, and workflow automation needed at scale.

---

## 7. Key Cross-Cutting Concerns

- **Design System**: M3 + expressive cultural tokens + GlassView + reanimated micro-interactions. Two color systems currently in use (in migration).
- **Accessibility**: Strong investment in the host wizard; lighter elsewhere. Needs systematization.
- **Analytics**: PostHog (product events + replays). Instrumentation is selective.
- **Performance**: Implicit Metro splitting. No explicit budgets or aggressive lazy loading yet.
- **Rate Limiting**: Dual (express-rate-limit + custom sliding window per route).

---

## 7. Performance Strategy

Performance is treated as a first-class concern with measurable budgets.

### Current Tools
- `scripts/check-web-bundle-size.js` — Runs on every CI build. Measures both raw and gzipped sizes.
- Budgets (as of latest update):
  - Soft: 1.2 MB gzipped (warning)
  - Hard: 1.8 MB gzipped (fails CI)
- Reusable lazy loading utilities in `src/lib/lazy.tsx` and host-specific helpers in `src/modules/host/utils/performance.ts`.
- `expo-image` is used in most places (better caching + decoding than React Native Image).

### Critical Paths
- Initial app load (fonts, auth, discover feed)
- HostSpace creation (very heavy — partially mitigated with lazy steps)
- Admin surfaces (loaded on demand)

### Goals (Industry Standard)
- Keep largest initial JS chunk under 1.5 MB gzipped.
- Lazy load non-critical screens (Admin, heavy modals, complex forms).
- Consistent image optimization with proper `contentFit`, priority, and caching policies.
- Measure and protect Time to Interactive on low-end Android devices.

---

## 8. Current Risks & Technical Debt

1. **Developer Experience** — Complex local setup (multiple emulators, token matching, API URL resolution) leads to "nuclear cleanup" culture.
2. **Knowledge Silos** — Lack of architecture docs and ADRs.
3. **Host Creation Fragmentation** — See ADR-001.
4. **Operational Scalability** — Admin tooling and backend queries not hardened for 10x volume.
5. **Observability** — Limited remote error tracking and distributed tracing.
6. **Resilience** — General offline support and conflict handling lag behind the excellent draft system in HostSpace.

---

## 9. Evolution & Future Direction

See the approved **World-Class Platform Transformation Plan** (root of planning artifacts) and the `docs/ADRs/` series for concrete decisions.

The strategy is **evolutionary excellence**:
- Phase 0: Foundations (DX + Docs + Governance)
- Phase 1: HostSpace unification and verification loop closure
- Phase 2: Operational excellence in admin tooling
- Phase 3+: Platformization, performance, internationalization, and signature delight

---

## 10. How to Contribute to This Document

- Major architectural changes require an ADR.
- Update this document when significant new layers or boundaries are introduced.
- Keep it honest — describe reality, not aspirations.

---

*This document is intentionally concise. Detailed decisions live in ADRs. Implementation details live in code and the excellent internal documentation inside `src/modules/host/`.*

**Questions?** Start a discussion referencing the relevant ADR or section.