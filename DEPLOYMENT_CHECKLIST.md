# CulturePass Deployment Checklist & Step-by-Step Instructions

**Date Created:** March 3, 2026  
**Last Updated:** May 13, 2026
**Status:** ✅ **READY FOR DEPLOYMENT**

---

## 📋 Project Health Assessment

### ✅ Code Quality
- **TypeScript**: ✅ 0 type errors
- **Linting**: ✅ Clean
- **iOS/Android**: ✅ Properly configured (app.json + info.plist + AndroidManifest.xml)
- **Web**: ✅ All pages working (Discover, Calendar, Communities, Perks, Profile, Login, Signup)

### ✅ Source Code Locations
| Source | Location | Status |
|--------|----------|--------|
| **React Native** (iOS/Android) | `/src/app/` (Expo Router) | ✅ Ready |
| **Web** (Expo Web unified) | `/src/app/` + shared components | ✅ Ready |
| **Cloud Functions** | `/functions/src/` | ✅ Built |
| **Assets** | `/assets/` | ✅ Present |
| **Shared Types** | `/shared/schema.ts` | ✅ Present |

### ✅ Build Artifacts
| Component | Output | Status |
|-----------|--------|--------|
| **Web Static Export** | `dist/` | ✅ Expo export output |
| **Functions Compiled** | `functions/lib/` | ✅ TypeScript compiled |
| **.env Configuration** | `.env` | ✅ Holds active credentials |

### ✅ Firebase Configuration
- **Project ID**: `culturepass-4f264`
- **.firebaserc**: ✅ Updated to use correct project ID
- **Firestore Rules**: ✅ In place (`firestore.rules`)
- **Storage Rules**: ✅ In place (`storage.rules`)
- **Cloud Functions**: ✅ Ready to deploy

---

## 🔐 Certificates, Credentials & Configs Required

These are the production signing and service configs CulturePass needs before a real App Store / Play Store / Firebase deploy. Secret files stay out of git; commit only public verification files and non-secret config.

### App Identity
| Item | Value / Location | Status |
|------|------------------|--------|
| App name | `CulturePass` in `app.json` | ✅ Configured |
| iOS bundle ID | `au.culturepass.app` | ✅ Configured |
| Android package | `au.culturepass.app` | ✅ Configured |
| Apple Team ID | `26WGXSNG58` | ✅ Configured |
| EAS Project ID | `9dc511ee-ee3e-4798-ae29-30efc8f5343e` | ✅ Configured |
| Expo owner | `cultureos` | ✅ Configured |
| EAS project | `https://expo.dev/accounts/cultureos/projects/culturepass` | ✅ Configured |
| App Store Connect app | `https://appstoreconnect.apple.com/apps/6761712952/distribution/info` | ✅ Restored |
| URL scheme | `culturepass://` | ✅ Configured |
| Production domain | `https://culturepass.app` | ✅ Configured |

### iOS Certificates & Capabilities
- [ ] Apple Distribution certificate for Team `26WGXSNG58`.
- [ ] App Store provisioning profile for `au.culturepass.app`.
- [ ] Push Notifications capability enabled in Apple Developer portal.
- [ ] Associated Domains capability enabled with `applinks:culturepass.app`, `applinks:www.culturepass.app`, and `webcredentials:culturepass.app`.
- [ ] Sign in with Apple capability enabled.
- [ ] App Groups capability enabled for `group.au.culturepass.app` because widgets share app data.
- [ ] Widget/app-extension bundle IDs provisioned: `au.culturepass.app.widget`, `au.culturepass.app.spotlight`, `au.culturepass.app.smart-card`, `au.culturepass.app.ExpoWidgetsTarget`.
- [ ] Apple Wallet pass certificate created for `pass.au.culturepass.app` if wallet passes are enabled.

Recommended EAS setup:
```bash
eas credentials --platform ios

# Confirm the credentials match:
# Bundle Identifier: au.culturepass.app
# Apple Team ID: 26WGXSNG58
# Distribution Certificate: Apple Distribution
# Provisioning Profile: App Store
```

### Android Certificates & Play Config
- [ ] Android release keystore registered in EAS credentials. Local secret file, if used: `@cultureos__culturepass.jks` (ignored by git).
- [ ] Google Play App Signing enabled for package `au.culturepass.app`.
- [ ] Upload certificate SHA-1 and SHA-256 added to Firebase Android app.
- [ ] App signing certificate SHA-256 added to `public/.well-known/assetlinks.json`.
- [ ] Google Play service account JSON stored locally as `google-play-service-account.json` for `eas submit` (ignored by git), or supplied through CI secrets.

Verification commands:
```bash
eas credentials --platform android

# If you have the keystore password, derive the upload certificate fingerprints:
keytool -list -v -keystore @cultureos__culturepass.jks

# After Play App Signing is enabled, copy the Play app-signing SHA-256 from:
# Google Play Console → CulturePass → Setup → App integrity → App signing key certificate
```

Update Android App Links after you have the production SHA-256:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "au.culturepass.app",
      "sha256_cert_fingerprints": ["PASTE_PLAY_APP_SIGNING_SHA256_HERE"]
    }
  }
]
```

File to update: `public/.well-known/assetlinks.json`. The current file is intentionally public; do not put keystore passwords or private keys in it.

### Firebase Client Config
- [ ] Firebase Web app keys set in `.env` and CI/EAS environments:
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
  - `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] Firebase iOS app exists for `au.culturepass.app`; download `GoogleService-Info.plist` when native Firebase SDK config is required.
- [ ] Firebase Android app exists for `au.culturepass.app`; download `google-services.json` when native Firebase SDK config is required.
- [ ] Firebase Cloud Messaging Web Push VAPID key set as `EXPO_PUBLIC_FCM_VAPID_KEY` if web push is enabled.
- [ ] Firebase App Check site key set as `EXPO_PUBLIC_APPCHECK_SITE_KEY` before enforcing App Check on web.

### Google Maps & Google Sign-In
- [ ] `EXPO_PUBLIC_GOOGLE_MAPS_KEY` set to a production key restricted to iOS bundle ID `au.culturepass.app`, Android package `au.culturepass.app` + SHA-1, and web domain `culturepass.app`.
- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set from Google Cloud OAuth client.
- [ ] `EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID` set for iOS URL scheme used by `@react-native-google-signin/google-signin`.
- [ ] Replace `FILL_ME_IN` placeholders in `eas.json` or, preferably, remove public secrets from `eas.json` and set them with EAS environment variables.

### Server Secrets
Set production server secrets with Firebase secrets/config, never in source:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set WALLET_LINK_SIGNING_SECRET
firebase functions:secrets:set APPLE_WWDR_CERT_PEM
firebase functions:secrets:set APPLE_PASS_SIGNER_CERT_PEM
firebase functions:secrets:set APPLE_PASS_SIGNER_KEY_PEM
firebase functions:secrets:set GOOGLE_WALLET_PRIVATE_KEY
```

Also configure non-secret or low-sensitivity Functions environment values:
- `APP_URL=https://culturepass.app`
- `PUBLIC_APP_ORIGIN=https://culturepass.app`
- `WALLET_LINKS_PUBLIC_ORIGIN=https://culturepass.app`
- `APPLE_TEAM_IDENTIFIER=26WGXSNG58`
- `APPLE_PASS_TYPE_IDENTIFIER=pass.au.culturepass.app`
- `GOOGLE_WALLET_ISSUER_ID`
- `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_WALLET_GENERIC_CLASS_ID`
- `GOOGLE_WALLET_TICKET_CLASS_ID`
- `STRIPE_PRICE_MONTHLY_ID`
- `STRIPE_PRICE_YEARLY_ID`
- `STRIPE_CONNECT_PLATFORM_FEE_BPS=1000`

### Public Domain Verification Files
- [x] iOS Universal Links / web credentials file exists at `public/.well-known/apple-app-site-association`.
- [ ] Android App Links file exists at `public/.well-known/assetlinks.json`, but the SHA-256 fingerprint must be replaced with the Play app-signing SHA-256 before production release.
- [ ] After deploy, verify both files are served without redirects:
```bash
curl -i https://culturepass.app/.well-known/apple-app-site-association
curl -i https://culturepass.app/.well-known/assetlinks.json
```

---

## 🚀 Pre-Deployment Checklist (Complete These First)

### Step 1: Verify .env Configuration
```bash
cd /Users/cultureos/Dev230526/CulturePass

# Check that .env has all required Firebase credentials:
rg "^EXPO_PUBLIC_FIREBASE_" .env

# Should show:
# EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyA38YmkzxfEYi6TAUGYfo7bxfPW3Ogi9XQ
# EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=culturepass-4f264.firebaseapp.com
# EXPO_PUBLIC_FIREBASE_PROJECT_ID=culturepass-4f264
# [... other vars ...]
```

✅ **Status**: VERIFIED

### Step 2: Verify Firebase CLI Login
```bash
firebase whoami
# Should show authenticated user email
```

### Step 3: Verify Certificate & Public Config Readiness
```bash
cd /Users/cultureos/Dev230526/CulturePass

# Deep link config in app.json
npx tsx scripts/tests/test-deeplinks.ts

# EAS signing credentials
eas credentials --platform ios
eas credentials --platform android

# Confirm no placeholder values remain in production app config or public verification files
rg "FILL_ME_IN|PASTE_|YOUR_|TODO" app.json eas.json public/.well-known
```

✅ **Required before mobile production release**: `public/.well-known/assetlinks.json` must contain the real Play app-signing SHA-256 fingerprint, not an empty string.

### Step 4: Perform Final Build Test (Optional)
```bash
# Test web build
npm run build-web

# Test functions build
cd functions && npm run build && cd ..

# Test type checking
npm run typecheck
```

---

## 📱 Part 1: Deploy Web App (Expo Web) to Firebase Hosting

### Prerequisites
- ✅ Web app built (`npm run build-web` completed)
- ✅ `.firebaserc` configured with correct project ID
- ✅ Firebase CLI authenticated (`firebase whoami`)

### Step 1: Build Web App (If Not Already Built)
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Validate Firebase web env before export (required for production deploys)
node scripts/assert-firebase-web-export.mjs

# This exports Expo web bundle to dist/ using real EXPO_PUBLIC_FIREBASE_* values
npm run build-web

# Expected output:
# ✓ Compiled successfully
# ✓ Generating static pages (13/13)
# Route (app)                              Size
# ┌ ○ /                                    1.9 kB
# ├ ○ /calendar                            1.68 kB
# ├ ○ /communities                         932 B
# ├ ○ /perks                               2.75 kB
# └ ...
```

### Step 2: Deploy to Firebase Hosting
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Deploy only hosting (fastest for web-only deploys)
firebase deploy --only hosting

# Expected output:
# ✔ Deploy complete!
#
# Project Console: https://console.firebase.google.com/project/culturepass-4f264
# Hosting URL: https://culturepass-4f264.web.app
```

### Step 3: Verify Deployment
```bash
# Visit in browser:
# https://culturepass-4f264.web.app/

# Check specific routes:
# https://culturepass-4f264.web.app/calendar
# https://culturepass-4f264.web.app/communities
# https://culturepass-4f264.web.app/perks
# https://culturepass-4f264.web.app/profile
```

---

## ⚙️ Part 2: Deploy Cloud Functions to Firebase

### Prerequisites
- ✅ Cloud Functions built (`cd functions && npm run build`)
- ✅ Firebase CLI authenticated
- ✅ `.env` file has any environment variables needed by functions

### Step 1: Verify Functions Build
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass/functions

# Check compiled output exists
ls -la lib/functions/src/

# Should contain index.js and other compiled files
```

### Step 2: Deploy Functions
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Deploy only Cloud Functions (fastest for function-only deploys)
firebase deploy --only functions

# Expected output:
# ✔ functions[api]: Successful create operation.
# Function URL: https://us-central1-culturepass-4f264.cloudfunctions.net/api/
#
# Deployment complete!
```

### Step 3: Verify Functions Deployment
```bash
# Check function exists in Firebase Console
firebase functions:list

# Test an API endpoint:
curl https://us-central1-culturepass-4f264.cloudfunctions.net/api/health 2>/dev/null | jq .

# Or visit in browser:
# https://us-central1-culturepass-4f264.cloudfunctions.net/api/
```

---

## 🌍 Part 3: Deploy ALL (Functions + Hosting) in One Command

### Quick Deploy (Recommended)
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# ONE COMMAND: Build + Deploy everything
npm run deploy-all

# This runs:
# 1. cd functions && npm run build && cd ..
# 2. npm run build-web
# 3. firebase deploy --only functions,hosting
```

### Expected Output
```
✔ functions[api]: Successful create operation.
Function URL: https://us-central1-culturepass-4f264.cloudfunctions.net/api/

✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/culturepass-4f264
Hosting URL: https://culturepass-4f264.web.app
Function URL: https://us-central1-culturepass-4f264.cloudfunctions.net/api/
```

---

## 📱 Part 4: Build iOS App with EAS (Apple App Store)

### Prerequisites
- ✅ EAS CLI installed: `npm install -g eas-cli`
- ✅ EAS authenticated: `eas login`
- ✅ Apple Developer account
- ✅ app.json configured with iOS settings
- ✅ eas.json configured with submission credentials
- ✅ Apple Distribution certificate and App Store provisioning profile registered in EAS
- ✅ Associated Domains, Push Notifications, Sign in with Apple, and App Groups enabled
- ✅ Apple Wallet pass certificate configured if wallet passes are enabled

### Step 1: Update Version Number
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Edit app.json
# Change: "version": "1.0.0" to "1.0.1" (or your release number)
# Change: "ios": { "buildNumber": "1" } to "buildNumber": "2"
```

### Step 2: Build iOS App
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Build for production
eas build --platform ios --profile production

# This will:
# - Ask if you want to build on EAS
# - Create a .ipa file
# - Take ~10-15 minutes
# - Show build ID when complete

# Expected output:
# ✔ Build finished.
# Build URL: https://expo.dev/accounts/@YOUR_USERNAME/builds/...
# Download URL: https://...
```

### Step 3: Submit to App Store
Before submitting the first production build, create the App Store Connect app record:

- App Store Connect → Apps → `+` → New App
- Name: `CulturePass`
- Bundle ID: `au.culturepass.app`
- SKU: `culturepass-ios` or another stable internal SKU
- User Access: Full Access
- Create version `1.1.0` if App Store Connect does not create it automatically

Current restored App Store Connect record:

- ASC App ID: `6761712952`
- URL: `https://appstoreconnect.apple.com/apps/6761712952/distribution/info`

```bash
# Option A: Auto-submit (if credentials in eas.json)
eas submit --platform ios --latest

# Option B: Manual review & submit later
eas submit --platform ios --id=$(eas build:list --limit 1 --json | jq -r '.[0].id')
```

If the build contains app extensions, every target must use the same `CFBundleVersion` as the parent app. Verify before rebuilding:

```bash
rg "CURRENT_PROJECT_VERSION|CFBundleVersion|buildNumber" ios targets app.json
```

### Step 4: Monitor App Store Review
- Go to: https://appstoreconnect.apple.com/
- Sign in with Apple Developer account
- Navigate to: Apps → CulturePass → Builds
- Check review status (typically 24-48 hours)

---

## 🤖 Part 5: Build Android App with EAS (Google Play)

### Prerequisites
- ✅ EAS CLI installed
- ✅ EAS authenticated
- ✅ Google Play Developer account
- ✅ app.json configured with Android settings
- ✅ eas.json configured with submission credentials
- ✅ Android release keystore registered in EAS
- ✅ Google Play service account configured for submit
- ✅ Firebase Android SHA-1/SHA-256 fingerprints configured
- ✅ `public/.well-known/assetlinks.json` contains the Play app-signing SHA-256

### Step 1: Update Version Number
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Edit app.json
# Change: "version": "1.0.0" to "1.0.1"
# Change: "android": { "versionCode": 1 } to "versionCode": 2
```

### Step 2: Build Android App
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Build for production
eas build --platform android --profile production

# This will:
# - Build an APK/AAB
# - Take ~10-15 minutes
# - Output build URL

# Expected output:
# ✔ Build finished.
# Build URL: https://expo.dev/accounts/@YOUR_USERNAME/builds/...
# Download URL: https://...
```

### Step 3: Submit to Google Play
```bash
# Auto-submit to Google Play
eas submit --platform android --latest

# Or specify build ID
eas submit --platform android --id=$(eas build:list --limit 1 --platform android --json | jq -r '.[0].id')
```

### Step 4: Monitor Google Play Review
- Go to: https://play.google.com/console/
- Sign in with Google Account
- Navigate to: CulturePass → Releases → Production
- Check review status (typically 4-24 hours)

---

## 🔄 Part 6: Deploy Web App Again After Mobile Updates (Optional)

If you've made changes to the web app while preparing mobile builds:

```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Rebuild web only (faster)
npm run build-web

# Deploy web only
firebase deploy --only hosting
```

---

## 🐛 Troubleshooting

### Issue: "Invalid project id: YOUR_FIREBASE_PROJECT_ID"
**Solution**: 
```bash
# Make sure .firebaserc has correct project ID
cat .firebaserc
# Should show: "default": "culturepass-4f264"

# If not, run:
firebase use culturepass-4f264
```

### Issue: "firebase: command not found"
**Solution**:
```bash
# Install Firebase CLI globally
npm install -g firebase-tools@latest

# Or use locally
npx firebase-tools@latest deploy --only hosting
```

### Issue: Web deployments fail with "public directory doesn't exist"
**Solution**:
```bash
# Make sure web build was successful
npm run build-web

# Check output exists
ls dist/index.html
```

### Issue: "This deploy is missing valid Firebase web keys (EXPO_PUBLIC_FIREBASE_*)"
**Solution**:
```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# Verify required keys exist in your runtime env
rg "^EXPO_PUBLIC_FIREBASE_" .env

# Hard fail if keys are missing or placeholder values
node scripts/assert-firebase-web-export.mjs

# Rebuild with production env values
npm run build-web
```

### Issue: Functions deployment fails with "Out of memory"
**Solution**:
```bash
# Build functions locally first
cd functions && npm run build && cd ..

# Then deploy
firebase deploy --only functions
```

### Issue: Android links open the browser instead of the app
**Solution**:
```bash
# Confirm the production asset links file contains the Play app-signing SHA-256:
curl https://culturepass.app/.well-known/assetlinks.json

# Confirm Android package and SHA-256 were also added to Firebase:
# Firebase Console → Project settings → Your apps → Android → SHA certificate fingerprints
```

### Issue: iOS Universal Links do not open the app
**Solution**:
```bash
# Confirm Apple association file is reachable and not redirected:
curl -i https://culturepass.app/.well-known/apple-app-site-association

# Confirm app.json keeps associated domains:
rg "associatedDomains|applinks:culturepass.app|webcredentials:culturepass.app" app.json
```

### Issue: EAS build fails because Google values are placeholders
**Solution**:
```bash
# Replace all FILL_ME_IN values in EAS environment config or set EAS env vars:
rg "FILL_ME_IN" eas.json

eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_MAPS_KEY --value "YOUR_KEY"
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "YOUR_CLIENT_ID"
eas env:create --environment production --name EXPO_PUBLIC_GOOGLE_REVERSED_CLIENT_ID --value "YOUR_REVERSED_CLIENT_ID"
```

### Issue: EAS project/account mismatch
**Solution**:
```bash
# The production EAS project should be:
# https://expo.dev/accounts/cultureos/projects/culturepass

eas whoami
eas project:info
rg "\"owner\"|\"projectId\"|\"slug\"" app.json

# Expected:
# owner: cultureos
# slug: culturepass
# projectId: 9dc511ee-ee3e-4798-ae29-30efc8f5343e
```

If the Expo account is wrong, EAS can use the wrong remote credentials. This does not change which Bundle IDs appear in App Store Connect; that list comes from Apple Developer / App Store Connect access for Team `26WGXSNG58`.

---

## 📊 Deployment Summary

| Component | Status | URL | Command |
|-----------|--------|-----|---------|
| **Web (Hosting)** | ✅ Ready | https://culturepass-4f264.web.app | `npm run deploy-web` |
| **Functions** | ✅ Ready | https://us-central1-culturepass-4f264.cloudfunctions.net/api/ | `firebase deploy --only functions` |
| **iOS (App Store)** | ✅ Ready | App Store | `eas build --platform ios` |
| **Android (Play)** | ✅ Ready | Google Play | `eas build --platform android` |

---

## 🎯 Quick Start: Deploy Everything

```bash
cd /Users/cultureos/Documents/CultureOS/CulturePass

# ONE COMMAND: Deploy web + functions
npm run deploy-all

# Wait for confirmation, then check:
# ✓ Web: https://culturepass-4f264.web.app/
# ✓ API: https://us-central1-culturepass-4f264.cloudfunctions.net/api/health
```

---

## ✅ Post-Deployment Verification

### Web App Smoke Test
- [ ] Visit https://culturepass-4f264.web.app/
- [ ] Check Discover page loads events
- [ ] Check Calendar renders with month view
- [ ] Check Communities list loads
- [ ] Check Perks shows discounts
- [ ] Check Login/Signup pages work
- [ ] Check Profile page (if authenticated)

### Cloud Functions Smoke Test
```bash
# Test health endpoint
curl https://us-central1-culturepass-4f264.cloudfunctions.net/api/health

# Expected: { "status": "ok" }
```

### Mobile Apps Smoke Test (After Release)
- [ ] iOS: Download from App Store sandbox, test login
- [ ] Android: Download from Google Play internal testing, test login
- [ ] Both: Verify events load, calendar works, communities display

---

## 📞 Support & Resources

- **Firebase Console**: https://console.firebase.google.com/project/culturepass-4f264
- **EAS Dashboard**: https://expo.dev/accounts/cultureos/projects/culturepass
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Google Play Console**: https://play.google.com/console/
- **Firebase Documentation**: https://firebase.google.com/docs
- **Expo Documentation**: https://docs.expo.dev/

---

## 🔐 Security Reminders

- ✅ Never commit `.env` with real credentials to git (already in .gitignore)
- ✅ Never commit `*.jks`, `*.keystore`, `*.p8`, `*.p12`, `GoogleService-Info.plist`, `google-services.json`, or `google-play-service-account.json`
- ✅ Firebase rules are restrictive (only auth users can read/write)
- ✅ API endpoints require authentication tokens
- ✅ Sensitive environment variables stored in EAS secrets, not in code
- ✅ Web app uses HTTPS everywhere (Firebase Hosting enforces this)

---

**Last Updated**: May 13, 2026
**Next Steps**: Use `npm run deploy-web` for web-only releases, or `npm run deploy` / `npm run deploy-all` for full deploy flows.
