# CulturePass Task Board (Current State)

Last refreshed: 2026-04-23 (scanned app + functions on `main`).

This file tracks **real remaining work**. Legacy “create file/component” tasks were removed because most of the app is already implemented.

---

## 1) Current Product Snapshot

Implemented and in active use:

- [x] Onboarding/auth flows, profile, scanner, tickets, payments, settings, legal pages
- [x] Discover/feed rails, browse, city/culture destinations, event detail/creation
- [x] Community features + admin tooling (users, moderation, finance, platform, audit)
- [x] Firebase Functions API surface for search/discovery/admin/stripe/support

Recent updates already shipped:

- [x] Discover header quick theme toggle (System/Light/Dark)
- [x] Discover category rail backend wiring (`/api/discover/categories`) + frontend counts
- [x] Browse/filter and empty-state UX improvements
- [x] Event rail/card UX refinements and pricing/status chips

---

## 2) P0 - Stabilize User-Critical Gaps

### Route integrity (broken/missing routes used by UI)
- [ ] Fix `/contacts` navigation target (currently referenced from scanner/profile flows, route missing on `main`).
- [ ] Fix `/membership/upgrade` navigation target (referenced, route missing).
- [ ] Fix `/(tabs)/perks` navigation target consistency (route usage exists; verify concrete route path and tab mapping).
- [ ] Add CI route-check task to catch invalid `router.push(...)` strings before merge.

### Client/Server API parity
- [ ] Implement `/api/search/suggest` in functions **or** remove `api.search.suggest()` from `lib/api.ts` and all consumers.
- [ ] Add API contract parity check in CI (generated or scripted smoke map from `lib/api.ts` vs functions handlers).

---

## 3) P1 - Product Correctness & Data Quality

### Admin data correctness
- [ ] Replace placeholder fetch logic in `src/app/admin/communities.tsx` (currently biased fallback behavior; can hide data).
- [ ] Audit all admin list screens for placeholder fallback queries and normalize behavior (explicit empty states over silent default filters).

### Discovery/search backend hygiene
- [ ] De-duplicate ownership of `/discover/trending` behavior if split across handlers/services; keep one canonical implementation path.
- [ ] Confirm category IDs between constants and backend counting/filtering logic remain canonicalized across event search.
- [ ] Add cached response strategy for `/api/discover/categories` to avoid repeated heavy reads at scale.

### Payments/ops hardening
- [ ] Remove or lock down unsafe fallback secrets in prod paths (e.g. mock Stripe secret fallback behavior).
- [ ] Add explicit startup/runtime guardrails: fail fast in non-dev when required env vars are absent.

---

## 4) P1 - Testing Strategy (High ROI)

### Integration/E2E (missing)
- [ ] Event creation -> publish -> discover visibility -> event detail open.
- [ ] Checkout -> ticket issuance -> wallet/ticket detail render.
- [ ] Scanner -> contact save flow.
- [ ] Admin moderation/support-ticket core loops.

### Contract & regression
- [ ] Add API contract tests for critical endpoints (search/discover/admin/stripe).
- [ ] Add route smoke tests for top-level app paths and deep links.

### Existing unit tests to keep healthy
- [ ] Keep hooks/use-cases tests passing; expand around role/auth/layout/date utils where regressions are frequent.

---

## 5) P2 - UX/Accessibility/Performance Quality Gates

### Accessibility
- [ ] Keyboard and focus-state pass for major web surfaces (Discover, Browse, Events, Settings).
- [ ] Color contrast audit across dark/light/system themes (especially chips, badges, secondary text).
- [ ] Screen reader labels audit for dynamic controls (theme toggle, filter rails, card actions).

### Performance
- [ ] Profile and browse long-list rendering on low-end devices (FPS + memory).
- [ ] Verify image-heavy rails use stable virtualization settings and no over-render on web.
- [ ] Add lightweight perf baseline script (before/after checks for critical screens).

---

## 6) Documentation & Process

- [ ] Keep this file outcome-focused (no giant “create file” inventories).
- [ ] Add `docs/ROUTE_MAP.md` (canonical routes + aliases + redirects).
- [ ] Add `docs/API_MAP.md` (client methods -> backend endpoints -> owner).
- [ ] Add monthly “task pruning” checkpoint to remove stale items.

---

## 7) Definition of Done (for any task)

- [ ] Feature/bug verified on Web + at least one native platform.
- [ ] Lint/type checks pass in touched packages.
- [ ] No dead links or missing routes introduced.
- [ ] If API changed: client + server + docs updated together.
- [ ] Empty/loading/error states validated.

---

## 8) Next 7-Day Execution Plan

- [ ] Day 1-2: P0 route fixes + route CI check.
- [ ] Day 2-3: Search suggest API parity decision + implementation.
- [ ] Day 3-4: Admin communities placeholder logic replacement.
- [ ] Day 4-5: Integration test scaffolding for event/checkout/scanner.
- [ ] Day 6-7: Accessibility pass for Discover/Browse/Settings and follow-up fixes.