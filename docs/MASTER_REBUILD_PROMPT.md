# CulturePass — Master Rebuild Prompt

> Use this document to rebuild CulturePass on any AI platform, stack, or toolchain.
> It is intentionally host-agnostic and tool-agnostic. You choose the database, auth provider,
> backend runtime, CI/CD, and deployment targets. This document describes **what to build**, not **how to deploy it**.
>
> **For wireframing**: This document is structured to be used directly with Google Stitch (stitch.withgoogle.com)
> or any Figma-like tool. Each screen section includes layout description, component hierarchy,
> user actions, and navigation connections — everything needed to generate accurate wireframes and mockups.

---

## 1. Product Identity

### What It Is

CulturePass is a **B2B2C cross-platform cultural lifestyle marketplace** for diaspora communities.
It is a marketplace — not a government portal, not an NGO tool.

**Mission**: Help diaspora communities stay connected to their culture, to each other, and to the places that matter.

**Core loop**: Users discover events → buy tickets → join communities → earn perks → repeat.

### Who It Serves (Three Audiences)


| Audience                     | Role        | Primary Actions                                            |
| ---------------------------- | ----------- | ---------------------------------------------------------- |
| Community Members            | `user`      | Discover events, buy tickets, join communities, earn perks |
| Event Organisers / Artists   | `organizer` | Create events, sell tickets, reach cultural audiences      |
| Cultural Businesses / Venues | `business`  | List in directory, build reputation, offer perks           |


### Operating Regions

CulturePass operates globally — any city, any culture. Discovery is **city-first** — users see their city's content by default. Current focus cities include Sydney, Melbourne, Auckland, Dubai, London, and Toronto; new cities are added as organiser and community density grows. There is no geographic restriction on sign-up, event creation, or business listings.

---

## 2. Navigation Architecture

### Global Provider Stack (app boot order)

```
OnboardingContext (city, country, interests, isComplete — persisted)
└── AuthProvider (JWT session, user profile, role)
    └── DataSync (syncs auth user → onboarding context)
    └── AuthGuard (global route protection, redirect rules)
    └── SavedContext (bookmarked events + joined communities)
    └── ContactsContext (CPID contact directory)
        └── Screen Stack (all routes)
            └── GlobalBackButton (floating back button overlay)
```

### Route Guard Rules

```
Guest → hits protected route → redirect to /login
Authenticated → hits /login or /signup → redirect to /(tabs) or /location (if onboarding incomplete)
Protected routes: /profile, /tickets, /payment, /saved, /settings, /membership, /submit, /scanner, /notifications, /contacts
Partially protected tabs: calendar, perks, dashboard require login; discover and community are open
```

### Tab Bar (6 visible tabs, mobile bottom / desktop sidebar)

```
Tab 1: Discover    icon: compass
Tab 2: Feed        icon: newspaper
Tab 3: Calendar    icon: calendar
Tab 4: Community   icon: people
Tab 5: Perks       icon: gift
Tab 6: Profile     icon: person
```

Hidden (no tab icon, accessible via deep link or push): `explore`, `directory`, `dashboard`

---

## 3. Complete Screen Inventory

### USER JOURNEY ORDER (the order a new user experiences screens)

```
COLD START
  1. app/landing.tsx           [web only — marketing page]
  2. app/index.tsx             [redirect hub — sends to login or tabs]

ONBOARDING (new user, sequential flow)
  3. (onboarding)/index        [welcome splash]
  4. (onboarding)/signup       [register]
     OR (onboarding)/login     [existing user]
     OR (onboarding)/forgot-password
  5. (onboarding)/location     [city + country]
  6. (onboarding)/interests    [activity categories]
  7. (onboarding)/culture-match [cultural identity]
  8. (onboarding)/communities  [join suggested communities]

MAIN APP — TAB LOOP
  9. (tabs)/index              [Discover — home]
  10. (tabs)/feed              [Social Feed]
  11. (tabs)/calendar          [Calendar]
  12. (tabs)/community         [Community Hub]
  13. (tabs)/perks             [Perks]
  14. (tabs)/profile           [My Profile]

FROM DISCOVER
  → event/[id]                 [event detail]
  → events                     [all events browse]
  → map                        [full map view]
  → search/index               [search]
  → city/[name]                [city page]
  → community/[id]             [community detail]

FROM EVENT DETAIL
  → event/create               [create event — organiser only]
  → tickets/index              [after purchase]
  → artist/[id]
  → venue/[id]
  → community/[id]

FROM PROFILE TAB
  → profile/edit
  → profile/public
  → profile/qr
  → tickets/index
  → saved/index
  → contacts/index
  → notifications/index
  → settings/index
  → membership/upgrade
  → dashboard/organizer        [if organiser role]

FROM COMMUNITY TAB
  → community/[id]
  → user/[id]
  → communities/index

FROM PERKS TAB
  → perks/[id]
  → membership/upgrade

FROM TICKETS
  → tickets/[id]               [single ticket QR]
  → tickets/print/[id]

FROM SETTINGS
  → settings/location
  → settings/privacy
  → settings/notifications
  → settings/about
  → settings/help
  → legal/terms
  → legal/privacy
  → legal/cookies
  → legal/guidelines

FROM PAYMENT
  → payment/wallet
  → payment/methods
  → payment/transactions
  → payment/success
  → payment/cancel

FROM ADMIN ONLY
  → admin/dashboard
  → admin/users
  → admin/moderation
  → admin/handles
  → admin/notifications
  → admin/audit-logs
  → admin/finance
  → admin/platform
  → admin/import
  → admin/updates
  → admin/data-compliance

UNIVERSAL HANDLE ROUTING
  → /[handle]                  [any +handle URL resolves to correct entity]
```

---

## 4. Screen-by-Screen Reference

> Format: **SCREEN NAME** | Route | Auth required? | Tab
> — Purpose, layout, components, actions, outbound links

---

### GROUP A: ENTRY & REDIRECT

---

#### A1. App Root

**Route**: `/` (app/index.tsx) | Public

**Purpose**: Invisible redirect hub. Checks auth and onboarding state on app launch.

**Logic**:

- `isRestoring=true` → show splash/loading
- `!isAuthenticated` → redirect to `/(onboarding)/index`
- `isAuthenticated && !isComplete` → redirect to `/(onboarding)/location`
- `isAuthenticated && isComplete` → redirect to `/(tabs)`

**No UI** — purely logic.

---

#### A2. Landing Page

**Route**: `/landing` | Public | Web only

**Purpose**: Marketing page for web visitors before login. Not shown on native.

**Layout**: Full-screen scroll

- Hero section: brand gradient background, logo, tagline ("Your cultural home, wherever you are"), two CTAs
- Features section: 3-column cards (Discover Events / Join Communities / Earn Perks)
- Testimonials / social proof
- App store badges (iOS / Android)
- Footer: links to About, Legal, Contact

**Actions**:

- "Get Started" → `/(onboarding)/signup`
- "Sign In" → `/(onboarding)/login`
- App Store badge → external iOS store URL
- Google Play badge → external Android store URL

---

### GROUP B: ONBOARDING FLOW (Sequential — steps 1–7)

---

#### B1. Welcome Splash

**Route**: `/(onboarding)/index` | Public | Step 0 of 7

**Purpose**: First branded screen users see. Sets tone.

**Layout**: Full-screen, centered, brand gradient background

- Logo (large)
- Tagline text
- Animated aurora gradient background
- Two buttons stacked vertically

**Actions**:

- "Create Account" → `/(onboarding)/signup`
- "Sign In" → `/(onboarding)/login`

---

#### B2. Sign Up

**Route**: `/(onboarding)/signup` | Public | Step 1 of 7

**Purpose**: New user registration

**Layout**: Scroll form

- Header: "Create your account", brand gradient top strip
- Inputs: Display Name, Email, Password (with strength indicator), Confirm Password
- Social sign-in row: [Google button] [Apple button (iOS only)]
- Legal consent checkbox: "I agree to Terms of Service and Privacy Policy" (links open modal or push to legal screens)
- Primary CTA button: "Create Account"
- Footer link: "Already have an account? Sign In"

**Actions**:

- Form submit → `POST /api/auth/register` → on success → `/(onboarding)/location`
- Google → OAuth flow → on success → `/(onboarding)/location` or `/(tabs)` if returning user
- Apple (iOS) → Sign in with Apple → on success → same
- "Sign In" link → `/(onboarding)/login`
- Terms link → `legal/terms` (modal or push)
- Privacy link → `legal/privacy` (modal or push)

**Validation**: email format, password ≥ 8 chars, passwords match, display name not empty

---

#### B3. Login

**Route**: `/(onboarding)/login` | Public

**Purpose**: Existing user sign-in

**Layout**: Scroll form

- Header: "Welcome back"
- Inputs: Email, Password
- "Forgot Password?" link (right-aligned under password)
- Primary CTA: "Sign In"
- Social sign-in row: [Google] [Apple (iOS)]
- Footer: "New here? Create Account"

**Actions**:

- Form submit → `POST /api/auth/login` → on success → check onboarding state → route accordingly
- Forgot Password → `/(onboarding)/forgot-password`
- Create Account → `/(onboarding)/signup`

---

#### B4. Forgot Password

**Route**: `/(onboarding)/forgot-password` | Public

**Purpose**: Password reset request

**Layout**: Minimal form

- Back button
- Header: "Reset Password"
- Email input
- "Send Reset Link" CTA
- Success state: check-icon, "Check your email" message

**Actions**:

- Submit → `POST /api/auth/forgot-password` → show success state
- Back → `/(onboarding)/login`

---

#### B5. Location Picker

**Route**: `/(onboarding)/location` | Auth required | Step 2 of 7

**Purpose**: Set user's city and country for personalised discovery

**Layout**: Full screen

- Progress indicator (step 2 of 7)
- Header: "Where are you based?"
- Sub: "We'll show you events near you"
- City list (searchable): grouped by country with flag emoji
  - Australia: Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, Gold Coast, Hobart, Darwin
  - New Zealand: Auckland, Wellington, Christchurch
  - UAE: Dubai, Abu Dhabi
  - UK: London
  - Canada: Toronto, Vancouver
- "Use My Location" GPS option (requests permission)
- "Continue" CTA (disabled until selection)

**Actions**:

- Select city → store in OnboardingContext
- GPS → call `/api/locations/nearest?lat=&lng=` → auto-select
- Continue → `PUT /api/users/:id` with city/country → `/(onboarding)/interests`
- Back → `/(onboarding)/signup` or `/(onboarding)/login`

---

#### B6. Interests

**Route**: `/(onboarding)/interests` | Auth required | Step 3 of 7

**Purpose**: Select cultural activity interests for event recommendations

**Layout**: Scroll grid

- Progress indicator (step 3 of 7)
- Header: "What are you into?"
- Sub: "Select all that apply"
- Interest chips in multi-select grid (minimum 3 required):
Music / Food & Dining / Arts & Culture / Dance / Sports / Film / Fashion / Religion & Spirituality / Language / Community Events / Markets / Family / Nightlife / Wellness / Gaming / Politics & Advocacy / First Nations / Business & Networking
- "Continue" CTA (enabled after ≥3 selected, shows count)
- "Skip for now" ghost link

**Actions**:

- Chip tap → toggle selection (haptic feedback)
- Continue → save interests → `/(onboarding)/culture-match`
- Skip → `/(onboarding)/culture-match`

---

#### B7. Culture Match

**Route**: `/(onboarding)/culture-match` | Auth required | Step 4 of 7

**Purpose**: Capture structured cultural identity (nationality, specific culture, languages, diaspora groups)

**Layout**: Scroll form with grouped sections

- Progress indicator (step 4 of 7)
- Header: "Your cultural identity"
- Section 1 — Nationality: dropdown/picker from ~80 nationalities (Indian, Chinese, Filipino, Vietnamese, Lebanese, etc.)
- Section 2 — Culture / Community: filtered chips based on nationality selection (e.g. Tamil, Punjabi, Cantonese, etc.)
- Section 3 — Languages spoken: multi-select chips (ISO 639-3 language list)
- Section 4 — Diaspora groups: cross-national community tags (South Asian Diaspora, African Diaspora, etc.)
- "Continue" CTA
- "Skip for now"

**Actions**:

- Nationality select → filter culture chips to match
- Continue → `PUT /api/users/:id` with culturalIdentity → `/(onboarding)/communities`
- Skip → `/(onboarding)/communities`

---

#### B8. Community Suggestions

**Route**: `/(onboarding)/communities` | Auth required | Step 5 of 7 (final onboarding step)

**Purpose**: Join suggested communities based on city + cultural identity

**Layout**: Scroll

- Progress indicator (step 5 of 7)
- Header: "Communities for you"
- Sub: "Join communities to see their events and updates"
- Grid of community cards (each: cover image, name, member count, culture tags, Join button)
  - Fetched from `/api/communities?city=&cultureIds=&pageSize=10`
- "Join All" quick action
- "Finish Setup" CTA (goes to main app even if 0 joined)

**Actions**:

- Join community card → `POST /api/communities/:id/join` → button toggles to "Joined"
- Finish Setup → `completeOnboarding()` → redirect to `/(tabs)`

---

### GROUP C: MAIN TABS (Tab Bar Navigation)

---

#### C1. Discover

**Route**: `/(tabs)/index` | Public (limited features for guests)

**Purpose**: Home feed — cultural events, rails, editorial content, local discovery

**Layout**: Full-screen scroll, no header (city/weather inline), pull-to-refresh

```
[DiscoverHeader]           — city name, current time, weather summary, search icon → /search
[SuperAppLinks row]        — quick access icons: Events / Map / Directory / Submit / Scanner (if organiser)
[HeroCarousel]             — full-width aurora-gradient carousel of featured events (auto-scroll, 4s interval)
[EventRail: "Happening Now"]   — events today/this weekend
[IndigenousSpotlight]      — First Nations rail with featured indigenous events/artists
[EventRail: "Near You"]    — GPS-proximity events (requests location permission)
[CommunityRail]            — suggested communities based on city + culture
[CategoryRail]             — browse by category: Music / Food / Dance / Film / Sports / Arts / Community
[EventRail: "Popular"]     — high-RSVP events
[ActivityRail]             — activities and experiences (non-event listings)
[CityRail]                 — other supported cities (explore other cities)
```

**Actions**:

- Search icon → `/search`
- Hero carousel tap → `/event/[id]`
- Event card tap → `/event/[id]`
- Community card tap → `/community/[id]`
- Category chip → `/events?category=X`
- "See All" on any rail → relevant list view
- City card → `/city/[name]`
- Map icon → `/map`
- Pull down → refresh all data

---

#### C2. Feed (Social Feed)

**Route**: `/(tabs)/feed` | Auth required

**Purpose**: Social stream — community posts, event announcements, reactions, comments, image sharing

**Layout**: FlatList, no header visible except inline controls

```
[Filter tabs row]          — "For You" | "Events" | "Communities"
[Create Post bar]          — avatar, "What's on your mind?" → post composer (inline or modal)
[Feed items list]          — mixed post types:
  - Event card post        — event promoted into feed by community
  - Announcement post      — text + optional image, community name, timestamp
  - Image post             — user-uploaded image with caption
[Each post has]            — author avatar, name, community badge, timestamp, body/image, like count, comment count
                           — Like button (heart toggle), Comment button (opens thread), Share button, Report (⋮ menu)
```

**Post Composer** (inline modal or sheet):

- Text area (multiline)
- Image picker icon → attach image from camera roll or camera
- Location tag (optional)
- Community picker (which community to post to)
- Post button → `createCommunityPost()`

**Comment Sheet** (slides up on comment tap):

- FlatList of comments (author, text, timestamp, like)
- Comment input at bottom, keyboard-aware

**Actions**:

- Like/unlike → `toggleLike(postId)` (Firestore realtime update)
- Comment → open comment sheet → `addComment(postId, text)`
- Share → native share sheet
- Report → `reportPost(postId)` → confirmation
- Filter tap → refetch filtered feed
- Event card → `/event/[id]`
- Community badge → `/community/[id]`

---

#### C3. Calendar

**Route**: `/(tabs)/calendar` | Auth required

**Purpose**: Date-based event browsing and personal calendar

**Layout**:

```
[Header]                   — "Calendar", month/year, list/grid toggle, filter icon
[MonthGrid]                — calendar grid with dot indicators on event days
[View toggle]              — Month Grid | List
[Filter bar]               — Category chips + Date range picker + Price (Free/Paid) filter
[Event list / date groups] — events grouped by date: "Saturday 22 March" → event cards
[Map toggle button]        — floating button → switches to MapView
```

**Actions**:

- Calendar day tap → filter list to that day
- Event card tap → `/event/[id]`
- Filter chip → refetch filtered events
- Map toggle → show `NativeMapView` with pinned events
- "Add to Calendar" on event → export to device calendar (ICS / Google Calendar)
- Month navigation arrows → prev/next month

---

#### C4. Community Hub

**Route**: `/(tabs)/community` | Public (join requires auth)

**Purpose**: Browse and join cultural communities, organisations, venues, and councils

**Layout**:

```
[Header]                   — "Community", search input
[Filter chips row]         — All / Community / Organisation / Venue / Council / Government / Artist / Business / Charity
[Nationality filter]       — horizontal chips from user's culture match (pre-filtered)
[Community list]           — cards in list or 2-col grid:
  Each card: cover image, name, entity type badge, member count, culture tags, city, "Join" or "Joined" button
[Empty state]              — if no results: "No communities found. Try a different filter."
[Floating create button]   — visible to organiser/admin role only
```

**Actions**:

- Community card tap → `/community/[id]`
- Filter chip → filter list
- Search input → filter by name/tags
- Join → `POST /api/communities/:id/join` (auth gate)
- Create button → `/submit` (community submission form)
- Pull down → refresh

---

#### C5. Perks

**Route**: `/(tabs)/perks` | Auth required

**Purpose**: Browse and redeem loyalty perks from cultural businesses

**Layout**:

```
[Header]                   — "Perks", points balance chip (e.g. "1,250 pts"), tier badge
[Membership CTA banner]    — if free tier: "Upgrade to unlock more perks" → /membership/upgrade
[Category filter row]      — All / Food / Fashion / Beauty / Wellness / Entertainment / Shopping
[Perks grid]               — 2-column grid of perk cards:
  Each card: business image, business name, perk title, value label (e.g. "15% off"), expiry, tier badge (if tier-locked)
[Tier gate overlay]        — locked perks show padlock overlay + "Requires Plus" label
```

**Actions**:

- Perk card tap → `/perks/[id]`
- Tier badge tap → `/membership/upgrade`
- Points chip tap → `/payment/wallet`
- Category filter → filter perks list

---

#### C6. Profile (My Profile)

**Route**: `/(tabs)/profile` | Auth required

**Purpose**: User's own profile hub — personal info, tickets, communities, settings entry

**Layout**: Scroll

```
[Profile hero]             — cover image, avatar, display name, handle (+handle), city, role badge
[Stats row]                — Events Attended | Communities Joined | Points Balance
[Membership tier card]     — tier name, tier badge colour, "Manage" link → /membership/upgrade
[Upcoming tickets section] — next 2 tickets, "See All" → /tickets
[Joined communities row]   — community avatars, "See All" → /communities/index
[Settings menu list]
  - Edit Profile           → /profile/edit
  - My Tickets             → /tickets
  - Saved Events           → /saved
  - Wallet & Payments      → /payment/wallet
  - Contacts               → /contacts
  - Notifications          → /notifications
  - Settings               → /settings
  - Organiser Dashboard    → /dashboard/organizer (if organiser role)
  - Admin Panel            → /admin/dashboard (if admin role)
  - Get to Know CulturePass → /get2know
  - Sign Out               → auth logout → /(onboarding)/index
```

**Actions**:

- Avatar tap → `/profile/qr` (show QR code for sharing profile)
- Edit profile → `/profile/edit`
- Ticket card → `/tickets/[id]`
- See All tickets → `/tickets`
- Settings list items → respective routes
- Sign out → `logout()` → redirect to onboarding

---

### GROUP D: EVENT SCREENS

---

#### D1. Event Detail

**Route**: `/event/[id]` | Public (purchase requires auth)

**Purpose**: Full event information + ticket purchase

**Layout**: Full scroll with sticky "Buy Tickets" bottom bar

```
[Hero image]               — full-width, 280px tall, gradient overlay bottom
[Floating action buttons]  — save/bookmark, share, report (⋮)
[Event title]              — large, bold
[Date / Time row]          — calendar icon, formatted date, formatted time
[Venue row]                — location pin icon, venue name, address
[Distance badge]           — "2.3 km away" (if GPS available)
[Culture tags]             — horizontal chip row (e.g. South Asian, Tamil, Bollywood)
[Price row]                — free badge OR price range
[RSVP row]                 — "X going" · Going / Maybe / Not Going buttons (free events)
[Description]              — expandable (truncated to 4 lines + "Read more")
[Artists section]          — if artists: horizontal scroll of artist cards → /artist/[id]
[Sponsors section]         — if sponsors: logo grid with tier labels
[Host info]                — name, contact email/phone (if provided by organiser)
[Map preview]              — static map thumbnail → tap opens full /map or Google Maps
[Add to Calendar]          — Google Calendar / .ICS export buttons
[Organiser card]           — organiser avatar, name, "View Profile" → /profile/[id]
[Related events rail]      — other events by same organiser or culture tag
```

**Sticky bottom bar** (always visible):

- Free event: "RSVP Going" button + attend count
- Ticketed event: "Buy Tickets — from $25" button → opens ticket tier selector sheet

**Ticket Tier Sheet** (bottom sheet):

- List of tiers (Standard / VIP / Early Bird) with price, availability
- Quantity stepper
- "Proceed to Payment" → payment checkout flow
- If no auth → redirect to `/login?redirectTo=/event/[id]`

**Actions**:

- Save/bookmark → `toggleSaved(eventId)`
- Share → native share sheet with event URL
- Going/Maybe/NotGoing → `POST /api/events/:id/rsvp`
- Buy Tickets → payment flow
- Artist card → `/artist/[id]`
- Organiser card → `/profile/[id]`
- Map → native maps app or in-app map
- Add to Google Calendar → external link
- Export ICS → download `.ics` file
- Related event → `/event/[id]`

---

#### D2. Event Creation Wizard

**Route**: `/event/create` | Auth required, organiser or admin role

**Purpose**: 9-step guided event creation form

**Layout**: Step-by-step wizard with progress header

```
[Progress bar]             — step X of 9, step title
[Step content]             — changes per step
[Back / Next buttons]      — sticky bottom
```

**Steps**:


| #   | Step        | Fields                                                                                                              |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Basics      | Title (required), Description (required), Category (required), Event type (festival/concert/etc.)                   |
| 2   | Image       | Hero image upload (required) + optional thumbnail; image preview; crop control                                      |
| 3   | Location    | Venue name, Street address, City (picker), Suburb, State, LGA/Council (auto-populated from city or manual)          |
| 4   | Date & Time | Start date (date picker), Start time, End date (optional toggle), End time (optional)                               |
| 5   | Entry Type  | "Free & Open" OR "Ticketed" (radio toggle)                                                                          |
| 6   | Tickets     | (only if Step 5 = Ticketed) Add ticket tiers: tier name, price, quantity; OR "Use External Tickets" (URL input)     |
| 7   | Team        | Add Artists/Performers (name, role, image), Add Sponsors (name, tier, logo), Host contact info (name, email, phone) |
| 8   | Culture     | Culture tags multi-select, Age suitability radio (All/Family/18+/21+), Language tags, Indigenous tags toggle        |
| 9   | Review      | Preview all entered details, publish or save as draft                                                               |


**Step 9 success screen**:

- Checkmark animation
- "Published! [Event title] is now live."
- "View Event" → `/event/[id]`
- "Create Another Event" → reset wizard

**Actions** (each step):

- Image step: `ImagePicker` → `uploadEventImageTemp()` → preview
- Location step: city picker populates LGA automatically
- Date step: platform date pickers (DateTimePicker on native, input on web)
- Save & exit → saves as draft → `/dashboard/organizer`
- Back → previous step
- Next → validate → next step
- Publish → `POST /api/events` with full payload → success screen

---

#### D3. All Events

**Route**: `/events` | Public

**Purpose**: Full events listing with compact filter bar (not the wizard — this is browse)

**Layout**: Header + compact filter row + FlatList

```
[Back button]              — floating top-left
[Header]                   — "All Events", results count
[Filter bar (single line)] — [Category dropdown] [Date range] [Price: Free/Paid] [Culture tag]
[Sort toggle]              — Newest / Soonest / Popular
[Events grid/list]         — responsive (1 col mobile, 2 col tablet, 3 col desktop)
[Load more]                — pagination on scroll
[Empty state]              — "No events match your filters. Try clearing some."
```

**Actions**:

- Event card → `/event/[id]`
- Filter change → refetch
- Sort change → re-sort
- Search bar (from Discover) pre-populates filters

---

### GROUP E: ENTITY DETAIL SCREENS

---

#### E1. Community Detail

**Route**: `/community/[id]` | Public (join requires auth)

**Purpose**: Full community profile page

**Layout**: Scroll

```
[Cover image + header]     — community name, entity type badge, member count
[Action row]               — Join/Leave button, Share, Bookmark
[Culture tags]             — nationality, culture, language chips
[Tabs]                     — About | Events | Members | Links
  About tab:               — description, category, contact, social links
  Events tab:              — upcoming events by this community → event cards
  Members tab:             — member avatars + names (public list)
  Links tab:               — Linktree-style link hub
[Representatives]          — if civic/council: representative profile card
```

**Actions**:

- Join → `POST /api/communities/:id/join` → button toggles
- Leave → `POST /api/communities/:id/leave`
- Share → native share
- Event card → `/event/[id]`
- Member avatar → `/user/[id]`
- Social link → external browser

---

#### E2. Business Detail

**Route**: `/business/[id]` | Public

**Layout**: Scroll

```
[Hero image]
[Name, category, rating stars, review count]
[Location + hours row]
[Culture tags]
[Action row]              — Save, Share, Directions (Google Maps)
[Tabs]                    — About | Reviews | Perks | Events
  About:                  — description, phone, email, website, address
  Reviews:                — star ratings + comments list, "Write Review" CTA
  Perks:                  — available perks at this business → perk cards
  Events:                 — upcoming events at this venue/by this org
```

**Actions**:

- Directions → native maps with address
- Write Review → `POST /api/reviews` (auth required)
- Perk card → `/perks/[id]`

---

#### E3. Venue Detail

**Route**: `/venue/[id]` | Public

**Layout**: Same as Business Detail with venue-specific fields:

- Capacity, accessibility, parking notes
- Upcoming events at this venue
- Map embed showing exact location

---

#### E4. Artist Profile

**Route**: `/artist/[id]` | Public

**Layout**: Scroll

```
[Hero/cover image]
[Avatar, name, genre tags, verified badge]
[Social links row]         — Instagram, TikTok, Spotify, YouTube links
[Bio section]
[Upcoming Events]          — events featuring this artist → event cards
[Gallery]                  — image grid from profile.gallery[]
```

**Actions**:

- Social links → external browser
- Event card → `/event/[id]`
- Follow → if implemented

---

#### E5. User Profile (Public)

**Route**: `/user/[id]` | Public

**Purpose**: View another user's public profile

**Layout**: Scroll

```
[Avatar, display name, handle, city, bio]
[Culture identity tags]
[Stats row]               — Events attended, Communities joined
[Communities section]     — community badges
[Upcoming events attending] — RSVP'd events
[Contact/Connect button]  — if implemented: add to contacts
```

**Actions**:

- Community badge → `/community/[id]`
- Event card → `/event/[id]`
- Add Contact → `contacts/index` + cpid lookup

---

#### E6. Profile Detail (Entity)

**Route**: `/profile/[id]` | Public

**Purpose**: Generic profile detail for any entity type (organiser, brand, org)

**Layout**: Mirrors community/business detail with entity-type-aware sections.
Renders the correct tab set based on `entityType`.

---

#### E7. My Profile — Edit

**Route**: `/profile/edit` | Auth required

**Layout**: Scroll form

```
[Back button + "Save" button in header]
[Avatar section]           — avatar image, "Change Photo" tap → ImagePicker
[Cover image]              — "Change Cover" → ImagePicker
[Fields]
  Display Name
  Handle (+handle)         — with availability check indicator
  Bio (multiline)
  City (picker)
  Country (picker)
  Website URL
  Social links             — Instagram, TikTok, YouTube, Facebook, Twitter/X
[Cultural Identity section]
  Nationality              — picker
  Cultures                 — multi-select chips
  Languages                — multi-select chips
[Danger zone]              — "Delete Account" (destructive, confirmation required)
```

**Actions**:

- Save → `PUT /api/users/:id` → back with success toast
- Avatar/cover image → ImagePicker → upload → preview
- Handle input → debounced availability check (green checkmark / red X)
- Delete Account → confirmation alert → `DELETE /api/users/:id` → logout → onboarding

---

#### E8. My Public Profile

**Route**: `/profile/public` | Auth required

**Purpose**: Preview what your profile looks like to others

**Layout**: Same as User Profile (E5) but loaded with the authenticated user's own data.

**Actions**:

- "Edit Profile" button → `/profile/edit`
- Back → `/(tabs)/profile`

---

#### E9. Profile QR Code

**Route**: `/profile/qr` | Auth required

**Purpose**: Display personal QR code for sharing profile + adding to contacts

**Layout**: Centred, full-screen dark background

```
[Avatar + name]
[Large QR code]            — encodes `culturepass.app/+handle` or `/cpid/CP-USR-xxx`
[Handle text]              — +youhandle
[Share button]             — native share the QR image
[Scan hint]                — "Ask others to scan this to connect"
```

**Actions**:

- Share → export QR as image via native share
- Back → `/(tabs)/profile`

---

### GROUP F: TICKETS & PAYMENT

---

#### F1. Ticket Wallet

**Route**: `/tickets` | Auth required

**Purpose**: All user's tickets in one place

**Layout**: Tabs + FlatList

```
[Header]                   — "My Tickets"
[Tabs]                     — Upcoming | Past | Cancelled
[Ticket cards]             — event image, event name, date, venue, ticket ID, status badge
[Empty state]              — "No tickets yet. Discover events to get started."
```

**Actions**:

- Ticket card → `/tickets/[id]`
- "Discover Events" empty state CTA → `/(tabs)/index`

---

#### F2. Ticket Detail

**Route**: `/tickets/[id]` | Auth required

**Purpose**: Single ticket view with QR code for venue entry

**Layout**: Full screen, card-style

```
[Event image banner]
[Event name, date, time, venue]
[Ticket holder name]
[Ticket type / tier name]
[QR code]                  — large, scannable
[Ticket ID]                — CP-TKT-xxx
[Status badge]             — Confirmed / Used / Cancelled / Expired
[Action row]               — Print, Share, Add to Wallet
```

**Actions**:

- Print → `/tickets/print/[id]`
- Share → native share with QR image
- Add to Wallet → Apple Wallet (iOS) / Google Wallet (Android)
- Back → `/tickets`

---

#### F3. Print Ticket

**Route**: `/tickets/print/[id]` | Auth required

**Purpose**: Print-optimised ticket layout

**Layout**: Clean, minimal, print-friendly

- Event details, QR code, ticket ID, terms
- "Print" button → browser print dialog (web) or share PDF (native)

---

#### F4. Payment Wallet

**Route**: `/payment/wallet` | Auth required

**Purpose**: CulturePass wallet — balance, top-up, reward points

**Layout**: Scroll

```
[Wallet balance card]      — large balance display, currency, "Top Up" CTA
[Reward points card]       — points balance, tier, "How to earn more" link
[Recent transactions row]  — last 3 transactions, "View All" → /payment/transactions
[Payment methods row]      — saved cards, "Manage" → /payment/methods
[Cashback rate info]       — current tier cashback rate display
```

**Actions**:

- Top Up → payment flow for wallet credit
- Transactions → `/payment/transactions`
- Manage cards → `/payment/methods`

---

#### F5. Payment Methods

**Route**: `/payment/methods` | Auth required

**Layout**: List

```
[Back button]
[Header] "Payment Methods"
[Saved cards list]         — card brand icon, last 4 digits, expiry, default badge
[Add Card button]          — opens card input form (Stripe Elements)
[Each card]                — delete button, "Set as Default" link
```

**Actions**:

- Add Card → Stripe card input → `POST /api/payment-methods`
- Delete card → `DELETE /api/payment-methods/:id`
- Set default → `PUT /api/payment-methods/:userId/default/:methodId`

---

#### F6. Transaction History

**Route**: `/payment/transactions` | Auth required

**Layout**: FlatList by date

```
[Back button]
[Header] "Transactions"
[Month groupings]          — "March 2026", then transaction rows
[Each row]                 — icon (ticket/wallet/perk), description, amount, date, status
```

---

#### F7. Payment Success

**Route**: `/payment/success` | Auth required

**Purpose**: Confirmation after successful ticket purchase or subscription

**Layout**: Centred, celebratory

- Checkmark animation
- "Payment Successful!"
- Event name / subscription tier
- "View Ticket" or "View Membership" CTA
- "Discover More Events" secondary link

**Actions**:

- View Ticket → `/tickets/[id]`
- Discover More → `/(tabs)/index`

---

#### F8. Payment Cancelled

**Route**: `/payment/cancel` | Auth required

**Purpose**: User returned from checkout without completing payment

**Layout**: Minimal

- Back icon
- "Payment cancelled"
- "Try Again" button
- "Back to Event" button

---

### GROUP G: PERKS DETAIL

---

#### G1. Perk Detail

**Route**: `/perks/[id]` | Auth required

**Purpose**: Full perk information + redemption

**Layout**: Scroll

```
[Business hero image]
[Perk title]               — e.g. "15% off your first order"
[Business name + location]
[Expiry date]
[Minimum tier badge]       — "Requires Plus membership"
[Description / terms]
[How to redeem instructions]
[Redeem button]            — primary CTA (disabled if tier-locked or expired)
[Tier upgrade prompt]      — if tier-locked: "Upgrade to Plus to unlock" → /membership/upgrade
```

**Actions**:

- Redeem → `POST /api/perks/:id/redeem` → show redemption code sheet
- Redemption code sheet: code string + QR, countdown timer, "Copy Code", "Done"
- Tier upgrade → `/membership/upgrade`
- Business name → `/business/[id]`

---

### GROUP H: DIRECTORY & BROWSE

---

#### H1. Directory (Browse)

**Route**: `/(tabs)/directory` | Public (hidden tab — accessed from Discover SuperAppLinks or search)

**Purpose**: Full entity directory — businesses, venues, organisations, councils, charities

**Layout**: Header + filter chips + list/grid

```
[Header]                   — "Directory", search bar
[Filter chips row]         — All / Events / Indigenous / Businesses / Venues / Organisations / Councils / Government / Charities
[Sort toggle]              — Featured / Nearest / A-Z / Rating
[Results grid]             — 2-col on tablet/desktop, 1-col list on mobile
  Entity card: image, name, type badge, city, rating, category
[Load more]                — pagination
```

**Actions**:

- Entity card → `/business/[id]` | `/venue/[id]` | `/community/[id]` | `/artist/[id]`
- Search → filter by name/description
- Filter chip → filter by entityType

---

#### H2. Movies

**Route**: `/movies` | Public
**Route (detail)**: `/movies/[id]` | Public

**Purpose**: Cultural cinema listings (South Asian films, Bollywood, world cinema, etc.)

**List Layout**: Grid of movie posters with title, language, rating
**Detail Layout**: Poster, synopsis, director, cast, language, showtimes, venue

**Actions (list)**: Movie card → `/movies/[id]`
**Actions (detail)**: Showtime tap → external booking or event

---

#### H3. Restaurants

**Route**: `/restaurants` | Public
**Route (detail)**: `/restaurants/[id]` | Public

**Purpose**: Cultural restaurants and food businesses directory

**List Layout**: Card grid with photo, name, cuisine type, rating, suburb, price range
**Detail**: Full business profile with menu highlights, hours, delivery/reservation options

---

#### H4. Activities

**Route**: `/activities` | Public
**Route (detail)**: `/activities/[id]` | Public

**Purpose**: Cultural experiences, classes, tours — bookable activities (non-event)

**List Layout**: Card grid with image, name, category, price, location
**Detail**: Full profile, booking info, highlights, features

---

#### H5. Shopping

**Route**: `/shopping` | Public
**Route (detail)**: `/shopping/[id]` | Public

**Purpose**: Cultural shops, markets, fashion, beauty, groceries

**List Layout**: Card grid
**Detail**: Shop profile, hours, location, social links

---

#### H6. Communities Browse

**Route**: `/communities` | Public

**Purpose**: Full communities listing page (different from the Community tab — this is a standalone browse page accessible from Profile or Discover rails)

**Layout**: Filter chips + list

- Same as Community tab but full-screen, no tab bar context

---

#### H7. Map

**Route**: `/map` | Public

**Purpose**: Full-screen map of events near user

**Layout**: Full-screen map with overlaid controls

```
[Map (NativeMapView)]      — platform-specific: react-native-maps (native), Google Maps embed (web)
[Floating search bar]      — top, semi-transparent
[Filter chips]             — overlay at bottom of map
[Event pins]               — tappable markers
[Event preview sheet]      — slides up on pin tap: event image, title, date, price, "View Event" CTA
[Cluster support]          — numbered clusters at low zoom
[My Location button]       — bottom-right
```

**Actions**:

- Pin tap → preview sheet
- Preview sheet "View Event" → `/event/[id]`
- Search bar → filter visible events

---

#### H8. City Page

**Route**: `/city/[name]` | Public

**Purpose**: City-specific discovery hub (e.g. "Discover Sydney", "Explore Melbourne")

**Layout**: Scroll

```
[City hero image + name]
[Featured events rail]     — events in this city
[Top communities in city]  — community cards
[Cultural venues]          — venue cards
[Directory shortcut]       — "Explore Businesses in Sydney"
```

**Actions**:

- Event card → `/event/[id]`
- Community → `/community/[id]`
- Venue → `/venue/[id]`

---

#### H9. Search

**Route**: `/search` | Public

**Purpose**: Full-text search across all entity types

**Layout**:

```
[Search bar]               — autofocus on mount, back button to dismiss
[Suggestions list]         — shows while typing (autocomplete from /api/search/suggest)
[Filter tabs]              — All | Events | Communities | Businesses | Profiles
[Results list]             — mixed entity cards on submit
[Recent searches]          — shown before first query (stored locally)
[Empty state]              — "No results for 'xyz'. Try different keywords."
```

**Actions**:

- Suggestion tap → fill search bar, trigger search
- Result card → appropriate detail page
- Filter tab → refetch with type filter
- Clear → empty input, show recent searches
- Back → dismiss search (return to caller screen)

---

#### H10. Saved Items

**Route**: `/saved` | Auth required

**Purpose**: Bookmarked events and joined communities

**Layout**: Tabs

```
[Header] "Saved"
[Tabs]                     — Saved Events | My Communities
[Saved Events]             — event cards with unsave button (X)
[My Communities]           — community cards with leave button
```

**Actions**:

- Event card → `/event/[id]`
- Unsave → `toggleSaved(eventId)`
- Community card → `/community/[id]`
- Leave → `POST /api/communities/:id/leave`

---

### GROUP I: NOTIFICATIONS & CONTACTS

---

#### I1. Notifications

**Route**: `/notifications` | Auth required

**Layout**: FlatList

```
[Header] "Notifications", "Mark all read" button
[Notification list]        — grouped: Today | Earlier | This Week
  Each item: icon, title, body, timestamp, unread dot
  Types: event reminder, ticket confirmed, perk available, community update, admin broadcast, new follower
[Empty state]              — "You're all caught up!"
```

**Actions**:

- Notification tap → mark as read + navigate to deep link (event, community, ticket, etc.)
- Mark all read → `PUT /api/notifications/:userId/read-all`
- Delete swipe → `DELETE /api/notifications/:id`

---

#### I2. Contacts

**Route**: `/contacts` | Auth required

**Purpose**: CulturePass contact directory — users you've connected with via CPID/QR scan

**Layout**: List + search

```
[Header] "Contacts", search, add button
[Contacts list]            — avatar, display name, handle, city
[Empty state]              — "No contacts yet. Scan someone's QR to connect."
```

**Actions**:

- Contact tap → `/contacts/[cpid]` (contact detail)
- Add button → opens QR scanner or CPID input
- Search → filter by name/handle

---

#### I3. Contact Detail

**Route**: `/contacts/[cpid]` | Auth required

**Purpose**: View a saved contact's profile

**Layout**: Profile-like view

- Avatar, name, handle, city, bio
- "View Full Profile" link → `/user/[id]`
- "Remove Contact" destructive action

---

### GROUP J: SCANNER

---

#### J1. QR Scanner

**Route**: `/scanner` | Auth required, organiser role

**Purpose**: Event check-in — scan attendee ticket QR codes

**Layout**: Full-screen camera view

```
[Camera viewport]          — platform camera with QR detection rectangle overlay
[Event selector]           — top bar: "Scanning for: [Event Name]" — tap to switch event
[Result overlay]           — slides up on successful scan:
  Valid ticket: green checkmark, attendee name, ticket type, "Check In" confirm button
  Invalid/Used: red X, error message
[Manual entry fallback]    — "Enter Ticket ID Manually" link
[Counter]                  — "47 checked in / 120 total" running total
```

**Actions**:

- QR detect → `POST /api/tickets/scan { qrCode }` → show result
- Check in confirm → marks ticket as used
- Event selector → pick which event to scan for
- Manual entry → text input for CP-TKT-xxx

---

### GROUP K: MEMBERSHIP

---

#### K1. Membership Upgrade

**Route**: `/membership/upgrade` | Auth required

**Purpose**: Tier comparison and subscription checkout

**Layout**: Scroll

```
[Current tier banner]      — "You're on Free"
[Tier comparison table]    — columns: Free | Plus | Elite | Pro | Premium | VIP
  Rows: Price, Cashback %, Early Access, Perks Access, Organiser Tools
[Billing toggle]           — Monthly | Annual (annual shows savings %)
[CTA per tier]             — "Upgrade to Plus — $X/month"
[FAQ accordion]            — "Can I cancel anytime?", "What happens to my tickets?", etc.
```

**Actions**:

- Billing toggle → recalculate prices
- Tier CTA → `POST /api/membership/subscribe { tier, billingCycle }` → payment checkout → `/payment/success`
- "Manage Existing" → `/payment/wallet` (cancel subscription)

---

### GROUP L: SETTINGS

---

#### L1. Settings Hub

**Route**: `/settings` | Auth required

**Layout**: Grouped menu list

```
[Profile section]
  Edit Profile             → /profile/edit
  Change Location          → /settings/location
  Notification Preferences → /settings/notifications
  Privacy Settings         → /settings/privacy

[Account section]
  Payment Methods          → /payment/methods
  Membership               → /membership/upgrade
  Transaction History      → /payment/transactions

[Support]
  Help Centre              → /settings/help
  About CulturePass        → /settings/about
  Send Feedback            → opens email compose

[Legal]
  Terms of Service         → /legal/terms
  Privacy Policy           → /legal/privacy
  Cookie Policy            → /legal/cookies
  Community Guidelines     → /legal/guidelines

[Danger Zone]
  Sign Out                 → logout → onboarding
  Delete Account           → confirmation → DELETE /api/users/:id
```

---

#### L2. Location Settings

**Route**: `/settings/location` | Auth required

**Purpose**: Change home city/country after onboarding

**Layout**: Same as B5 Location Picker but as a settings sub-page with existing selection pre-filled.

---

#### L3. Privacy Settings

**Route**: `/settings/privacy` | Auth required

**Layout**: Toggle list

- Profile Visibility (public / private)
- Activity Status (show when online)
- Location Visible (show city on profile)
- Email Notifications
- Push Notifications
- Marketing Emails
- Show in Directory
- Data Sharing (analytics)

**Actions**: Each toggle → `PUT /api/privacy/settings/:userId`

---

#### L4. Notification Settings

**Route**: `/settings/notifications` | Auth required

**Layout**: Toggle list grouped by category

- Event Reminders
- Ticket Confirmations
- Community Updates
- New Followers
- Perk Availability
- Platform Announcements

**Actions**: Each toggle → update FCM preferences + `PUT /api/privacy/settings`

---

#### L5. About

**Route**: `/settings/about` | Public

**Layout**: Scroll

- App version, build number
- "About CulturePass" mission text
- "Open Source Licences" link
- Social media links

---

#### L6. Help Centre

**Route**: `/settings/help` or `/help` | Public

**Layout**: Accordion FAQ

- Grouped by topic: Getting Started / Events / Tickets / Membership / Technical
- Each FAQ: question → expand → answer
- "Contact Support" CTA at bottom → email compose

---

### GROUP M: DASHBOARDS (Role-Specific)

---

#### M1. Organiser Dashboard

**Route**: `/dashboard/organizer` | Auth required, organiser role

**Purpose**: Event management and performance overview

**Layout**: Scroll

```
[Stats overview]           — Total Events | Ticket Revenue | Attendees | Upcoming
[My Events list]           — event cards with:
  Status badge (Draft / Published / Past)
  "Edit" and "View" actions
  Attendee count, revenue
[Create Event button]      — prominent CTA → /event/create
[Quick filters]            — Upcoming | Draft | Past
[Recent check-ins]         — live during event day
```

**Actions**:

- Event card "Edit" → `/event/create` with event id pre-loaded (edit mode)
- Event card "View" → `/event/[id]`
- Create Event → `/event/create`
- Check-in scanner → `/scanner`

---

#### M2. Venue Dashboard

**Route**: `/dashboard/venue` | Auth required, business/venue role

**Layout**: Similar to Organiser but venue-focused

- Venue profile stats (views, follows, reviews)
- Upcoming events at venue
- Perks management (create/edit perks)
- Edit Venue Profile CTA

---

#### M3. Sponsor Dashboard

**Route**: `/dashboard/sponsor` | Auth required, sponsor role

**Layout**: Sponsorship portfolio

- Events sponsored list
- Reach/impression stats per sponsorship
- Add New Sponsorship form

---

### GROUP N: ADMIN PANEL

All admin routes require `admin` or `platformAdmin` role. Redirect to `/(tabs)` if role insufficient.

---

#### N1. Admin Dashboard

**Route**: `/admin/dashboard` | Admin

**Layout**: Overview metrics

- Total users, events, tickets sold (lifetime + this month)
- Quick links to all sub-sections
- Recent activity log preview
- Pending reports count (badge)
- New handle approval requests count

---

#### N2. User Management

**Route**: `/admin/users` | Admin

**Layout**: Table/list with search and filters

- Search by email/username/CPID
- Filter by role, city, membership tier
- Each row: avatar, name, email, role dropdown (change role inline), city, created date, action menu
- Action menu: View Profile / Suspend / Delete

**Actions**:

- Role dropdown → `PUT /api/admin/users/:id/role`
- View → `/user/[id]`
- Suspend / Delete → confirmation → API call

---

#### N3. Content Moderation

**Route**: `/admin/moderation` | Admin

**Layout**: Reports queue

- Filter: Pending | Reviewing | Resolved | Dismissed
- Each report row: reported content preview, report reason, reporter, date, action buttons
- Action: Approve (keep content) | Remove Content | Warn User | Suspend User

---

#### N4. Handle Approvals

**Route**: `/admin/handles` | Admin

**Purpose**: Review and approve/reject `+handle` requests from users and profiles

**Layout**: Queue list

- Each row: requested handle, entity type (user/profile), name, created date, status
- Approve button → sets `handleStatus = 'approved'`
- Reject button → sets `handleStatus = 'rejected'`, notifies user

---

#### N5. Push Notifications

**Route**: `/admin/notifications` | Admin

**Purpose**: Broadcast push notifications to all users or segments

**Layout**: Form

- Title input
- Body input
- Target: All Users | City filter | Tier filter
- Preview
- Send button → `POST /api/admin/notifications/broadcast`

---

#### N6. Audit Logs

**Route**: `/admin/audit-logs` | Admin

**Layout**: Table

- Timestamp, actor (user), action type, target entity, IP address
- Filter by action type, date range
- Export CSV button

---

#### N7. Finance Overview

**Route**: `/admin/finance` | Admin

**Layout**: Revenue dashboard

- Total revenue (MTD, YTD)
- Breakdown: tickets / subscriptions / perks
- Payout queue (organiser payouts)
- Refund management

---

#### N8. Platform Settings

**Route**: `/admin/platform` | Admin

**Layout**: Configuration form

- Feature flags (rollout percentages)
- Supported cities management
- Search index backfill trigger button
- App version + maintenance mode toggle

---

#### N9. Data Import

**Route**: `/admin/import` | Admin

**Purpose**: Bulk import events, communities, profiles from CSV/JSON

**Layout**: Upload form with field mapping interface

---

#### N10. Data Compliance

**Route**: `/admin/data-compliance` | Admin

**Purpose**: GDPR / Privacy Act compliance tools

- Data export requests queue
- Deletion requests queue
- Consent audit log

---

#### N11. Platform Updates

**Route**: `/admin/updates` | Admin

**Purpose**: Manage platform changelog / announcements shown in `/updates`

---

### GROUP O: UPDATES & MISC

---

#### O1. Platform Updates Feed

**Route**: `/updates` | Public

**Purpose**: Changelog — what's new in CulturePass

**Layout**: FlatList of update cards

- Each card: version/date badge, title, description, image (optional)

**Actions**:

- Card tap → `/updates/[id]`

---

#### O2. Update Detail

**Route**: `/updates/[id]` | Public

**Purpose**: Full release note / announcement detail

---

#### O3. Get to Know CulturePass

**Route**: `/get2know` | Auth required

**Purpose**: Interactive intro to the platform — feature tour, culture quiz

**Layout**: Step-by-step swipeable cards

- Welcome to CulturePass
- How Discover works
- About Communities
- Earning Perks
- Cultural Identity
- Final: "You're ready!" → `/(tabs)/index`

---

#### O4. Submit a Listing

**Route**: `/submit` | Auth required

**Purpose**: Let organisers/businesses submit new profiles or event listings for review

**Layout**: Form

- Entity type selector: Event / Business / Venue / Community / Organisation
- Basic info fields (type-specific)
- Contact info
- "Submit for Review" CTA → creates draft record pending admin approval

---

#### O5. About Page

**Route**: `/about` | Public

**Purpose**: About CulturePass brand and mission (static page, web-focused)

---

#### O6. Legal Pages

**Routes**: `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/guidelines`, `/legal/event-terms`
All: Public, static scroll pages with headings and paragraphs.

---

#### O7. 404 / Not Found

**Route**: `+not-found` | Public

**Layout**: Centred

- "Page not found"
- "Go Home" → `/(tabs)/index`

---

#### O8. Universal Handle Routing

**Route**: `/[handle]` | Public

**Purpose**: Any URL like `culturepass.app/+johndoe` or `culturepass.app/+sydneydance` resolves here

**Logic**: `GET /api/cpid/lookup/:handle` → redirect to:

- User → `/user/[id]`
- Community → `/community/[id]`
- Business → `/business/[id]`
- Venue → `/venue/[id]`
- Artist → `/artist/[id]`
- Not found → `+not-found`

---

## 5. Navigation Connection Map

```
landing ──────────────────────────────────────────────────────────────────────┐
                                                                              │
(onboarding)/index ──► signup ──► location ──► interests ──► culture-match ──► communities ──► (tabs)
              └───────► login ──► location ──► interests ──► culture-match ──► communities ──► (tabs)
              └───────► login ──► (tabs) [if already complete]
              └───────► forgot-password ──► login

(tabs)/index ──► event/[id] ──► tickets/[id] ──► payment/success
           │                └──► artist/[id]
           │                └──► venue/[id]
           │                └──► community/[id]
           │                └──► profile/[id]
           ├──► search
           ├──► map
           ├──► events
           ├──► city/[name]
           └──► community/[id]

(tabs)/feed ──► event/[id]
           └──► community/[id]
           └──► user/[id]

(tabs)/calendar ──► event/[id]
               └──► map [toggle]

(tabs)/community ──► community/[id] ──► event/[id]
                └──► user/[id]           └──► artist/[id]
                └──► communities/index

(tabs)/perks ──► perks/[id] ──► business/[id]
            └──► membership/upgrade ──► payment/success
            └──► payment/wallet

(tabs)/profile ──► profile/edit
              ├──► profile/qr
              ├──► tickets ──► tickets/[id] ──► tickets/print/[id]
              ├──► saved ──► event/[id]
              ├──► contacts ──► contacts/[cpid]
              ├──► notifications
              ├──► payment/wallet ──► payment/methods
              │                  └──► payment/transactions
              ├──► settings ──► settings/location
              │            ├──► settings/privacy
              │            ├──► settings/notifications
              │            ├──► settings/about
              │            ├──► settings/help
              │            ├──► legal/*
              │            └──► membership/upgrade
              ├──► membership/upgrade
              ├──► dashboard/organizer ──► event/create
              │                       └──► scanner
              └──► admin/dashboard ──► admin/users
                                  ├──► admin/moderation
                                  ├──► admin/handles
                                  ├──► admin/notifications
                                  ├──► admin/audit-logs
                                  ├──► admin/finance
                                  ├──► admin/platform
                                  ├──► admin/import
                                  ├──► admin/data-compliance
                                  └──► admin/updates
```

---

## 6. Complete Page Count Summary


| Group     | Category                 | Pages          |
| --------- | ------------------------ | -------------- |
| A         | Entry & Redirect         | 2              |
| B         | Onboarding               | 7              |
| C         | Main Tabs                | 6              |
| D         | Event Screens            | 3              |
| E         | Entity Detail            | 9              |
| F         | Tickets & Payment        | 8              |
| G         | Perks                    | 1              |
| H         | Directory & Browse       | 10             |
| I         | Notifications & Contacts | 3              |
| J         | Scanner                  | 1              |
| K         | Membership               | 1              |
| L         | Settings                 | 6              |
| M         | Dashboards               | 3              |
| N         | Admin Panel              | 11             |
| O         | Updates & Misc           | 8              |
| **Total** |                          | **79 screens** |


---

## 7. User Journeys for Wireframing

> Use these journeys as flows in Google Stitch or Figma. Each journey = one user flow diagram.

### Journey 1: New User Onboarding

```
Landing → Welcome → Sign Up → Location → Interests → Culture Match → Communities → Discover
```

### Journey 2: Discover & Buy a Ticket

```
Discover Tab → [Event Card] → Event Detail → [Buy Tickets] → Tier Selector Sheet →
Payment Methods → [Pay] → Payment Success → Ticket Detail (QR)
```

### Journey 3: Join a Community

```
Community Tab → [Community Card] → Community Detail → [Join] → (joined state) →
Feed Tab → [Community Post appears]
```

### Journey 4: Earn & Redeem a Perk

```
Perks Tab → [Perk Card] → Perk Detail → [Redeem] → Redemption Code Sheet → [Copy/Show at venue]
```

### Journey 5: Create an Event (Organiser)

```
Profile Tab → Organiser Dashboard → [Create Event] →
Step 1 Basics → Step 2 Image → Step 3 Location → Step 4 Date → Step 5 Entry →
Step 6 Tickets → Step 7 Team → Step 8 Culture → Step 9 Review → [Publish] → Success Screen →
Event Detail (live)
```

### Journey 6: Check In Attendees (Organiser)

```
Profile Tab → Organiser Dashboard → [Scanner] → Scanner Screen →
[Scan QR] → Valid result → [Check In] → Counter increments
```

### Journey 7: Upgrade Membership

```
Profile Tab OR Perks Tab → Membership Upgrade → [Toggle Annual] → [Upgrade to Plus] →
Stripe Checkout → Payment Success → Profile Tab (tier badge updated)
```

### Journey 8: Share Profile via QR

```
Profile Tab → [Tap Avatar / QR icon] → Profile QR Screen → [Share] → native share sheet
```

### Journey 9: Admin Approve a Handle

```
Admin Dashboard → Handle Approvals → [Review request] → [Approve] → user notified
```

### Journey 10: Search & Find Something

```
Discover Tab → [Search icon] → Search Screen → [Type query] → Suggestions appear →
[Tap suggestion] → Results list → [Tap result] → Entity Detail
```

---

## 8. Data Model

### Users

```typescript
User {
  id: string
  username: string
  handle?: string           // CulturePass handle — displayed as +handle
  handleStatus: 'pending' | 'approved' | 'rejected'
  displayName?: string
  email?: string
  avatarUrl?: string
  city?: string
  state?: string
  postcode?: number
  country?: string
  bio?: string
  interests?: string[]
  socialLinks?: {
    instagram?, facebook?, twitter?, tiktok?, youtube?, linkedin?, website?
  }
  isVerified?: boolean
  culturePassId?: string    // CP-USR-xxx unique platform ID
  culturalIdentity?: {
    nationalityId?: string  // e.g. 'indian'
    cultureIds?: string[]   // e.g. ['malayali', 'tamil']
    languageIds?: string[]  // ISO 639-3, e.g. ['mal', 'eng']
    diasporaGroupIds?: string[]
  }
  communities?: string[]    // community IDs joined
  role: 'user' | 'organizer' | 'business' | 'sponsor' | 'cityAdmin' | 'platformAdmin' | 'moderator' | 'admin'
  membership?: {
    tier: 'free' | 'plus' | 'elite' | 'pro' | 'premium' | 'vip'
    validUntil?: string
    isActive?: boolean
  }
  lgaCode?: string          // LGA code from onboarding/GPS
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  followersCount?: number
  followingCount?: number
  createdAt: string
  updatedAt?: string
}
```

### Events

```typescript
EventData {
  id: string
  culturePassId?: string    // CP-EVT-xxx
  title: string
  description: string
  date: string              // ISO date string
  time?: string
  endDate?: string
  endTime?: string
  venue?: string
  address?: string
  city: string
  state?: string
  country: string
  suburb?: string
  lat?: number
  lng?: number
  geoHash?: string          // for geospatial proximity queries
  lgaCode?: string          // LGA for proximity filtering
  councilId?: string
  imageUrl?: string
  heroImageUrl?: string
  category?: string
  cultureTag?: string[]     // e.g. ['South Asian', 'Tamil', 'Bollywood']
  tags?: string[]
  indigenousTags?: string[]
  languageTags?: string[]
  priceCents?: number
  isFree?: boolean
  entryType: 'ticketed' | 'free_open'
  tiers?: { name: string; priceCents: number; available: number }[]
  capacity?: number
  attending?: number
  isFeatured?: boolean
  organizerId?: string
  artists?: EventArtist[]
  eventSponsors?: EventSponsor[]
  hostInfo?: EventHostInfo
  eventType?: 'festival' | 'concert' | 'workshop' | 'puja' | 'sports' | 'food' | 'cultural' | 'community' | 'exhibition' | 'conference' | 'other'
  ageSuitability?: 'all' | 'family' | '18+' | '21+'
  status: 'draft' | 'published' | 'cancelled'
  rsvpGoing?: number
  rsvpMaybe?: number
  rsvpNotGoing?: number
  myRsvp?: 'going' | 'maybe' | 'not_going' | null
  externalTicketUrl?: string
  deletedAt?: string        // soft delete
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

EventArtist { profileId?, name, role?, imageUrl? }
EventSponsor { profileId?, name, tier: 'title'|'gold'|'silver'|'bronze', logoUrl?, websiteUrl? }
EventHostInfo { profileId?, name, contactEmail?, contactPhone?, websiteUrl? }
```

### Profiles (Entities)

```typescript
Profile {
  id: string
  entityType: 'community' | 'business' | 'venue' | 'artist' | 'organizer' | 'restaurant' | 'brand'
  name: string
  slug?: string
  handle?: string
  description?: string
  imageUrl?: string
  coverImageUrl?: string
  gallery?: string[]
  city?: string
  country?: string
  location?: { lat: number; lng: number }
  status: 'draft' | 'published' | 'suspended'
  isVerified?: boolean
  isClaimed?: boolean
  followersCount?: number
  rating?: number
  reviewsCount?: number
  eventsCount?: number
  membersCount?: number
  category?: string
  cultureTags?: string[]
  nationalityId?, cultureIds?, languageIds?, diasporaGroupIds?
  website?, contactEmail?, phone?, socialLinks?
  isIndigenousOwned?, supplyNationRegistered?
  ownerId?: string
  createdAt?, updatedAt?
}
```

### Tickets

```typescript
Ticket {
  id: string
  cpTicketId: string        // CP-TKT-xxx
  eventId: string
  userId: string
  status: 'confirmed' | 'used' | 'cancelled' | 'expired'
  paymentStatus: 'paid' | 'pending' | 'refunded'
  qrCode: string
  priceCents: number
  cashbackCents?: number
  rewardPoints?: number
  tierName?: string
  history: { action, timestamp, actorId }[]
  createdAt: string
}
```

### Community Feed Post (Social Feed)

```typescript
FeedPost {
  id: string
  kind: 'event' | 'announcement' | 'image_post' | 'community_update'
  communityId: string
  community: Community
  authorId?: string
  body?: string
  imageUrl?: string
  likesCount: number
  commentsCount: number
  createdAt: string
  // kind='event':
  event?: EventData
  // kind='announcement':
  // uses body field
}

FeedComment {
  id: string
  postId: string
  authorId: string
  text: string
  createdAt: string
  likesCount: number
}
```

---

## 9. API Endpoints

All endpoints live under `/api`. Authentication via Bearer token (JWT).

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/social          (Google, Apple)
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Users

```
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/privacy/settings/:userId
PUT    /api/privacy/settings/:userId
```

### Events

```
GET    /api/events               ?city&country&category&cultureTag&startDate&endDate&page&pageSize
GET    /api/events/:id
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id           (soft delete)
GET    /api/events/nearby        ?lat&lng&radiusKm&limit
POST   /api/events/:id/rsvp      { status: 'going'|'maybe'|'not_going' }
GET    /api/discover/:userId     (personalised ranked feed)
GET    /api/feed                 (multi-signal ranked feed)
```

### Communities

```
GET    /api/communities          ?city&country&category&page&pageSize
GET    /api/communities/:id
POST   /api/communities
PUT    /api/communities/:id
POST   /api/communities/:id/join
POST   /api/communities/:id/leave
GET    /api/communities/:id/members
```

### Social Feed

```
POST   /api/feed/posts           { communityId, body, imageUrl? }
GET    /api/feed/posts           ?communityId&filter=for-you|events|communities
GET    /api/feed/posts/:id/comments
POST   /api/feed/posts/:id/comments  { text }
POST   /api/feed/posts/:id/like
DELETE /api/feed/posts/:id/like
POST   /api/feed/posts/:id/report
```

### Profiles (Directory)

```
GET    /api/profiles             ?entityType&city&country&category&page&pageSize
GET    /api/profiles/:id
POST   /api/profiles
PUT    /api/profiles/:id
GET    /api/businesses/:id
GET    /api/restaurants/:id
GET    /api/activities
GET    /api/movies
GET    /api/shopping
GET    /api/reviews/:profileId
POST   /api/reviews              { profileId, rating, comment }
```

### Tickets

```
GET    /api/tickets/:userId
GET    /api/tickets/:userId/count
GET    /api/ticket/:id
POST   /api/tickets              (purchase)
PUT    /api/tickets/:id/cancel
POST   /api/tickets/scan         { qrCode }
GET    /api/tickets/:id/history
GET    /api/tickets/:id/wallet/apple
GET    /api/tickets/:id/wallet/google
```

### Perks

```
GET    /api/perks                ?tier&city&category
GET    /api/perks/:id
POST   /api/perks
POST   /api/perks/:id/redeem
GET    /api/redemptions
```

### Membership & Wallet

```
GET    /api/membership/:userId
POST   /api/membership/subscribe
POST   /api/membership/cancel-subscription
GET    /api/wallet/:userId
POST   /api/wallet/:userId/topup
GET    /api/transactions/:userId
GET    /api/payment-methods/:userId
POST   /api/payment-methods
DELETE /api/payment-methods/:id
PUT    /api/payment-methods/:userId/default/:methodId
POST   /api/stripe/create-checkout-session
POST   /api/stripe/refund
POST   /api/stripe/webhook
```

### Search

```
GET    /api/search               ?q&type=all|event|community|business|profile&city&country&tags&startDate&endDate&page&pageSize
GET    /api/search/suggest       ?q
```

### Notifications

```
GET    /api/notifications/:userId
GET    /api/notifications/:userId/unread-count
PUT    /api/notifications/:id/read
PUT    /api/notifications/:userId/read-all
DELETE /api/notifications/:id
```

### Council / LGA

```
GET    /api/councils             ?pageSize&sortBy
GET    /api/councils/:id
GET    /api/councils/nearest     ?lat&lng
```

### Media & Uploads

```
POST   /api/uploads/image
POST   /api/media/attach
GET    /api/media/:targetType/:targetId
```

### Indigenous / First Nations

```
GET    /api/indigenous/traditional-lands
GET    /api/indigenous/spotlights
```

### Reports

```
POST   /api/reports
GET    /api/admin/reports
PUT    /api/admin/reports/:id/review
```

### Admin

```
GET    /api/admin/users
PUT    /api/admin/users/:id/role
GET    /api/admin/audit-logs
POST   /api/admin/notifications/broadcast
POST   /api/admin/search-backfill
GET    /api/rollout/config       ?userId
```

### Misc

```
GET    /health
GET    /api/cpid/lookup/:cpid
GET    /api/locations
GET    /api/locations/nearest    ?lat&lng
GET    /api/updates
GET    /api/updates/:id
```

---

## 10. Design System

### Brand Colors (immutable tokens)

```
Indigo   #4F46E5  — Primary brand, CTAs, trust signals, active navigation
Saffron  #FF8C42  — Festival, warm discovery, primary buttons
Coral    #FF5E5B  — Action energy, artists, urgency
Gold     #FFC857  — Premium membership, cultural celebration
Teal     #0D9488  — Global belonging, venues, communities, success states
Blue     #3A86FF  — Community, info states, focus rings
```

### Theme Backgrounds

**Dark Mode (default on native)**

```
background:      #0B0B14   Deep Space
surface:         #22203A   Rich Purple
surfaceElevated: #4F46E5   Culture Indigo
secondary:       #1B0F2E   Midnight Plum
border:          #2A2747
divider:         #3A375A
```

**Light Mode (default on web)**

```
background:      #F4EDE4
surface:         #FFF8F0
surfaceElevated: #FFFFFF
secondary:       #E6D3B3
border:          #D4C5B0
```

### Text Colors

```
Dark:   primary #FFFFFF, secondary #C9C9D6, muted #8D8D8D
Light:  primary #1B0F2E, secondary #4A4A4A, muted #8D8D8D
```

### Signature Gradients

```
CulturePass Brand: [#4F46E5, #FF8C42, #FF5E5B]  hero banners
Aurora:            [#3A86FF, #7B5EA7, #FF5E5B]  onboarding backgrounds
Sunset:            [#FF5E5B, #FF8C42, #FFC857]  event cards
Midnight:          [#0B0B14, #1B0F2E]            dark backgrounds
Primary:           [#4F46E5, #3A4FC8]            tab active, CTAs
```

### Component Sizing

```
Button heights:    sm 36, md 44, lg 52
Button radius:     12 (pill: 9999)
Card radius:       16 (featured: 20)
Card padding:      14
Input height:      48, radius 12
Chip height:       36, radius 50 (pill)
Avatar:            xs 24, sm 32, md 40, lg 56, xl 72, xxl 96
Tab bar:           mobile 84px (includes safe area), desktop 64px
```

### Typography — Poppins

```
xs 12, sm 14, md 16, lg 18, xl 20, xxl 24, xxxl 28, display 32+
Weights: Regular 400 / Medium 500 / SemiBold 600 / Bold 700
```

### Spacing (4pt grid)

```
xs 4, sm 8, md 16, lg 24, xl 32, xxl 48, xxxl 64
```

### Breakpoints

```
mobile:  < 768    bottom tab bar, 1 col
tablet:  768–1023 bottom tab bar, 2 col grid
desktop: ≥ 1024   left sidebar 240px, 3–4 col grid, no bottom bar
```

---

## 11. Layout Architecture

### Desktop (≥ 1024px)

- Fixed left sidebar (240px): logo, nav links, user avatar, CTA button
- No top navigation bar
- Content fills `flex: 1` to the right
- Top padding: `0`

### Tablet (768–1023px) + Mobile Web

- Bottom tab bar
- Top padding: `0`

### Mobile Native (iOS + Android)

- Bottom tab bar height 84px (includes safe area)
- Top padding: device safe area inset (notch/dynamic island)
- iOS: glassmorphism blur tab bar; Android: semi-transparent fallback

### Responsive Hook

```
useLayout() → {
  isDesktop, isTablet, isMobile
  numColumns: 1 (mobile) / 2 (tablet) / 3-4 (desktop)
  hPad: 16 / 24 / 32
  sidebarWidth: 0 / 0 / 240
  columnWidth(gap?): computed column width
  contentWidth: full content width
}
```

---

## 12. Design Laws (apply to every screen)

1. **Cultural Minimalism** — content leads, decoration earns its place
2. **Token Integrity** — no hardcoded hex; only brand tokens and theme hooks
3. **Platform Parity** — native-feel on iOS/Android/web; test all three
4. **Approachable Complexity** — one primary CTA per screen, plain language, clear empty states
5. **Technical Craftsmanship** — TypeScript strict, lint clean, zero type errors before shipping

### Button Hierarchy (per screen)

```
Primary     → solid Saffron (#FF8C42) background, deep text, radius 12
Secondary   → Indigo (#4F46E5) background, white text
Ghost       → no fill, teal border and text
Destructive → coral tint background, coral text — never primary position
Disabled    → muted gray, 50% opacity
One primary CTA visible per screen at a time
```

---

## 13. Authentication & State

### Auth Flow

1. Register/login → server issues JWT (short-lived) + refresh token
2. `Authorization: Bearer <token>` on every request
3. `/api/auth/me` → full user + role + membership
4. Role in JWT custom claims for fast server-side guards
5. Onboarding: `city + country + interests` must be set → `isComplete = true`
6. On tier change → update custom claims immediately

### Social Sign-In

- Google: OAuth2 PKCE → `/api/auth/social { provider: 'google', token }`
- Apple: Sign in with Apple → `/api/auth/social { provider: 'apple', identityToken }` (iOS required)

### State Management


| Concern     | Pattern                                                       |
| ----------- | ------------------------------------------------------------- |
| Server data | React Query (`useQuery`, `useMutation`)                       |
| Auth        | `AuthContext` + `useAuth()`                                   |
| Onboarding  | `OnboardingContext` (city, country, interests, isComplete)    |
| Saved items | `SavedContext` (savedEvents, joinedCommunities, AsyncStorage) |
| Contacts    | `ContactsContext` (CPID contacts, AsyncStorage)               |
| UI state    | `useState` / `useReducer` local                               |


---

## 14. Business Logic

### Membership Tier Benefits

```
free    — full discovery, 0% cashback, basic perks
plus    — 2h early ticket access, 2% cashback, enhanced perks
elite   — 6h early access, 5% cashback, priority perks
pro     — organiser tools, analytics, promoted events, 8% cashback
premium — VIP event access, exclusive experiences, 10% cashback
vip     — top rewards, partner benefits, white-glove, 15% cashback
```

### Ticket Purchase Flow

1. Select tier + quantity → show total
2. Charge via payment provider
3. On success: create ticket record, credit reward points, apply cashback
4. Ticket gets unique `qrCode` + `cpTicketId`

### Perk Redemption Flow

1. Check `minimumTier` → gate if insufficient
2. Generate single-use redemption code
3. Record in redemptions collection
4. Show code + countdown timer (typically 30 mins to use)

### Feed Ranking Algorithm (7 signals)

```
Cultural match   0.30  — event culture tags match user's cultureIds
Recency          0.20  — events happening soon score higher
Distance         0.20  — closer events (geoHash proximity)
Editorial        0.10  — isFeatured flag manually boosted
Trending         0.10  — RSVP + ticket velocity in last 24h
Organiser rep    0.05  — organizerReputationScore
Social proof     0.05  — followed organiser engagement
```

---

## 15. What Is NOT in The Current App (Post-Launch Backlog)

These features are planned but not yet built — **do not wireframe as complete**:

- Community posts feed (Feed tab exists but only events + announcements — user post creation flow is partial)
- Promotional/discount codes at checkout
- Organiser-to-attendee messaging (multicast push)
- Rewards points redemption at checkout (toggle to apply points)
- Tiered perk gates with lock overlay (UI only — server gate needed)
- Organiser public profile pages (`/profile/organizer/[id]`)
- NZ + UAE onboarding city grouping by country with flags
- Apple Wallet / Google Wallet `.pkpass` generation
- Wallet top-up + Apple Pay / Google Pay
- Firebase DataConnect migration (GraphQL schema — exploratory)

---

## 16. Missing Pages to Add (Recommended for Full Product)

These are not in the current codebase but would complete the product:

- **Event RSVP List** `/event/[id]/attendees` — list of who's going (public or friends-only)
- **Organiser Public Profile** `/organiser/[id]` — distinct from user profile; shows events, stats, bio
- **Onboarding Handle Setup** — step to claim `+handle` during onboarding (currently post-onboarding in edit)
- **Community Post Detail** `/community/[id]/posts/[postId]` — full post with comment thread
- **Explore Page** `/(tabs)/explore` — currently hidden tab; 2-col grid discovery grid (fill this out)
- **Checkout Page** `/checkout` — dedicated multi-step checkout with promo code input, summary, payment confirmation
- **Event Recurring** — for weekly classes/events: recurrence rule on create + calendar integration
- **Indigenous Artist Profile** `/indigenous/artist/[id]` — dedicated profile type respecting community protocols
- **Review Submission** `/reviews/create?profileId=X` — dedicated review form page
- **Onboarding — Handle Claim** — claim your `+handle` as part of signup flow

---

## 17. Google Stitch Wireframing Notes

When importing this document into Google Stitch or using it for Figma:

### Screen Priority Order (wireframe these first)

1. Welcome Splash (B1)
2. Sign Up (B2)
3. Location Picker (B5)
4. Discover Tab (C1)
5. Event Detail (D1)
6. Ticket Detail with QR (F2)
7. Community Tab (C4) + Community Detail (E1)
8. Profile Tab (C6)
9. Perks Tab (C5) + Perk Detail (G1)
10. Event Create Wizard — Steps 1, 9 (D2)
11. Calendar Tab (C3)
12. Feed Tab (C2)
13. Search (H9)
14. Membership Upgrade (K1)
15. Settings Hub (L1)

### Component Reuse

These components appear on multiple screens — wireframe once, reuse:

- **EventCard** — image, title, date, location, price chip, save button
- **CommunityCard** — cover image, name, member count, culture tags, join button
- **PerkCard** — image, title, value label, tier badge
- **ProfileCard** — avatar, name, handle, city, type badge
- **TabBar** — mobile bottom bar (6 tabs, active pill, glassmorphism on iOS)
- **WebSidebar** — desktop left panel (240px, logo, nav links, user avatar)
- **SearchBar** — full width, placeholder, filter icon right
- **FilterChipRow** — horizontally scrollable pill chips
- **HeroCarousel** — full-width auto-scrolling hero with gradient overlay and dots
- **SectionHeader** — section title, subtitle, "See All" link
- **EmptyState** — icon, title, body, CTA button

### Design Tokens for Stitch

When setting up colour styles in your tool:

```
Background:   #0B0B14 (dark) / #F4EDE4 (light)
Surface:      #22203A (dark) / #FFF8F0 (light)
Primary:      #4F46E5
Accent 1:     #FF8C42
Accent 2:     #FF5E5B
Accent 3:     #FFC857
Accent 4:     #0D9488
Text:         #FFFFFF (dark) / #1B0F2E (light)
Text 2:       #C9C9D6 (dark) / #4A4A4A (light)
Border:       #2A2747 (dark) / #D4C5B0 (light)
```

---

## 18. Environment Variables

```
AUTH_JWT_SECRET, AUTH_REFRESH_SECRET
AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET
AUTH_APPLE_CLIENT_ID, AUTH_APPLE_TEAM_ID, AUTH_APPLE_KEY_ID, AUTH_APPLE_PRIVATE_KEY
DATABASE_URL
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_MONTHLY_IDS, STRIPE_PRICE_YEARLY_IDS
SEARCH_APP_ID, SEARCH_ADMIN_KEY
STORAGE_BUCKET, STORAGE_CDN_BASE_URL
FCM_SERVER_KEY (push notifications)
# Client-safe (bundle into app):
PUBLIC_API_URL
PUBLIC_SEARCH_APP_ID, PUBLIC_SEARCH_KEY
PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_STRIPE_PUBLISHABLE_KEY
PUBLIC_GOOGLE_MAPS_KEY
```

---

## 19. Recommended Build Order

Phase 1 — Foundation

1. Auth (email/password + Google + Apple)
2. User profile + full onboarding flow
3. Event listing + event detail (read-only)
4. Basic search

Phase 2 — Core Marketplace
5. Ticket purchase + QR ticket wallet
6. Membership tiers + Stripe subscription
7. Community browse + join/leave
8. Perks list + redemption

Phase 3 — Discovery & Social
9. Personalised ranked feed (cultural match + location)
10. Social Feed tab (posts, likes, comments)
11. Calendar view with filters + map
12. Directory (businesses, venues, organisations)
13. First Nations spotlight

Phase 4 — Creation Tools
14. Event creation wizard (9 steps)
15. Organiser dashboard
16. QR scanner (check-in)

Phase 5 — Platform & Polish
17. Push notifications
18. Admin panel (users, moderation, handles)
19. Search index backfill
20. Analytics dashboard
21. Apple/Google Wallet passes
22. Handle routing (`/[handle]`)

---

*This document is the single source of truth for rebuilding CulturePass on any platform or AI tool.*
*Tech stack, hosting, and tooling are intentionally excluded — those are implementation choices.*
*The product, data model, API contract, design system, and business logic described here are fixed.*
*Last updated: May 2026. App Store launch target: 15 April 2026.*