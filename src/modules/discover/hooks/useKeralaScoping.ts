import { EventData, Community } from '@/shared/schema';
import { SPARSE_LIST_MIN } from '@/lib/locationFallback';
import { useDiscoverData } from './useDiscoverData';

function scopeWithSparseFallback<T>(
  items: T[],
  predicate: (item: T) => boolean,
  enabled: boolean,
): T[] {
  if (!enabled) return items;
  const scoped = items.filter(predicate);
  return scoped.length >= SPARSE_LIST_MIN ? scoped : items;
}

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

  const scopeEvents = <T extends EventData | string>(arr: T[]): T[] =>
    scopeWithSparseFallback(
      arr,
      (i) => typeof i === 'string' || isKeralaEvent(i as EventData),
      keralaDomain,
    );

  return {
    featured: scopeWithSparseFallback(data.featuredEvents, isKeralaEvent, keralaDomain),
    soon: scopeEvents(data.startingSoonRailData),
    nearby: scopeEvents(data.nearbyRailData),
    popular: scopeEvents(data.popularRailData),
    forYou: scopeWithSparseFallback(data.forYouEvents, isKeralaEvent, keralaDomain),
    communities: scopeWithSparseFallback(data.discoverCommunities, isKeralaCommunity, keralaDomain),
  };
}
