# CulturePass — Claude / agent notes (CLAUDE.md)

Project guide for AI agents. Read before touching code.

> **Master reference**: [`AGENTS.md`](AGENTS.md) — full architecture, data models, deployment.
> **Design Principles**: [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md) — five core laws (Cultural Minimalism, Token Integrity, Platform Parity, Approachable Complexity, Technical Craftsmanship).
> **Style Guide (shareable)**: [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) — brand voice, colour roles, typography, layout, navigation.  
> **Design Tokens (2026)**: [`docs/DESIGN_TOKENS.md`](docs/DESIGN_TOKENS.md) — authoritative hex/component reference: spacing, navigation, buttons, Z-index, glass patterns.
> **Coding rules & UI patterns**: [`culturepass-rules.md`](culturepass-rules.md) — NEVER/ALWAYS, design tokens, events.tsx standard, API patterns.
> **Store submission (iOS / Android)**: [`docs/STORE_SUBMISSION.md`](docs/STORE_SUBMISSION.md) — versions, `generate:brand-assets`, privacy checklist.
> **Event card text**: Use `TextStyles.eventCardTitle` / `TextStyles.eventCardDate` with `useColors().eventDate` (or `eventDateOnMedia` on dark photos). Do **not** use gold/yellow for event datetime or primary card labels.

---

## Branding & Taglines (2026)

- **Primary Tagline**: 'Belong anywhere.'
- **Secondary Tagline**: 'Discover. Connect. Belong.'
- **Platform Tagline**: 'Your one-stop lifestyle platform for cultural diaspora communities'
- **Web Tagline**: 'Belong anywhere.'

## Project Overview

Cross-platform cultural lifestyle marketplace for diaspora communities (AU, NZ, UAE, UK, CA).
**Stack**: Expo `^55.0.15` · React `19.2.0` · React Native `0.83.4` · Expo Router `~55.0.12` · Reanimated `4.2.1` · Firebase `^12.12.1` · TanStack Query `^5.99.0`
**Launch**: 15 April 2026 (live) — iOS + Android + Web; Sydney + Melbourne first.

CulturePass is a **B2B2C marketplace** — not a government portal.
Connects Users → Events / Businesses / Venues / Communities in cultural diaspora cities.
Council (LGA) = **location attribute** for proximity services, not a governance feature.

---

## Architecture

App router, UI, hooks, and `lib/` live under **`src/`**. **`shared/`** stays at the repo root (types shared with Cloud Functions).

```
src/app/
  (tabs)/               index (Discover), calendar, community, city,
                        my-space  (visible in bottom bar)
                        CultureX, host  (full screens, href=null — reached via in-app links)
                        profile, directory, dashboard, menu  (hidden, href=null)
                        communities/
  (domain)/             artist, business, cities, city/[name], community,
                        culture, event, listing/create, movies, restaurants,
                        shopping, venue, events.tsx
  (onboarding)/         cultures, location, signup, login flows
  (shortlinks)/         b, c, e, o, t, u, v
  (static)/             about, contact, get2know, landing, legal/, logo, help/
  browse/[category].tsx Category browse pages (Mode-C)
  create/               [type].tsx, hub.tsx, index.tsx
  admin/                14+ routes (users, audit-logs, moderation, finance,
                        discover, import, handles, notifications, platform,
                        data-compliance, updates, dashboard)
  dashboard/            organizer, venue, sponsor, widgets, wallet-readiness,
                        backstage/[id]
  payment/, tickets/, checkout/, membership/, perks/, offers/
  notifications/, settings/, search/, activities/, updates/
  profile/, user/[id], organiser/[id]
  hostspace/            Creator hub (companion to (tabs)/host.tsx):
                        index, /create, /create/[category], /dashboard
  network/              /network — followers/following/suggestions/added segments
  contacts/             Contacts CRM: /contacts (list), /contacts/[cpid] (detail)
  scanner.tsx · map.tsx · explore.tsx · finder.tsx · my-council.tsx · menu.tsx
  kerala.tsx · design-vitrine.tsx · [handle].tsx (/@username redirect)

src/modules/            Feature-by-feature modules
  admin · api · communities · contacts · core · discover · events · explore
  host · listings · network · payment · profile
  core/layout/          Shell + navigation chrome:
    tabs/               CustomTabBar.tsx       ← gradient pill bottom bar (v2)
                        TabHeaderChrome.tsx    ← logo · page title · glass action buttons
                        TabHeaderNativeShell.tsx · TabPrimaryHeader.tsx
                        TabScreenShell.tsx · TabSectionShell.tsx
                        AmbientMeshLayer.tsx · CultureEngagementHero.tsx
                        mainTabTokens.ts       ← MAIN_TAB_UI, shadow presets
    navigation/         M3NavigationRail.tsx   ← tablet-width navigation rail
    web/                WebSidebar.tsx · WebTopBar.tsx
  events/components/    EventCard.tsx (flag dispatcher),
                        EventCardV1.tsx, EventCardV2.tsx (Mode-C, flag-gated)
  host/components/      Host hub UI (tabs/host.tsx surface)
  listings/create/      Listings create flow ((domain)/listing/create.tsx)
  profile/{api,components,hooks,screens}/   MySpace tab backing
  contacts/screens/     ContactsCrmScreen, ContactDetailCrmScreen
                        (search, pin/unpin, segments, notes/tags/interests)
  network/screens/      NetworkScreen (added/followers/following/suggestions
                        with React Query follow/unfollow mutations)

src/components/
  ui/, atomic/                Legacy/shared UI primitives
  Discover/                   HeroCarousel, EventRail, CommunityRail, CategoryRail,
                              CityRail, ActivityRail, IndigenousSpotlight, FeedCard,
                              SpotlightCard, SuperAppLinks, SectionHeader,
                              WebHeroCarousel, WebRailSection, EventCard, …
  browse/                     BrowseCard, BrowseHeader, BrowseLayout, PromotedRail
                              (+ atomic/ primitives)
  city/, culture/, hubs/      City/culture/hub destination pages
  connect/, feed/             Social + feed surfaces
  calendar/                   CalendarFilters, CalendarMonthGrid, CalendarTabs,
                              EventCard, MapToggle
  dashboard/, directory/, location/
  perks/                      PerkAbout, PerkCard, PerkCouponModal, PerkDetails,
                              PerkHero, PerkIndigenousCard, PerkMembershipCard
  scanner/, submit/, about/, admin/, onboarding/
  widgets/                    WidgetIdentityQRCard, WidgetNearbyEventsCard,
                              WidgetSpotlightCard, WidgetUpcomingTicketCard
  Loose: BrowsePage.tsx, FeedCardSkeleton.tsx, FilterChip.tsx, FilterModal.tsx,
         KeyboardAwareScrollViewCompat.tsx, LocationPicker.tsx,
         NativeMapView.{tsx,native.tsx,web.tsx}, SocialLinksBar.tsx, WidgetSync.tsx

src/design-system/      SINGLE source of truth for tokens + atomic UI
  tokens/               theme.ts (master export, SignatureGradient),
                        colors.ts, typography.ts, spacing.ts (Radius scale),
                        elevation.ts, animations.ts, vitrineTheme.ts, material3.ts
  ui/                   Button, Card, Badge, Input, BackButton, BrandLockup,
                        BrandWordmark, CardGrammar, CardSurface, Checkbox,
                        LikeToggle, SaveToggle, AnimatedFilterChip, FilterChips,
                        CreatorActions, CultureImage, CultureTag, DatePickerInput,
                        PasswordStrengthIndicator, ScreenState, Skeleton, SocialButton,
                        GlassView (.tsx + .native.tsx),
                        M3Button, M3TopAppBar, M3FilterChip, M3SectionHeader,
                        M3Card, M3FAB, index.ts

src/constants/          Data constants only (NOT design tokens)
  cityHeroImages, cultures, cultureDestinations, cultureExplorePresets,
  eventCategories, languages, locations, onboardingCommunities,
  onboardingInterests, navigation/

src/hooks/
  useLayout · useColors · useRole · useCouncil · useLocations · useLocationFilter
  useNearestCity · useNearestMarketplaceLocation · useLocationPickerFlow
  useDetectCountry · useFeaturedCities · useCityPage · useCultureMatch
  useCultureDestinationData · useBrowseData · useImageUpload · usePushNotifications
  useCanEdit · useAppAppearance · useBiometricAuth · useLogin · useSignup
  useInterestsSelection · useMembershipUpgrade · useCalendarSync(.native)
  useTabScrollBottomPadding · useEffectiveMainTabTopInset
  discover/             Discover-specific hooks
  queries/              keys.ts, useExplore.ts, usePerks.ts (TanStack Query)

src/lib/
  api.ts                Typed API client — ONLY way to call the backend
  auth.tsx              Firebase Auth provider + useAuth()
  app-meta.ts           APP_NAME, APP_NAME_AU, SEO meta
  config.ts · feature-flags.ts · routes.ts · publicPaths.ts · domainHost.ts
  navigation.ts · openExternalUrl.ts · storage.ts · query-client.ts
  analytics.ts · analytics-funnel.ts · reporting.ts (content reports, NOT errors)
  community.ts · community-storage.ts · feedService.ts · discover-curation.ts
  cultureDestinationScope.ts · cultureHubDeepLink.ts
  marketplaceLocation.ts · syncMarketplaceLocation.ts
  currency.ts · format.ts · dateUtils.ts · haptics.ts · withAlpha.ts
  ical.ts               .ics builder + webcal:// city subscription URL
  image-manipulator.{ts,native.ts,web.ts} · mediaUrls.ts
  indigenous.ts · live-activity.ts · push.ts · theme-factory.ts
  firebase.ts · firebase/ · location/ · widgets/ · site-footer-links.ts

src/platform/api/     Namespace-factory layer composed into src/lib/api.ts
  client.ts             ApiError + parseJson + request() wrapper around apiRequest
  endpoints/            createCommunitiesNamespace, createEventsNamespace,
                        createMembershipNamespace, createPaymentMethodsNamespace,
                        createWalletNamespace, createRewardsNamespace,
                        createPerksNamespace — `src/lib/api.ts` calls these
                        factories with `request` and assigns to `api.events` etc.

src/repositories/     Thin wrappers over api.* and AsyncStorage
  ContactsRepository.ts   SavedContact CRUD keyed by cpid (AsyncStorage-backed)
  MembershipRepository.ts Pure delegation to api.membership.{get,subscribe,cancel,…}

src/contexts/         OnboardingContext · SavedContext · ContactsContext
shared/schema.ts      Master TypeScript type re-exports
shared/schema/        activity, admin, booking, checkin, council, discover, entities,
                      event, feedItem, media, moderation, movie, notification, perk,
                      profile, ticket, update, user, wallet (+ others)

functions/src/
  app.ts              Express app
  index.ts            Functions entry — exports `api` + Firestore triggers
  triggers.ts · triggers/eventScores.ts · triggers/onImageUpload.ts · triggers/index.ts
  middleware/         auth (requireAuth, requireRole), moderation
  handlers/           33 domain routers — one file per domain:
    activities · admin · auth · calendar · cities · council · cultureToday
    discovery · events · feed · indigenous · locations · membership
    misc · movies · offerings · perks · profiles · restaurants · rewards
    search · shopping · social · stripe · stripeConnect · tickets · updates
    uploads · users · utils · validation · wallet
  services/           31 services — typed Firestore data layer + domain logic
                      (firestore, events, tickets, perks, profiles, search,
                      discoverCuration, discoverDomain, ranking, cache, rollout,
                      stripeConnect, walletPasses, appleWalletWebService,
                      cultureTodayCalendar, taxonomy, systemConfig, …)
  jobs/               geohashBackfill.ts (AU postcode / coordinate backfill)
  data/               AllCouncilsList.csv (~1000 AU LGAs)
  migrations/ · payments/ · repositories/ · scraper/ · shared/ · use-cases/

server/   Docker image-processing service (Sharp + job queue) — not required for main dev
dataconnect/  Firebase DataConnect GraphQL schema (exploratory)
```

### Feature flags & EventCard V2
EventCard rendering is flag-gated via `useFlagOverride('eventcard-v2')` in `src/modules/events/components/EventCard.tsx`. Defaults to `EventCardV1`; flipping the flag swaps to `EventCardV2` (Mode-C primitives — same props, refreshed visual layer). Flag plumbing: `src/lib/feature-flags.ts`.

---

## Web Layout Architecture

| Breakpoint        | Layout                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Desktop ≥1024px   | 240px left sidebar (`WebSidebar.tsx`), no top bar, `topInset = 0`   |
| Tablet 768–1023px | Bottom tab bar, `topInset = 0`                                      |
| Mobile native     | Bottom tab bar 84px (glassmorphism on iOS), `topInset = insets.top` |

```typescript
const { isDesktop, isTablet, isMobile, numColumns, hPad, sidebarWidth, columnWidth } = useLayout();
// sidebarWidth = 240 on desktop web, 0 elsewhere

// CORRECT — always:
const topInset = Platform.OS === 'web' ? 0 : insets.top;
// WRONG — never:
// const topInset = Platform.OS === 'web' ? 67 : insets.top;  ← old top-bar value
```

### Tabs (current)

| Visible in bottom bar                                           | Hidden (`href=null`)                                    |
| --------------------------------------------------------------- | ------------------------------------------------------- |
| index (Discover) · calendar · community · city · my-space       | CultureX · host · profile · directory · dashboard · menu |

`(tabs)/communities/` and `(tabs)/menu.tsx` are part of the tabs group but reached via deep links / nested navigation, not the tab bar.

**CultureX** and **host** exist as full tab screens but are hidden from the bottom bar — they are reached via in-app navigation (e.g. SuperAppLinks on Discover, host dashboard links).

---

## Design Tokens

Import from `@/design-system/tokens/theme` — the **only** correct path (not `@/constants/theme`):

```ts
import {
  Colors, TextStyles, Elevation, Spacing, Radius,
  ButtonTokens, CardTokens, InputTokens, AvatarTokens,
  TabBarTokens, ChipTokens, HeaderTokens, ZIndex, IconSize,
  LiquidGlassTokens, LiquidGlassAccents, MaterialExpressive,
  SignatureGradient, CultureTokens, gradients, glass, neon,
} from '@/design-system/tokens/theme';
```

- **`SignatureGradient`** — alias of `gradients.culturepassBrand` (**violet `#9333EA` → coral `#FF5E5B`**). **Max ONE per screen** — reserve for hero / onboarding / CulturePass+ surfaces.
- **`CultureTokens.indigo`** = `#4F46E5` (warmer indigo-violet, 2026 update). **`CultureTokens.violet`** = `#9333EA` — used for active navigation states, gradient pills, community surfaces.
- **`Radius`** scale (`spacing.ts`): `xs` 6 · `sm` 10 · `md` 16 · `lg` 20 · `xl` 24 · `full` 9999.
- Atomic UI primitives live in `src/design-system/ui/` — prefer these over raw `<Pressable>` / `<View>`:
  - Core: `Button`, `Card`, `Badge`, `Input`, `BackButton`, `BrandLockup`, `BrandWordmark`
  - Cards: `CardGrammar`, `CardSurface`, `M3Card`
  - Interactive: `Checkbox`, `LikeToggle`, `SaveToggle`, `AnimatedFilterChip`, `FilterChips`
  - Utility: `ScreenState`, `Skeleton`, `GlassView` (`.tsx` + `.native.tsx`)
  - M3 set: `M3Button`, `M3TopAppBar`, `M3FilterChip`, `M3SectionHeader`, `M3FAB`
  - Misc: `CreatorActions`, `CultureImage`, `CultureTag`, `DatePickerInput`, `PasswordStrengthIndicator`, `SocialButton`

---

## UI Navigation Architecture

### Bottom Tab Bar (`CustomTabBar.tsx`)

Active tab uses a **gradient pill indicator** — not a flat tinted background:

```typescript
// Active well: 56×32px, overflow hidden
// LinearGradient fill: [CultureTokens.violet, CultureTokens.coral] horizontal
// Active icon: '#FFFFFF' (white on gradient)
// Active label: CultureTokens.violet + FontFamily.semibold
// Inactive: colors.textTertiary + FontFamily.regular
// Press animation: Reanimated withSpring scale 0.90 → 1.0
```

Key files: `CustomTabBar.tsx`, `mainTabTokens.ts`, `app/(tabs)/_layout.tsx`

### Header Chrome (`TabHeaderChrome.tsx`)

Every main tab header follows the pattern: **logo mark · page title · glass action buttons**.

```typescript
// GlobalNavActions exports: notification bell · search · menu (optional)
// Icon button glass style (adapts to dark/light):
const glassStyle = {
  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
  borderWidth: 1,
  borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
};
// Size: 44×44px, borderRadius: 12
// Notification badge: coral bg, 1.5px white border, 16×16px min
```

Components: `HomeLogoMark`, `BrandMark`, `GlobalNavActions`, `TabPageChromeRow`

### M3 Design System

Material 3 Expressive components for consistency on feature screens:

| Component | File | Purpose |
|---|---|---|
| `M3TopAppBar` | `design-system/ui/M3TopAppBar.tsx` | Screen-level app bars with back/actions |
| `M3Button` | `design-system/ui/M3Button.tsx` | Filled / tonal / outlined / elevated / text |
| `M3FilterChip` | `design-system/ui/M3FilterChip.tsx` | Selectable filter pills |
| `M3SectionHeader` | `design-system/ui/M3SectionHeader.tsx` | Section title + "See all" action |
| `M3Card` | `design-system/ui/M3Card.tsx` | Elevated / filled / outlined card surfaces |
| `M3FAB` | `design-system/ui/M3FAB.tsx` | Floating action button |
| `M3NavigationRail` | `modules/core/layout/navigation/M3NavigationRail.tsx` | Tablet vertical nav rail |

M3 color tokens are accessed via `useM3Colors()` — do **not** mix `useColors()` and `useM3Colors()` in the same component.

### Glass Surface (`GlassView`)

```typescript
import { GlassView } from '@/design-system/ui/GlassView';
// .native.tsx → BlurView (iOS) / solid elevated surface (Android)
// .web.tsx    → backdrop-filter: blur(18px) saturate(140%)
```

---

## Search

`GET /api/search` uses Firestore-backed `searchService.globalSearch` (bounded reads + in-memory match). Query params: `q`, `city`, `country`, `category`, `cultureTag`, `entryType`, `pageSize`. Returns `events`, `profiles`, `movies`, `users` (users currently empty).

---

## Council as Location Service (LGA)

Council = **location attribute only**. No governance, no detail pages, no user claims.

- `lgaCode` / `councilId` fields on events, businesses, users → proximity filtering
- Directory: browsable cards via Council filter chip (`api.council.list`)
- Discover: "Events in Your Area" rail uses `lgaCode` matching
- Admin data: `AllCouncilsList.csv` (~1000 AU LGAs), `councils/` Firestore collection

---

## State Management

| Concern     | Solution                                                   |
| ----------- | ---------------------------------------------------------- |
| Server data | TanStack React Query (`useQuery`, `useMutation`)           |
| Auth state  | `AuthProvider` + `useAuth()`                               |
| Onboarding  | `OnboardingContext` (city, country, interests, isComplete) |
| Saved items | `SavedContext` (savedEvents, joinedCommunities)            |
| Contacts    | `ContactsContext`                                          |
| UI state    | `useState` / `useReducer` local to component               |

---

## Firestore Data Model

```
users/{uid}
  username, displayName, email, city, country
  role: 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin'
  membership: { tier, expiresAt }
  stripeCustomerId, stripeSubscriptionId, stripeAccountId?
  isSydneyVerified, interests[], culturePassId
  lgaCode?                    ← written server-side on onboarding

events/{eventId}
  title, description, venue, address, date, time, endDate?, endTime?, city, country
  imageUrl, heroImageUrl?, cultureTag[], tags[], category
  priceCents, tiers[], isFree, isFeatured
  entryType: 'ticketed' | 'free'
  organizerId, capacity, attending
  artists?: EventArtist[]
  eventSponsors?: EventSponsor[]
  hostInfo?: EventHostInfo
  status: 'draft' | 'published' | 'cancelled'
  lgaCode?, councilId?
  deletedAt, publishedAt, cpid, geoHash, latitude, longitude

tickets/{ticketId}
  eventId, userId, status, paymentStatus
  qrCode, cpTicketId, priceCents, cashbackCents, rewardPoints
  history[]: { action, timestamp, actorId }

profiles/{profileId}
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organisation'
  name, description, imageUrl, city, country
  ownerId, isVerified, rating, lgaCode?
  socialLinks: { website, instagram, facebook, twitter }

councils/{councilId}
  name, suburb, state, lgaCode, country
  websiteUrl?, phone?, addressLine1?
  verificationStatus: 'verified' | 'unverified'
```

Firestore rules: users own their doc; events/profiles public read, organizer/admin write; tickets owner-read only (Admin SDK writes).

---

## iCal export

Calendar export is **client-side**: `src/lib/ical.ts` builds multi-event `.ics` payloads (`downloadICS()` for web, `webcal://` URL for city subscription) and `useCalendarSync.ts` / `useCalendarSync.native.ts` integrates with the OS calendar (delegates to `expo-calendar` on native). A server-side `calendar/city.ics` subscription endpoint is on the roadmap.

---

## Environment Variables

```bash
# Client — baked into bundle (EXPO_PUBLIC_*)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_API_URL=https://us-central1-culturepass-4f264.cloudfunctions.net/api/
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=

# Cloud Functions ONLY — never in EXPO_PUBLIC_*
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY_ID=price_...
STRIPE_PRICE_YEARLY_ID=price_...
APP_URL=https://culturepass.app
# Connect marketplace fee (optional; default 1000 bps = 10%)
STRIPE_CONNECT_PLATFORM_FEE_BPS=1000

# Local development seeding only
SEED_TEST_EMAIL=testuser@example.com
SEED_TEST_PASSWORD=supersecret
# Used by: npm run emulator:seed:cap
```

Mirror all `EXPO_PUBLIC_*` vars in `eas.json` `build.*.env`.

---

## Local Development

```bash
npm install && cd functions && npm install && cd ..
npx expo start            # native + web
npx expo start --web      # web only
firebase emulators:start --only functions,firestore,auth,storage
npm run emulator:seed:cap   # optional: Auth + Firestore emulator seed (The CAP org + 5 events)
npm run typecheck
npm run lint
npm run qa:solid          # full gate: lint + typecheck + scripted tests + Functions build + mock web export + route hygiene
npm run qa:all            # broader test sweep (unit + integration + e2e:smoke + route hygiene)
```

**Monorepo:** Do not run `git init` inside `functions/` — Cloud Functions belong to this repo only (nested `functions/.git` is ignored and breaks tooling).

Emulator API URL: `EXPO_PUBLIC_API_URL=http://localhost:5001/culturepass-4f264/us-central1/api/`

---

## Building & Deploying

```bash
# iOS — bump app.json version + ios.buildNumber first
npm run build:ios:production && npm run submit:ios:production

# Android — bump app.json version + android.versionCode first
npm run build:android:production && npm run submit:android:production

# OTA updates (Expo Updates)
npm run update:preview      # preview channel
npm run update:production   # production channel

# Web (Hosting only)
npm run deploy-web          # expo export → dist/ + firebase deploy --only hosting

# Full Firebase (Hosting + Functions + Firestore rules/indexes + Storage rules)
# Requires real EXPO_PUBLIC_FIREBASE_* in `.env` (see scripts/assert-firebase-web-export.mjs)
npm run deploy              # runs firebase deploy --non-interactive

# Guarded full deploy (qa:solid → backup commit → push → deploy functions + hosting)
npm run deploy:guarded

# Cloud Functions only
cd functions && npm run build && cd .. && firebase deploy --only functions
```

**Deploy order**: Functions FIRST, then app — never reverse when adding new endpoints.

---

## Pending — Post-Launch (May–June 2026)

**In progress / near-term:**
- GeoHash backfill: geocode events still missing `latitude` / `longitude` / `geoHash`.
- Council LGA auto-select from GPS on onboarding (`/api/councils/nearest`).
- Android polish round (`removeClippedSubviews` + image-URI normalization sweep).

**Roadmap:**
- Organiser event analytics dashboard (`dashboard/event-analytics/[eventId]`).
- Promotional codes (`promoCodes/` collection, checkout validation).
- Organiser attendee messaging (FCM multicast + email queue).
- Community posts (`communities/{id}/posts/`, feature-flagged).
- Rewards points redemption UI (Perks tab balance chip + checkout toggle).
- Tiered perk gates (lock overlay + server-side 403 on `/api/perks/:id/redeem`).
- Push notification deep links + per-category opt-out.
- NZ + UAE city grouping on onboarding.
- Wallet top-up + Apple/Google Pay UI.
- Server-side `calendar/city.ics` subscription endpoint (currently client-only).
- Firebase DataConnect migration (exploratory).

## Recently Shipped (May 2026)

- Council area functionality for Australian users (LGA proximity filtering).
- `LikeToggle` component + `LikesContext` across EventCard and community cards.
- M3 design system layer: `M3TopAppBar`, `M3Button`, `M3FilterChip`, `M3SectionHeader`, `M3Card`, `M3FAB`, `M3NavigationRail`.
- `GlassView` platform component (`expo-blur` on iOS, CSS backdrop-filter on web).
- Tab bar v2: gradient pill active indicator (violet → coral), Reanimated spring press animation.
- Header chrome v2: glass icon buttons (search / notifications / menu), improved notification badge.
- `Button` refinement: diagonal gradient (`start {x:0,y:0.2}`), `letterSpacing: 0.15` on labels.
- `docs/DESIGN_TOKENS.md` rewritten with 2026 token values and navigation patterns.
