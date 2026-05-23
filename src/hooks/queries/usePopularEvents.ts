/**
 * usePopularEvents — city/country-scoped events sorted by popularity.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { eventKeys } from './keys';
import type { EventData } from '@/shared/schema';

interface UsePopularEventsOptions {
  city?: string;
  country?: string;
  pageSize?: number;
  enabled?: boolean;
}

interface PopularEventsResult {
  events: EventData[];
  total: number;
}

export function usePopularEvents({
  city,
  country,
  pageSize = 12,
  enabled = true,
}: UsePopularEventsOptions) {
  const params = { city: city ?? '', country: country ?? '', pageSize };
  return useQuery<PopularEventsResult>({
    queryKey: eventKeys.popular(params),
    queryFn: () => api.events.popular({ city, country, pageSize }),
    enabled: enabled && Boolean(city || country),
    staleTime: 60_000,
  } as UseQueryOptions<PopularEventsResult>);
}
