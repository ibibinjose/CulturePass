# CulturePass Monorepo — Workspace Guide

Two Expo apps, one Firebase project, one codebase. This file is the single source of truth for how to work across both apps.

---

## Architecture at a Glance

```
CulturePass/                          ← git root
├── src/                              ← CulturePass (consumer app)
├── host-app/                         ← CultureHost (host / creator app)
│   ├── src/
│   │   ├── app/                      ← Expo Router screens
│   │   ├── design-system/            ← thin re-exports → consumer design-system
│   │   ├── hooks/                    ← thin re-exports → consumer hooks
│   │   ├── lib/                      ← thin re-exports → consumer lib
│   │   └── shared/schema.ts          ← re-exports → ../../shared/schema
│   ├── metro.config.js               ← watchFolders + package deduplication
│   ├── babel.config.js               ← @/ → src/, @consumer → ../src/, @shared → ../shared/
│   └── tsconfig.json                 ← path aliases + @tanstack deduplication
├── functions/                        ← Cloud Functions (shared by both apps)
├── shared/                           ← TypeScript types (shared by both apps)
├── package.json                      ← consumer app (root)
└── WORKSPACES.md                     ← this file
```

---

## One Firebase, Two Apps

**Both apps use the exact same:**
- Firebase project: `culturepass-4f264`
- Firebase Auth (same users, same sessions — a user logged in to CulturePass is the same account on CultureHost)
- Firestore database (same collections, same documents)
- Cloud Functions / REST API (`/api/...` endpoints)
- Firebase Storage (same media bucket)
- Stripe Connect integration

**This is intentional.** CulturePass and CultureHost are complementary surfaces of the same platform:

| CulturePass | CultureHost |
|-------------|-------------|
| Discovers events, buys tickets, joins communities | Creates events, manages listings, checks in attendees |
| Consumer (fans, community members) | Producer (organisers, venue managers, community leaders) |
| `au.culturepass.app` | `au.culturepass.host` |

Same Firebase config values go into both apps' `.env` / `eas.json`.

---

## Module Resolution

CultureHost's `@consumer/*` alias points to the consumer app's `src/`. This means:

```
host-app import            resolves to
──────────────────────────────────────────────────────
@/lib/query-client    →    host-app/src/lib/query-client.ts
                           (which re-exports @consumer/lib/query-client)
@consumer/lib/auth    →    ../src/lib/auth.tsx (consumer's auth)
@shared/schema        →    ../shared/schema (workspace root types)
@/shared/schema       →    ../shared/schema (via tsconfig fallback)
```

When a consumer file imported via `@consumer/` makes an `@/` import internally, Metro/TypeScript resolves it through host-app's `src/` first, then falls back to `../src/`. This is why re-export stubs exist in `host-app/src/` for every file the consumer code references.

**Never import from `@consumer/` directly in host-app screens.** Always go through the `@/` re-export wrappers so the resolution chain stays clean.

---

## Daily Development

### Start CulturePass (consumer)
```bash
# From repo root
npm install
npx expo start
```

### Start CultureHost
```bash
cd host-app
npm install
npx expo start
```

Both can run simultaneously — they use different ports (Metro uses 8081 by default; start the second app with `--port 8082` if needed).

### Local emulators (both apps)
```bash
# From repo root — starts Auth, Firestore, Functions, Storage
firebase emulators:start --only auth,functions,firestore,storage

# Set in each app's .env:
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/
```

---

## Quality Gates

### Consumer app
```bash
# From repo root
         # TypeScript check (host-app excluded)
npm run lint               # ESLint
npm run qa:solid           # Full gate: lint + typecheck + tests + build
```

### CultureHost
```bash
cd host-app
npm run typecheck          # TypeScript check
npm run lint               # ESLint
```

Both typechecks must be clean before any PR or deploy.

---

## Building and Submitting

### Node version requirement
Both apps require **Node 22.14.0**. Use nvm:
```bash
nvm use 22.14.0   # or: nvm install 22.14.0
```

### Consumer app (CulturePass)
```bash
# From repo root — bump app.json version + ios.buildNumber / android.versionCode first
npm run build:ios:production
npm run build:android:production
npm run submit:ios:production
npm run submit:android:production
```

### CultureHost
```bash
# From host-app/ — bump app.json version first
cd host-app
npm run build:ios:production
npm run build:android:production
npm run submit:ios:production
npm run submit:android:production
```

### Web (consumer only)
```bash
# From repo root
npm run deploy-web         # expo export → dist/ + firebase deploy --only hosting
```

> CultureHost web is served at `host.culturepass.app`. To deploy it add a separate Firebase Hosting target for `host-app/dist/` (or Expo EAS Hosting).

### OTA updates
```bash
# Consumer
npm run update:production

# CultureHost
cd host-app && npm run update:production
```

---

## Adding New Features

### Feature that only affects consumers (fans, ticket buyers)
→ Work in `src/` as normal. CultureHost is unaffected.

### Feature that only affects hosts (organiser dashboard, scanner, event create)
→ Work in `host-app/src/`. Nothing in `src/` changes.

### Shared backend change (new API endpoint, schema type, Firestore field)
1. Update `functions/src/handlers/<domain>.ts` — add the endpoint
2. Update `shared/schema/<domain>.ts` — add the TypeScript type
3. Deploy Functions first: `cd functions && npm run build && firebase deploy --only functions`
4. Then update whichever app(s) consume it

**Deploy order is always: Functions → App(s). Never reverse.**

### New design token or component
→ Add to `src/design-system/` in the consumer. CultureHost picks it up automatically via the `@consumer/` alias — no duplication needed.

---

## EAS Setup for CultureHost (one-time)

CultureHost needs its own EAS project registered:

```bash
cd host-app
npx eas init              # creates a new project in your Expo account
# Update the projectId in host-app/app.json "extra.eas.projectId"
# Update the updates URL in host-app/app.json "updates.url"
# Update "FILL_ME_IN" values in host-app/eas.json
```

Also update App Store Connect:
- Create a new app: `CultureHost`, bundle ID `au.culturepass.host`
- Update `ascAppId` in `host-app/eas.json` submit.production.ios

---

## Firebase Hosting Setup for CultureHost (one-time)

Add a hosting target in `firebase.json` (consumer repo root):

```json
{
  "hosting": [
    {
      "target": "consumer",
      "public": "dist",
      "...": "..."
    },
    {
      "target": "host",
      "public": "host-app/dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

Then:
```bash
firebase target:apply hosting consumer culturepass-app
firebase target:apply hosting host culturehost-app
# Build both, then:
firebase deploy --only hosting:host
```

---

## Adding a New Screen to CultureHost

1. Create file in `host-app/src/app/` following Expo Router conventions
2. Use `@/hooks/useColors`, `@/hooks/useM3Colors`, `@/hooks/useLayout` (all resolve through re-export wrappers to the consumer's implementations)
3. Import tokens from `@/design-system/tokens/theme`
4. Use `@/lib/api` for API calls — same typed API client as the consumer app
5. Add a navigation entry in `host-app/src/app/(tabs)/_layout.tsx` if it's a new tab

---

## Assets

CultureHost currently uses the **same icons/splash as CulturePass** (copied as placeholders). When you have final CultureHost brand assets:

```bash
# Replace these files in host-app/assets/images/:
icon.png              ← 1024×1024, no transparency
splash-icon.png       ← 200×200+ centred on transparent bg
favicon.png           ← 48×48
android-icon-foreground.png ← adaptive icon foreground

# Then regenerate splash screens:
cd host-app && npm run generate:splash  # add this script once expo-splash-screen is wired
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `host-app/metro.config.js` | Watches workspace root; deduplicates React, Firebase, TanStack |
| `host-app/babel.config.js` | `@consumer` + `@shared` aliases |
| `host-app/tsconfig.json` | Path aliases; `@/` falls back to `../src/` for consumer deps |
| `host-app/src/lib/reporting.ts` | Standalone stub (not re-exported; auth.tsx uses `logError`) |
| `tsconfig.json` (root) | Excludes `host-app/` from consumer typecheck |
| `shared/schema/` | Authoritative TypeScript types used by both apps + Functions |
| `functions/src/handlers/` | All REST endpoints — shared by both apps |
