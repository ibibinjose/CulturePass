# CultureHost — CLAUDE.md

Creator hub companion app for event organisers, venue managers, and cultural community leaders.

---

## What this app is

A focused Expo app for **hosts** only — not a consumer app. Lives alongside the main consumer app in the same repo but is built, deployed, and submitted independently.

- **Bundle ID (iOS)**: `au.culturepass.host`
- **Package (Android)**: `au.culturepass.host`
- **URL scheme**: `culturehost://`
- **Web**: `https://host.culturepass.app`
- **Same Firebase project** as the consumer app (`culturepass-4f264`)

## Repo layout

```
CulturePass/
├── src/                   ← consumer app (untouched)
├── host-app/              ← THIS app
│   ├── src/
│   │   ├── app/           ← Expo Router screens
│   │   │   ├── _layout.tsx
│   │   │   ├── +not-found.tsx
│   │   │   ├── (auth)/login.tsx
│   │   │   └── (tabs)/    index | events | scanner | create
│   │   ├── design-system/ ← thin re-export wrappers → consumer's design-system
│   │   ├── hooks/         ← thin re-export wrappers → consumer's hooks
│   │   ├── lib/           ← thin re-exports + reporting stub
│   │   └── shared/schema.ts → re-exports from ../../shared/schema
│   ├── babel.config.js    ← @/ → src/, @shared → ../shared, @consumer → ../src
│   ├── metro.config.js    ← watchFolders includes workspace root
│   └── package.json
├── functions/             ← shared Cloud Functions (no changes needed)
└── shared/                ← shared TypeScript types
```

## Module resolution

`@consumer/*` → `../src/*` (consumer app's source)
`@shared/*`   → `../shared/*` (workspace-root shared types)
`@/*`         → `./src/*` (host-app's own source)

Metro's `watchFolders` includes the workspace root so all cross-app imports resolve correctly.

## Tabs

| Tab | Route | Purpose |
|-----|-------|---------|
| Dashboard | `(tabs)/index.tsx` | Stats overview, quick actions, upcoming events |
| Events | `(tabs)/events.tsx` | Manage events (filter by status, edit, publish) |
| Scanner | `(tabs)/scanner.tsx` | QR ticket scanner + manual check-in |
| Create | `(tabs)/create.tsx` | Create hub: Event / Community / Listing / Venue |

## Dev

```bash
cd host-app
npm install
npx expo start          # native + web
npx expo start --web    # web only
```

Set env vars in `host-app/.env` (copy from `.env.example`). Uses the same Firebase project as the consumer app — no new Firebase setup needed.

## Build & submit

```bash
cd host-app
npm run build:ios:production
npm run submit:ios:production
npm run build:android:production
npm run submit:android:production
```

Register the EAS project first: `eas init` inside `host-app/`, then update the `projectId` in `app.json`.

## Design tokens

Import from `@/design-system/tokens/theme` — resolves via the `@consumer` alias chain to the consumer app's design-system. No duplication; token changes in the consumer app propagate automatically.

## Auth

Same Firebase Auth as the consumer app. The `AuthProvider` and `useAuth()` hook are re-exported from the consumer's `lib/auth.tsx`. Login screen is `(auth)/login.tsx`.

## What to build next

- Event create/edit screens (deep-link into consumer's `/create/event` or build native forms here)
- Attendee list screen per event (tickets + check-in status)
- Revenue / payout summary screen (Stripe Connect)
- Push notification settings for organizers
- Analytics dashboard (event views, conversion, geographic breakdown)
