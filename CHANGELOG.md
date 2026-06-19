# Changelog

All notable changes to CulturePass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [Unreleased]

### Added
- **Event detail info document** — Organised by, Contact Organiser, date/time range with timezone, full address, event type & category, Add to Calendar, and Share With Friends (Copy Link, Facebook, Twitter, LinkedIn, Pinterest). Desktop sidebar + mobile top panel. See `docs/EVENT_DETAIL_UI.md`.
- **Partial-data fallbacks** across community and event surfaces — sparse API payloads show italic placeholders instead of hiding rows (`src/lib/presentation.ts`).
- **Sparse-inventory location fallbacks** — Discover and Community surfaces show local events/communities first, then pad with country-wide listings when fewer than three local results (`src/lib/locationFallback.ts`). Discover adds Popular Events and Communities on the “All” filter; community detail pages supplement recommended events via `useCommunityDisplayEvents`.
- **Eventbrite Australia sync** — Daily import from `eventbrite.com.au` into the **Australian Event Finder** community (`cpass_australian_event_finder`). Tickets open on Eventbrite (`externalTicketUrl`); no CulturePass checkout. Manual run: `npm run sync:eventbrite`; scheduled `syncEventbriteDaily` at 05:00 Sydney. Requires `EVENTBRITE_PRIVATE_TOKEN`.
- **Apple PassKit Web Service** routes at `/api/wallet/apple/v1/*` (device registration, pass updates, logs).
- **Wallet tooling**: `npm run wallet:readiness`, `wallet:setup`, `wallet:secrets:push`; `PUBLIC_APP_ORIGIN` / stable `.pkpass` download URLs.
- Clear wallet error messages on `/profile/qr` (503 config vs auth failures); web triggers `.pkpass` download.

### Fixed
- Wallet pass QR/deep links use canonical `/cpu/{CPID}` URLs.
- Pass download loads full user profile including membership tier.
- API client paths for Google Wallet bootstrap + admin readiness.

## [1.3.2] - 2026-06-08

### Added
- **Cross-platform release readiness**: aligned app version, iOS build number (28), Android versionCode (7), and EAS `runtimeVersion` to 1.3.2.
- **EAS environment workflow**: `npm run eas:env:push:preview` / `eas:env:push:production` sync `.env` to Expo; `release:check` runs doctor + QA before store builds.
- **Web deploy guard**: `deploy-web` validates Firebase env via `assert-firebase-web-export.mjs` before export; `build-web:with-mock-firebase` for CI throwaway exports.

### Fixed
- **Mock → real data**: CPID lookup, users, profiles, ticket scan, and culture shop handlers use Firestore + seeded demo fixtures; legacy `mock-*` codes gated to emulator/test only.
- **Host actions**: profile/event/listing delete and share wired to real APIs (`useHostItemActions`).
- **Web export**: `react-native-maps` plugin excluded on web builds in `app.config.js`.
- **iOS build**: removed stale Sentry upload build phase from Xcode project (package already removed).

## [1.3.1] - 2026-06-06

### Added
- **Premium Directory UI/UX**: Rebuilt the Directory screen at `/directory` with a responsive grid (3-column layout on desktop, 2-column on tablet, 1-column on mobile), split banner/avatar card styles, and VIP horizontal carousels (Featured and Community).
- **Interactive Location Selection**: Integrated `LocationPickerModal` and `useLocationPickerFlow` directly into the Directory screen, making the header location badge clickable and automatically updating search queries.
- **Improved Test Run Quality**: Mocked the `firebase-functions` logger in file validation service tests to suppress warning logs in console outputs.
- **Dependency Security Fixes**: Resolved 16 security vulnerability alerts by specifying overrides for `@xmldom/xmldom` and `uuid` packages.

### Fixed
- **EAS Build Upload Casing**: Resolved git/filesystem naming casing mismatch for `cpu/[id].tsx` and `(shortlinks)/cpu/[id].tsx` that caused build failures on macOS.

## [1.3.0] - 2026-06-05

### Added
- **End-to-End Scanner Improvements**:
  - Refactored the ticket scanner backend (`/api/tickets/scan`) to return `200 OK` with descriptive validation outcomes (duplicate, invalid, cancelled) instead of `400/404` errors, avoiding client-side fetch exceptions and enabling graceful status card rendering.
  - Included the full ticket object in validation failure responses to assist gate staff in resolving entry disputes.
  - Updated `parseCulturePassInput` to extract CPIDs from scanned user/profile URLs (e.g. `http://localhost:8081/cpu/CP-U58B35B`), allowing direct QR scans of digital business card passes.
  - Retained the `email`, `phone`, and `website` fields resolved from CPIDs and displayed them in a premium **CONNECT & LINKS** section on `CulturePassContactCard` with active links.
  - Added comprehensive mock support for testing: scanning mock ticket codes (`mock-used`, `mock-cancelled`, `mock-invalid`) returns descriptive mock cards, and looking up user ID `CP-U58B35B` returns Vikram Sharma's full profile details (email, phone, bio, website).
- **Branding Enhancements**: Embedded the CulturePass logo in the center of generated QR codes across the entire application (Profile passes, user screens, community detail, and host passes).
- **Web Sidebar Polish**: Left-aligned the date, time, and weather metadata block in `WebSidebar` (removed `marginLeft: 16` offset and set `marginRight: 'auto'` to position the block cleanly on the left under the logo).
- Host wizard analytics now fully instrumented and surfaced:
  - Comprehensive tracking in `useFormWizard` (session start, step start/complete, validation errors by field, auto-save success/failure with timing, publish funnel with duration, abandonment on unmount/cancel with last step + reason).
  - Auto-save tracking wrapped in the hook's save path.
  - Trust signals (draft recovery, verification status, legal friction, post-publish activation, critical-step abandon) already present + now complemented by core funnel data.
  - `AnalyticsDashboard` (post-publish profile performance: views, traffic sources, keywords, engagement, suggestions, CSV) is now rendered in HostSpace Dashboard with multi-profile selector for hosts with >1 entity.
- Data foundation for measuring creator success funnels (north-star per ARCH principles) without any AI surface.
- **Wizard polish**: explicit `trackUpload` (with timing, size, success/failure) wired through `useMediaUpload` → `MediaUploadField` → `Step2Media` (logo/hero/gallery/video + native/web/crop paths). Example `trackApiCall` on draft mutations. `getSessionAnalyticsMetrics()` + live __DEV__ metrics panel surfaced in `WizardContainer` (rolling counters, step timings, error rates visible during development).

### Fixed
- Multiple copy-paste bugs in `WizardContainer` alert/confirm paths (nested `if (Platform.OS === 'web')` caused native alerts for validation, publish, and draft save to never trigger correctly on iOS/Android).
- Removed dormant AI-specific analytics types/events/exports from `formAnalyticsService` (scope alignment; no behavior change for active paths).

### Changed
- `hostspace/dashboard` now loads and displays the user's host profiles + inline analytics surface (makes existing ProfileAnalytics backend + UI investment operational).
- Minor comment/doc updates to remove "AI-powered" references in analytics surfaces (heuristics remain data-driven rule-based).
- **Bundle spike (host create)**: `app/hostspace/create/index.tsx` now lazy-loads `WizardContainer` + `EntityTypeSelector` via `createLazyComponent` + `<Suspense>` (on-demand chunk for the heavy profile wizard + entity fields). Matches existing `HostspaceCreateWorkspace` pattern; individual steps were already `createLazyStep` inner-lazy. Reduces static pull of rich form code into main entry for non-host-create paths.
- Deeper bundle: additional lazies in `src/app/hostspace/index.tsx` (DraftRecovery, HostItemActionSheet, CreateMenuSheet, UniversalShareSheet) and `HostspaceCreateWorkspace.tsx` (ListingsColumn, VerifyCard, TopChrome, CategoryGrid/Sidebar) with Suspense. More on-demand splits for host surfaces.
- Unification spike (ADR-001): detailed entry point map added to create/index.tsx comments (8+ points: workspace launcher, selector, wizard, dedicated forms, menu sheets, actions, deep links, nation builder). Notes analytics now live on wizard; recommends full deprecation of rich paths in workspace.
- Broader lint/any: fixed several 'as any' / 'any[]' in host wizard/media (useFormWizard prefill, useMediaUpload asset size) for type safety. Client pagination + metrics surface added to admin/users.tsx (roadmap admin scale example, using slice + page controls + host analytics link surface). Some import order fixed via --fix.
- Analysis: expo export run; confirmed separate chunks for EntityTypeSelector, Steps post-lazy; entry still references strings but on-demand for heavy wizard paths.
- Next (unification execution + type safety + admin scale + bundle + promoCodes): 
  - Host unification: enforced rich filter in workspace launcher; added deprecation + wizard redirect in HostspaceCommunityCreateForm; wired LazyArtistFields/LazyBusinessFields (via React.lazy + Suspense) into Step5Description for artist/business entity data in the FormWizard (unification proof; rich profiles now get entity-specific UI in canonical wizard path).
  - Type safety: removed unused Sentry import in query-client (follows NEVER @sentry rule); fixed (data as any) in host-applications; more unknown in validation/query; tightened more in users/admin; fixed import path for lazies.
  - Admin scale: added client pagination (page/slice/controls/reset on filter/search) + metrics surface (funnel note + live wizard analytics link) to host-applications.tsx. Matches users.tsx pattern. Added pagination + controls to audit-logs.tsx.
  - Bundle: lazy in performance for entity fields (and direct in step); re-analysis/size run (still 1.86MB entry, on-demand confirmed for host paths; entity code now split).
  - PromoCodes implementation: Extended backend admin promo schema/handler/create/list to support 'ticket_discount' type (with discountType, discountValue, eventId optional, maxRedemptions, redeemedCount) using doc-id-as-code for lookup consistency; updated admin UI promo-codes.tsx with type selector + conditional form fields for discounts + updated list/stats render for both types (free_plus membership gifts and ticket discounts). Added redeemedCount increment(1) on successful paid ticket (in stripe webhook after confirm, and tickets direct purchase tx). Fixed ticketPricing to accept isActive/active for mixed data. Client checkout/ticketQuote/events pricing already had validation+apply discount; now full end-to-end creatable via admin + tracked redemptions per roadmap item.
  - Host-facing promo creation in HostSpace: Added backend routes GET/POST /api/events/:id/promos (protected to event organizer via requireAuth + ownership check). Exposed via api.events.promos and hostApi.events.promos. Integrated UI into EventAnalyticsDashboard (accessible to hosts via hostspace dashboard and actions): create form for event-scoped ticket promos + live list of promos with redemption counts. Ties directly to existing analytics and checkout flows.
  Typecheck/lint clean on deltas.

## [1.2.2] - 2026-05-27

### Changed
- Production iOS build + TestFlight submission pipeline stabilized (EAS profiles, credentials for main app + ExpoWidgetsTarget).
- Babel config updated with explicit Hermes private field/method transforms for reliable production bundles.
- Removed incompatible direct dependencies (`@react-navigation/*` packages, direct Expo internals) per `expo-doctor`.
- Major layout deformity remediation pass (FIXES-001):
  - Targeted extraction of inline styles + hex colors into design tokens in Admin users directory and Host EntityTypeSelector.
  - Added visual regression test scaffolding for critical flows (host apply, admin, discover).
- Package hygiene: cleaned wrapper-induced deprecated packages from previous submit attempts.

### Fixed
- Hermes "private properties not supported" runtime error in dev client and production builds.
- Multiple layout/formatting issues (raw styles, absolute positioning, missing truncation) in high-risk surfaces.
- Bundle size checker script syntax error.

### Added
- `docs/FIXES-001-layout-deformities.md` — living remediation plan.
- `e2e/visual-regression.spec.ts` — Playwright screenshot tests for key screens.
- Proper CHANGELOG tracking.

### Notes
- Use `eas build -p ios --profile production` + `eas submit` (or the EAS dashboard) for TestFlight/Play Store. Avoid legacy "npx testflight" wrappers.
- All production EXPO_PUBLIC_* vars must be set in eas.json "production" profile and GitHub secrets / EAS secrets.

## [1.2.1] - 2026-05-15

### Initial public launch (iOS, Android, Web)
- Full Expo Router + custom tab bar + web sidebar implementation.
- Host profile creation wizard, ticketing, membership, etc.
- Apple Widgets + Live Activities support.
- Design system (M3 + cultural tokens) rollout.

[Unreleased]: https://github.com/cultureos/culturepass/compare/v1.2.1...HEAD
[1.2.2]: https://github.com/cultureos/culturepass/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/cultureos/culturepass/releases/tag/v1.2.1
