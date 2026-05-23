# App Store & Google Play — Submission Guide

**Last aligned:** May 2026 — store-facing assets use the **2026 palette** (`CultureTokens`, `SignatureGradient`: indigo `#4F46E5`, teal `#0D9488`, violet → coral gradient). See [`STYLE_GUIDE.md`](STYLE_GUIDE.md) and [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md).
**Last reviewed:** May 8, 2026.

---

## Before every store upload

1. **Regenerate raster brand assets** so PNGs match the current SVG gradients:
   ```bash
   npm run generate:brand-assets
   ```

2. **Bump versions** in `app.json`:
   - `expo.version` (user-facing semver)
   - `ios.buildNumber` (string, monotonic)
   - `android.versionCode` (integer, monotonic)

3. **Run the quality gate:**
   ```bash
   npm run qa:solid
   ```

4. **Privacy & permissions** — `app.json` → `ios.infoPlist` / Android equivalents must match actual usage (location, camera, photo library, contacts, Face ID, etc.).

5. **Store listings** — short description, full description, and "What's New" should match product voice from [`src/lib/app-meta.ts`](../src/lib/app-meta.ts) (taglines: *Belong anywhere.* / *Discover. Connect. Belong.*).

---

## First-time EAS setup

Run once per project. Required before any cloud build.

```bash
# Firebase (copy from Firebase Console → Project Settings → Your apps → Web app config)
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "yourproject.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "yourproject"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "yourproject.appspot.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123:ios:abc"

# API URL (Cloud Functions base URL — must end with /api/)
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://us-central1-yourproject.cloudfunctions.net/api/"

# Google Sign-In (Google Cloud Console → Credentials → iOS OAuth Client)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "xxx.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID --value "com.googleusercontent.apps.xxx"

# Google Maps (Google Cloud Console → Maps SDK for iOS)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value "AIza..."
```

> Manage secrets in the EAS dashboard at expo.dev → your project → Secrets.

---

## Build commands

```bash
# Physical iPhone dev build (registers device UDID first: eas device:create)
npm run build:ios:device

# TestFlight internal preview
npm run build:ios:preview
npm run build:android:preview

# Production builds
npm run build:ios:production
npm run build:android:production

# Submit to stores
npm run submit:ios:production
npm run submit:android:production

# OTA updates (no native rebuild needed)
npm run update:preview
npm run update:production

# Check build status
eas build:list --platform ios
eas build:list --platform android
```

---

## App Store Connect setup (do once)

Log into [appstoreconnect.apple.com](https://appstoreconnect.apple.com):

### App Information
- [ ] **Name**: CulturePass
- [ ] **Subtitle**: Events, Community & Culture
- [ ] **Bundle ID**: `au.culturepass.app`
- [ ] **Primary Language**: English (Australia)
- [ ] **Category**: Lifestyle (Primary) · Social Networking (Secondary)
- [ ] **Age Rating**: 4+ (complete questionnaire — no objectionable content)

### Capabilities
- [ ] Push Notifications
- [ ] Sign In with Apple
- [ ] Associated Domains (`applinks:culturepass.app`, `webcredentials:culturepass.app`)
- [ ] Maps

### Privacy (App Privacy questionnaire)
| Data type | Collected | Linked to identity |
|-----------|-----------|-------------------|
| Contact Info (email, name) | Yes | Yes |
| Identifiers (User ID) | Yes | Yes |
| Location (coarse) | Yes | No |
| Usage Data | Yes | Analytics |

### Screenshots required
| Device | Resolution |
|--------|-----------|
| iPhone 6.9" (16 Pro Max) | 1320 × 2868 px |
| iPhone 6.7" (14 Plus) | 1290 × 2796 px |
| iPad 13" (if `supportsTablet: true`) | Optional |

Key screens to capture: Discover, Event detail, Profile/QR, Community, Perks.

---

## TestFlight process

1. Build preview: `npm run build:ios:preview`
2. Submit: `eas submit --platform ios --profile production --latest`
3. In App Store Connect → TestFlight → wait ~30 min for processing → add internal testers.

---

## App Review submission checklist

In App Store Connect before submitting for review:
- [ ] Build selected
- [ ] Screenshots added
- [ ] Review notes: "Cultural events and community platform for diaspora communities worldwide" + demo account credentials
- [ ] Privacy Policy URL: `https://culturepass.app/legal/privacy`

---

## Apple App Store

- **Screenshots**: Dark-friendly, token-compliant current UI.
- **App Privacy**: Match data collection to actual SDK behaviour (Firebase, analytics).
- **Wallet**: Pass background colour uses `#4F46E5` (`CultureTokens.indigo`) — see `functions/src/services/walletPasses.ts`.

---

## Google Play

- **Data safety form**: Aligned with actual permissions and data handling.
- **Feature graphic / screenshots**: Refresh if primary UI chrome changed materially.
- **Adaptive icon**: Foreground/background PNGs from `generate:app-images`; `splash` `backgroundColor` remains `#0B0B14` per `app.json`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "No matching provisioning profile found" | `eas credentials --platform ios` — let EAS manage credentials |
| "Missing push notification entitlement" | Ensure `aps-environment` is `production` in `ios/CulturePass/CulturePass.entitlements` |
| "App crashes on launch in production" | Verify all `EXPO_PUBLIC_*` EAS secrets are set (Step 1) |
| "QR code not visible on iPhone" | Use the dev client build — Expo Go doesn't match SDK versions |
| "Camera permission denied" | `app.json` → `infoPlist.NSCameraUsageDescription` must be set; user may need to re-enable in Settings → CulturePass → Camera |
| Build timeout | EAS builds take 15–30 min — check status with `eas build:list` |

---

## Reference

| Topic | Document |
|-------|---------|
| Brand + UX standard | [`STYLE_GUIDE.md`](STYLE_GUIDE.md) |
| Hex + components | [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md) |
| Engineering rules | [`culturepass-rules.md`](../culturepass-rules.md) |
| Store copy / metadata | [`APP_STORE_LISTING.md`](APP_STORE_LISTING.md) |
| Web SEO shell | `src/app/+html.tsx` |
