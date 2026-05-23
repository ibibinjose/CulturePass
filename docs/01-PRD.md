# 01 — Product Requirements Document (PRD)

> **Version**: 2.0 — May 2026
> **Status**: Live — v1.1.0 shipped 15 April 2026
> **Audience**: Product, Design, Engineering, Investors
> **Related**: [02-TRD](02-TRD.md) · [03-APP_FLOW](03-APP_FLOW.md) · [AGENTS.md](../AGENTS.md) · [GO_TO_MARKET](GO_TO_MARKET.md)

---

## 1. Product Vision

**CulturePass** is a B2B2C cultural lifestyle marketplace for diaspora communities worldwide.

> **Primary Tagline**: *Belong anywhere.*
> **Secondary Tagline**: *Discover. Connect. Belong.*
> **Platform Tagline**: *Your one-stop lifestyle platform for cultural diaspora communities*

The core insight: diaspora communities are vibrant and event-rich, but their events, businesses, and gathering spaces are scattered across social media, WhatsApp groups, and niche websites. CulturePass unifies them in a single, beautifully designed cross-platform experience.

**Long-term vision**: A global cultural OS — a living, searchable map of diaspora culture (events, businesses, artists, venues, communities) continuously enriched by the people who live it.

---

## 2. Audiences

CulturePass serves three overlapping audiences simultaneously:

| Audience | Primary Need | What CulturePass Delivers |
|---|---|---|
| **Community Members** | Find events, connect with culture | Discovery, ticketing, community hubs, loyalty perks |
| **Event Organisers & Artists** | Reach the right audience and sell tickets | Event publishing, ticket sales, analytics dashboard |
| **Cultural Businesses & Venues** | Build reputation and attract community traffic | Directory listing, verified profile, community endorsements |

### Primary User Personas

**Priya, 28 — Community Member**
- South Asian Australian, Sydney. Works in tech. Moved from India 3 years ago.
- Wants to stay connected to culture, meet others from her community, attend festivals and events.
- Currently discovers events via Instagram DMs and WhatsApp groups. Misses events due to lack of visibility.
- Value proposition: one place to find every cultural event in Sydney, buy tickets, and connect with people who share her background.

**Marcus, 42 — Event Organiser**
- Caribbean Australian, Melbourne. Runs a monthly cultural music event series.
- Sells tickets via Eventbrite and promotes via Facebook. Struggles to reach the diaspora community specifically.
- Loses 30–40% of potential attendees who find events too late.
- Value proposition: publish events to an audience already looking for exactly what he's running; built-in ticketing; cultural discovery engine surfaces his events to the right people.

**Hana, 35 — Business Owner**
- Ethiopian-Australian, Sydney. Owns a restaurant and grocery.
- Has no discovery mechanism beyond Google Maps and word of mouth.
- Value proposition: verified directory listing with photos and reviews, surfaced to community members who actively want to support diaspora businesses.

---

## 3. Problem Statement

### Problems Being Solved

1. **Discovery fragmentation** — cultural events are scattered across Instagram, Facebook, WhatsApp groups, and community newsletters with no central source.
2. **Cultural specificity** — general event platforms (Eventbrite, Humanitix) have no concept of diaspora culture, community identity, or cultural proximity.
3. **Organiser reach** — organisers targeting diaspora audiences have no targeted channel; paid social is expensive and untargeted.
4. **Business invisibility** — cultural businesses and venues are poorly served by Google Maps and general directories.
5. **Community disconnection** — diaspora communities lack a digital hub that mirrors the social fabric of physical community life.

### What CulturePass Is Not

- Not a government portal or council platform (council = location attribute only)
- Not a competitor to Eventbrite for mainstream events (niche diaspora-first positioning)
- Not a social network (community features support, not replace, discovery and commerce)

---

## 4. Core Features

### 4.1 Discover (Home Tab)

**Purpose**: Primary discovery surface. Editorial + algorithmic. Users land here first.

| Component | Description |
|---|---|
| Hero Carousel | Featured events — aurora gradient hero banners, editorial curation |
| Event Rails | Horizontal scroll rails — Trending, Near You, By Culture Tag, Free Events |
| Community Rail | Join/explore community hubs |
| Category Rail | Browse by category (Music, Food, Dance, Art, Film, Wellness, etc.) |
| City Rail | Discover events in other cities |
| Indigenous Spotlight | Dedicated First Nations cultural events and artists — not a footnote |
| Super App Links | Deep links to CultureX, Host Hub, Featured Communities |
| Feed Cards | Personalised activity feed — events from communities you've joined |

**Algorithmic signals**: city match, culture tag affinity, past attendance, joined communities, recency.

### 4.2 Events

**Discovery**: Browse and search events filtered by city, category, date range, and price (free/paid/all).

**Event Detail**: Full event page with hero image, description, venue map, ticket tiers, organiser info, culture tags, artist lineup, and sponsors.

**Ticketing**: Purchase in-app via Stripe. Multi-tier tickets. QR code generated on purchase. Wallet pass (Apple/Google Wallet on roadmap).

**Event Creation** (organisers): 9-step wizard — basics, image, location, datetime, entry type, ticket tiers, team, culture tags, review + publish.

### 4.3 Calendar Tab

Monthly grid calendar with event dots. Civic reminders. Filter by culture tag. My Tickets view. Add-to-device-calendar (iCal export).

### 4.4 Community Tab

Join and browse diaspora community hubs. Community feeds (post-launch, feature-flagged). Community events view. Follow/unfollow other members.

### 4.5 City Tab

City destination pages — hero imagery, active events, featured communities, local businesses, cultural highlights. Supports all live cities (Sydney, Melbourne, Auckland, Dubai, London, Toronto).

### 4.6 My Space (Profile Tab)

Personal hub — upcoming tickets, saved events, joined communities, earned perks, membership status, profile settings, identity QR card.

### 4.7 Perks

Earn and redeem loyalty perks across the platform. Perk balance chip. Redemption modal. Membership-tier-gated perks.

### 4.8 Business & Venue Directory

Browse cultural businesses and venues by category (restaurants, groceries, fashion, beauty, venues, organisations). Filter by city, culture tag, council area. Business detail pages with photos, rating, location, and contact info.

### 4.9 Host Hub (Organiser Surface)

Full organiser experience — event creation, event management, dashboard, analytics. Reached via in-app links (not bottom tab bar).

### 4.10 CultureX

Culture-focused content experience — editorial, spotlights, culture-of-the-week, artist profiles. Reached via in-app links.

### 4.11 Search

Global search across events, communities, businesses, venues, artists. Filter by city, category, culture tag, entity type.

### 4.12 Network

Followers/following/suggestions. Social graph. Connect with other community members.

### 4.13 Contacts CRM

Save and manage contacts from the community. Pin/unpin, segment, notes, tags, interests. Smart Business Cards via deep link.

### 4.14 Scanner

QR ticket scanner for organisers and venue staff to validate event entry.

### 4.15 Admin Dashboard

Platform administration — user management, audit logs, content moderation, finance/payouts, discover curation, notification broadcast, platform health, data compliance.

---

## 5. Membership Tiers

| Tier | Monthly AUD | Annual AUD | Key Benefits |
|---|---|---|---|
| **Free** | $0 | $0 | Full discovery, basic community access, standard ticketing |
| **Plus** | $9.99 | $89.99 | Enhanced perks, early ticket access, priority discovery |
| **Elite** | $19.99 | $179.99 | Increased cashback, priority listings |
| **Pro** | $29.99 | $269.99 | Organiser tools, promoted events, detailed analytics |
| **Premium** | $49.99 | $449.99 | VIP event access, exclusive cultural experiences |
| **VIP** | $99.99 | $899.99 | Top-tier rewards, partner benefits, white-glove support |

Membership managed via Stripe subscriptions. Tier status synced real-time via Firebase custom claims. Cashback and reward points scale with tier.

---

## 6. Revenue Streams

1. **CulturePass+ Subscriptions** — Monthly/annual plans via Stripe (primary recurring revenue)
2. **Ticket Booking Fees** — % per ticket transaction (default: platform fee baked into priceCents)
3. **Stripe Connect Platform Fee** — `STRIPE_CONNECT_PLATFORM_FEE_BPS` (default 1000 bps = 10%) on organiser payouts
4. **Promoted Event Listings** — Organiser tier upgrades; featured placement on Discover
5. **Business Directory Premium** — $49–$99/month for verified business profiles with promoted placement

**Year 1 Revenue Targets**: $5K–$10K MRR by Month 6. 500–1,000 CulturePass+ subscribers. 20 Pro/Enterprise organiser accounts.

---

## 7. Geographic Markets

### Phase 1 (Live — April 2026)
- Sydney, NSW, Australia
- Melbourne, VIC, Australia

### Phase 2 (H2 2026)
- Auckland + Wellington, NZ (Month 7)
- Dubai, UAE (Month 8)
- London, UK (Month 9)
- Toronto, CA (Month 11)

No geographic restriction on sign-up or event creation. City filtering determines content relevance.

### Council/LGA Integration
Council is a **location attribute only** — not governance. LGA codes (`lgaCode`) on events and users power proximity filtering ("Events in Your Area" rail). ~1,000 Australian LGAs seeded from `AllCouncilsList.csv`.

---

## 8. Platform Support

| Platform | Status | Bundle ID |
|---|---|---|
| iOS | Live | `au.culturepass.app` |
| Android | Live | `au.culturepass.app` |
| Web | Live | `culturepass.app` |

Dark mode is the native default (iOS/Android). Light mode is the web default. System preference respected on all platforms.

---

## 9. First Nations Commitment

Indigenous Australian culture is a **core platform feature**, not an add-on:
- Dedicated Indigenous Spotlight section on Discover
- First Nations culture tag in event categories
- `indigenous.ts` lib for curated filtering
- Acknowledgement of Country on location screens
- No editorial content published without Indigenous community consultation

---

## 10. Success Metrics (Year 1 KPIs)

| Metric | Target |
|---|---|
| Registered users (30 days post-launch) | 5,000 |
| Active organiser accounts | 10 |
| Published events | 200 |
| App Store rating | ≥ 4.0 (≥ 50 reviews) |
| D7 retention | ≥ 25% |
| DAU/MAU | ≥ 20% |
| CulturePass+ subscribers (Month 6) | 500–1,000 |
| MRR (Month 6) | $5K–$10K AUD |
| GMV take rate | 5–8% blended |

---

## 11. Non-Goals (Explicit Exclusions)

- Real-time in-app chat (roadmap post-Month 6)
- Livestreaming or video hosting
- Non-English content localization (platform is English-first)
- Government portal features (council = proximity only)
- Direct competition with horizontal ticketing platforms (Eventbrite, Humanitix)
- Cryptocurrency or NFT ticketing

---

## 12. Post-Launch Roadmap (May–December 2026)

| Feature | Target |
|---|---|
| Algolia full-text search | Month 1 post-launch |
| GeoHash backfill (geocode remaining events) | Month 1 |
| Council LGA auto-select from GPS on onboarding | Month 1 |
| Organiser event analytics dashboard | Month 2 |
| Promotional codes (checkout validation) | Month 2 |
| Community posts (feature-flagged) | Month 3 |
| Push notification deep links + per-category opt-out | Month 3 |
| Rewards points redemption UI | Month 3 |
| Organiser attendee messaging (FCM multicast) | Month 4 |
| Wallet top-up + Apple/Google Pay | Month 4 |
| NZ + UAE city grouping on onboarding | Month 5 |
| Tiered perk gates (lock overlay + server 403) | Month 5 |
| Server-side iCal city subscription endpoint | Month 6 |

---

*Last updated: May 2026 | Maintained by: CulturePass Product*
