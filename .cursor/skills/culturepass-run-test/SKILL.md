---
name: culturepass-run-test
description: >-
  Runs and tests the CulturePass (CulturePass) Expo app, Cloud Functions, and
  scripted checks. Use when setting up a cloud agent workspace, running the dev
  server, configuring EXPO_PUBLIC_* / emulators, exercising feature flags, or
  executing lint/typecheck/tests/QA scripts without guessing commands.
---

# CulturePass — run & test (agent starter)

**Mirror:** keep this file identical to **`.claude/skills/culturepass-run-test/SKILL.md`** (update both when changing).

Authoritative architecture and rules live in **`AGENTS.md`** and **`CLAUDE.md`**. This skill is a **minimal runbook**: install → env → run → test by area.

---

## 0. First-time setup (repo root)

```bash
cd /path/to/xCxPxAx
npm install
cd functions && npm install && cd ..
```

Copy **`.env.example` → `.env`** and fill at least the **`EXPO_PUBLIC_*`** block (Firebase web app + `EXPO_PUBLIC_API_URL`). Never commit `.env`. Expo loads `.env` for CLI commands (see `npx expo start` / lint).

**Two installs:** root = Expo app + tooling; **`functions/`** = Cloud Functions (separate `package.json`).

---

## 1. Starting the app

| Goal | Command |
|------|---------|
| Dev server (QR / native / web from menu) | `npm start` → `npx expo start` |
| Web only | `npm run web` → `expo start --web` |
| iOS simulator (native build) | `npm run ios` |
| Android | `npm run android` |

Agents usually validate **web** fastest: `npm run web`, open the printed localhost URL.

**Auth / “logging in”:** There is no CLI login. Use the in-app **Sign in** flow (Firebase Auth). For **local emulators**, seed a test user with `SEED_TEST_EMAIL` / `SEED_TEST_PASSWORD` (see **`CLAUDE.md` → Local Development**) then run `npm run emulator:seed:cap` after emulators are up.

---

## 2. Environment & API routing (all clients)

| Variable | Role |
|----------|------|
| `EXPO_PUBLIC_API_URL` | HTTP API base (Cloud Functions `api`); trailing slash optional. |
| `EXPO_PUBLIC_USE_FIREBASE_EMULATORS` | `true` to point Auth/Firestore/etc. at emulators (see **`src/lib/firebase.ts`**). |
| `EXPO_PUBLIC_FIREBASE_*` | Required for real Firebase; **web export in CI** often uses mocks (below). |

**Local Functions HTTP (typical):**  
`EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/`  
(see **`CLAUDE.md`** emulator URL.)

**`src/lib/query-client.ts`** chooses API base for web vs native vs localhost; read that file if the app hits the wrong host.

**Mock Firebase for web bundle only (no real keys):**  
`npm run build-web:with-mock-firebase` — sets placeholder `EXPO_PUBLIC_FIREBASE_*` for **`expo export --platform web`** so CI/agents can build without secrets.

---

## 3. Feature flags (no special “login”)

- Client: **`src/lib/feature-flags.ts`** — `GET {API}/api/rollout/flags` with `userId` (+ optional `segment` query). On failure or offline behavior, code falls back to **`DEFAULT_FLAGS`** (see same file).
- **Mocking / forcing:** Point `EXPO_PUBLIC_API_URL` at a stub that returns JSON matching **`FeatureFlagsResponse`**, or patch the rollout route in **Functions** (`functions/src/` rollout service) in a dev branch. There is no single env var that toggles every flag locally.
- Native cache: `@culturepass_flags_cache` in AsyncStorage (TTL ~5 min); clear app data or wait TTL when testing flag changes.

---

## 4. Firebase emulators + Functions (optional integration)

```bash
firebase emulators:start --only functions,firestore,auth,storage
# optional seed (requires SEED_* in env):
npm run emulator:seed:cap
```

Set **`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`** (and emulator host vars from **`.env.example`**) so the app talks to emulators. **Deploy order:** when adding HTTP routes, deploy **Functions before** shipping app changes that depend on them (**`AGENTS.md`**).

---

## 5. Testing by codebase area

### A. Root — TypeScript app (Expo Router, `src/app/`, `src/components/`, `src/lib/`)

| Step | Command |
|------|---------|
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` |
| Package sanity | `npm run test:package-json` |
| Deep links / app.json | `npx tsx scripts/tests/test-deeplinks.ts` |

**Jest (hooks / use-cases / pipeline):** tests under **`src/hooks/__tests__/`**, **`src/use-cases/__tests__/`**, **`pipeline/queue/__tests__/`** — run with **`npx jest <path>`** (root **`jest.config.js`**). Not all of these are chained into `npm run test:unit`; run targeted paths when changing those modules.

### B. Scripted “unit” suite (no Jest)

```bash
npm run test:unit
```

Runs **`scripts/tests/unit-*.ts`** (middleware, locations, Functions authz policy, profiles schema, etc.) via **`tsx`**. Add new files here and **append** to the `test:unit` script in root **`package.json`** if they should gate **`qa:all`**.

### C. Integration / smoke / web hygiene

| Command | What it checks |
|---------|----------------|
| `npm run test:integration` | HTTP API route smoke (`scripts/tests/integration-api-routes.ts`) |
| `npm run test:e2e:smoke` | Critical path smoke |
| `npm run test:web:route-hygiene` | Exported web HTML routes (`dist/` after export, or as script defines) |

### D. Cloud Functions (`functions/`)

```bash
npm run functions:build   # from repo root
# or
cd functions && npm run build && npm run lint
```

Uses **`tsc`** then copies CSV data into **`lib/`**. After editing **`functions/src/`**, always run **`functions:build`** before claiming the backend compiles.

### E. Full web export (heavy)

```bash
npm run build-web:with-mock-firebase
```

Used in **`npm run qa:solid`**. Needs network/CPU time; use for pre-merge confidence, not every edit.

### F. One-shot QA (recommended before PR)

```bash
npm run qa:solid
```

Runs **lint → typecheck → `qa:all` → `functions:build` → mock-firebase web export → web route hygiene**. This is the project’s main **agent-safe** quality bar when secrets are not available.

---

## 6. `server:dev` (optional)

`npm run server:dev` runs **`tsx scripts/server-dev.ts`** — a local HTTP helper (see script) used when the app should hit **`localhost:5050`** instead of Cloud Functions. Use when **`src/lib/query-client.ts`** falls back to 5050 or when README/CLAUDE mentions it.

---

## 7. Updating this skill

When you discover a new trick (env var, script, emulator quirk, test file location):

1. **Add it here** in the smallest section that fits (or a new subsection under §5).
2. If the command is **stable and repo-wide**, add or reference it in root **`package.json`** `scripts` and point this skill at the script name.
3. If behavior is **policy** (e.g. deploy order, never commit `.env`), prefer a single line + link to **`AGENTS.md`** / **`CLAUDE.md`** instead of duplicating long rules.
4. **Keep mirrors in sync:** **`.cursor/skills/culturepass-run-test/SKILL.md`** and **`.claude/skills/culturepass-run-test/SKILL.md`** should stay identical (edit both).

Keep this file **short**; long explanations belong in **`CLAUDE.md`** or **`docs/`**.
