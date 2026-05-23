import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api, type FeaturedCityData } from '@/lib/api';
import {
  isLikelyValidRemoteImageUrl,
  resolveFeaturedCityImageUrl,
} from '@/constants/cityHeroImages';
import { CultureTokens } from '@/design-system/tokens/theme';

export type { FeaturedCityData };

/**
 * Deterministic gradient pairs for city cards when no imageUrl is set.
 * Keyed by countryCode; unknown countries fall back to the default pair.
 */
export const CITY_GRADIENTS: Record<string, [string, string]> = {
  AU: ['#FF8C42', '#1B0F2E'],   // saffron → midnight
  NZ: ['#22C55E', '#0F2A1A'],   // green → dark green
  AE: ['#FFC857', '#6B0F0F'],   // gold → deep red
  GB: ['#3B82F6', '#0F1E3F'],   // blue → navy
  CA: ['#EF4444', '#2D0A0A'],   // red → dark red
  US: ['#6366F1', '#0F0F2E'],   // indigo → deep indigo
  SG: ['#F43F5E', '#1A0F1A'],   // rose → deep plum
  DEFAULT: [CultureTokens.indigo, '#000000'], // brand indigo → jet black
};

export function cityGradient(countryCode: string): [string, string] {
  return CITY_GRADIENTS[countryCode] ?? CITY_GRADIENTS.DEFAULT;
}

export function useFeaturedCities() {
  const { data: cities = [], isLoading, isError, isRefetching, refetch } = useQuery<FeaturedCityData[]>({
    queryKey: ['/api/cities/featured'],
    queryFn: () => api.cities.featured(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const dedupedCities = useMemo(() => {
    const byIdentity = new Map<string, FeaturedCityData>();
    for (const city of cities) {
      const key = `${city.countryCode.toUpperCase()}::${(city.slug || city.name).toLowerCase()}`;
      const current = byIdentity.get(key);
      if (!current) {
        byIdentity.set(key, city);
        continue;
      }
      if ((city.order ?? 999) < (current.order ?? 999)) {
        byIdentity.set(key, city);
      }
    }
    return [...byIdentity.values()]
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map((c) => ({
        ...c,
        imageUrl: isLikelyValidRemoteImageUrl(c.imageUrl)
          ? c.imageUrl!.trim()
          : resolveFeaturedCityImageUrl(c),
      }));
  }, [cities]);

  return { cities: dedupedCities, isLoading, isError, isRefetching, refetch };
}
