import { CultureTokens } from '@/design-system/tokens/theme';

export type SubmitType =
  | 'event'
  | 'festival'
  | 'concert'
  | 'workshop'
  | 'movie'
  | 'restaurant'
  | 'shop'
  | 'activity'
  | 'professional'
  | 'organisation'
  | 'business'
  | 'artist'
  | 'perk';

export const TYPE_CONFIG: Record<SubmitType, { label: string; description: string; icon: string; color: string }> = {
  event: { label: 'Event', description: 'Timed happenings & community gatherings', icon: 'calendar', color: CultureTokens.gold },
  festival: { label: 'Festival', description: 'Multi-day festivals & celebrations', icon: 'color-filter', color: CultureTokens.gold },
  concert: { label: 'Concert / show', description: 'Live music, theatre & performances', icon: 'musical-notes', color: CultureTokens.coral },
  workshop: { label: 'Workshop / class', description: 'Classes, talks & skill sessions', icon: 'school', color: CultureTokens.teal },
  movie: { label: 'Movie', description: 'Cinema listings & screenings', icon: 'film', color: CultureTokens.movie },
  restaurant: { label: 'Dining', description: 'Restaurant & café listings', icon: 'restaurant', color: CultureTokens.teal },
  shop: { label: 'Shopping', description: 'Retail & boutique listings', icon: 'bag-handle', color: CultureTokens.indigo },
  activity: { label: 'Activity', description: 'Tours, experiences & cultural sites', icon: 'compass', color: CultureTokens.venue },
  professional: { label: 'Professional', description: 'Practice, artist & professional profile page', icon: 'briefcase', color: CultureTokens.indigo },
  organisation: { label: 'Organisation', description: 'Cultural groups & communities', icon: 'people', color: CultureTokens.teal },
  business: { label: 'Business', description: 'General business profile', icon: 'business', color: CultureTokens.indigo },
  artist: { label: 'Artist', description: 'Musicians, dancers & creatives', icon: 'color-palette', color: CultureTokens.coral },
  perk: { label: 'Perk', description: 'Discounts & member benefits', icon: 'gift', color: CultureTokens.gold },
};

export const EVENT_LIKE: SubmitType[] = ['event', 'festival', 'concert', 'workshop'];
export const PROFILE_TABS: SubmitType[] = ['organisation', 'professional', 'business'];
export const ORG_LISTING_TABS: SubmitType[] = ['organisation', 'professional', 'business'];
/** Default order in Creator Studio (role filtering applied in UI). */
export const TYPE_ORDER: SubmitType[] = [
  'event', 'festival', 'concert', 'workshop',
  'activity',
  'professional', 'organisation', 'business',
  'movie', 'restaurant', 'shop',
  'perk',
];

export function isEventLike(tab: SubmitType): boolean {
  return EVENT_LIKE.includes(tab);
}

export function normalizeSubmitType(type?: string, variant?: string): SubmitType {
  const t = (type || 'event').toLowerCase().trim();
  const v = (variant || '').toLowerCase().trim();
  if (t === 'artist') return 'professional';
  if (t === 'event') {
    if (v === 'festival') return 'festival';
    if (v === 'concert' || v === 'music') return 'concert';
    if (v === 'workshop' || v === 'class') return 'workshop';
    return 'event';
  }
  if ((t === 'organisation' || t === 'org') && v === 'professional') return 'professional';
  if (t === 'dining' || t === 'food') return 'restaurant';
  if (t === 'retail' || t === 'shopping' || t === 'store') return 'shop';
  if (t === 'cinema' || t === 'films') return 'movie';
  const allowed = Object.keys(TYPE_CONFIG) as SubmitType[];
  if (allowed.includes(t as SubmitType)) return t as SubmitType;
  return 'event';
}

export function resolveEventCategory(tab: SubmitType, formCategory: string): string {
  if (tab === 'festival') return formCategory || 'Festival';
  if (tab === 'concert') return formCategory || 'Music';
  if (tab === 'workshop') return formCategory || 'Workshop';
  return formCategory || 'Cultural';
}

export const EVENT_CATEGORIES   = ['Cultural', 'Music', 'Dance', 'Festival', 'Workshop', 'Religious', 'Food', 'Sports'];

/** Multi-select on event listings — maps to API `cultureTag` */
export const EVENT_CULTURE_TAGS = [
  'Australian', 'Indian', 'Chinese', 'Vietnamese', 'Greek', 'Italian', 'Middle Eastern', 'African', 'Pacific',
  'Indigenous', 'Multicultural', 'ANZAC', 'Beach Culture', 'Pub Culture', 'AFL & NRL', 'Cricket & Surfing',
  'Faith', 'Youth', 'LGBTQIA+', 'Seniors', 'Family',
] as const;
export const ORG_CATEGORIES     = ['Cultural', 'Religious', 'Community', 'Youth', 'Professional', 'Charity'];
export const PROFESSIONAL_CATEGORIES = [
  'Artist',
  'Accountant',
  'Lawyer',
  'Consultant',
  'Educator',
  'Creative Studio',
  'Producer',
  'Photographer',
  'Designer',
  'Wellness',
] as const;

/** Chip-selectable discovery tags for organisation/professional/business profiles */
export const ORG_DISCOVERY_TAGS = [
  // Culture & heritage
  'Australian', 'Indian', 'Chinese', 'Vietnamese', 'Filipino', 'Greek', 'Italian',
  'Middle Eastern', 'African', 'Pacific Islander', 'Indigenous', 'Multicultural',
  'Mateship', 'Fair Go', 'Cafe Culture', 'Beach Culture', 'Pub Culture', 'ANZAC', 'Dreamtime',
  'Korean', 'Arabic', 'Tamil', 'Persian', 'Nepali', 'Sri Lankan',
  // Activity type
  'Language Class', 'Dance', 'Music', 'Cultural Events', 'Festivals',
  'Art & Craft', 'Heritage', 'Film', 'Food', 'Sports',
  // Community focus
  'Youth', 'Women', 'Seniors', 'Family-Friendly', 'Faith',
  'LGBTQIA+', 'Volunteers', 'Newcomers & Migrants',
] as const;
export const BIZ_CATEGORIES     = ['Restaurant', 'Retail', 'Services', 'Beauty', 'Tech', 'Grocery'];
export const ARTIST_GENRES      = ['Music', 'Dance', 'Visual Arts', 'Theatre', 'Film', 'Literature'];
export const ACTIVITY_CATEGORIES = ['Tour', 'Workshop', 'Cultural Site', 'Outdoor', 'Family', 'Food & drink'];
export const SHOP_CATEGORIES    = ['Fashion', 'Gifts', 'Books', 'Grocery', 'Electronics', 'Home', 'Beauty'];
export const CUISINE_OPTIONS    = ['Asian', 'Middle Eastern', 'European', 'African', 'Latin', 'Fusion', 'Cafe', 'Seafood', 'Vegetarian', 'General'];
export const MOVIE_GENRES       = ['Drama', 'Comedy', 'Documentary', 'Horror', 'Family', 'Arthouse', 'World cinema'];
export const PRICE_RANGE_OPTS   = ['$', '$$', '$$$', '$$$$'] as const;
export const LISTING_PLACEHOLDER_IMG = 'https://placehold.co/1200x800/e8e8f0/4F46E5?text=CulturePass';
export const PERK_TYPES = [
  { key: 'discount_percent', label: '% Discount',  icon: 'pricetag-outline'    },
  { key: 'discount_fixed',   label: '$ Discount',  icon: 'cash-outline'        },
  { key: 'free_ticket',      label: 'Free Ticket', icon: 'ticket-outline'      },
  { key: 'early_access',     label: 'Early Access',icon: 'time-outline'        },
  { key: 'vip_upgrade',      label: 'VIP Upgrade', icon: 'star-outline'        },
  { key: 'cashback',         label: 'Cashback',    icon: 'refresh-circle-outline' },
];
export const PERK_CATEGORIES = ['tickets', 'events', 'dining', 'shopping', 'wallet'];

export const initialForm = {
  name: '', description: '', city: '', state: '', postcode: '', country: 'Australia',
  /** Comma-separated — sent as profile `tags` */
  profileTags: '',
  contactEmail: '', phone: '', website: '', category: '', abn: '',
  instagram: '', facebook: '', youtube: '', twitterX: '', linkedin: '', airpal: '',
  date: '', time: '', venue: '', address: '',
  price: '', capacity: '', externalTicketUrl: '', communityId: '',
  hostName: '', hostEmail: '', hostPhone: '', sponsors: '',
  perkType: '', discountValue: '', providerName: '', perkCategory: '',
  runtime: '', movieRating: 'M', director: '', language: 'English', priceRange: '$$',
};

export type FormState = typeof initialForm;
export type FieldErrors = Partial<Record<keyof FormState | 'perkType', string>>;
export type DerivedLocation = { city: string; state: string; country: string; postcode: number; latitude: number; longitude: number };

