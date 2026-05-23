/**
 * Canonical CulturePass event category list.
 * Used by the filter UI and the import normalizer.
 */

export type EventCategory =
  | 'Kids & Youth'
  | 'Family'
  | 'Community & Causes'
  | 'Exhibitions'
  | 'Festival'
  | 'Food & Drink'
  | 'Music'
  | 'Nightlife'
  | 'Shopping, Markets & Fairs'
  | 'Sport & Fitness'
  | 'Talks, Courses & Workshops'
  | 'Theatre, Dance & Film'
  | 'Tours & Experiences';

/** Pre-split canonical label — still on Firestore for older rows; filters expand to Kids + Family */
export const LEGACY_CHILDREN_FAMILY_CATEGORY = 'Children & Family' as const;

export const EVENT_CATEGORIES: { id: EventCategory; icon: string; emoji: string }[] = [
  { id: 'Kids & Youth',               icon: 'play-circle-outline',   emoji: '🧸' },
  { id: 'Family',                     icon: 'people-outline',        emoji: '👨‍👩‍👧‍👦' },
  { id: 'Community & Causes',         icon: 'heart-circle-outline',  emoji: '🤝' },
  { id: 'Exhibitions',                icon: 'images-outline',        emoji: '🖼️' },
  { id: 'Festival',                   icon: 'sparkles-outline',      emoji: '🎉' },
  { id: 'Food & Drink',               icon: 'restaurant-outline',    emoji: '🍽️' },
  { id: 'Music',                      icon: 'musical-notes-outline', emoji: '🎵' },
  { id: 'Nightlife',                  icon: 'moon-outline',          emoji: '🌃' },
  { id: 'Shopping, Markets & Fairs',  icon: 'storefront-outline',    emoji: '🛒' },
  { id: 'Sport & Fitness',            icon: 'barbell-outline',       emoji: '🏃' },
  { id: 'Talks, Courses & Workshops', icon: 'easel-outline',         emoji: '📚' },
  { id: 'Theatre, Dance & Film',      icon: 'film-outline',          emoji: '🎭' },
  { id: 'Tours & Experiences',        icon: 'map-outline',           emoji: '🧭' },
];

/**
 * Maps common external category strings (from scraped sources) to our canonical categories.
 * Case-insensitive matching is applied at usage time.
 * More specific matches should come before general ones.
 */
export const CATEGORY_MAP: Record<string, EventCategory> = {
  // ==================== Kids & Youth / Family ====================
  'kids': 'Kids & Youth',
  'kid': 'Kids & Youth',
  'children': 'Kids & Youth',
  'child': 'Kids & Youth',
  'youth': 'Kids & Youth',
  'school holidays': 'Kids & Youth',
  'playgroup': 'Kids & Youth',
  'teen': 'Kids & Youth',
  'teens': 'Kids & Youth',

  'family': 'Family',
  'families': 'Family',
  'children and family': 'Family',
  'children & family': 'Family',
  'child and family': 'Family',
  'multigenerational': 'Family',
  'all ages': 'Family',
  'family friendly': 'Family',

  // ==================== Community & Causes ====================
  'community': 'Community & Causes',
  'community & causes': 'Community & Causes',
  'community and causes': 'Community & Causes',
  'cultural': 'Community & Causes',
  'charity': 'Community & Causes',
  'causes': 'Community & Causes',
  'civil': 'Community & Causes',
  'social': 'Community & Causes',
  'volunteer': 'Community & Causes',
  'fundraiser': 'Community & Causes',
  'awareness': 'Community & Causes',

  // ==================== Exhibitions ====================
  'exhibitions': 'Exhibitions',
  'exhibition': 'Exhibitions',
  'gallery': 'Exhibitions',
  'art': 'Exhibitions',
  'arts': 'Exhibitions',
  'arts and culture': 'Exhibitions',
  'arts & culture': 'Exhibitions',
  'fine art': 'Exhibitions',
  'museum': 'Exhibitions',
  'display': 'Exhibitions',

  // ==================== Festival ====================
  'festival': 'Festival',
  'festivals': 'Festival',
  'heritage': 'Festival',
  'carnival': 'Festival',
  'fiesta': 'Festival',
  'mela': 'Festival',
  'celebration': 'Festival',
  'parade': 'Festival',
  'street festival': 'Festival',
  'cultural festival': 'Festival',

  // ==================== Food & Drink ====================
  'food': 'Food & Drink',
  'food and drink': 'Food & Drink',
  'food & drink': 'Food & Drink',
  'dining': 'Food & Drink',
  'restaurant': 'Food & Drink',
  'wine': 'Food & Drink',
  'beer': 'Food & Drink',
  'brewery': 'Food & Drink',
  'tasting': 'Food & Drink',
  'market food': 'Food & Drink',
  'gastronomy': 'Food & Drink',

  // ==================== Music ====================
  'music': 'Music',
  'concert': 'Music',
  'live music': 'Music',
  'gig': 'Music',
  'band': 'Music',
  'orchestra': 'Music',
  'dj': 'Music',
  'performance': 'Music', // will be overridden by more specific matches below if needed

  // ==================== Nightlife ====================
  'nightlife': 'Nightlife',
  'club': 'Nightlife',
  'clubs': 'Nightlife',
  'party': 'Nightlife',
  'bar': 'Nightlife',
  'pub': 'Nightlife',
  'after dark': 'Nightlife',
  'late night': 'Nightlife',

  // ==================== Shopping, Markets & Fairs ====================
  'shopping': 'Shopping, Markets & Fairs',
  'market': 'Shopping, Markets & Fairs',
  'markets': 'Shopping, Markets & Fairs',
  'fair': 'Shopping, Markets & Fairs',
  'fairs': 'Shopping, Markets & Fairs',
  'bazaar': 'Shopping, Markets & Fairs',
  'expo': 'Shopping, Markets & Fairs',
  'trade show': 'Shopping, Markets & Fairs',

  // ==================== Sport & Fitness ====================
  'sport': 'Sport & Fitness',
  'sports': 'Sport & Fitness',
  'fitness': 'Sport & Fitness',
  'running': 'Sport & Fitness',
  'marathon': 'Sport & Fitness',
  'yoga': 'Sport & Fitness',
  'workout': 'Sport & Fitness',
  'game': 'Sport & Fitness',
  'match': 'Sport & Fitness',

  // ==================== Talks, Courses & Workshops ====================
  'talk': 'Talks, Courses & Workshops',
  'talks': 'Talks, Courses & Workshops',
  'lecture': 'Talks, Courses & Workshops',
  'seminar': 'Talks, Courses & Workshops',
  'workshop': 'Talks, Courses & Workshops',
  'workshops': 'Talks, Courses & Workshops',
  'course': 'Talks, Courses & Workshops',
  'panel': 'Talks, Courses & Workshops',
  'conference': 'Talks, Courses & Workshops',
  'class': 'Talks, Courses & Workshops',

  // ==================== Theatre, Dance & Film ====================
  'theatre': 'Theatre, Dance & Film',
  'theater': 'Theatre, Dance & Film',
  'dance': 'Theatre, Dance & Film',
  'film': 'Theatre, Dance & Film',
  'cinema': 'Theatre, Dance & Film',
  'play': 'Theatre, Dance & Film',
  'musical': 'Theatre, Dance & Film',
  'ballet': 'Theatre, Dance & Film',
  'opera': 'Theatre, Dance & Film',
  'screening': 'Theatre, Dance & Film',

  // ==================== Tours & Experiences ====================
  'tour': 'Tours & Experiences',
  'tours': 'Tours & Experiences',
  'walking tour': 'Tours & Experiences',
  'guided tour': 'Tours & Experiences',
  'experience': 'Tours & Experiences',
  'adventure': 'Tours & Experiences',
  'hike': 'Tours & Experiences',
  'cruise': 'Tours & Experiences',
  'boat tour': 'Tours & Experiences',
};