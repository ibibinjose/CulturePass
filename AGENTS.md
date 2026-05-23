# CulturePass — Master engineer reference (AGENTS.md)

> The definitive blueprint for CulturePass: architecture, tech stack, design laws, data models, and API patterns. **Read this before touching code.**
>
> **Last Updated**: May 2026
> **Related Docs**: [`CLAUDE.md`](CLAUDE.md) (Quickstart), [`docs/DESIGN_PRINCIPLES.md`](docs/DESIGN_PRINCIPLES.md), [`culturepass-rules.md`](culturepass-rules.md).

### Project Documents (Source of Truth)

| # | Document | Purpose |
|---|---|---|
| 01 | [docs/01-PRD.md](docs/01-PRD.md) | Product vision, audiences, features, KPIs |
| 02 | [docs/02-TRD.md](docs/02-TRD.md) | Stack, env vars, auth, API, testing, deploy |
| 03 | [docs/03-APP_FLOW.md](docs/03-APP_FLOW.md) | Every screen, click, and navigation path |
| 04 | [docs/04-UI_UX_BRIEF.md](docs/04-UI_UX_BRIEF.md) | Design system, tokens, components, motion |
| 05 | [docs/05-BACKEND_SCHEMA.md](docs/05-BACKEND_SCHEMA.md) | Firestore collections, types, security rules |
| 06 | [docs/06-IMPLEMENTATION_PLAN.md](docs/06-IMPLEMENTATION_PLAN.md) | Build sequence, phase status, deploy rules |

---

## 1. Project Overview & Identity

CulturePass is a **B2B2C cultural lifestyle marketplace** for diaspora communities (AU, NZ, UAE, UK, CA).
- **Naming**: Use **CulturePass** everywhere by default (`APP_NAME` in `src/lib/app-meta.ts`, Expo `name`). Reserve **CulturePass AU** for Australia-only legal or marketing copy (`APP_NAME_AU`).
- **Core Product**: Connects Users → Events / Businesses / Venues / Communities.
- **Council (LGA)**: Treated as a **location attribute** for proximity filtering, not a governance identity.
- **Design Philosophy**: "Night Festival" aesthetic (Dark mode default on native).
- **Stack**: Expo `^55.0.15` · React `19.2.0` · React Native `0.83.4` · Expo Router `~55.0.12` · Reanimated `4.2.1` · Firebase `^12.12.1` · TanStack Query `^5.99.0`.
- **Launch**: 15 April 2026 (live) — iOS + Android + Web; Sydney + Melbourne first.

### Taglines & Branding
- **Primary Tagline**: 'Belong anywhere.'
- **Secondary Tagline**: 'Discover. Connect. Belong.'
- **Platform Tagline**: 'Your one-stop lifestyle platform for cultural diaspora communities'
- **Web Tagline**: 'Belong anywhere.'

---

## 2. Architecture & Directory Structure

App router, UI, hooks, and `lib/` live under **`src/`**. **`shared/`** stays at the repo root (types shared with Cloud Functions).

```
src/app/                            Expo Router (src directory layout)
  (tabs)/                           index (Discover), calendar, CultureX, community,
                                    city, host, my-space  (visible)
                                    profile, directory  (hidden, href=null)
                                    communities/, menu.tsx
  (domain)/                         artist, business, cities, city/[name],
                                    community, culture, event, listing/create,
                                    movies, restaurants, shopping, venue, events.tsx
  (onboarding)/                     cultures, location, signup, login flows
  (shortlinks)/                     b, c, e, o, t, u, v  (single-letter URL prefixes)
  (static)/                         about, contact, get2know, landing, legal/, logo, help/
  browse/[category].tsx             Category browse pages (Mode-C cards)
  create/                           [type].tsx, hub.tsx, index.tsx (event/listing entry)
  admin/                            14+ routes: users, audit-logs, moderation, finance,
                                    discover, import, handles, notifications, platform,
                                    data-compliance, updates
  payment/, tickets/, checkout/     Wallet, Stripe flows, ticket detail + print
  membership/, perks/, offers/      Membership tiers, perk detail
  notifications/, settings/         Prefs (notifications, location, calendar-sync,
                                    appearance, privacy, help, about)
  search/, activities/, updates/    Search, activity feed, app announcements
  profile/, user/[id], organiser/[id]
  hostspace/                        Creator hub: hostspace, /create,
                                    /create/[category] (event, community, …).
                                    Companion to (tabs)/host.tsx.
  network/                          /network — followers/following/suggestions/added
                                    segments backed by SocialUserMini.
  contacts/                         Contacts CRM: /contacts (list) and
                                    /contacts/[cpid] (detail). cpid = contact profile id.
  scanner.tsx · map.tsx · explore.tsx · finder.tsx · my-council.tsx · menu.tsx
  kerala.tsx · design-vitrine.tsx · [handle].tsx (/@username redirect)
  +html.tsx · +native-intent.tsx · +not-found.tsx

src/modules/                        Feature-by-feature module layer
  admin · api · communities · contacts · core · discover · events · explore
  host · listings · network · payment · profile
  events/components/EventCard.tsx           Flag dispatcher
  events/components/EventCardV1.tsx         Legacy
  events/components/EventCardV2.tsx         Mode-C primitives (flag-gated)
  host/components/                          Host hub UI
  listings/create/                          Listings create flow
  profile/{api,components,hooks,screens}/   MySpace tab backing
  contacts/screens/                         ContactsCrmScreen, ContactDetailCrmScreen
                                            (debounced search, pin/unpin, segments,
                                             notes/tags/interest editing)
  network/screens/                          NetworkScreen (added/followers/following/
                                             suggestions; follow/unfollow via React Query)

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
  directory/, location/       Directory grid, LocationPicker primitives
  perks/                      PerkAbout, PerkCard, PerkCouponModal, PerkDetails,
                              PerkHero, PerkIndigenousCard, PerkMembershipCard
  scanner/                    Ticket scanner UI
  submit/                     Event/content submission forms
  about/, admin/              Static + admin UI
  onboarding/                 Signup / interests / location flows
  widgets/                    WidgetIdentityQRCard, WidgetNearbyEventsCard,
                              WidgetSpotlightCard, WidgetUpcomingTicketCard
  Loose: BrowsePage.tsx, FeedCardSkeleton.tsx, FilterChip.tsx, FilterModal.tsx,
         KeyboardAwareScrollViewCompat.tsx, LocationPicker.tsx,
         NativeMapView.{tsx,native.tsx,web.tsx}, SocialLinksBar.tsx, WidgetSync.tsx

src/design-system/            SINGLE source of truth for tokens + atomic UI
  tokens/                     theme.ts (master export, SignatureGradient),
                              colors.ts, typography.ts, spacing.ts (Radius scale),
                              elevation.ts, animations.ts, vitrineTheme.ts
  ui/                         Button, Card, Badge, Input, BackButton,
                              BrandLockup, BrandWordmark, CardGrammar, CardSurface,
                              Checkbox, CreatorActions, CultureImage, CultureTag,
                              DatePickerInput, FilterChips, AnimatedFilterChip,
                              PasswordStrengthIndicator, SaveToggle, ScreenState,
                              Skeleton, SocialButton, Input, index.ts

src/constants/                Data constants (NOT design tokens)
  cityHeroImages, cultures, cultureDestinations, cultureExplorePresets,
  eventCategories, languages, locations, onboardingCommunities,
  onboardingInterests, navigation/

src/hooks/
  useLayout, useColors, useRole, useCouncil, useLocations, useLocationFilter,
  useNearestCity, useNearestMarketplaceLocation, useLocationPickerFlow,
  useDetectCountry, useFeaturedCities, useCityPage, useCultureMatch,
  useCultureDestinationData, useBrowseData, useImageUpload, usePushNotifications,
  useCanEdit, useAppAppearance, useBiometricAuth, useLogin, useSignup,
  useInterestsSelection, useMembershipUpgrade, useCalendarSync(.native),
  useTabScrollBottomPadding, useEffectiveMainTabTopInset
  discover/                   Discover-specific hooks
  queries/                    keys.ts, useExplore.ts, usePerks.ts (TanStack Query)

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
  client.ts             ApiError + parseJson + request() (wraps base apiRequest)
  endpoints/            createCommunitiesNamespace, createEventsNamespace,
                        createMembershipNamespace, createPaymentMethodsNamespace,
                        createWalletNamespace, createRewardsNamespace,
                        createPerksNamespace — `src/lib/api.ts` calls these factories
                        with `request` and assigns the result to `api.events`,
                        `api.communities`, etc. Not a replacement; a delegation layer.

src/repositories/     Thin wrappers over api.* and AsyncStorage
  ContactsRepository.ts   Local CRUD for SavedContact (cpid-keyed),
                          AsyncStorage-backed merge/dedup, optional remote sync.
  MembershipRepository.ts Pure delegation to api.membership.{get,subscribe,cancel,…}.

src/contexts/         OnboardingContext · SavedContext · ContactsContext

shared/schema.ts      Master TS type re-exports
shared/schema/        activity, admin, booking, checkin, council, discover, entities,
                      event, feedItem, media, moderation, movie, notification, perk,
                      profile, ticket, update, user, wallet, …

functions/src/        Firebase Cloud Functions (Express)
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
  services/           31 services — typed Firestore data layer + domain logic:
    activities, appleWalletWebService, base, cache, cities, cultureTodayCalendar,
    discoverCuration, discoverDomain, eventProfileLinks, events, firestore,
    locations, misc, movies, notifications, perks, profiles, ranking, restaurants,
    rollout, search, shopping, stripeConnect, systemConfig, taxonomy, tickets,
    updates, users, wallets, walletPasses
  jobs/               geohashBackfill.ts (AU postcode / coordinate backfill)
  data/               AllCouncilsList.csv (~1000 AU LGAs)
  migrations/ · payments/ · repositories/ · scraper/ · shared/ · use-cases/
```

### Feature flags & EventCard V2
EventCard rendering is flag-gated via `useFlagOverride('eventcard-v2')` in `src/modules/events/components/EventCard.tsx`. Defaults to `EventCardV1.tsx`; flipping the flag swaps to `EventCardV2.tsx` (Mode-C primitives — same props/behavior, refreshed visual layer). Flag plumbing lives in `src/lib/feature-flags.ts`.

---

## 3. Design Token System (CultureTokens)

Never hardcode hex values. Import from `@/design-system/tokens/theme` or use `useColors()` at runtime.

```ts
import { Colors, TextStyles, Elevation, Spacing, Radius, ButtonTokens, SignatureGradient } from '@/design-system/tokens/theme';
```

### Core Brand (`CultureTokens` — 2026)
- `indigo`: `#4F46E5` (Primary brand — trust, platform identity)
- `violet`: `#9333EA` (Active nav, community, gradient start)
- `coral`: `#FF5E5B` (Action/Movement)
- `gold`: `#FFC857` (Brand warmth — **not for primary readable text**; gradients/membership chrome only)
- `teal`: `#0D9488` (Global belonging, venues, free/live accents)

### Event cards & readable text
- **Datetime lines**: `useColors().eventDate` (light UI) and `useColors().eventDateOnMedia` (text on dark hero imagery).
- **Do not** use `CultureTokens.gold`, `#FFCC00`, or mustard yellow for titles, dates, tags, or paragraphs. Prefer `TextStyles.eventCardTitle` / `TextStyles.eventCardDate`.

### Hierarchical Radius (`@/design-system/tokens/spacing`)
`Radius.xs` 6 · `sm` 10 · `md` 16 · `lg` 20 · `xl` 24 · `full` 9999.

### Functional Sizing
- `ButtonTokens.height.md`: 52 (Apple HIG compliant)
- `CardTokens.radius`: 16
- `InputTokens.height`: 48
- `AvatarTokens.radius`: 9999 (Circular)

### Gradients
- `gradients.culturepassBrand` / **`SignatureGradient`**: violet `#9333EA` → coral `#FF5E5B` — hero, onboarding, flagship CTAs; **max ONE per screen**
- `gradients.primary`: indigo ramp for legacy/utility surfaces — prefer `SignatureGradient` for brand-flagship moments
- `gradients.midnight`: Deep dark — backgrounds

---

## 4. Web & Responsive Layout Rules

### Breakpoints
- **Tablet**: 768px (Bottom tabs persist)
- **Desktop**: 1024px (Left Sidebar appears, `sidebarWidth = 240`)

### The "Top Inset" Rule (CRITICAL)
- **Native**: `useSafeAreaInsets().top`
- **Web**: Always `0`. (The 64px header is replaced by Sidebar on Desktop.)
- **Correct usage**: `const topInset = Platform.OS === 'web' ? 0 : insets.top;`

### Desktop web: readable width & CTAs
- **Constrain primary content** beside the 240px sidebar — wrap the main column in `maxWidth: 720–920`, `width: '100%'`, `alignSelf: 'center'`.
- **Avoid full-bleed button stacks** on web. Reserve full-width primary buttons for narrow/mobile layouts or a single hero CTA, not repeated down the page.

---

## 5. Essential Coding Rules

### NEVER Do
- Call `useAuth()` or `useColors()` outside a React component.
- Use `any` — use `Record<string, unknown>` or proper schema types.
- Write raw `<Pressable>` for buttons — use `<Button>`.
- Use `AsyncStorage` directly — use `src/lib/storage.ts` or Query Client helpers.
- Use `console.log` in prod — guard with `if (__DEV__)`.
- **Sentry is REMOVED**: Do not import `@sentry`. Use `console.error` + `captureRouteError`.

### ALWAYS Do
- Use `api.*` from `src/lib/api.ts` (`@/lib/api`) for all backend calls.
- Wrap async-data screens in `<ErrorBoundary>`.
- Handle 401s with `ApiError.isUnauthorized()`.
- Test on iOS, Android, and Web before PR.
- Add `accessibilityLabel` to interactive elements.
- Use `Image` from `expo-image` (better caching/perf).

---

## 6. Backend & Data Flows

### API Pattern
We use a **Namespace Pattern** in `src/lib/api.ts`:
`api.events.list()`, `api.auth.me()`, `api.tickets.scan()`, `api.council.list()`, `api.indigenous.spotlight()`, etc.

Domains served by `functions/src/handlers/`: activities, admin, auth, calendar, cities, council, cultureToday, discovery, events, feed, indigenous, locations, membership, misc, movies, offerings, perks, profiles, restaurants, rewards, search, shopping, social, stripe, stripeConnect, tickets, updates, uploads, users, wallet.

### Firestore Models (Summary)
- **users/{uid}**: Profile, membership tier, interests, `culturePassId` (`CP-USR-XXXX`), `lgaCode?`.
- **events/{eventId}**: Title, geoHash, lat/lng, lgaCode, organizerId, category, priceCents, tiers, entryType, status, hostInfo, eventSponsors.
- **tickets/{ticketId}**: User ownership, QR token, payment status, history.
- **profiles/{profileId}**: entityType (community / business / venue / artist / organisation), ownerId, lgaCode.
- **councils/{id}**: LGA data seeded from `AllCouncilsList.csv`.

### Stripe Payment Flow
1. Client calls `POST /api/events/:id/checkout`.
2. App opens Stripe-hosted URL in `WebBrowser`.
3. Webhook `checkout.session.completed` marks ticket `paid` and increments event `attending`.
4. **Stripe Connect** (`handlers/stripeConnect.ts` + `services/stripeConnect.ts`) handles host onboarding and platform-fee splits (default `STRIPE_CONNECT_PLATFORM_FEE_BPS=1000`, i.e. 10%).

### iCal export
Calendar export is **client-side**: `src/lib/ical.ts` builds multi-event `.ics` and `useCalendarSync(.native).ts` integrates with the OS calendar. A server-side `calendar/city.ics` subscription endpoint is on the roadmap.

---

## 7. Special Logic: Council & Indigenous

- **Council (LGA)**: Proximity dimension only. `lgaCode` matches users to local events.
- **Indigenous Spotlight**: Special discover rail pulled from `api.indigenous.spotlight`.
- **Acknowledgement of Country**: `src/lib/indigenous.ts`, shown on onboarding.

---

## 8. Build & Deployment

1. **Functions First**: Deploy backend before app when adding new endpoints.
2. **Environment**: `EXPO_PUBLIC_*` vars are baked into bundles; mirror them in `eas.json`.
3. **QA**: `npm run qa:solid` (lint + typecheck + scripted tests + Functions build + mock web export + route hygiene). `npm run qa:all` runs the full suite.
4. **Deploy Web (hosting only)**: `npm run deploy-web` (Expo Export → Hosting).
5. **Full Firebase deploy**: `npm run deploy` — typecheck → Functions build → web export with real `EXPO_PUBLIC_*` from `.env` → `firebase deploy --non-interactive` for all `firebase.json` targets.
6. **Guarded deploy**: `npm run deploy:guarded` — `qa:solid` then `deploy-all` (backup commit + push + deploy functions and hosting).
7. **Native builds**: `eas build --platform ios --profile production` / `eas build --platform android --profile production` (+ `submit:ios:production` / `submit:android:production`). OTA: `update:preview` / `update:production`.

---

## 9. Future Roadmap

- [ ] GeoHash backfill for events still missing `latitude` / `longitude` / `geoHash`.
- [ ] Council LGA auto-select from GPS on onboarding (`/api/councils/nearest`).
- [ ] Server-side `calendar/city.ics` subscription endpoint (currently client-only).
- [ ] Push notification deep links + per-category opt-out.
- [ ] Promotional code system (`promoCodes` collection, checkout validation).
- [ ] Tiered perk gates (lock overlay + server-side 403 on `/api/perks/:id/redeem`).
- [ ] Rewards points redemption UI (Perks tab balance chip + checkout toggle).
- [ ] Apple/Google Pay wallet top-up.
- [ ] NZ + UAE city grouping on onboarding.
- [ ] Firebase DataConnect migration (exploratory).
