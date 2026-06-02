# CLAUDE.md — CulturePass AI Agent Quickstart

> **Read `TheApp.md` first.** It is the authoritative product + engineering overview.

**CulturePass** is a live B2B2C cultural lifestyle marketplace for diaspora communities (iOS, Android, Web since 15 April 2026). It connects users to events, businesses, venues, communities, memberships, and perks worldwide.

---

## 1. Critical Import & Usage Rules (Violations break the system)

### Design Tokens — Single Source of Truth
```ts
// ✅ CORRECT — always
import {
  Colors, TextStyles, Elevation, Spacing, Radius,
  ButtonTokens, CardTokens, InputTokens, AvatarTokens,
  TabBarTokens, ChipTokens, HeaderTokens, ZIndex, IconSize,
  LiquidGlassTokens, LiquidGlassAccents, MaterialExpressive,
  SignatureGradient, CultureTokens, gradients, glass, neon,
  Luxe, LuxeTextStyles, luxeGradients,
} from '@/design-system/tokens/theme';

// ❌ NEVER
import ... from '@/constants/theme';
import ... from './theme'; // local copy
// Never hardcode hex values for brand colors, spacing, radius, typography.
```

**Brand colors (2026)** live only in `CultureTokens`:
- `indigo` `#4F46E5` (primary)
- `violet` `#9333EA`
- `coral` `#FF5E5B` (CTA)
- `gold` `#FFC857` (membership chrome only — not for readable text)
- `teal` `#0D9488`

`SignatureGradient` (violet → coral) is reserved for hero/onboarding/flagship CTAs — **max one per screen**.

### API Access — One Entry Point Only
```ts
// ✅ ONLY way to talk to the backend
import { api } from '@/lib/api';

const events = await api.events.list({ city: 'Sydney', page: 1 });
const me = await api.auth.me();
const ticket = await api.tickets.scan({ qrCode });
```

- All namespaces are defined in `src/platform/api/endpoints/*` and wired in `src/lib/api.ts`.
- Never use `fetch`, `axios`, or direct Firestore in client code.
- Use `ApiError` from `@/lib/api` for classification (especially `ApiError.isUnauthorized()`).

### Color Hooks — Strict Separation
```ts
// M3 components (M3TopAppBar, M3Button, M3Card, M3FilterChip, etc.)
import { useM3Colors, useM3Color } from '@/hooks/useM3Colors';

// Everything else (legacy + custom surfaces)
import { useColors } from '@/hooks/useColors';

// ❌ NEVER mix useColors() + useM3Colors() in the same component.
```

### Layout & Platform Insets
```ts
// ✅ CORRECT — always
// Use the web-aware hook for proper iOS Safari / Dynamic Island support on mobile web
const insets = useSafeAreaInsetsWeb();
const topInset = insets.top;

// ❌ WRONG — never hardcode the old 67px top bar value
```

Use `useLayout()` for responsive decisions (`isCompact`, `isDesktop`, `breakpoint`).

### Auth & Role Hooks
- `useAuth()` only inside React components (module-level token store lives in `lib/query-client.ts`).
- Role checks: `useRole()` or `api.auth.me()`.
- Server enforces via `requireRole(...)` + custom claims. Client checks are UX only.

### Feature Flags
```ts
import { useFlagOverride } from '@/lib/feature-flags';

const { value: showV2 } = useFlagOverride('eventcard-v2');
// Defaults to EventCardV1. V2 is the Mode-C visual layer.
```

### Event Cards
`EventCard` (in `src/modules/events/components/EventCard.tsx`) is a dispatcher:
- Reads `eventcard-v2` flag.
- Renders `EventCardV1` or `EventCardV2`.
- When V2 reaches 100% rollout, replace the dispatcher with a direct re-export of V2 and delete V1.

---

## 2. Engineering Rules (from TheApp.md)

### Never
- Use `any` — use `Record<string, unknown>` or types from `shared/schema`.
- Write raw `<Pressable>` for buttons — use the design-system `<Button>` or M3 variants.
- Call `useAuth()` or `useColors()` outside a React component.
- Use `AsyncStorage` directly — use `src/lib/storage.ts`.
- Import `@sentry` — use `console.error` + `captureRouteError`.
- Hardcode hex values — use design tokens.
- Use `console.log` in production code — guard with `if (__DEV__)`.

### Always
- Call the backend through `api.*` from `src/lib/api.ts`.
- Import images via `expo-image` (better caching + glass-aware skeletons).
- Wrap async-data screens with `<ErrorBoundary>`.
- Handle 401s with `ApiError.isUnauthorized()`.
- Add `accessibilityLabel` to every interactive element.
- Test on iOS, Android, **and** Web before opening a PR.

### Layout Rules (Web vs Native)
- Desktop ≥ 1100px: 240px left `WebSidebar` with compact theme, local time/date, and weather chrome.
- Tablet / iPad: Bottom tab bar (safe areas respected via `useSafeAreaInsetsWeb()`).
- Mobile web (iPhone/Android): Bottom tab bar + proper Dynamic Island / home indicator via CSS `env(safe-area-inset-*)`.

Visible bottom tabs: Discover · Calendar · Community · City · My Space (Perks also present in current layout).

Hidden from tab bar (`href={null}`): CultureX, Host, Profile (deep), Directory, Dashboard, Menu.

---

## 3. How to Add a New Endpoint (Canonical Path)

1. **Shared contract** — add types to `shared/schema/` (or extend existing).
2. **Backend**:
   - Add route handler in `functions/src/handlers/<domain>.ts`.
   - Implement business logic in `functions/src/services/<domain>.ts`.
   - Add validation (Zod) + middleware (`requireAuth`, `requireRole`, `slidingWindowRateLimit`, `moderationCheck`).
3. **Client namespace** — create or extend in `src/platform/api/endpoints/<domain>.ts`.
4. **Wire it** — import and attach in `src/lib/api.ts` under the correct namespace.
5. **Client usage** — call via `api.<namespace>.<method>(...)`.
6. **Tests** — unit (handler/service) + integration where possible.

---

## 4. Key Files & Directories (Start Here)

| File | Purpose |
|------|---------|
| `TheApp.md` | Product vision, stack, quickstart, engineering rules, roadmap |
| `docs/ARCHITECTURE.md` | System design, principles, HostSpace deep dive, risks |
| `src/lib/api.ts` | Complete typed client surface (all `api.*` methods) |
| `src/design-system/tokens/theme.ts` | Master design token export + component tokens |
| `shared/schema.ts` | Re-exports every domain type (the contract) |
| `src/platform/api/endpoints/` | 30+ typed API namespaces (client factories) |
| `functions/src/handlers/` | 33 thin Express routers |
| `functions/src/services/` | 31 Firestore-backed business logic services |
| `functions/src/middleware/auth.ts` | Role hierarchy, `requireRole`, `isOwnerOrAdmin`, token freshness |
| `src/hooks/useLayout.ts` | Responsive breakpoint engine |
| `src/modules/host/` | Most sophisticated subsystem (157 files) — study before touching |

---

## 5. Common Pitfalls & Anti-Patterns

- Treating HostSpace create as "just forms" — it is a versioned, draftable, verification-aware, polymorphic profile platform (see ADR-001).
- Bypassing the API layer for "speed" — this breaks auth, validation, moderation, analytics, and rate limiting.
- Mixing M3 and legacy color systems in one component.
- Hardcoding top bar height or assuming iOS-only safe area.
- Using direct Firestore listeners in the client (the app is API-first).
- Forgetting that web is a static export + Firebase Hosting rewrites (`/api/**` → Functions).
- Ignoring the two-layer host verification model (Layer 1 = organizer role; Layer 2 = regulated entity verification).

---

## 6. Development Workflow

```bash
npm install
cd functions && npm install && cd ..

# Local dev
npx expo start
firebase emulators:start --only functions,firestore,auth,storage

# Quality gates (run before every PR)
npm run typecheck
npm run lint
npm run qa:solid          # full gate

# Seed emulator test data
npm run emulator:seed:cap
```

**Deploy order**: Cloud Functions **before** client when API contracts change.

---

## 7. References

- Full product + engineering reference: [TheApp.md](./TheApp.md)
- Architecture deep dive: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- ADRs: `docs/ADRs/`
- Design principles: `docs/DESIGN_PRINCIPLES.md` (when present)
- Agent skills: `.agents/skills/` (Firebase, Genkit, etc.)

**When in doubt**: Re-read TheApp.md sections on "Engineering rules", "Design system", and "Architecture". Then ask.

---

*This file is intentionally concise and actionable. Deep context lives in TheApp.md and docs/ARCHITECTURE.md.*
