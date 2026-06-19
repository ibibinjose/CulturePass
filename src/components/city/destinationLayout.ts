import { Platform } from 'react-native';
import type { ExploreCategoryKey, ListingTypeKey } from '@/hooks/useCityPage';

/** Shared subtitle for Browse by type sections. */
export function destinationBrowseSubtitle(contextName?: string): string {
  if (contextName?.trim()) {
    return `Explore ${contextName.trim()} listings across different categories.`;
  }
  return 'Explore listings across different categories.';
}

/** Deep-link target for a listing-type tile on city / culture hub pages. */
export function buildDestinationListingHref(listingType: ListingTypeKey, queryLabel: string): string {
  const label = queryLabel.trim();
  const routes: Record<ListingTypeKey, string> = {
    event: '/events',
    festival: `/search?q=${encodeURIComponent(`${label} festival`)}`,
    concert: `/search?q=${encodeURIComponent(`${label} concert`)}`,
    workshop: `/search?q=${encodeURIComponent(`${label} workshop`)}`,
    movie: '/movies',
    dining: '/restaurants',
    shopping: '/shopping',
    activity: '/a',
    professional: `/search?q=${encodeURIComponent(`${label} professional`)}`,
    organisation: `/search?q=${encodeURIComponent(`${label} organisation`)}`,
    business: '/directory',
    artist: `/search?q=${encodeURIComponent(`${label} artist`)}`,
    perk: '/perks',
  };
  const route = routes[listingType];
  if (route.includes('?q=')) return route;
  const hubQuery = encodeURIComponent(label);
  const suffix = route.includes('?') ? '&' : '?';
  return `${route}${suffix}q=${hubQuery}`;
}

const includesAny = (blob: string, needles: string[]) => needles.some((n) => blob.includes(n));

/** Match a lowercased haystack against an explore category chip. */
export function matchesExploreBlob(blob: string, category: ExploreCategoryKey): boolean {
  switch (category) {
    case 'events':
    case 'directory':
      return true;
    case 'movies':
      return includesAny(blob, ['movie', 'film', 'cinema', 'screening']);
    case 'dining':
      return includesAny(blob, ['dining', 'restaurant', 'cafe', 'café', 'food']);
    case 'activities':
      return includesAny(blob, ['activity', 'tour', 'experience', 'workshop', 'class', 'sport', 'outdoor']);
    case 'shopping':
      return includesAny(blob, ['shop', 'shopping', 'retail', 'store', 'boutique']);
    case 'offers':
      return includesAny(blob, ['offer', 'deal', 'discount', 'free', 'perk']);
    case 'indigenous':
      return includesAny(blob, ['indigenous', 'aboriginal', 'first nations', 'torres strait']);
    case 'artists':
      return includesAny(blob, ['artist', 'music', 'dance', 'creative', 'performance', 'concert', 'performer']);
    default:
      return true;
  }
}

export function filterEventsByExploreCategory<
  T extends {
    category?: string | null;
    tags?: string[] | null;
    cultureTag?: string[] | null;
    cultureTags?: string[] | null;
  },
>(events: T[], category: ExploreCategoryKey): T[] {
  if (category === 'events') return events;
  return events.filter((e) => {
    const blob = `${e.category ?? ''} ${(e.tags ?? []).join(' ')} ${(e.cultureTag ?? []).join(' ')} ${(e.cultureTags ?? []).join(' ')}`.toLowerCase();
    return matchesExploreBlob(blob, category);
  });
}

export function filterVenuesByExploreCategory<
  T extends { category?: string | null; name?: string | null },
>(venues: T[], category: ExploreCategoryKey): T[] {
  if (category === 'events' || category === 'movies' || category === 'activities' || category === 'offers' || category === 'indigenous') {
    return [];
  }
  return venues.filter((v) => {
    const blob = `${v.category ?? ''} ${v.name ?? ''}`.toLowerCase();
    return matchesExploreBlob(blob, category);
  });
}

export function isVenuePrimaryExploreCategory(category: ExploreCategoryKey): boolean {
  return category === 'dining' || category === 'shopping' || category === 'directory';
}

/** Shared explore category chips — city tab, city hub, culture hub. */
export const DESTINATION_EXPLORE_LINKS: readonly {
  key: ExploreCategoryKey;
  label: string;
  icon: 'calendar-outline' | 'film-outline' | 'restaurant-outline' | 'compass-outline' | 'bag-handle-outline' | 'pricetag-outline' | 'color-palette-outline' | 'grid-outline' | 'leaf-outline';
}[] = [
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'movies', label: 'Movies', icon: 'film-outline' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline' },
  { key: 'activities', label: 'Activities', icon: 'compass-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { key: 'offers', label: 'Offers', icon: 'pricetag-outline' },
  { key: 'artists', label: 'Artists', icon: 'color-palette-outline' },
  { key: 'directory', label: 'Directory', icon: 'grid-outline' },
  { key: 'indigenous', label: 'Indigenous', icon: 'leaf-outline' },
];

export const DESTINATION_HERO_GRADIENT: [string, string, string] = [
  'rgba(0,0,0,0.72)',
  'rgba(0,0,0,0.14)',
  'rgba(0,0,0,0.94)',
];

export function destinationHeroHeight(opts: {
  isExpanded?: boolean;
  isDesktop?: boolean;
  variant?: 'tab' | 'hub';
}): number {
  const { isExpanded = false, isDesktop = false, variant = 'hub' } = opts;
  if (variant === 'tab') {
    if (isDesktop) return 380;
    if (isExpanded) return 340;
    return Platform.OS === 'web' ? 320 : 300;
  }
  if (isDesktop) return 440;
  if (isExpanded) return 400;
  return Platform.OS === 'web' ? 380 : 360;
}

export function destinationFabBottom(tabBarHeight: number, safeBottom: number): number {
  return tabBarHeight + safeBottom + (Platform.OS === 'web' ? 20 : 16);
}

export function destinationScrollBottom(tabBarHeight: number, safeBottom: number): number {
  return tabBarHeight + safeBottom + 88;
}

/** Bottom spacer for hub routes (no tab bar). */
export function destinationHubScrollBottom(safeBottom: number): number {
  return safeBottom + 96;
}