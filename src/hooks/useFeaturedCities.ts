import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api, type FeaturedCityData } from '@/lib/api';
import {
  isLikelyValidRemoteImageUrl,
  resolveFeaturedCityImageUrl,
} from '@/constants/cityHeroImages';
import { CultureTokens } from '@/design-system/tokens/theme';
import { luxeDark, RICH_INDIGO, DEEP_SAFFRON, HERITAGE_GOLD, DEEP_PLUM, EMERALD_HARMONY, TERRACOTTA_GLOW } from '@/design-system/tokens/luxeHeritage';

export type { FeaturedCityData };

/**
 * Deterministic gradient pairs for city cards when no imageUrl is set.
 * Keyed by countryCode; unknown countries fall back to the default pair.
 */
export const CITY_GRADIENTS: Record<string, [string, string]> = {
  AU: [DEEP_SAFFRON, '#1A0F0A'],                           // warm saffron → deep bronze luxe
  NZ: [EMERALD_HARMONY, '#0A211C'],                        // vibrant emerald → deep forest luxe
  AE: [HERITAGE_GOLD, DEEP_PLUM],                          // prestige gold → deep plum
  GB: [RICH_INDIGO, '#0D1626'],                            // rich indigo → midnight navy luxe
  CA: [TERRACOTTA_GLOW, '#2A1212'],                        // terracotta energy → dark
  US: [RICH_INDIGO, '#0A0A14'],                            // strong indigo → deep luxe night
  SG: [DEEP_SAFFRON, '#2A0F2A'],                           // saffron pop → deep plum night
  DEFAULT: [RICH_INDIGO, luxeDark.background],             // premium indigo → true luxe black
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
