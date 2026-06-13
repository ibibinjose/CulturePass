# culturepass-rules.md — Strict Coding & Design Rules

> This is the **enforcement layer**. These rules are non-negotiable. They exist because past violations created real user-facing and maintenance pain.

**Read in order**: `TheApp.md` → `CLAUDE.md` → this file.

---

## NEVER (Hard Rules — Will Fail Review or Break Things)

### 1. Design System
- **Never** import design tokens from `@/constants/theme` or any local copy.
  - Always: `import { ... } from '@/design-system/tokens/theme'`
- **Never** hardcode brand hex values (`#4F46E5`, `#9333EA`, `#FF5E5B`, `#FFC857`, etc.).
- **Never** invent new spacing, radius, or typography scales outside the token system.
- `SignatureGradient` (violet → coral) — **maximum one per screen**. Reserve for hero/flagship CTAs.

### 2. API Layer
- **Never** call `fetch`, `axios`, or any raw HTTP in client code.
- **Never** access Firestore directly from the client (the app is API-first).
- **Never** bypass `src/lib/api.ts`. All backend communication must go through a namespaced method on the exported `api` object.

### 3. Color Hooks
- **Never** mix `useColors()` and `useM3Colors()` in the same component.
- M3 components (`M3Button`, `M3Card`, `M3TopAppBar`, `M3FilterChip`, etc.) must use `useM3Colors()` / `useM3Color()`.
- Legacy + custom surfaces use `useColors()`.

### 4. Auth & Hooks
- **Never** call `useAuth()` or `useColors()` (or any hook) outside a React component body.
- The module-level token store (`setAccessToken` / `getAccessToken` in `lib/query-client.ts`) exists precisely to obey this rule.

### 5. AsyncStorage
- **Never** use `AsyncStorage` directly.
- Use `src/lib/storage.ts` (or the repository layer).

### 6. Error & Monitoring
- **Never** import `@sentry/*`.
- Use `console.error` + `captureRouteError` (from `src/lib/reporting.ts` or handler utils).

### 7. Console & Debug
- **Never** leave `console.log` / `console.warn` in production paths.
- Guard with `if (__DEV__)` or use the structured logger.

### 8. Event Cards
- **Never** edit `EventCardV1.tsx` or `EventCardV2.tsx` directly for new features.
- Route all changes through the dispatcher in `EventCard.tsx` (feature-flagged via `eventcard-v2`).
- The goal is eventual 100% V2 rollout, after which V1 and the dispatcher will be removed.

### 8b. Event Detail Info Document
- **Always** surface organiser, date/time range, location, event type, category, calendar export, and share actions via `EventInfoDocument` — never hide these rows when data is partial; use `DISPLAY_FALLBACK` from `src/lib/presentation.ts`.
- Spec: `docs/EVENT_DETAIL_UI.md`.

### 9. Layout Hardcoding
- **Never** hardcode the old `67px` top bar value.
- Always compute: `const topInset = Platform.OS === 'web' ? 0 : insets.top;`

### 10. TypeScript
- **Never** use `any`.
- Use `Record<string, unknown>`, proper generics, or types re-exported from `@/shared/schema`.

---

## ALWAYS (Mandatory Patterns)

### 1. API Calls
```ts
import { api } from '@/lib/api';
const data = await api.events.list({ city, category, page });
```

### 2. Design Tokens
```ts
import { Spacing, Radius, CultureTokens, TextStyles, ButtonTokens } from '@/design-system/tokens/theme';
```

### 3. Error Boundaries
- Wrap every screen that performs async data fetching with `<ErrorBoundary>`.

### 4. 401 Handling
- Use `ApiError.isUnauthorized()` (exported from `@/lib/api`).

### 5. Accessibility
- Every interactive element must have an `accessibilityLabel` (or be wrapped in a component that provides one).

### 6. Testing Surface
- Before opening a PR: test on **iOS + Android + Web** (especially web desktop ≥1024px sidebar layout).

### 7. Image Loading
- Use `expo-image` (`CultureImage` or direct) for all remote images — it provides caching + glass-aware skeleton behavior.

### 8. Feature Flags (when applicable)
- Use `useFlagOverride('flag-name')` from `@/lib/feature-flags`.
- Current example: `eventcard-v2`.

---

## Event Card Specific Rules

1. `EventCard` (the public export) is a **dispatcher only**.
2. Visual/UX changes belong in `EventCardV2` (Mode-C layer).
3. Behavioral parity between V1 and V2 is mandatory while both exist.
4. Date text must use `TextStyles.eventCardDate` + `useColors().eventDate` (light) or `useColors().eventDateOnMedia` (on dark hero).
5. **Never** use gold/yellow for event dates or primary card labels.

---

## HostSpace / FormWizard Rules

- The `FormWizard` (6-step, versioned, draftable, verification-aware) is the **canonical engine** for rich host profile creation (ADR-001).
- Lighter dedicated forms exist for non-profile content (events, offers, marketplace listings, communities) — these are intentionally lighter.
- Any change to draft saving, versioning, validation, or verification flow must touch the shared wizard primitives first.
- Accessibility utilities inside the wizard are high-quality — extend them rather than duplicating.

---

## Web Layout Rules

| Breakpoint     | Layout                              | topInset |
|----------------|-------------------------------------|----------|
| Desktop ≥1024  | 240px left `WebSidebar` + content   | 0        |
| Tablet 768-1023| Bottom tab bar                      | 0        |
| Mobile native  | Bottom tab bar + safe area          | insets.top |

- `WebSidebar` lives in `src/modules/core/layout/web/WebSidebar.tsx`.
- Use `useLayout()` to drive conditional rendering of rails/sidebars.

---

## Role & Permission Rules (Summary)

Server is authoritative (`functions/src/middleware/auth.ts`):
- `requireRole('admin')` protects admin router.
- `requireRole('moderator')` or higher for host application review.
- `isOwnerOrAdmin(ownerId)` and `isOwnerOrCityAdmin(ownerId, city)` helpers.
- Token freshness (`requireFresh()`) required for sensitive mutations.

Client role checks are **UX only** — never trust them for security.

---

## File Placement Heuristics

| What you're building       | Primary location                          |
|----------------------------|-------------------------------------------|
| New screen / route         | `src/app/` (use existing group if possible) |
| Complex feature            | `src/modules/<feature>/`                  |
| Shared UI primitive        | `src/design-system/ui/` (if M3-ish) or `src/components/` |
| New API namespace          | `src/platform/api/endpoints/<domain>.ts` → wire in `lib/api.ts` |
| Backend route              | `functions/src/handlers/<domain>.ts` + service |
| Shared type                | `shared/schema/<domain>.ts`               |
| Design token / component token | `src/design-system/tokens/`            |

---

## Quick Sanity Checklist (Before Every Commit)

- [ ] No raw hex outside `design-system/tokens/`
- [ ] All API calls go through `api.*`
- [ ] No `useAuth()` / `useColors()` calls outside components
- [ ] No `any` (or justified `// @ts-expect-error` with comment)
- [ ] `accessibilityLabel` present on interactive elements
- [ ] Tested on web desktop + at least one mobile simulator
- [ ] `npm run typecheck && npm run lint` passes

---

## When These Rules Conflict

1. Prefer the rule that protects **trust & reliability** (creators' money, user data, verification states).
2. Prefer the rule that keeps the **design system** as the single source of truth.
3. Prefer the rule that keeps the **API layer** as the single source of truth.
4. If still unclear, open a discussion referencing this file + the relevant ADR.

---

*These rules were extracted from real pain. They will evolve only when the underlying architecture or design system changes. Update this file + TheApp.md + CLAUDE.md together.*

**Last sync**: See git history for this file.
