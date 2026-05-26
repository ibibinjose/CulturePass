# Changelog

All notable changes to CulturePass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
