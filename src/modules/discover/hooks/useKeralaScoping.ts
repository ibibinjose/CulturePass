import { EventData, Community } from '@/shared/schema';
import { useDiscoverData } from './useDiscoverData';

export function useKeralaScoping(keralaDomain: boolean, data: ReturnType<typeof useDiscoverData>) {
  const isKeralaEvent = (event: EventData) => {
    const haystack = [
      event.title,
      event.description,
      event.category,
      event.city,
      ...(event.tags ?? []),
      ...(event.cultureTag ?? []),
      ...(event.cultureTags ?? []),
      ...(event.languageTags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const isKeralaCommunity = (community: Community) => {
    const c = community as Community & {
      cultureTags?: string[];
      cultureIds?: string[];
      languageIds?: string[];
      languages?: string[];
      description?: string;
    };
    const haystack = [
      c.name,
      c.description,
      ...(c.cultureTags ?? []),
      ...(c.cultureIds ?? []),
      ...(c.languageIds ?? []),
      ...(c.languages ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return /kerala|malayali|malayalee|malayalam/.test(haystack);
  };

  const scope = <T extends EventData | string>(arr: T[]): T[] =>
    keralaDomain ? arr.filter((i) => typeof i === 'string' || isKeralaEvent(i as EventData)) : arr;

  return {
    featured: keralaDomain ? data.featuredEvents.filter(isKeralaEvent) : data.featuredEvents,
    soon: scope(data.startingSoonRailData),
    nearby: scope(data.nearbyRailData),
    popular: scope(data.popularRailData),
    forYou: keralaDomain ? data.forYouEvents.filter(isKeralaEvent) : data.forYouEvents,
    communities: keralaDomain ? data.allCommunities.filter(isKeralaCommunity) : data.allCommunities,
  };
}
