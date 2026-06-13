import { Platform } from 'react-native';
import type { Community } from '@/shared/schema';
import { getCommunityMemberCount } from '@/lib/community';

export type CommunityHubSegment = 'discover' | 'joined' | 'following' | 'saved';
export type CommunitySortMode = 'activity' | 'size' | 'name';
export type CommunityLocationFilter = 'near-you' | 'all';

export type CommunityCategoryFilter =
  | 'all'
  | 'cultural'
  | 'local_community'
  | 'business'
  | 'club'
  | 'council'
  | 'charity'
  | 'arts_sports_club';

export const COMMUNITY_CATEGORY_CHIPS: readonly {
  id: CommunityCategoryFilter;
  label: string;
  icon: string;
}[] = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'cultural', label: 'Cultural', icon: 'color-palette-outline' },
  { id: 'local_community', label: 'Local', icon: 'home-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'club', label: 'Clubs', icon: 'people-outline' },
  { id: 'arts_sports_club', label: 'Arts & sport', icon: 'trophy-outline' },
  { id: 'council', label: 'Civic', icon: 'business-outline' },
  { id: 'charity', label: 'Charity', icon: 'heart-outline' },
];

export const COMMUNITY_SEGMENT_OPTIONS: readonly { id: CommunityHubSegment; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: 'compass-outline' },
  { id: 'joined', label: 'My hubs', icon: 'people-outline' },
  { id: 'following', label: 'Following', icon: 'bookmark-outline' },
  { id: 'saved', label: 'Saved', icon: 'heart-outline' },
];

function normCity(v: string | undefined) {
  return (v ?? '').trim().toLowerCase();
}

function communityCategoryKey(c: Community): string {
  return String(c.communityCategory ?? c.category ?? '').toLowerCase();
}

export function filterHubCommunities(
  communities: Community[],
  opts: {
    segment: CommunityHubSegment;
    category: CommunityCategoryFilter;
    location: CommunityLocationFilter;
    userCity: string;
    joinedIds: Set<string>;
    followingIds: Set<string>;
    savedIds: string[];
    sort: CommunitySortMode;
  },
): Community[] {
  const { segment, category, location, userCity, joinedIds, followingIds, savedIds, sort } = opts;
  const city = normCity(userCity);
  const savedSet = new Set(savedIds);

  let result = [...communities];

  if (segment === 'joined') {
    result = result.filter((c) => joinedIds.has(c.id));
  } else if (segment === 'following') {
    result = result.filter((c) => followingIds.has(c.id) && !joinedIds.has(c.id));
  } else if (segment === 'saved') {
    result = result.filter((c) => savedSet.has(c.id));
  }

  if (category !== 'all') {
    result = result.filter((c) => communityCategoryKey(c) === category || communityCategoryKey(c).includes(category));
  }

  if (location === 'near-you') {
    result = result.filter((c) => {
      const hubCity = normCity(c.city);
      // Nationwide / online hubs without a city are visible in every metro filter.
      if (!hubCity) return true;
      return (
        hubCity === city ||
        (c.chapterCities ?? []).some((ch) => normCity(ch) === city)
      );
    });
  }

  if (sort === 'size') {
    result.sort((a, b) => getCommunityMemberCount(b) - getCommunityMemberCount(a));
  } else if (sort === 'name') {
    result.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' }));
  } else {
    const levelOrder: Record<string, number> = { thriving: 4, active: 3, steady: 2, new: 1 };
    result.sort((a, b) => {
      const aLevel = levelOrder[String(a.activityLevel ?? 'new')] || 0;
      const bLevel = levelOrder[String(b.activityLevel ?? 'new')] || 0;
      return bLevel - aLevel || getCommunityMemberCount(b) - getCommunityMemberCount(a);
    });
  }

  return result;
}

export function communityHubScrollBottom(tabBarHeight: number, safeBottom: number): number {
  return tabBarHeight + safeBottom + 88;
}

export function communityHubHeroHeight(isDesktop: boolean, isExpanded: boolean): number {
  if (isDesktop) return 300;
  if (isExpanded) return 280;
  return Platform.OS === 'web' ? 260 : 240;
}