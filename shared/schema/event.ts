export type EventType =
  | 'festival'
  | 'concert'
  | 'workshop'
  | 'puja'
  | 'sports'
  | 'food'
  | 'cultural'
  | 'community'
  | 'exhibition'
  | 'conference'
  | 'networking'
  | 'nightlife'
  | 'family'
  | 'film'
  | 'theatre'
  | 'comedy'
  | 'dance'
  | 'wellness'
  | 'market'
  | 'tour'
  | 'charity'
  | 'religious'
  | 'other';

export type AgeSuitability = 'all' | 'family' | '18+' | '21+';

export type PriceTier = 'free' | 'budget' | 'mid' | 'premium';

/** Whether the event requires tickets or is free/open entry */
export type EntryType = 'ticketed' | 'free_open';

export interface EventArtist {
  profileId?: string;
  name: string;
  role?: string;
  imageUrl?: string;
}

export type SponsorTier = 'title' | 'gold' | 'silver' | 'bronze';

export interface EventSponsor {
  profileId?: string;
  name: string;
  tier: SponsorTier;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface EventHostInfo {
  profileId?: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
}

export interface EventData {
  id: string;
  /** Optional public slug for /e/... URLs (fallback to id). */
  slug?: string;
  /** ABS LGA code — used for proximity matching */
  lgaCode?: string;
  /** Firestore document ID from councils collection */
  councilId?: string;
  culturePassId?: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  address?: string;
  priceCents?: number;
  priceLabel?: string;
  category?: string;
  communityId?: string;
  organizerId?: string;
  /**
   * Canonical public profile that publishes this event (directory “page”).
   * When set, discovery/dashboards should prefer this over organizerId-only resolution.
   * See docs/PROFILE_PUBLISHING_AND_MARKETPLACE_GAPS.md
   */
  publisherProfileId?: string;
  /**
   * Optional link to profiles/{id} where entityType is venue (or approved venue-like profile).
   * Inline venue/address fields remain the fallback for one-off locations.
   */
  venueProfileId?: string;
  createdBy?: string;
  imageColor?: string;
  imageUrl?: string;
  thumbhash?: string;
  capacity?: number;
  attending?: number;
  isFeatured?: boolean;
  isFree?: boolean;
  tiers?: { name: string; priceCents: number; available: number }[];
  country: string;
  state?: string;
  city: string;
  council?: string;
  councilTag?: string;
  suburb?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  indigenousTags?: string[];
  /** ISO nationality taxonomy id (e.g. indian) for flag display */
  nationalityId?: string;
  isIndigenousOwned?: boolean;
  languageTags?: string[];
  cultureTag?: string[];
  cultureTags?: string[];
  geoHash?: string;
  eventType?: EventType;
  visibility?: 'public' | 'private' | 'approval_required';
  vibe?: string;
  audience?: string;
  ageSuitability?: AgeSuitability;
  priceTier?: PriceTier;
  organizerReputationScore?: number;
  culturalRelevanceScore?: number;
  popularityScore?: number;
  accessibility?: string[];
  ticketsSold?: number;
  externalTicketUrl?: string | null;
  externalUrl?: string | null;
  ticketClickCount?: number;
  rsvpGoing?: number;
  rsvpMaybe?: number;
  rsvpNotGoing?: number;
  /** The user's own RSVP status — populated on GET /events/:id when authenticated */
  myRsvp?: 'going' | 'maybe' | 'not_going' | null;
  status?: 'draft' | 'published' | 'cancelled';
  publishedAt?: string;
  deletedAt?: string | null;
  distanceKm?: number;
  createdAt?: string;
  updatedAt?: string;
  // Enhanced event creation fields
  entryType?: EntryType;
  locationType?: 'physical' | 'virtual' | 'hybrid';
  meetingLink?: string | null;
  timezone?: string;
  waitlistEnabled?: boolean;
  requireApproval?: boolean;
  guestListVisibility?: 'public' | 'attendees_only' | 'host_only';
  sendReminders?: boolean;
  reminderAutomationEnabled?: boolean;
  reminderOffsetsMinutes?: number[];
  registrationFields?: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
  };
  maxTicketsPerOrder?: number;
  customQuestions?: string[];
  endDate?: string;
  endTime?: string;
  heroImageUrl?: string;
  artists?: EventArtist[];
  eventSponsors?: EventSponsor[];
  hostInfo?: EventHostInfo | null;
  hostName?: string;
  hostEmail?: string;
  hostPhone?: string;
  sponsors?: string | null;
  /** Provider-specific fields (e.g. Eventik categories/types, sync timestamps). */
  metadata?: Record<string, unknown>;
  sourceSystem?: string;
}

export interface DiscoveryResult {
  event: EventData;
  matchScore: number;
  matchReason: string[];
}

export interface PaginatedEventsResponse {
  events: EventData[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
