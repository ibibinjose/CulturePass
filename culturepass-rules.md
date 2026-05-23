# CulturePass — Rules & Patterns Reference

> Full project structure → `CLAUDE.md`. Design principles → `docs/DESIGN_PRINCIPLES.md`.
> This file covers: NEVER/ALWAYS, UI standard, design tokens, colors, API patterns, platform specifics.

### Product naming

- Default: **CulturePass** (matches `app.json` → `expo.name` and `APP_NAME`).
- Australia-only surfaces: **CulturePass AU** (`APP_NAME_AU` in `lib/app-meta.ts`).
- Avoid legacy **CulturePassAU** (no space) in comments, docs, or user-visible strings.

---

## NEVER Do

- Call hooks (`useAuth`, `useColors`, etc.) outside a React component
- Use `any` type — use `Record<string, unknown>` + explicit casts or type narrowing
- Hardcode hex colors, spacing, or font sizes in components — use `useColors()`, `Spacing`, token constants
- Write `<Pressable><Text>` — always use `<Button>` from `@/design-system/ui` (or `@/components/ui` where legacy)
- Import from `constants/*.ts` files directly in screens — always import from `constants/theme`
- Hardcode `topInset = Platform.OS === 'web' ? 67 : insets.top` — web inset is always `0`
- Use raw `fetch()` — always use `api.*` from `src/lib/api.ts` (`@/lib/api`)
- Rely on **`GET /api/users/me`** alone for the signed-in user — it returns **404** if `users/{uid}` is missing and does **not** create the doc. Load / refresh the current user with **`api.auth.me()`** (`GET /api/auth/me`), which materializes the profile on first hit
- Import Firebase SDK directly in screens — use `src/lib/api.ts` / `src/lib/auth.tsx`
- Create `StyleSheet` objects inside render functions — use module-level `StyleSheet.create()`
- Use `console.log` in production — guard with `if (__DEV__)`
- Commit API keys, Stripe keys, or `.env` files
- Use `AsyncStorage` directly for auth tokens — `lib/query-client.ts` `setAccessToken()` handles this
- Import `@sentry/node` or `@sentry/react-native` — **Sentry is fully removed**
- Use `lib/reporting.ts` for errors — it's a **user content report system** (spam, harassment), not error logging
- Add duplicate routes to Cloud Functions route files — check the file first

---

## ALWAYS Do

- Use `api.*` from `@/lib/api` for all backend calls
- Use `useLayout()` for all responsive values (padding, columns, breakpoints, sidebarWidth)
- Use `useColors()` for theme-aware colors — never hardcode hex in JSX
- Wrap screens with async data in `<ErrorBoundary>`
- Handle 401 with `ApiError.isUnauthorized()` → redirect to login
- Use `useQuery` / `useMutation` (TanStack React Query) for all server state
- Gate authenticated queries with **`!!userId && !isRestoring`** from `useAuth()` so web does not fetch with a stale `null` id or flash empty UI before Firebase restores the session
- Use `useSafeAreaInsets()` for native insets; web top inset is always `0`
- Use `Haptics.*` (expo-haptics) for tactile feedback — iOS/Android only
- Use `Image` from `expo-image` (not `react-native`) for all images
- Test on iOS, Android, and web — use `Platform.OS` guards when behaviour differs
- Use `Platform.select()` or `.native.tsx` / `.web.tsx` suffixes for large platform divergences
- Check `isOrganizer` / `isAdmin` from `useRole()` before rendering sensitive UI
- Add `accessibilityLabel` and `accessibilityRole` to all interactive elements
- Run `npm run typecheck` and `npm run lint` before committing
- In Cloud Functions catch blocks: `captureRouteError(err, 'ROUTE_NAME')` from `./utils`
- Use **sentence case** for buttons, nav, and headers — `"Get tickets"`, not `"Get Tickets"`. PR reviewers reject Title Case.
- Import `SignatureGradient` from `@/design-system/tokens/theme` for the **violet → coral** brand gradient. **Max one** SignatureGradient instance per screen (hero / onboarding / CulturePass+ only).
- Match radius to surface: badges `Radius.xs` (6), chips/pills `Radius.full`, buttons/inputs `Radius.md` (16), cards `Radius.lg` (20) or `CardTokens.radius`, modals/sheets `Radius.xl` (24).

---

## UI Design Standard — events.tsx Pattern

**`app/events.tsx` is the gold-standard listing screen.** Apply this structure to every listing/browsable screen (events, perks, community, directory, movies, restaurants, shopping).

### Required Structure

```
Header
  flexDirection: row
  Title: Poppins_700Bold 20px
  Location subtitle: indigo pin icon
  42×42 action button: BlurView on iOS, semi-transparent rgba on Android/web

Filter Row
  Inline animated FilterChip (Reanimated interpolateColor + spring scale)
  NOT the `src/components/FilterChip.tsx` version — build inline per screen
  Two-row horizontal filter ScrollViews (categories + secondary filters)

Content Grid
  FlatList with numColumns from useLayout()
  FadeInDown.delay(index * 60) per item (Reanimated entering animation)
  keyExtractor + getItemLayout for performance

Loading State
  Skeleton grid matching the card grid layout

Empty State
  Icon circle + title + description + "Reset filters" button

Footer
  Paginating spinner while fetching next page
  "X items shown" end-of-list divider text
```

### Code conventions on these screens
```typescript
// StyleSheet.create() at module level — never inside component
const styles = StyleSheet.create({ ... });

// ErrorBoundary wraps entire screen
<ErrorBoundary>
  <ScreenContent />
</ErrorBoundary>

// Grid layout
const { numColumns, hPad, columnWidth } = useLayout();
<FlatList
  numColumns={numColumns}
  contentContainerStyle={{ paddingHorizontal: hPad, gap: 14 }}
  keyExtractor={(item) => item.id}
  renderItem={({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={{ width: columnWidth() }}>
      <EventCard event={item} />
    </Animated.View>
  )}
/>
```

---

## Design Tokens

**Single import point**: `import { ... } from '@/design-system/tokens/theme'`

> **Partner / narrative guide**: [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) · **Token details**: [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md).

> Note: `@/constants/theme` is a legacy alias. All new code uses `@/design-system/tokens/theme`.

### Brand Colors (2026)

```typescript
import { CultureTokens } from '@/design-system/tokens/theme';

CultureTokens.indigo   // #4F46E5 — Indigo-Violet (2026 update; old value was #0066CC)
CultureTokens.violet   // #9333EA — Active states, navigation pills, gradient start
CultureTokens.coral    // #FF5E5B — Movement Coral — action energy, alerts, gradient end
CultureTokens.teal     // #0D9488 — Warmer Teal — free badges, live states, belonging
CultureTokens.gold     // #FFC857 — Temple Gold — accents/gradients/indigenous *chrome* only (not body or datetime text)
// SignatureGradient = [CultureTokens.violet, CultureTokens.coral] — violet → coral
```

### Event card typography (shared template)

- **Title**: `TextStyles.eventCardTitle`
- **Date/time line**: `TextStyles.eventCardDate` + `useColors().eventDate` (light UI) or `useColors().eventDateOnMedia` (on dark hero photos)
- **Location**: `TextStyles.eventCardMeta` + `colors.textSecondary`
- **Do not** use `CultureTokens.gold` or yellow hex for dates, titles, or tag labels on event surfaces.

### Badge & Chip Color Rules

| Use case | Token | Reason |
|----------|-------|--------|
| FREE badge on event cards | `CultureTokens.teal` | Gold/saffron clashes with indigo brand |
| LIVE / AVAILABLE badges | `CultureTokens.teal` | Positive state = teal |
| Price chips on cards | `CultureTokens.teal` | Non-indigenous accent |
| Active filter chip | `CultureTokens.indigo` | Primary brand color |
| Indigenous banners / 🪃 badges | `CultureTokens.gold` | Cultural accent — avoid gold *text*; borders/backgrounds OK |
| Indigenous section accents | `CultureTokens.teal` or `CultureTokens.indigo` | Explore/cards use teal border; gold text deprecated |

> **Rule**: Gold (#FFC857) is for **small indigenous accents and brand warmth**, not for primary readable text. Event datetimes use `colors.eventDate`.

### Functional Category Tokens

```typescript
CultureTokens.event      // Saffron — event listing cards
CultureTokens.artist     // Coral — artist profile cards
CultureTokens.venue      // Teal — venue cards
CultureTokens.movie      // Gold — movie cards
CultureTokens.community  // Bright Blue — community cards
```

### Component Tokens

```typescript
import { ButtonTokens, CardTokens, InputTokens, AvatarTokens, TabBarTokens } from '@/design-system/tokens/theme';

ButtonTokens.height.md      // 52 — Apple minimum touch target
ButtonTokens.radius         // 16 (Radius.md)
CardTokens.radius           // 20 (Radius.lg) — cards, list rows
CardTokens.radiusLarge      // 20 — hero cards
CardTokens.padding          // 16
InputTokens.height          // 48
AvatarTokens.size.md        // 40
TabBarTokens.heightMobile   // Standard 49-64px (platform-dependent)
```

### Theme-Aware Colors (inside components only)

```typescript
import { useColors } from '@/hooks/useColors';
const colors = useColors();

// Surface
colors.background · colors.surface · colors.surfaceElevated

// Text
colors.text · colors.textSecondary · colors.textTertiary

// Brand
colors.primary · colors.secondary · colors.accent · colors.gold

// State
colors.success · colors.warning · colors.error · colors.info

// Structure
colors.border · colors.borderLight · colors.divider · colors.primaryGlow
```

> Dark mode = default on native (night festival aesthetic).
> Web always returns light theme from `useColors()`.

### Gradients

```typescript
import { SignatureGradient, gradients } from '@/constants/theme';

SignatureGradient           // [Violet, Emerald] — canonical brand gradient. Max ONE per screen.
gradients.culturepassBrand  // Same as SignatureGradient (legacy alias; prefer SignatureGradient).
gradients.primary           // [Indigo, Blue] — tab bar active pill
gradients.aurora            // light blue/purple — backgrounds
gradients.sunset            // warm orange/coral — event cards
gradients.midnight          // deep indigo — dark backgrounds
```

### Animations

```typescript
import { animations } from '@/constants/theme';

animations.duration.fast    // 150ms
animations.duration.normal  // 300ms
animations.duration.slow    // 500ms
animations.easing.default   // standard curve
```

---

## Layout Patterns

```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth, contentWidth } = useLayout();

// Desktop: sidebarWidth = 240, numColumns = 3–4
// Tablet:  sidebarWidth = 0,   numColumns = 2
// Mobile:  sidebarWidth = 0,   numColumns = 1–2

// Breakpoints
import { Breakpoints } from '@/constants/theme';
Breakpoints.tablet   // 768
Breakpoints.desktop  // 1024
Breakpoints.wide     // 1280

// Web top inset — ALWAYS:
const topInset = Platform.OS === 'web' ? 0 : insets.top;
```

---

## Local web + Cloud Functions (CORS)

Expo web (`http://localhost:8081`, other ports) calls the API on another origin (`https://us-central1-<project>.cloudfunctions.net`). Browsers **require** the API to return `Access-Control-Allow-Origin` for that host.

- **Fix**: Cloud Functions Express CORS allowlist lives in `functions/src/app.ts` (`isAllowedOrigin`, `LOCAL_DEV_ORIGINS`, loopback regex). After changing it, **deploy functions**: `cd functions && npm run build && cd .. && firebase deploy --only functions`
- If you still see CORS errors against production URL, the deployed build is likely **older than this repo** — redeploy `api`.
- **Alternative for local API**: point `EXPO_PUBLIC_API_URL` at the emulator (`http://localhost:5001/<project>/us-central1/api/`) per `CLAUDE.md` (no cross-origin to cloudfunctions.net).

---

## API & Data Fetching

```typescript
import { api, ApiError } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/events', city, country],
  queryFn: () => api.events.list({ city, country, pageSize: 50 }),
  staleTime: 60_000,  // for stable reference data
});

// Mutation
const { mutate } = useMutation({
  mutationFn: (d: PurchaseData) => api.tickets.purchase(d),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/tickets'] }),
  onError: (err) => {
    if (err instanceof ApiError && err.isUnauthorized()) router.push('/login');
  },
});

// Error handling
try {
  await api.events.create(data);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.isUnauthorized()) return router.push('/(onboarding)/login');
    if (err.isNotFound()) return setError('Event not found.');
    if (err.status === 429) return setError('Too many requests. Please slow down.');
    setError(err.message);
  }
}
```

---

## Cloud Functions — Route Pattern

```typescript
import { captureRouteError } from './utils';  // ALWAYS — never bare console.error

router.get('/resource/:id', requireAuth, async (req, res) => {
  try {
    const data = await service.get(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    captureRouteError(err, 'GET /api/resource/:id');
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});
```

---

## Authentication

```typescript
import { useAuth } from '@/lib/auth';
const {
  isAuthenticated,
  userId,
  user,           // Session snapshot (may omit fields until server sync completes)
  isRestoring,    // true until Firebase `onAuthStateChanged` finishes first resolution
  hasRole,
  logout,
} = useAuth();

// Role check
if (!hasRole('organizer', 'admin')) return null;

// User fields
user.id · user.username · user.email · user.role
user.city · user.country · user.subscriptionTier
user.isSydneyVerified · user.interests · user.communities
```

Auth flow: Firebase Auth → `onAuthStateChanged` → `api.auth.me()` → `setAccessToken()`.
Social sign-in: Google (web: popup, native: `@react-native-google-signin`), Apple (iOS only, required by App Store).

### Current-user API (important)

| Endpoint | Behaviour |
|----------|-----------|
| **`GET /api/auth/me`** (`api.auth.me()`) | **Preferred** for “who am I” + edit screens. Creates `users/{uid}` on first successful hit if missing. |
| **`GET /api/users/me`** (`api.users.me()`) | Returns 404 if the Firestore user doc does not exist — do not rely on it alone after login. |

### React Query pattern (profile & settings)

```typescript
const { userId, user: authUser, isRestoring } = useAuth();

const { data, isPending, isError, refetch } = useQuery({
  queryKey: ['/api/auth/me', 'screen-name', userId],
  queryFn: () => api.auth.me(),
  enabled: Boolean(userId) && !isRestoring,
});

// Optional: hydrate UI from `authUser` in a `useEffect` while `data` is still pending
// so inputs are not blank on slow networks (see `app/profile/edit.tsx`).
```

`AuthGuard` already skips redirects while `isRestoring` is true — do not duplicate that guard inside every screen, but **do** gate fetches as above so queries do not run with `userId === null` on the first paint.

---

## Search

Use `api.search.query()` → `GET /api/search` (Firestore-backed on the server).

---

## iOS-Specific

- Physical device required for: haptics, BlurView, SF Symbols, safe area
- `SymbolView` from `expo-symbols` for SF Symbols (iOS 16+), fall back to Ionicons
- `expo-haptics`: `selectionAsync()` for selection, `notificationAsync(Success/Warning/Error)` for feedback
- BlurView intensity: 60–90; wrap in `try/catch` on simulator
- `KeyboardAvoidingView behavior="padding"` on iOS
- Apple Sign-In: **required** by App Store if offering any social sign-in
- ATS: all HTTP calls must be HTTPS in production

## Android-Specific

- `BlurView` not supported → use `rgba()` semi-transparent backgrounds
- `KeyboardAvoidingView behavior="height"` on Android
- Google Sign-In: configure SHA-1 in Firebase console for debug + release keystore
- Status bar: `expo-status-bar style="light"` for dark backgrounds
- Edge-to-edge: handle bottom nav bar with `useSafeAreaInsets().bottom`

---

## Performance

- React Compiler is enabled (`babel-plugin-react-compiler`) — skip manual `useMemo`/`useCallback` unless profiling shows need
- `expo-image` handles disk caching — never use `react-native` `Image`
- `FlatList` with `keyExtractor` + `getItemLayout` for all long lists
- `StyleSheet.create()` at module level — never inside components
- `Platform.OS` guards tree-shake platform-specific code at build time
- `React.lazy()` + `<Suspense>` for heavy screens on web

---

## Security Checklist (before every commit)

- [ ] No hardcoded secrets — `EXPO_PUBLIC_*` env vars only
- [ ] `STRIPE_SECRET_KEY` and other server secrets never in `EXPO_PUBLIC_*`
- [ ] User input validated with `zod` before sending to API
- [ ] No `dangerouslySetInnerHTML`
- [ ] `redirectTo` params only allow internal routes (`/` prefix, no `://`)
- [ ] Image uploads: MIME type + size validated client AND server
- [ ] Server-side role guards (`requireRole()`) — client checks are UX only
- [ ] `if (__DEV__)` guards on all `console.error` calls in client code

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Typed API client — only way to call backend (`@/lib/api`) |
| `lib/auth.tsx` | Firebase Auth provider + `useAuth()` |
| `constants/theme.ts` | Single import for all design tokens |
| `src/hooks/useColors.ts` | Theme-aware colors (dark=native, light=web) |
| `src/hooks/useLayout.ts` | Responsive layout values |
| `shared/schema.ts` | Master TypeScript type re-exports |
| `functions/src/handlers/utils.ts` | `captureRouteError()` — use in all catch blocks |
| `app/events.tsx` | Gold-standard listing screen UI pattern |

---

## Testing Commands

```bash
npm run test:unit          # service + middleware unit tests
npm run test:integration   # API integration (requires local emulator)
npm run test:e2e:smoke     # critical path smoke tests
npm run qa:all             # all above + package.json validation
npm run typecheck          # TypeScript check (no emit)
npm run lint               # ESLint
npm run lint:fix           # ESLint auto-fix
```
