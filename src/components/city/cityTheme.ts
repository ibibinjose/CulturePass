import { Ionicons } from '@expo/vector-icons';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import type { ExploreCategoryKey, ListingTypeKey } from '@/hooks/useCityPage';

export const CITY_HERO_OVERLAY: [string, string, string] = [
  'rgba(227,106,78,0.18)',
  'rgba(0,0,0,0.05)',
  'rgba(12,10,9,0.92)',
];

export const CITY_STAT_COLORS = {
  events: Luxe.colors.appBlue,
  hubs: Luxe.colors.indigo,
  cultures: Luxe.colors.emerald,
  cultureX: Luxe.colors.gold,
} as const;

export const EXPLORE_CATEGORY_ACCENT: Record<ExploreCategoryKey, string> = {
  events: Luxe.colors.appBlue,
  movies: Luxe.colors.indigo,
  dining: Luxe.colors.appBlue,
  activities: Luxe.colors.emerald,
  shopping: Luxe.colors.gold,
  offers: Luxe.colors.saffron,
  artists: Luxe.colors.plum,
  directory: Luxe.colors.indigo,
  indigenous: Luxe.colors.emerald,
};

export const LISTING_TYPE_META: Record<
  ListingTypeKey,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  event: { icon: 'calendar-outline', color: Luxe.colors.appBlue },
  festival: { icon: 'sparkles-outline', color: Luxe.colors.gold },
  concert: { icon: 'musical-notes-outline', color: Luxe.colors.plum },
  workshop: { icon: 'school-outline', color: Luxe.colors.indigo },
  movie: { icon: 'film-outline', color: Luxe.colors.indigo },
  dining: { icon: 'restaurant-outline', color: Luxe.colors.appBlue },
  shopping: { icon: 'bag-handle-outline', color: Luxe.colors.gold },
  activity: { icon: 'compass-outline', color: Luxe.colors.emerald },
  professional: { icon: 'briefcase-outline', color: Luxe.colors.indigo },
  organisation: { icon: 'people-outline', color: Luxe.colors.emerald },
  business: { icon: 'storefront-outline', color: Luxe.colors.saffron },
  artist: { icon: 'color-palette-outline', color: Luxe.colors.plum },
  perk: { icon: 'pricetag-outline', color: Luxe.colors.gold },
};