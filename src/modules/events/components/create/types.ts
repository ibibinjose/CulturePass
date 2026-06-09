import { EntryType, SponsorTier } from '@/shared/schema';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_CATEGORIES, EventCategory } from '@/constants/eventCategories';

// ---------------------------------------------------------------------------
// Draft interfaces (local form state — not the final API payload)
// ---------------------------------------------------------------------------
export interface ArtistDraft { name: string; role: string; profileId?: string; imageUrl?: string }
export interface SponsorDraft { name: string; tier: SponsorTier; websiteUrl?: string; logoUrl?: string }
export interface HostDraft { name: string; contactEmail: string; contactPhone: string; websiteUrl?: string }
export interface TierDraft { name: string; priceCents: string; capacity: string }

export interface FormData {
  title: string;
  description: string;
  eventType: EventCategory | 'other' | '';
  visibility: 'public' | 'private' | 'approval_required';
  vibe: '' | 'chill' | 'party' | 'formal' | 'family' | 'spiritual' | 'networking';
  audience: '' | 'students' | 'professionals' | 'families' | 'tourists' | 'mixed';
  heroImageUrl: string;
  /** Directory profile shown as canonical publisher (optional). */
  publisherProfileId: string;
  /** Cached label for review UI */
  publisherLabel: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  locationType: 'physical' | 'virtual' | 'hybrid';
  meetingLink: string;
  timezone: string;
  /** Link to a venue-style profile (optional; one-off address when unset). */
  venueProfileId: string;
  venueProfileLabel: string;
  useLinkedVenue: boolean;
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  entryType: EntryType;
  waitlistEnabled: boolean;
  requireApproval: boolean;
  guestListVisibility: 'public' | 'attendees_only' | 'host_only';
  sendReminders: boolean;
  reminderOffsetsMinutes: number[];
  reminderAutomationEnabled: boolean;
  maxTicketsPerOrder: string;
  registrationFields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
  };
  customQuestions: string[];
  isFree: boolean;
  priceCents: string;
  capacity: string;
  tiers: TierDraft[];
  artists: ArtistDraft[];
  sponsors: SponsorDraft[];
  hostInfo: HostDraft;
  cultureTagIds: string[];
  languageTagIds: string[];
  nationalityId: string;
  indigenousTags: string[];
  isIndigenousOwned: boolean;
  accessibilityIds: string[];
  /** Adds server tag `CultureToday` for the global calendar */
  cultureTodayPromo: boolean;
  /** Surfaces event to CultureX “Culture Explores” discovery (cultureTag sentinel). */
  cultureXInvite: boolean;
  /** Council ID (firestore id) */
  councilId?: string;
  /** LGA Code (e.g. 17200 for Sydney) */
  lgaCode?: string;
}

export const defaultForm: FormData = {
  title: '',
  description: '',
  eventType: '',
  visibility: 'public',
  vibe: '',
  audience: '',
  heroImageUrl: '',
  publisherProfileId: '',
  publisherLabel: '',
  venue: '',
  address: '',
  city: '',
  country: 'Australia',
  locationType: 'physical',
  meetingLink: '',
  timezone: 'Australia/Sydney',
  venueProfileId: '',
  venueProfileLabel: '',
  useLinkedVenue: false,
  date: '',
  endDate: '',
  time: '',
  endTime: '',
  entryType: 'free_open',
  waitlistEnabled: false,
  requireApproval: false,
  guestListVisibility: 'host_only',
  sendReminders: true,
  reminderOffsetsMinutes: [1440, 120],
  reminderAutomationEnabled: true,
  maxTicketsPerOrder: '',
  registrationFields: {
    name: true,
    email: true,
    phone: false,
    company: false,
  },
  customQuestions: [],
  isFree: true,
  priceCents: '',
  capacity: '',
  tiers: [{ name: 'General Admission', priceCents: '', capacity: '' }],
  artists: [],
  sponsors: [],
  hostInfo: { name: '', contactEmail: '', contactPhone: '', websiteUrl: '' },
  cultureTagIds: [],
  languageTagIds: [],
  nationalityId: '',
  indigenousTags: [],
  isIndigenousOwned: false,
  accessibilityIds: [],
  cultureTodayPromo: false,
  cultureXInvite: false,
};

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
export type Step = 'basics' | 'publishing' | 'image' | 'location' | 'datetime' | 'entry' | 'tickets' | 'team' | 'culture' | 'review';

export const ALL_STEPS: Step[] = ['publishing', 'basics', 'image', 'location', 'datetime', 'entry', 'tickets', 'team', 'culture', 'review'];

export const STEP_TITLES: Record<Step, string> = {
  basics:   'Event Details',
  publishing: 'Publishing as',
  image:    'Event Image',
  location: 'Where is it?',
  datetime: 'When is it?',
  entry:    'Entry Type',
  tickets:  'Ticketing',
  team:     'Core Team',
  culture:  'Cultural Tags',
  review:   'Review & Publish',
};

export const STEP_ICONS: Record<Step, keyof typeof Ionicons.glyphMap> = {
  basics:   'create-outline',
  publishing: 'business-outline',
  image:    'image-outline',
  location: 'location-outline',
  datetime: 'calendar-outline',
  entry:    'ticket-outline',
  tickets:  'cash-outline',
  team:     'people-outline',
  culture:  'globe-outline',
  review:   'checkmark-circle-outline',
};

export function getStepSub(step: Step): string {
  switch (step) {
    case 'basics':   return 'Name and describe your event';
    case 'publishing': return 'Choose the profile that appears as the organiser';
    case 'image':    return 'Add a hero image for your event';
    case 'location': return "Tell us where it's happening";
    case 'datetime': return 'Set the date and start time';
    case 'entry':    return 'Ticketed or free open entry?';
    case 'tickets':  return 'Configure pricing and capacity';
    case 'team':     return 'Artists, sponsors, and host info';
    case 'culture':  return 'Add cultural and language tags';
    case 'review':   return 'Check everything before publishing';
    default:         return '';
  }
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
export const EVENT_TYPES: { id: EventCategory | 'other'; label: string; emoji: string }[] = [
  ...EVENT_CATEGORIES.map(c => ({ id: c.id, label: c.id, emoji: c.emoji })),
  { id: 'other', label: 'Other', emoji: '✨' },
];

export const EVENT_TYPE_GROUPS: {
  id: string;
  label: string;
  types: (EventCategory | 'other')[];
}[] = [
  {
    id: 'arts-entertainment',
    label: 'Arts & Entertainment',
    types: ['Music', 'Festival', 'Exhibitions', 'Theatre, Dance & Film', 'Nightlife'],
  },
  {
    id: 'learning-community',
    label: 'Learning & Community',
    types: ['Talks, Courses & Workshops', 'Community & Causes'],
  },
  {
    id: 'lifestyle-local',
    label: 'Lifestyle & Local',
    types: [
      'Food & Drink',
      'Sport & Fitness',
      'Kids & Youth',
      'Family',
      'Shopping, Markets & Fairs',
      'Tours & Experiences',
      'other',
    ],
  },
];

export const VIBE_OPTIONS: { id: FormData['vibe']; label: string; emoji: string }[] = [
  { id: 'chill', label: 'Chill', emoji: '🫶' },
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'formal', label: 'Formal', emoji: '🕴️' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { id: 'spiritual', label: 'Spiritual', emoji: '🪔' },
  { id: 'networking', label: 'Networking', emoji: '🤝' },
];

export const AUDIENCE_OPTIONS: { id: FormData['audience']; label: string; emoji: string }[] = [
  { id: 'students', label: 'Students', emoji: '🎓' },
  { id: 'professionals', label: 'Professionals', emoji: '💼' },
  { id: 'families', label: 'Families', emoji: '👨‍👩‍👧' },
  { id: 'tourists', label: 'Tourists', emoji: '🧳' },
  { id: 'mixed', label: 'Mixed audience', emoji: '🌍' },
];

export const SPONSOR_TIERS: { id: SponsorTier; label: string; color: string }[] = [
  { id: 'title',  label: 'Title Sponsor', color: '#00ADEF' },
  { id: 'gold',   label: 'Gold',          color: '#FF8C42' },
  { id: 'silver', label: 'Silver',        color: '#9CA3AF' },
  { id: 'bronze', label: 'Bronze',        color: '#B45309' },
];

export const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: 'body' },
  { id: 'hearing', label: 'Hearing Loop', icon: 'ear' },
  { id: 'sign', label: 'Sign Language', icon: 'hand-left' },
  { id: 'quiet', label: 'Quiet Zones', icon: 'volume-mute' },
  { id: 'visual', label: 'Braille/Audio', icon: 'eye' },
];
