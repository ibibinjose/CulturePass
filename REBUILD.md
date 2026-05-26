# CulturePass — Rebuild from Zero (Clean Slate Guide)

This document contains the exact commands to completely rebuild the project from scratch on a new machine or after major corruption.

## 1. Prerequisites

- Node.js 22.14.x (use nvm or fnm)
- Xcode + Command Line Tools (macOS)
- Android Studio + SDK (for Android)
- Firebase CLI (`npm i -g firebase-tools`)
- EAS CLI (`npm i -g eas-cli`) — recommended for production builds

## 2. Full Nuclear Cleanup

```bash
# From project root
rm -rf node_modules
rm -rf .expo
rm -rf ios android
rm -rf dist
rm -rf web/app          # leftover from previous web attempts
rm -rf functions/node_modules

# Clear all possible caches
rm -rf $TMPDIR/metro-* $TMPDIR/haste-* $TMPDIR/react-* 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true
```

## 3. Fresh Dependency Install

```bash
npm install --legacy-peer-deps
```

(If you need to work on Firebase Functions separately)

```bash
cd functions && npm install --legacy-peer-deps
```

## 4. Clean Native Projects (iOS + Android)

```bash
npx expo prebuild --clean --platform all
```

**Note on Widgets (Apple Targets):**
- The `@bacons/apple-targets` plugin is currently enabled.
- If the above command fails with Xcode project errors, temporarily comment it out in `app.config.js`, run prebuild, then uncomment it for EAS builds.

## 5. iOS Specific Steps

```bash
cd ios
pod install --repo-update
cd ..
```

Then open `ios/CulturePass.xcworkspace` in Xcode and build, or run:

```bash
npx expo run:ios
```

## 6. Android Specific Steps

```bash
npx expo run:android
```

Or open the `android/` folder in Android Studio.

## 7. Web Development / Build

```bash
# Dev
npx expo start --web --clear

# Production static export (recommended for Firebase Hosting)
npx expo export --platform web --output-dir dist --clear
```

## 8. Start Clean Development Server

```bash
npx expo start --clear
```

## 9. Firebase / Backend

```bash
# From project root
firebase emulators:start --only functions,firestore,auth

# Or deploy
cd functions && npm run deploy
```

## 10. Common Post-Cleanup Fixes

- If you see profile sync errors: Make sure the backend API is running (emulator or deployed).
- If deep links don't work: Run the app once so it registers the scheme, then test `culturepass://` links.
- For widgets to appear on device: You must build with the `@bacons/apple-targets` plugin enabled via EAS or manual Xcode configuration.

## Recommended Daily Workflow

```bash
# Morning / after pulling changes
npm install --legacy-peer-deps
npx expo start --clear
```

---

**Last updated:** After the major 2026 rebuild pass (Expo Router entry fix, NavigationMetadata consolidation, clean prebuild, etc.)

Maintained by the CulturePass engineering team.
