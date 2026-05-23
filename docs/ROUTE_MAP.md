# CulturePass — Route Map

> **Living document.** Update this file whenever routes are added, removed, or renamed.
> The canonical source of truth for route files is `src/app/` (Expo Router file-based routing).
> Last updated: May 2026.

---

## Table of Contents

1. [(tabs) — Bottom navigation](#tabs--bottom-navigation)
2. [(domain) — Entity detail pages](#domain--entity-detail-pages)
3. [(onboarding) — Auth & onboarding flows](#onboarding--auth--onboarding-flows)
4. [(shortlinks) — Short URL prefixes](#shortlinks--short-url-prefixes)
5. [(static) — Static / marketing pages](#static--static--marketing-pages)
6. [Admin routes](#admin-routes)
7. [Contacts](#contacts)
8. [Membership](#membership)
9. [Perks](#perks)
10. [Hostspace / Creator hub](#hostspace--creator-hub)
11. [Payment & Tickets](#payment--tickets)
12. [Profile & Social](#profile--social)
13. [Browse, Search & Discovery](#browse-search--discovery)
14. [Settings](#settings)
15. [CultureMarket & CultureShop](#culturemarket--cultureshop)
16. [Loose top-level routes](#loose-top-level-routes)
17. [Special Expo Router files](#special-expo-router-files)
18. [Known aliases and redirects](#known-aliases-and-redirects)
19. [Route hygiene script](#route-hygiene-script)

---

## (tabs) — Bottom navigation

Layout file: `src/app/(tabs)/_layout.tsx`

### Visible tabs (shown in bottom bar / navigation rail)

| URL path | File | Tab label |
|---|---|---|
| `/` | `src/app/(tabs)/index.tsx` | Discover |
| `/calendar` | `src/app/(tabs)/calendar.tsx` | Calendar |
| `/community` | `src/app/(tabs)/community.tsx` | Community |
| `/city` | `src/app/(tabs)/city.tsx` | My City |
| `/my-space` | `src/app/(tabs)/my-space.tsx` | Profile |

### Hidden tabs (addressable but `href: null` — not shown in nav bar)

| URL path | File | Notes |
|---|---|---|
| `/host` | `src/app/(tabs)/host.tsx` | Host hub entry point |
| `/profile` | `src/app/(tabs)/profile.tsx` | Legacy profile tab |
| `/directory` | `src/app/(tabs)/directory.tsx` | Directory listing |
| `/menu` | `src/app/(tabs)/menu.tsx` | Overflow menu |
| `/communities` | `src/app/(tabs)/communities/index.tsx` | Communities list |
| `/communities/[id]` | `src/app/(tabs)/communities/[id].tsx` | Community detail |
| `/communities/create` | `src/app/(tabs)/communities/create.tsx` | Create community |

---

## (domain) — Entity detail pages

Layout file: `src/app/(domain)/_layout.tsx`

These routes render full-page entity detail screens. The `(domain)` segment is a route group and does **not** appear in the URL.

| URL path | File | Description |
|---|---|---|
| `/artist/[id]` | `src/app/(domain)/artist/[id].tsx` | Artist profile |
| `/business/[id]` | `src/app/(domain)/business/[id].tsx` | Business profile |
| `/cities` | `src/app/(domain)/cities/index.tsx` | Cities index |
| `/city/[name]` | `src/app/(domain)/city/[name].tsx` | City destination page |
| `/community/[id]` | `src/app/(domain)/community/[id].tsx` | Community detail |
| `/community/association-platform` | `src/app/(domain)/community/association-platform.tsx` | Association platform page |
| `/culture` | `src/app/(domain)/culture/index.tsx` | Culture hub index |
| `/culture/[slug]` | `src/app/(domain)/culture/[slug].tsx` | Culture destination page |
| `/event/[id]` | `src/app/(domain)/event/[id].tsx` | Event detail |
| `/event/create` | `src/app/(domain)/event/create.tsx` | Event creation (domain entry) |
| `/listing/create` | `src/app/(domain)/listing/create.tsx` | Listing creation |
| `/movies` | `src/app/(domain)/movies/index.tsx` | Movies index |
| `/restaurants` | `src/app/(domain)/restaurants/index.tsx` | Restaurants index |
| `/shopping` | `src/app/(domain)/shopping/index.tsx` | Shopping index |
| `/venue/[id]` | `src/app/(domain)/venue/[id].tsx` | Venue detail |
| `/events` | `src/app/(domain)/events.tsx` | Events listing page |

---

## (onboarding) — Auth & onboarding flows

Layout file: `src/app/(onboarding)/_layout.tsx`

The `(onboarding)` segment is a route group and does **not** appear in the URL.

| URL path | File | Description |
|---|---|---|
| `/onboarding` (index) | `src/app/(onboarding)/index.tsx` | Onboarding entry / splash |
| `/login` | `src/app/(onboarding)/login.tsx` | Login screen |
| `/signup` | `src/app/(onboarding)/signup.tsx` | Sign-up screen |
| `/forgot-password` | `src/app/(onboarding)/forgot-password.tsx` | Password reset |
| `/location` | `src/app/(onboarding)/location.tsx` | Location selection |
| `/interests` | `src/app/(onboarding)/interests.tsx` | Interests selection |
| `/communities` (onboarding) | `src/app/(onboarding)/communities.tsx` | Community selection |
| `/culture-match` | `src/app/(onboarding)/culture-match.tsx` | Culture matching |
| `/host-application` | `src/app/(onboarding)/host-application.tsx` | Host application form |

---

## (shortlinks) — Short URL prefixes

These are single-letter URL prefixes used for shareable short links. Each resolves to a full entity detail page. The `(shortlinks)` segment is a route group and does **not** appear in the URL.

| Short URL | File | Resolves to |
|---|---|---|
| `/b/[id]` | `src/app/(shortlinks)/b/[id].tsx` | Business |
| `/c/[id]` | `src/app/(shortlinks)/c/[id].tsx` | Community |
| `/e/[id]` | `src/app/(shortlinks)/e/[id].tsx` | Event |
| `/o/[id]` | `src/app/(shortlinks)/o/[id].tsx` | Organiser / Organisation |
| `/s/[id]` | `src/app/(shortlinks)/s/[id].tsx` | Shopping / Store |
| `/t/[id]` | `src/app/(shortlinks)/t/[id].tsx` | Ticket |
| `/u/[id]` | `src/app/(shortlinks)/u/[id].tsx` | User profile |
| `/v/[id]` | `src/app/(shortlinks)/v/[id].tsx` | Venue |

> **Note:** AGENTS.md documents `b, c, e, o, t, u, v`. The actual codebase also includes `/s/[id]` (shopping/store). Update AGENTS.md if `/s` is confirmed permanent.

---

## (static) — Static / marketing pages

The `(static)` segment is a route group and does **not** appear in the URL.

| URL path | File | Description |
|---|---|---|
| `/about` | `src/app/(static)/about.tsx` | About CulturePass |
| `/contact` | `src/app/(static)/contact.tsx` | Contact page |
| `/founder` | `src/app/(static)/founder.tsx` | Founder story |
| `/get2know` | `src/app/(static)/get2know.tsx` | Get to know us |
| `/landing` | `src/app/(static)/landing.tsx` | Marketing landing page |
| `/logo` | `src/app/(static)/logo.tsx` | Brand / logo page |
| `/help` | `src/app/(static)/help/index.tsx` | Help centre |
| `/legal/community` | `src/app/(static)/legal/community.tsx` | Community guidelines |
| `/legal/cookies` | `src/app/(static)/legal/cookies.tsx` | Cookie policy |
| `/legal/event-terms` | `src/app/(static)/legal/event-terms.tsx` | Event terms |
| `/legal/guidelines` | `src/app/(static)/legal/guidelines.tsx` | Platform guidelines |
| `/legal/privacy` | `src/app/(static)/legal/privacy.tsx` | Privacy policy |
| `/legal/terms` | `src/app/(static)/legal/terms.tsx` | Terms of service |

---

## Admin routes

Layout file: `src/app/admin/_layout.tsx`

All routes are under `/admin/`. Access is role-gated (admin role required).

| URL path | File | Description |
|---|---|---|
| `/admin` | `src/app/admin/index.tsx` | Admin dashboard |
| `/admin/audit-logs` | `src/app/admin/audit-logs.tsx` | Audit log viewer |
| `/admin/communities` | `src/app/admin/communities.tsx` | Community management |
| `/admin/community-banner` | `src/app/admin/community-banner.tsx` | Community banner management |
| `/admin/data-compliance` | `src/app/admin/data-compliance.tsx` | Data compliance tools |
| `/admin/discover` | `src/app/admin/discover.tsx` | Discover feed management |
| `/admin/finance` | `src/app/admin/finance.tsx` | Finance / revenue overview |
| `/admin/moderation` | `src/app/admin/moderation.tsx` | Content moderation queue |
| `/admin/notifications` | `src/app/admin/notifications.tsx` | Push notification management |
| `/admin/platform` | `src/app/admin/platform.tsx` | Platform configuration |
| `/admin/promo-codes` | `src/app/admin/promo-codes.tsx` | Promotional codes |
| `/admin/users` | `src/app/admin/users.tsx` | User management |
| `/admin/verification` | `src/app/admin/verification/index.tsx` | Verification queue |
| `/admin/verification/[taskId]` | `src/app/admin/verification/[taskId].tsx` | Verification task detail |

> **Note:** AGENTS.md lists `handles`, `import`, and `updates` as admin routes. These files are not present on disk as of May 2026. Add them here when created.

---

## Contacts

| URL path | File | Description |
|---|---|---|
| `/contacts` | `src/app/contacts/index.tsx` | Contacts CRM list |
| `/contacts/[cpid]` | `src/app/contacts/[cpid].tsx` | Contact detail (`cpid` = contact profile ID) |

---

## Membership

Layout file: `src/app/membership/_layout.tsx`

| URL path | File | Description |
|---|---|---|
| `/membership` | `src/app/membership/index.tsx` | Membership overview |
| `/membership/upgrade` | `src/app/membership/upgrade.tsx` | Upgrade / tier selection |

---

## Perks

| URL path | File | Description |
|---|---|---|
| `/perks` | `src/app/perks/index.tsx` | Perks listing |
| `/perks/[id]` | `src/app/perks/[id].tsx` | Perk detail & redemption |

---

## Hostspace / Creator hub

Layout file: `src/app/hostspace/_layout.tsx`

| URL path | File | Description |
|---|---|---|
| `/hostspace` | `src/app/hostspace/index.tsx` | Creator hub home |
| `/hostspace/apply` | `src/app/hostspace/apply.tsx` | Host application |
| `/hostspace/dashboard` | `src/app/hostspace/dashboard/index.tsx` | Host dashboard |
| `/hostspace/create` | `src/app/hostspace/create/index.tsx` | Create content entry |
| `/hostspace/create/[category]` | `src/app/hostspace/create/[category].tsx` | Create by category |
| `/hostspace/create/listing` | `src/app/hostspace/create/listing.tsx` | Create listing |

### Create (standalone)

Layout file: `src/app/create/_layout.tsx`

| URL path | File | Description |
|---|---|---|
| `/create` | `src/app/create/index.tsx` | Create entry point |
| `/create/hub` | `src/app/create/hub.tsx` | Creator hub redirect |
| `/create/[type]` | `src/app/create/[type].tsx` | Create by type |

---

## Payment & Tickets

### Payment

| URL path | File | Description |
|---|---|---|
| `/payment/wallet` | `src/app/payment/wallet.tsx` | Wallet balance |
| `/payment/methods` | `src/app/payment/methods.tsx` | Payment methods |
| `/payment/transactions` | `src/app/payment/transactions.tsx` | Transaction history |
| `/payment/success` | `src/app/payment/success.tsx` | Payment success callback |
| `/payment/cancel` | `src/app/payment/cancel.tsx` | Payment cancel callback |

### Checkout

| URL path | File | Description |
|---|---|---|
| `/checkout` | `src/app/checkout/index.tsx` | Checkout flow (Stripe) |

### Tickets

| URL path | File | Description |
|---|---|---|
| `/tickets` | `src/app/tickets/index.tsx` | My tickets list |
| `/tickets/[id]` | `src/app/tickets/[id].tsx` | Ticket detail |
| `/tickets/print/[id]` | `src/app/tickets/print/[id].tsx` | Printable ticket |

### Offers

| URL path | File | Description |
|---|---|---|
| `/offers` | `src/app/offers/index.tsx` | Offers listing |

---

## Profile & Social

### Profile

| URL path | File | Description |
|---|---|---|
| `/profile` | `src/app/profile/index.tsx` | My profile |
| `/profile/edit` | `src/app/profile/edit.tsx` | Edit profile |
| `/profile/public` | `src/app/profile/public.tsx` | Public profile preview |
| `/profile/qr` | `src/app/profile/qr.tsx` | Profile QR code |
| `/profile/[id]` | `src/app/profile/[id].tsx` | Profile by ID |

### User & Organiser

| URL path | File | Description |
|---|---|---|
| `/user/[id]` | `src/app/user/[id].tsx` | User public profile |
| `/organiser/[id]` | `src/app/organiser/[id].tsx` | Organiser profile |

### Network

| URL path | File | Description |
|---|---|---|
| `/network` | `src/app/network/index.tsx` | Followers / following / suggestions |

### Saved

| URL path | File | Description |
|---|---|---|
| `/saved` | `src/app/saved/index.tsx` | Saved events & content |

---

## Browse, Search & Discovery

| URL path | File | Description |
|---|---|---|
| `/browse/[category]` | `src/app/browse/[category].tsx` | Category browse (Mode-C cards) |
| `/search` | `src/app/search/index.tsx` | Search |
| `/activities` | `src/app/activities/index.tsx` | Activity feed |
| `/updates/[id]` | `src/app/updates/[id].tsx` | App announcement detail |
| `/notifications` | `src/app/notifications/index.tsx` | Notifications inbox |

---

## Settings

| URL path | File | Description |
|---|---|---|
| `/settings` | `src/app/settings/index.tsx` | Settings home |
| `/settings/account` | `src/app/settings/account.tsx` | Account settings |
| `/settings/appearance` | `src/app/settings/appearance.tsx` | Theme / appearance |
| `/settings/calendar-sync` | `src/app/settings/calendar-sync.tsx` | Calendar sync |
| `/settings/help` | `src/app/settings/help.tsx` | Help & support |
| `/settings/location` | `src/app/settings/location.tsx` | Location preferences |
| `/settings/notifications` | `src/app/settings/notifications.tsx` | Notification preferences |
| `/settings/privacy` | `src/app/settings/privacy.tsx` | Privacy settings |
| `/settings/about` | `src/app/settings/about.tsx` | About / version info |

---

## CultureMarket & CultureShop

These are experimental / feature-flagged marketplace routes. Layout files exist for both.

### CultureMarket

Layout file: `src/app/CultureMarket/_layout.tsx`

| URL path | File | Description |
|---|---|---|
| `/CultureMarket` | `src/app/CultureMarket/index.tsx` | Market home |
| `/CultureMarket/list` | `src/app/CultureMarket/list.tsx` | Market listings |
| `/CultureMarket/[id]` | `src/app/CultureMarket/[id].tsx` | Market item detail |

### CultureShop

Layout file: `src/app/CultureShop/_layout.tsx`

| URL path | File | Description |
|---|---|---|
| `/CultureShop` | `src/app/CultureShop/index.tsx` | Shop home |
| `/CultureShop/list` | `src/app/CultureShop/list.tsx` | Shop listings |
| `/CultureShop/[id]` | `src/app/CultureShop/[id].tsx` | Shop item detail |
| `/CultureShop/manage` | `src/app/CultureShop/manage.tsx` | Shop management |

---

## Loose top-level routes

These files sit directly in `src/app/` and are not inside any route group.

| URL path | File | Description |
|---|---|---|
| `/scanner` | `src/app/scanner.tsx` | QR / ticket scanner |
| `/map` | `src/app/map.tsx` | Map view |
| `/explore` | `src/app/explore.tsx` | Explore / discovery surface |
| `/finder` | `src/app/finder.tsx` | Venue / event finder |
| `/my-council` | `src/app/my-council.tsx` | My Council (LGA) page |
| `/menu` | `src/app/menu.tsx` | App menu / drawer |
| `/kerala` | `src/app/kerala.tsx` | Kerala cultural destination |
| `/design-vitrine` | `src/app/design-vitrine.tsx` | Design system showcase (dev only) |
| `/onboarding-canvas` | `src/app/onboarding-canvas.tsx` | Onboarding canvas (dev/test) |

---

## Special Expo Router files

These are Expo Router convention files, not navigable routes.

| File | Purpose |
|---|---|
| `src/app/_layout.tsx` | Root layout — wraps the entire app |
| `src/app/+html.tsx` | Custom HTML shell for web export |
| `src/app/+native-intent.tsx` | Native deep-link intent handler |
| `src/app/+not-found.tsx` | 404 / not-found fallback screen |

---

## Known aliases and redirects

### `[handle].tsx` catch-all

`src/app/[handle].tsx` is a catch-all route that matches any path segment not claimed by a more specific route. It is used for `/@username` style profile URLs — e.g. `/johndoe` resolves to the public profile for the user with handle `johndoe`. The screen reads the `handle` param and redirects to the appropriate profile or entity page.

### Shortlink routes

The `(shortlinks)/` group provides single-letter URL prefixes for shareable deep links. Each prefix maps to an entity type:

| Short prefix | Entity type | Example |
|---|---|---|
| `/b/[id]` | Business | `/b/abc123` → `/business/abc123` |
| `/c/[id]` | Community | `/c/abc123` → `/community/abc123` |
| `/e/[id]` | Event | `/e/abc123` → `/event/abc123` |
| `/o/[id]` | Organiser | `/o/abc123` → `/organiser/abc123` |
| `/s/[id]` | Shopping / Store | `/s/abc123` → `/shopping/abc123` |
| `/t/[id]` | Ticket | `/t/abc123` → `/tickets/abc123` |
| `/u/[id]` | User | `/u/abc123` → `/user/abc123` |
| `/v/[id]` | Venue | `/v/abc123` → `/venue/abc123` |

These short URLs are intended for use in QR codes, SMS, and social sharing where brevity matters.

### Root index redirect

`src/app/index.tsx` at the root level redirects to `/(tabs)/index` (the Discover tab). It is not a standalone screen.

---

## Route hygiene script

`scripts/tests/validate-web-route-hygiene.ts` checks that no internal helper routes (e.g. `_components/`, `_lib/`, `_styles`) have leaked into the web export `dist/` directory as publicly accessible HTML files. This prevents Expo Router's file-based routing from accidentally exposing non-page files as web routes.

**What it checks:**

The script walks all `.html` files in the web export `dist/` directory and asserts that none match these forbidden patterns:

- `_components/*.html`
- `_lib/*.html`
- `_styles.html`
- `_constants.html`

If any leaked helper routes are found, the script exits non-zero and lists the offending files.

**How to run:**

```bash
# Requires a web export to exist first
npm run build-web

# Then run the hygiene check
npm run test:web:route-hygiene
```

Or run both in sequence (as part of the `qa:solid` gate):

```bash
npm run qa:solid
```

`qa:solid` runs: `typecheck → qa:all → functions:build → build-web:with-mock-firebase → test:web:route-hygiene`

The `test:web:route-hygiene` step is also included as a named step in `ci.yml` for easier debugging in CI logs.

> **Note:** The script checks the built `dist/` output, not the source files. You must run `npm run build-web` (or `build-web:with-mock-firebase` in CI) before running the hygiene check.
