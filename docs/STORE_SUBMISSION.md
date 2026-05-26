# CulturePass — App Store & Play Store Submission Guide

**Last updated**: 2026-05-27 (post v1.2.2 remediation)

This document is the single source of truth for releasing CulturePass to the Apple App Store (TestFlight → production) and Google Play Store.

## 1. Current Release Information

| Item                    | Value                          |
|-------------------------|--------------------------------|
| Bundle Identifier (iOS) | `au.culturepass.app`           |
| Package Name (Android)  | `au.culturepass.app`           |
| App Store Connect ID    | 6761712952                     |
| Current Version         | 1.2.2                          |
| Current Build Number    | 26                             |
| EAS Project ID          | `9dc511ee-ee3e-4798-ae29-30efc8f5343e` |

**Important**: We ship two iOS targets in every build:
- Main app (`au.culturepass.app`)
- `ExpoWidgetsTarget` (`au.culturepass.app.ExpoWidgetsTarget`)

Both must have valid provisioning profiles and share the same Distribution Certificate.

---

## 2. Prerequisites (One-time per machine)

```bash
npm install -g eas-cli
eas login
eas whoami
```

You must be a member of the **ZEN KAPITAL PTY LTD** Apple team (Team ID `26WGXSNG58`).

---

## 3. Correct Submission Flow (2026+)

**Never use** `npx testflight` or other legacy wrappers. They pull in ancient dependencies and obscure real errors.

### iOS (TestFlight → Production)

```bash
# 1. Build
eas build -p ios --profile production --non-interactive

# 2. Once the build succeeds in EAS, submit it
eas submit -p ios --profile production --non-interactive
```

Or use the EAS dashboard (recommended for the first few submissions while learning the process).

### Android (Internal → Production)

```bash
eas build -p android --profile production --non-interactive
eas submit -p android --profile production --non-interactive
```

---

## 4. EAS Profiles & Environment Variables

All required production variables are defined in `eas.json` under the `production` profile.

**Critical variables that must be present** (already in eas.json as of 2026-05-27):

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_FIREBASE_*` (all 8 keys)
- `EXPO_PUBLIC_EAS_PROJECT_ID`
- Widget / Apple-specific vars (if any new ones are added)

If you add a new `EXPO_PUBLIC_*` variable, it **must** be added to the `production` (and usually `preview`) profile in `eas.json` and also set as an EAS secret.

---

## 5. Credentials & Targets (iOS)

As of 2026-05-27 the following credentials are configured and stored in EAS:

- **Distribution Certificate** (shared):
  - Serial: `75712157AB5594C0EA07BE2238ABA1EC`
  - Expires: April 2027
  - Team: 26WGXSNG58

- **Provisioning Profiles**:
  - `au.culturepass.app` → `927FQ86X9M`
  - `au.culturepass.app.ExpoWidgetsTarget` → `L964AJA3NR`

Both profiles are active and include the necessary capabilities (Push Notifications, App Groups for widgets, etc.).

**Never delete or replace the certificate** unless it is about to expire. Coordinate with the team lead.

---

## 6. What Changed Recently (Relevant to Submission)

- v1.2.2 (2026-05-27):
  - Production iOS bundle phase stabilized (Babel Hermes private field transforms + dependency hygiene).
  - Removed incompatible `@react-navigation/*` packages.
  - Widget target (ExpoWidgetsTarget) is now part of every production build.
  - Documentation and version control hygiene improvements (this file + CHANGELOG).

---

## 7. Pre-Submission Checklist

Before kicking off a production build:

- [ ] Version bumped in `app.config.js` (both `version` and `buildNumber` / `versionCode`)
- [ ] `CHANGELOG.md` updated with user-facing changes
- [ ] All `EXPO_PUBLIC_*` variables present in `eas.json` "production" profile
- [ ] `npm run lint && npm run typecheck && npm test` pass
- [ ] Web build succeeds (`npm run build-web`)
- [ ] No new console warnings in production bundle (check EAS logs)
- [ ] Manual smoke test on iOS simulator + at least one Android emulator (or TestFlight internal group)
- [ ] Visual regression tests (if enabled) are green or intentionally updated

---

## 8. Common Failure Modes & Fixes

| Symptom                              | Likely Cause                              | Fix |
|--------------------------------------|-------------------------------------------|-----|
| "Bundle JavaScript build phase" unknown error | Hermes private fields or missing Babel transforms | Ensure `babel.config.js` has the three private field plugins (already done as of 2026-05-27) |
| Build succeeds but submit fails      | Wrong `ascAppId` or missing credentials   | Check `eas.json` submit section and EAS dashboard |
| Widgets not appearing                | ExpoWidgetsTarget profile missing         | Confirm both targets have valid profiles (see §5) |
| Deep link / dev client issues in prod | Wrong scheme or missing `expo-dev-client` plugin | Verify `app.config.js` scheme + plugin list |

---

## 9. Emergency Rollback

If a submitted build is catastrophic:

1. Do **not** release it to the public App Store / Play Store.
2. Use TestFlight internal groups or Android internal track to validate fixes.
3. Re-submit with a new build number (EAS auto-increment can be enabled in `eas.json` if desired).

---

## 10. Contacts & Ownership

- Apple Team: ZEN KAPITAL PTY LTD (26WGXSNG58)
- Primary Apple ID for submissions: AirPizza@icloud.com (stored in EAS)
- EAS Project Owner: cultureos

For credential rotation or new team members, coordinate with the engineering lead.

---

**Do not run `npx testflight` or similar wrappers.** Use the official `eas build` + `eas submit` commands or the EAS web dashboard.

This document should be updated on every production release.