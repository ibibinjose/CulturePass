export interface ActivityData {
  id: string;
  name: string;
  description: string;
  category: string;
  duration?: string;
  ageGroup?: string;
  city: string;
  state?: string;
  postcode?: number;
  latitude?: number;
  longitude?: number;
  country: string;
  location?: string;
  imageUrl?: string;
  priceLabel?: string;
  rating?: number;
  reviewsCount?: number;
  highlights?: string[];
  ownerId: string;
  ownerType?: 'business' | 'venue' | 'organizer';
  businessProfileId?: string;
  status?: 'draft' | 'published' | 'archived';
  isPromoted?: boolean;
  isPopular?: boolean;
  culturePassId?: string;
  createdAt?: string;
  updatedAt?: string;

  // ── Classes & Fitness specific (populated from HostSpace Activity form) ──
  /** Human-readable recurrence e.g. "Weekly", "Every Tuesday", "One-time" */
  recurrence?: string;
  /** Skill level for classes: Beginner | Intermediate | Advanced | All Levels */
  difficulty?: string;
  /** Instructor / lead name for the class or session */
  instructorName?: string;
  /** Combined schedule text shown to users, e.g. "Tue 18:30 · 60 min" */
  scheduleText?: string;
  /** Max participants (string or number from form) */
  maxParticipants?: string | number;
  /** Location type for the offering */
  locationType?: 'In-person' | 'Online' | 'Hybrid';
  /** Primary culture / community the class is rooted in */
  primaryCulture?: string;
  /** Visibility setting from creator */
  visibility?: 'Public' | 'Community-only' | 'Invite-only';
}

export type ActivityInput = Omit<ActivityData, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
