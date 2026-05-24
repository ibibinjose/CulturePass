import type { MembershipTier, UserRole, SocialLinks } from './common';

export interface Membership {
  id: string;
  userId: string;
  tier: MembershipTier;
  validUntil?: string;
  isActive?: boolean;
  benefits?: string[];
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  points: number;
}

/**
 * Structured cultural identity — set during onboarding, used for
 * personalised discovery, community matching, and event recommendations.
 */
export interface CulturalIdentity {
  /** ISO 3166-1 alpha-3 derived nationality key, e.g. "indian" */
  nationalityId?: string;
  /** One or more culture IDs from constants/cultures.ts, e.g. ["malayali"] */
  cultureIds?: string[];
  /** ISO 639-3 language IDs from constants/languages.ts, e.g. ["mal", "eng"] */
  languageIds?: string[];
  /** Cross-national diaspora group IDs, e.g. ["south_asian_diaspora"] */
  diasporaGroupIds?: string[];
  /**
   * Cultures the user wants to EXPLORE (distinct from their roots).
   * Drives the Cultural Passport: events from these cultures earn bonus points
   * and advance quests when the culture is NOT also in `cultureIds`.
   */
  exploringCultureIds?: string[];
  /**
   * Lowercased event/search tags derived from `exploringCultureIds`.
   * Denormalised so client-side filtering against `cultureTag[]` is O(1).
   */
  exploringCultureTags?: string[];
}

export type HandleStatus = 'pending' | 'approved' | 'rejected';

export interface CalendarSettings {
  autoAddTickets?: boolean;
  showPersonalEvents?: boolean;
  deviceConnected?: boolean;
  lastSyncedAt?: string;
}

export interface UserSubscribedCity {
  city: string;
  country: string;
  subscribedAt: string;
}

export interface User {
  id: string;
  username: string;
  /** CulturePass handle — the canonical identifier displayed as +handle */
  handle?: string;
  /** Whether this handle has been approved by an admin (default: 'pending' on registration) */
  handleStatus?: HandleStatus;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  postcode?: number;
  country?: string;
  /** Australian LGA code — proximity / perks gating (not governance). */
  lgaCode?: string;
  /** councils/{id} when the member chose an LGA. */
  councilId?: string;
  bio?: string;
  interests?: string[];
  location?: string;
  socialLinks?: SocialLinks;
  isVerified?: boolean;
  isSydneyVerified?: boolean;
  /**
   * Cities a user follows for city-page updates.
   * Persisted server-side so this preference syncs across devices.
   */
  subscribedCities?: UserSubscribedCity[];
  culturePassId?: string;
  /** @deprecated use culturalIdentity.nationalityId + cultureIds instead */
  ethnicityText?: string;
  /** @deprecated use culturalIdentity.languageIds instead */
  languages?: string[];
  /** Structured cultural identity — the Cultural Identity Layer */
  culturalIdentity?: CulturalIdentity;
  communities?: string[];
  interestCategoryIds?: string[];
  calendarSettings?: CalendarSettings;
  notificationPreferences?: {
    categories?: {
      events?: boolean;
      communities?: boolean;
      perks?: boolean;
      updates?: boolean;
    };
  };
  preferences?: {
    priceSensitivity?: 'free' | 'low' | 'medium' | 'high';
    experienceTypes?: string[];
    accessibilityNeeds?: string[];
  };
  behavioral?: {
    likesCount?: number;
    saveCount?: number;
    attendanceRate?: number;
    lastActiveAt?: string;
    claimedPerks?: number;
  };
  followersCount?: number;
  followingCount?: number;
  connectionsCount?: number;
  eventsAttended?: number;
  likesCount?: number;
  createdAt: string;
  updatedAt?: string;
  website?: string;
  phone?: string;
  membership?: Membership;
  role?: UserRole;
  privacySettings?: PrivacySettings;
  /** Server-set when user completes their first paid CulturePass+ subscription checkout (intro pricing consumed). */
  premiumIntroDiscountUsedAt?: string;
  /** Admin-granted: may publish CultureShop Daily Deals (organiser tier + flag). */
  approvedMarketplacePublisher?: boolean;
}

export interface RecommendationProfile {
  userId: string;
  culturalTagWeights: Record<string, number>;
  eventTypeWeights: Record<string, number>;
  updatedAt: string;
}

export type RewardsTier = 'standard' | 'silver' | 'gold' | 'diamond';

export interface RewardsAccount {
  userId: string;
  points: number;
  tier: RewardsTier;
  lifetimePoints: number;
  updatedAt: string;
}

export interface PrivacySettings {
  /** Whether the user's profile is visible to others */
  profileVisible?: boolean;
  /** Alias used by some screens */
  profileVisibility?: boolean;
  activityVisible?: boolean;
  /** Alias used by some screens */
  activityStatus?: boolean;
  locationVisible?: boolean;
  /** Alias used by some screens */
  showLocation?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingEmails?: boolean;
  /** Weekly cultural digest email (Monday 9 AM Sydney time). Defaults to true. */
  weeklyDigestEmail?: boolean;
  showInDirectory?: boolean;
  /** Whether data is shared with partners */
  dataSharing?: boolean;
  /** Browse other profiles without revealing identity (LinkedIn style) */
  privateViewingMode?: boolean;
  [key: string]: boolean | undefined;
}

export interface MembershipSummary {
  tier: string;
  tierLabel: string;
  status: 'active' | 'inactive';
  expiresAt: string | null;
  cashbackRate: number;
  cashbackMultiplier: number;
  earlyAccessHours: number;
  eventsAttended: number;
}
