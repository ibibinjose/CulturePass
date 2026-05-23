# CulturePass release checklist

Use before shipping **web**, **iOS**, or **Android** (adjust steps per surface). Pair with CI: `.github/workflows/ci.yml` runs `npm run qa:solid` on pushes and PRs to `main`, `preview`, and `dev`.

**Auth & Stripe review (static):** [`REVIEW_AUTH_AND_PAYMENTS.md`](./REVIEW_AUTH_AND_PAYMENTS.md)

---

## Preconditions

- [ ] **`npm run qa:solid` passes locally** after `npm ci` at the repo root **and** `npm ci` in `functions/` (the root quick start already runs `npm install` in `functions/`). If you only ran root install, `npm run test:unit` triggers **`pretest:unit`**, which runs `npm ci` in `functions/` automatically when `firebase-admin` is missing there.
- [ ] **Secrets**: Stripe live/test keys + webhook secret, Firebase Functions env, Google Maps keys, PostHog (if used) match the target environment. Never commit Play service account JSON (`google-play-service-account.json` is gitignored).
- [ ] **`eas.json` production / preview**: `EXPO_PUBLIC_*` values match Firebase Console web app + Cloud Functions URL you intend to hit.
- [ ] **Firestore rules & indexes** deployed if this release changes data access or queries.
- [ ] **Stripe Dashboard**: webhook endpoint URL matches where `POST .../stripe/webhook` is served (hosted API or Cloud Function URL).

---

## Web (Firebase Hosting)

- [ ] `.env` has real `EXPO_PUBLIC_*` (not mock) for `npm run build-web` / `npm run deploy-web` path that asserts Firebase keys.
- [ ] `firebase deploy` targets correct hosting site(s) (`firebase.json`: `culturepass-4f264`, `culturepass`).
- [ ] Smoke: cold load, login, Discover, event detail, **API calls succeed** (`/api` rewrite to `api` function).

---

## iOS

- [ ] `app.json` / App Store Connect: **version** and **ios.buildNumber** bumped per submission rules.
- [ ] `runtimeVersion` and Expo Updates URL align with shipped native binary after any native plugin / SDK change.
- [ ] EAS: `eas build --platform ios --profile production`; archive installs on device + TestFlight.
- [ ] **Sign in with Apple**, push (if claiming), Universal Links (`culturepass.app`) open correct routes.
- [ ] Ticket purchase smoke: checkout opens, return path works, ticket visible.

---

## Android

- [ ] `app.json` **android.versionCode** bumped vs last Play upload.
- [ ] `eas build --platform android --profile production`; internal testing track → production when ready.
- [ ] App Links verification (Digital Asset Links) for `culturepass.app` still valid after package/signing changes.
- [ ] Same auth + checkout smoke as iOS.

---

## Post-deploy

- [ ] Cloud Logging: no spike in **5xx** on `/health` or high-traffic API routes after deploy.
- [ ] Stripe webhook delivery shows **successful** deliveries for test payment (or monitor first real transaction).
- [ ] Optional OTA: `eas update --branch production` only if JS-only changes match current `runtimeVersion`.

---

## Rollback plan

- [ ] Hosting: redeploy prior `dist`/known-good hosting release or rollback in Firebase Hosting release history.
- [ ] Functions: deploy previous artifact or rollback via Firebase (keep prior `functions` build output tagged in CI/Git).
- [ ] Native: store versions cannot be rolled back; ship hotfix binary or instruct users to remain on prior build until fix.
