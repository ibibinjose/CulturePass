# 03 — App Flow

> **Version**: 2.0 — May 2026
> **Status**: Live — v1.1.0
> **Audience**: Product, Design, Engineering, QA
> **Related**: [01-PRD](01-PRD.md) · [04-UI_UX_BRIEF](04-UI_UX_BRIEF.md) · [ROUTE_API_MATRIX](ROUTE_API_MATRIX.md)

---

## Navigation Architecture Overview

CulturePass uses **Expo Router** (file-based routing). Navigation is split into:

| Group | Routes | Access |
|---|---|---|
| `(tabs)/` | 5 visible tabs + hidden screens | Bottom tab bar (native) / Sidebar (web) |
| `(domain)/` | Entity detail pages | Deep link / in-app navigation |
| `(onboarding)/` | Signup + onboarding wizard | Auth gate redirect |
| `(shortlinks)/` | Short URL redirects (`/e/xxx`, `/c/xxx`, etc.) | External share links |
| `(static)/` | About, legal, help pages | Footer / settings links |
| `browse/[category]` | Category browse pages | Category rail tap |
| `create/` | Create hub + type-specific flows | Host Hub + FAB |
| `admin/` | 14+ admin routes | platformAdmin role required |
| `dashboard/` | Organiser / venue / sponsor dashboards | organizer role required |

---

## 1. App Entry & Auth Gate

```
App Launch
    │
    ├─ Has valid session? ──No──► (onboarding)/login.tsx
    │                                    │
    │                              Has account?
    │                             /          \
    │                    Yes: login      No: signup
    │                            │              │
    │                    ─────────────────────────
    │                            │
    │                    Onboarding complete?
    │                    /              \
    │               Yes: skip      No: onboarding wizard
    │                        │
    └─────────────────────────
                             │
                    (tabs)/index.tsx  ← Discover (home)
```

### Onboarding Wizard

1. **/onboarding/cultures** — Select culture tags (interests)
2. **/onboarding/location** — Select city + country
3. **/onboarding/communities** — Join initial communities (optional)
4. → `OnboardingContext.isComplete = true` → redirect to `(tabs)/index.tsx`

---

## 2. Bottom Tab Bar (5 Tabs)

| Tab | Route | Icon | Role |
|---|---|---|---|
| Discover | `(tabs)/index.tsx` | Home | All users |
| Calendar | `(tabs)/calendar.tsx` | Calendar | All users |
| Community | `(tabs)/community.tsx` | People | All users |
| City | `(tabs)/city.tsx` | Map pin | All users |
| My Space | `(tabs)/my-space.tsx` | Person | Authenticated |

Hidden tab screens (href=null — reached via in-app links):
- `(tabs)/CultureX.tsx` — Cultural content hub
- `(tabs)/host.tsx` — Host Hub
- `(tabs)/profile.tsx` — User profile (also reachable from My Space)
- `(tabs)/directory.tsx` — Business/venue directory
- `(tabs)/dashboard.tsx` — Quick dashboard entry
- `(tabs)/menu.tsx` — Expanded menu / settings

---

## 3. Discover Tab Flow (Home)

```
(tabs)/index.tsx
    │
    ├─ Hero Carousel (editorial featured events)
    │       └─ tap event ──► (domain)/event/[id].tsx
    │
    ├─ Event Rails (Trending / Near You / By Culture / Free)
    │       └─ tap event ──► (domain)/event/[id].tsx
    │       └─ tap "See all" ──► (domain)/events.tsx (filtered)
    │
    ├─ Community Rail
    │       └─ tap community ──► (domain)/community/[id].tsx
    │       └─ tap "See all" ──► (tabs)/community.tsx
    │
    ├─ Category Rail
    │       └─ tap category ──► browse/[category].tsx
    │
    ├─ City Rail
    │       └─ tap city ──► (domain)/city/[name].tsx
    │
    ├─ Indigenous Spotlight
    │       └─ tap event ──► (domain)/event/[id].tsx
    │       └─ tap artist ──► (domain)/artist/[id].tsx
    │
    ├─ Super App Links
    │       ├─ CultureX ──► (tabs)/CultureX.tsx
    │       ├─ Host Hub ──► (tabs)/host.tsx
    │       └─ Communities ──► (tabs)/community.tsx
    │
    └─ Feed Cards (personalised)
            └─ tap ──► relevant entity detail page
```

---

## 4. Event Flow

### 4.1 Event Discovery → Purchase

```
Event list (any rail / browse / search)
    │
    └─ tap event card
            │
    (domain)/event/[id].tsx
            │
    ├─ View details (description, venue, date, culture tags, artists)
    ├─ View ticket tiers
    ├─ Tap "Get Tickets"
    │       │
    │   Authenticated?
    │   /           \
    │  No           Yes
    │   └─ login    └─ checkout/[eventId].tsx
    │                       │
    │               Select ticket tier + quantity
    │               Enter payment details (Stripe)
    │               Confirm purchase
    │                       │
    │               payment_intent.succeeded (webhook)
    │                       │
    │               tickets/[ticketId].tsx ← confirmation screen
    │                       │
    │               ├─ QR code displayed
    │               ├─ Add to Calendar option
    │               └─ Share event card
    │
    ├─ Tap "Save" ──► SavedContext.savedEvents
    ├─ Tap "Share" ──► native share sheet (Open Graph card)
    └─ Tap organiser name ──► organiser/[id].tsx
```

### 4.2 Event Creation (Organiser)

```
Host Hub (tabs)/host.tsx
    │
    └─ "Create Event" button
            │
    create/index.tsx (hub)
            │
    create/[type].tsx → (domain)/listing/create.tsx → 9-step wizard:
            │
    Step 1: Basics (title, category, description)
    Step 2: Hero image upload
    Step 3: Location (venue name, address, map pin, lgaCode)
    Step 4: Date + Time (start/end, timezone)
    Step 5: Entry type (free / ticketed / RSVP)
    Step 6: Ticket tiers (price, capacity, name per tier)
    Step 7: Team (co-organisers)
    Step 8: Culture tags (South Asian, East African, Indigenous, etc.)
    Step 9: Review + Publish
            │
    ├─ Save as Draft → status: 'draft' → dashboard
    └─ Publish → status: 'published' → live on Discover
```

---

## 5. Calendar Tab Flow

```
(tabs)/calendar.tsx
    │
    ├─ Month grid view (event dots on dates with events)
    │       └─ tap date ──► day view (events list for that date)
    │
    ├─ My Tickets segment
    │       └─ upcoming ticket ──► tickets/[id].tsx (QR code)
    │
    ├─ Civic Reminders (public holidays, cultural dates)
    │
    ├─ Filter chips (by culture tag)
    │       └─ apply filter ──► filtered calendar view
    │
    └─ "Add to Calendar" (device sync)
            ├─ Add all saved events ──► expo-calendar (native) / .ics download (web)
            └─ Subscribe to city calendar ──► webcal:// URL
```

---

## 6. Community Tab Flow

```
(tabs)/community.tsx
    │
    ├─ My Communities rail (joined)
    │       └─ tap ──► (domain)/community/[id].tsx
    │
    ├─ Discover Communities (by culture, city, category)
    │       └─ tap ──► (domain)/community/[id].tsx
    │                       │
    │               ├─ "Join" button → api.communities.join()
    │               ├─ Community events ──► event flow
    │               ├─ Members list ──► user/[id].tsx
    │               └─ Posts feed (feature-flagged, Month 3)
    │
    └─ Search communities (filter by culture tag)
```

---

## 7. City Tab Flow

```
(tabs)/city.tsx (city selector)
    │
    └─ select city
            │
    (domain)/city/[name].tsx
            │
    ├─ City hero banner
    ├─ Upcoming events rail ──► event flow
    ├─ Featured communities ──► community flow
    ├─ Local businesses ──► (domain)/business/[id].tsx
    ├─ Cultural venues ──► (domain)/venue/[id].tsx
    └─ Council area ──► my-council.tsx (LGA proximity)
```

---

## 8. My Space (Profile) Tab Flow

```
(tabs)/my-space.tsx
    │
    ├─ Upcoming tickets ──► tickets/[id].tsx (QR)
    ├─ Saved events ──► event/[id].tsx
    ├─ Joined communities ──► community/[id].tsx
    ├─ Perks balance / My Perks ──► perks flow
    ├─ Membership status chip
    │       └─ tap ──► membership/[tier].tsx (upgrade flow)
    │
    ├─ Identity QR Card ──► WidgetIdentityQRCard modal
    ├─ Network (followers/following) ──► network/
    │       ├─ /network (added / followers / following / suggestions)
    │       └─ tap user ──► user/[id].tsx
    │
    ├─ Contacts CRM ──► contacts/
    │       ├─ /contacts (list, search, segments)
    │       └─ /contacts/[cpid] (detail: notes, tags, interests, pin)
    │
    ├─ Settings ──► settings/ (notifications, privacy, appearance)
    └─ Edit Profile ──► profile/ (name, bio, photo, social links)
```

---

## 9. Perks Flow

```
(domain)/perks.tsx (via My Space or bottom navigation)
    │
    ├─ Perks balance chip
    ├─ Featured perks carousel
    ├─ Perks by category
    │
    └─ tap perk ──► perks/[id].tsx
                        │
                ├─ PerkHero, PerkAbout, PerkDetails
                ├─ Membership lock (if tier-gated)
                │       └─ "Upgrade" ──► membership upgrade flow
                └─ "Redeem" button
                        │
                PerkCouponModal (show coupon code + instructions)
                        │
                api.perks.redeem() ──► points deducted
```

---

## 10. Host Hub Flow (Organiser)

```
(tabs)/host.tsx (hidden from tab bar — reached via SuperAppLinks)
    │
    ├─ My Events list
    │       ├─ tap event ──► dashboard/backstage/[id].tsx
    │       └─ "Create Event" ──► event creation wizard
    │
    ├─ Dashboard ──► dashboard/organizer.tsx
    │       ├─ Revenue summary
    │       ├─ Ticket sales chart
    │       ├─ Attendee list per event
    │       └─ Scanner link ──► scanner.tsx
    │
    ├─ Wallet ──► payment/
    │       └─ Stripe Connect payout status
    │
    └─ Create Profile ──► create/hub.tsx
                └─ create/[type].tsx (venue / business / organisation / artist)
```

---

## 11. Search Flow

```
Search icon (header) ──► search/
    │
    ├─ Global search input
    ├─ Filter chips (city, category, culture tag, entity type)
    │
    ├─ Results: Events
    │       └─ tap ──► event/[id].tsx
    ├─ Results: Communities
    │       └─ tap ──► community/[id].tsx
    ├─ Results: Businesses / Venues
    │       └─ tap ──► business/[id].tsx or venue/[id].tsx
    └─ Results: Artists
            └─ tap ──► artist/[id].tsx
```

---

## 12. Directory Flow

```
(tabs)/directory.tsx (hidden — accessed via menu)
    │
    ├─ Filter tabs: All / Events / Indigenous / Businesses / Venues /
    │               Organisations / Councils / Government / Charities
    │
    ├─ Council filter chip (LGA proximity)
    └─ tap card ──► appropriate entity detail page
```

---

## 13. Admin Dashboard Flow

```
admin/dashboard.tsx (requires platformAdmin role)
    │
    ├─ admin/users.tsx (user search, role management, ban)
    ├─ admin/audit-logs.tsx (full activity log)
    ├─ admin/moderation.tsx (content reports queue)
    ├─ admin/finance.tsx (revenue, payout oversight)
    ├─ admin/discover.tsx (editorial curation, hero selection)
    ├─ admin/import.tsx (bulk event import)
    ├─ admin/handles.tsx (@username management)
    ├─ admin/notifications.tsx (broadcast push notification)
    ├─ admin/platform.tsx (feature flags, system config)
    ├─ admin/data-compliance.tsx (GDPR/Privacy Act requests)
    └─ admin/updates.tsx (platform changelog management)
```

---

## 14. Onboarding Flows (Detail)

### Signup

```
(onboarding)/signup.tsx
    │
    ├─ Name, email, password
    ├─ OR: Google / Apple Sign-In
    │
    └─ createUserWithEmailAndPassword / social auth
            │
    Auto-navigate ──► onboarding wizard
```

### Login

```
(onboarding)/login.tsx
    │
    ├─ Email + password
    ├─ "Forgot password" ──► password reset email
    ├─ Google Sign-In
    ├─ Apple Sign-In
    └─ Biometric (if enrolled)
            │
    Post-auth ──► onboarding complete check
    ├─ Complete ──► (tabs)/index.tsx
    └─ Incomplete ──► onboarding wizard
```

---

## 15. Short Links (Deep Links)

| Route | Resolves To |
|---|---|
| `/e/[id]` | `(domain)/event/[id].tsx` |
| `/c/[id]` | `(domain)/community/[id].tsx` |
| `/b/[id]` | `(domain)/business/[id].tsx` |
| `/v/[id]` | `(domain)/venue/[id].tsx` |
| `/u/[id]` | `user/[id].tsx` |
| `/o/[id]` | `organiser/[id].tsx` |
| `/t/[id]` | `tickets/[id].tsx` |
| `/[@handle]` | `[handle].tsx` → resolve → entity page |

Universal links via `applinks:culturepass.app` (iOS Associated Domains).

---

## 16. Settings Flow

```
settings/
    │
    ├─ Notifications (per-category opt-out — Month 3)
    ├─ Appearance (dark/light/system)
    ├─ Privacy (data export, delete account)
    ├─ Linked Accounts (Google, Apple)
    ├─ Membership ──► membership/[tier].tsx
    └─ Help ──► (static)/help/
```

---

## 17. Web-Specific Navigation

On desktop (≥1024px), the bottom tab bar is replaced by a 240px left `WebSidebar`:

```
WebSidebar (240px)
    │
    ├─ BrandLockup
    ├─ Discover
    ├─ Calendar
    ├─ Community
    ├─ City
    ├─ My Space
    ├─ [Divider]
    ├─ Host Hub (if organizer role)
    ├─ Admin (if platformAdmin role)
    └─ Settings
```

No `TopBar` on desktop web — `topInset = 0` always on web.

Tablet (768–1023px): bottom tab bar shown; `M3NavigationRail` available for secondary nav.

---

## 18. Error & Empty States

| State | Component | Behavior |
|---|---|---|
| API error | `ScreenState` (error variant) | Retry button, error message |
| Empty results | `ScreenState` (empty variant) | Illustration + action CTA |
| Loading | `Skeleton` / `FeedCardSkeleton` | Animated shimmer placeholders |
| No auth (gated screen) | Redirect to login | Preserve intended destination as `returnTo` param |
| Role insufficient | 403 screen | "You don't have permission" + back navigation |
| Network offline | Offline banner | Cached data shown where available |

---

*Last updated: May 2026 | Maintained by: CulturePass Product + Engineering*
