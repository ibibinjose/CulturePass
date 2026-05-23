# 05 — Backend Schema

> **Version**: 2.0 — May 2026
> **Status**: Live — v1.1.0
> **Audience**: Engineering, Data, Security
> **Related**: [02-TRD](02-TRD.md) · [AUTH_PROFILE_RBAC](AUTH_PROFILE_RBAC.md) · [AGENTS.md](../AGENTS.md) · [API_ENDPOINTS](API_ENDPOINTS.md)

---

## 1. Database: Cloud Firestore

Firestore is a NoSQL document database. All data lives in collections of documents. Documents contain fields and may contain subcollections.

**Region**: `australia-southeast1`
**Security model**: Firestore Security Rules + Firebase Admin SDK (server-side bypasses rules)

---

## 2. Core Collections

### 2.1 `users/{uid}`

Primary user record. `uid` matches Firebase Auth UID.

```typescript
interface User {
  uid: string;                        // Firebase Auth UID (document ID)
  username: string;                   // Unique @handle
  displayName: string;
  email: string;
  photoURL?: string;                  // Firebase Storage URL
  bio?: string;
  city: string;                       // Primary city
  country: string;                    // ISO 3166-1 alpha-2
  role: UserRole;                     // 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin'
  membership: {
    tier: MembershipTier;             // 'free' | 'plus' | 'elite' | 'pro' | 'premium' | 'vip'
    expiresAt?: Timestamp;
    stripeSubscriptionId?: string;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeAccountId?: string;           // Stripe Connect (organiser payouts)
  interests: string[];                // Culture tags + interest categories
  culturePassId?: string;             // CPID — short unique identity code
  isSydneyVerified?: boolean;
  lgaCode?: string;                   // LGA code — written server-side on onboarding
  fcmTokens?: string[];               // Push notification device tokens
  notificationPreferences?: {         // Per-category opt-out (Month 3)
    [category: string]: boolean;
  };
  socialLinks?: {
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  followersCount: number;
  followingCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;              // Soft delete
}

type UserRole = 'user' | 'organizer' | 'moderator' | 'admin' | 'cityAdmin' | 'platformAdmin';
type MembershipTier = 'free' | 'plus' | 'elite' | 'pro' | 'premium' | 'vip';
```

**Security**: Users own their document (read + write own). Admins can read/write all. Role field is server-write-only.

---

### 2.2 `events/{eventId}`

Event listings — the core entity.

```typescript
interface Event {
  id: string;                         // Firestore document ID
  cpid: string;                       // Short public ID (for short links /e/[cpid])
  title: string;
  description: string;
  category: EventCategory;
  cultureTag: string[];               // e.g. ['south-asian', 'indigenous-australian']
  tags: string[];                     // Freeform tags
  status: EventStatus;                // 'draft' | 'published' | 'cancelled'
  
  // Venue + Location
  venue: string;                      // Venue name
  address: string;                    // Full formatted address
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  geoHash?: string;                   // Geohash for proximity queries
  lgaCode?: string;                   // LGA code for council proximity
  councilId?: string;                 // Reference to councils/{councilId}
  
  // Time
  date: string;                       // ISO 8601 date 'YYYY-MM-DD'
  time: string;                       // 'HH:MM' local time
  endDate?: string;
  endTime?: string;
  timezone?: string;                  // e.g. 'Australia/Sydney'
  
  // Media
  imageUrl: string;                   // Primary card image
  heroImageUrl?: string;              // Full-bleed hero (event detail)
  
  // Ticketing
  entryType: EntryType;               // 'ticketed' | 'free' | 'rsvp'
  isFree: boolean;
  priceCents: number;                 // Lowest paid tier price in cents (0 if free)
  tiers: TicketTier[];
  capacity?: number;
  attending: number;                  // Current attendance count
  
  // Organiser
  organizerId: string;               // uid of organiser
  
  // Optional metadata
  artists?: EventArtist[];
  eventSponsors?: EventSponsor[];
  hostInfo?: EventHostInfo;
  
  // Discovery signals
  isFeatured: boolean;               // Editorial hero placement
  featuredScore?: number;            // Algorithmic ranking score
  
  // Timestamps
  publishedAt?: Timestamp;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TicketTier {
  id: string;
  name: string;                       // e.g. 'General Admission', 'VIP'
  priceCents: number;
  capacity?: number;
  sold: number;
  description?: string;
}

interface EventArtist {
  id?: string;
  name: string;
  role?: string;                      // e.g. 'Headliner', 'Supporting'
  imageUrl?: string;
}

interface EventSponsor {
  name: string;
  logoUrl?: string;
  tier?: 'gold' | 'silver' | 'bronze';
}

type EventStatus = 'draft' | 'published' | 'cancelled';
type EntryType = 'ticketed' | 'free' | 'rsvp';
```

**Security**: Public read on `status: 'published'`. Organiser write on own events. Admin write all. Draft events: organiser-read-only.

---

### 2.3 `tickets/{ticketId}`

One document per ticket purchase.

```typescript
interface Ticket {
  id: string;
  cpTicketId: string;                 // Short public ticket ID (for QR code)
  eventId: string;
  userId: string;                     // Purchaser uid
  
  // Tier info (snapshot at purchase time)
  tierId: string;
  tierName: string;
  priceCents: number;
  
  // Payment
  status: TicketStatus;              // 'reserved' | 'paid' | 'used' | 'cancelled' | 'refunded'
  paymentStatus: PaymentStatus;      // 'pending' | 'succeeded' | 'failed' | 'refunded'
  stripePaymentIntentId?: string;
  
  // Rewards
  cashbackCents: number;
  rewardPoints: number;
  
  // QR
  qrCode: string;                    // Encoded ticket data for scanner
  
  // Audit trail
  history: TicketHistoryEntry[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TicketHistoryEntry {
  action: 'created' | 'paid' | 'checked_in' | 'cancelled' | 'refunded';
  timestamp: Timestamp;
  actorId: string;                    // uid of user who performed action
  note?: string;
}

type TicketStatus = 'reserved' | 'paid' | 'used' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
```

**Security**: Owner-read-only (purchaser). Admin-SDK writes (server-side only). Organisers can read tickets for their events.

---

### 2.4 `profiles/{profileId}`

Entity profiles: community, business, venue, artist, organisation.

```typescript
interface Profile {
  id: string;
  cpid: string;                       // Short public ID
  entityType: ProfileEntityType;      // 'community' | 'business' | 'venue' | 'artist' | 'organisation'
  name: string;
  description: string;
  imageUrl?: string;
  coverImageUrl?: string;
  
  // Owner
  ownerId: string;                    // uid
  
  // Location
  city: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  lgaCode?: string;
  
  // Classification
  cultureTag: string[];
  category?: string;
  tags: string[];
  
  // Quality signals
  isVerified: boolean;
  isFeatured: boolean;
  rating?: number;                    // 0–5, weighted average
  reviewCount?: number;
  membersCount?: number;              // For communities
  followersCount?: number;
  
  // Contact
  socialLinks?: {
    website?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

type ProfileEntityType = 'community' | 'business' | 'venue' | 'artist' | 'organisation';
```

**Security**: Public read on `status: 'active'`. Owner write on own profile. Admin write all.

---

### 2.5 `councils/{councilId}`

Australian Local Government Areas (LGAs). ~1,000 records seeded from `AllCouncilsList.csv`.

```typescript
interface Council {
  id: string;
  name: string;                       // e.g. 'City of Sydney'
  suburb?: string;
  state: string;                      // e.g. 'NSW', 'VIC'
  lgaCode: string;                    // Unique LGA identifier
  country: string;                    // 'AU'
  websiteUrl?: string;
  phone?: string;
  addressLine1?: string;
  verificationStatus: 'verified' | 'unverified';
  latitude?: number;
  longitude?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Purpose**: Location attribute only. Proximity service. Not a governance feature.

---

### 2.6 `communities/{communityId}`

Diaspora community hubs (mirrors `profiles/{id}` where `entityType: 'community'` but with subcollections).

```typescript
interface Community extends Profile {
  entityType: 'community';
  memberIds?: string[];               // Denormalised for small communities (< 1000)
  membersCount: number;
  isPrivate: boolean;
  joinPolicy: 'open' | 'request' | 'invite';
}

// Subcollection: communities/{communityId}/members/{uid}
interface CommunityMember {
  uid: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Timestamp;
}

// Subcollection: communities/{communityId}/posts/{postId} (feature-flagged, Month 3)
interface CommunityPost {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'removed';
  createdAt: Timestamp;
}
```

---

### 2.7 `perks/{perkId}`

Loyalty perks catalogue.

```typescript
interface Perk {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  
  category: string;                   // e.g. 'food', 'events', 'shopping'
  isIndigenous: boolean;              // Indigenous-specific perk
  
  // Access control
  requiredTier: MembershipTier;       // Minimum tier to redeem
  pointsCost: number;                 // Reward points cost to redeem (0 = free for tier)
  
  // Redemption
  redeemType: 'code' | 'link' | 'qr';
  redeemValue: string;                // Coupon code / URL / QR data
  expiresAt?: Timestamp;
  
  // Availability
  totalRedemptions?: number;          // Max total redemptions (null = unlimited)
  redemptionsUsed: number;
  perUserLimit?: number;              // Max per user (null = unlimited)
  
  // Display
  isFeatured: boolean;
  sortOrder: number;
  
  partnerId?: string;                 // Profile ID of perk partner
  
  status: 'active' | 'expired' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2.8 `notifications/{notificationId}`

Platform notifications.

```typescript
interface Notification {
  id: string;
  userId: string;                     // Recipient uid
  
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  
  deepLink?: string;                  // In-app route to navigate to on tap
  
  isRead: boolean;
  readAt?: Timestamp;
  
  metadata?: Record<string, unknown>; // Type-specific extra data
  
  createdAt: Timestamp;
}

type NotificationType =
  | 'ticket_confirmed'
  | 'event_reminder'
  | 'event_cancelled'
  | 'community_invite'
  | 'new_follower'
  | 'perk_unlocked'
  | 'membership_updated'
  | 'admin_broadcast';
```

---

### 2.9 `wallets/{userId}`

User wallet (reward points + cashback balance).

```typescript
interface Wallet {
  userId: string;                     // Document ID = uid
  pointsBalance: number;
  cashbackCents: number;              // Unspent cashback in cents
  lifetimePointsEarned: number;
  lifetimePointsSpent: number;
  updatedAt: Timestamp;
}

// Subcollection: wallets/{userId}/transactions/{txId}
interface WalletTransaction {
  id: string;
  type: 'earn' | 'spend' | 'cashback' | 'adjustment';
  points?: number;
  cashbackCents?: number;
  source: string;                     // e.g. 'ticket:eventId', 'perk:perkId'
  description: string;
  createdAt: Timestamp;
}
```

---

### 2.10 `activities/{activityId}`

User activity feed.

```typescript
interface Activity {
  id: string;
  userId: string;                     // Actor uid
  type: ActivityType;
  entityId: string;                   // ID of the entity (event, community, etc.)
  entityType: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

type ActivityType =
  | 'attended_event'
  | 'saved_event'
  | 'joined_community'
  | 'followed_user'
  | 'purchased_ticket'
  | 'redeemed_perk'
  | 'created_event';
```

---

### 2.11 `social/{uid}/following/{targetUid}`

Social graph (denormalised fan-out pattern).

```typescript
interface Follow {
  uid: string;              // Follower
  targetUid: string;        // Following
  createdAt: Timestamp;
}

// users/{uid}.followersCount and followingCount are denormalised counters
// Updated via server-side triggers on follow/unfollow
```

---

### 2.12 `moderation/{reportId}`

Content moderation queue.

```typescript
interface ModerationReport {
  id: string;
  reporterId: string;
  entityId: string;
  entityType: 'event' | 'profile' | 'post' | 'user';
  reason: string;
  detail?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  action?: 'none' | 'warned' | 'removed' | 'banned';
  createdAt: Timestamp;
}
```

---

### 2.13 `auditLogs/{logId}`

Immutable admin audit trail.

```typescript
interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;                     // e.g. 'user.ban', 'event.feature', 'perk.create'
  entityId?: string;
  entityType?: string;
  before?: Record<string, unknown>;   // State before change
  after?: Record<string, unknown>;    // State after change
  ip?: string;
  userAgent?: string;
  createdAt: Timestamp;
}
```

---

### 2.14 `updates/{updateId}`

Platform changelog / release notes.

```typescript
interface PlatformUpdate {
  id: string;
  version: string;
  title: string;
  body: string;
  type: 'feature' | 'fix' | 'improvement';
  publishedAt: Timestamp;
  createdAt: Timestamp;
}
```

---

## 3. Authentication (Firebase Auth)

### Custom Claims

Set server-side via Firebase Admin SDK on auth events:

```typescript
interface CustomClaims {
  role: UserRole;
  membershipTier: MembershipTier;
}
```

Claims updated on:
- User role change (admin action)
- Stripe subscription created/updated/deleted (webhook handler)

### Token Structure

```
Firebase ID Token (JWT):
  sub: uid
  email: string
  custom claims: { role, membershipTier }
  exp: 1 hour (auto-refreshed by SDK)
```

---

## 4. Security Rules (Firestore)

### Access Matrix

| Collection | Public Read | Authenticated Read | Owner Write | Admin Write |
|---|---|---|---|---|
| `users` | No | Own doc only | Own doc | Yes |
| `events` | Published only | All published | Own events | Yes |
| `tickets` | No | Own tickets | No | Admin SDK only |
| `profiles` | Active only | All active | Own profile | Yes |
| `councils` | Yes | Yes | No | Yes |
| `perks` | Active only | All active | No | Yes |
| `notifications` | No | Own only | No | Admin SDK |
| `wallets` | No | Own only | No | Admin SDK |
| `activities` | No | Own only | Own only | Yes |
| `moderation` | No | No | Report create | Yes |
| `auditLogs` | No | No | No | Yes |

---

## 5. Composite Indexes

Required for multi-field queries:

```
events: [city ASC, date ASC, status ASC]
events: [lgaCode ASC, date ASC, status ASC]
events: [organizerId ASC, status ASC, date DESC]
events: [cultureTag ARRAY_CONTAINS, city ASC, date ASC]
events: [isFeatured ASC, date ASC, status ASC]
events: [geoHash ASC, date ASC]
profiles: [entityType ASC, city ASC, isVerified ASC]
profiles: [cultureTag ARRAY_CONTAINS, entityType ASC]
tickets: [userId ASC, status ASC, createdAt DESC]
tickets: [eventId ASC, status ASC]
notifications: [userId ASC, isRead ASC, createdAt DESC]
```

---

## 6. Backend API Layer

### Handler → Service → Firestore

```
HTTP Request
    ↓
functions/src/app.ts (Express)
    ↓
functions/src/middleware/auth.ts (verify Firebase ID token → req.user)
    ↓
functions/src/handlers/[domain].ts (route handler)
    ↓
functions/src/services/[domain].ts (business logic + Firestore reads/writes)
    ↓
Cloud Firestore
```

### Service Layer Files (Key)

| Service | Responsibility |
|---|---|
| `firestore.ts` | Typed Firestore data layer — CRUD primitives |
| `events.ts` | Event create/update/publish/cancel + score calculation |
| `tickets.ts` | Purchase, validate (QR scan), refund |
| `profiles.ts` | Entity profile CRUD + verification |
| `search.ts` | Multi-collection search with filters + scoring |
| `discoverCuration.ts` | Editorial + algorithmic Discover feed assembly |
| `discoverDomain.ts` | Domain-specific discovery queries (city, culture, proximity) |
| `ranking.ts` | Event relevance scoring (recency, attendance, culture match, geo) |
| `stripeConnect.ts` | Organiser payout management |
| `walletPasses.ts` | Apple/Google Wallet pass generation (roadmap) |
| `cache.ts` | In-memory TTL cache (60s default for hot paths) |
| `rollout.ts` | Feature flag phased rollout |
| `taxonomy.ts` | Culture tags, event categories, canonical lookups |
| `systemConfig.ts` | Platform-wide configuration (feature flags, fee BPS) |

---

## 7. Stripe Data Relationships

```
Stripe Customer ID ──────────── users/{uid}.stripeCustomerId
Stripe Subscription ID ──────── users/{uid}.membership.stripeSubscriptionId
Stripe Connect Account ID ────── users/{uid}.stripeAccountId
Stripe Payment Intent ID ──────── tickets/{id}.stripePaymentIntentId

Webhook events → Cloud Function → Firestore write:
  customer.subscription.created  → users/{uid}.membership.tier
  customer.subscription.updated  → users/{uid}.membership
  customer.subscription.deleted  → users/{uid}.membership.tier = 'free'
  invoice.payment_succeeded      → users/{uid}.membership confirmed
  invoice.payment_failed         → notify user, downgrade pending
  payment_intent.succeeded       → tickets/{id}.paymentStatus = 'succeeded'
  payment_intent.payment_failed  → tickets/{id}.paymentStatus = 'failed'
```

---

## 8. Event Scoring (Discovery Algorithm)

`ranking.ts` computes `featuredScore` for event ranking in Discover rails:

```typescript
score = (
  recencyScore        * 0.30   // Events happening sooner rank higher
  + attendingScore    * 0.25   // Higher attendance → trending
  + cultureMatchScore * 0.25   // Culture tag matches user interests
  + geoScore          * 0.15   // Proximity to user's city / lgaCode
  + featuredBoost     * 0.05   // Editorial isFeatured flag
)
```

---

## 9. GeoHash Proximity

Events with `latitude` / `longitude` have a `geoHash` field computed server-side.

```typescript
// Geohash precision 6 = ~1.2km × 0.6km cell
// Proximity query: find all events within ~10km radius
const neighbors = geohash.neighbors(userGeoHash);
const queries = [userGeoHash, ...neighbors].map(hash =>
  db.collection('events')
    .where('geoHash', '>=', hash)
    .where('geoHash', '<=', hash + '~')
    .where('status', '==', 'published')
);
```

Backfill job: `functions/src/jobs/geohashBackfill.ts` — geocodes events missing lat/lng.

---

## 10. Feature Flags

```typescript
// functions/src/services/rollout.ts
// Client: src/lib/feature-flags.ts + useFlagOverride()

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;         // 0–100
  allowlist?: string[];              // UIDs with flag on regardless of rollout
  denylist?: string[];               // UIDs with flag off regardless of rollout
}

// Active flags:
'eventcard-v2'    // EventCard V2 (Mode-C visual layer)
'community-posts' // Community posts feed (Month 3)
'wallet-topup'    // Wallet top-up UI (Month 4)
'perk-gates'      // Tier-gated perk lock overlay (Month 5)
```

---

*Last updated: May 2026 | Maintained by: CulturePass Engineering*
