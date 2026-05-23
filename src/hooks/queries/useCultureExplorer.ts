/**
 * Culture Explorer hooks — Passport panel + Quest rail data.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cultureExplorerKeys } from './keys';
import type {
  CultureExplorerSummary,
  CultureExplorerQuestsResponse,
} from '@/shared/schema';

interface UseCultureExplorerSummaryOptions {
  enabled?: boolean;
}

/** Fetches the user's Cultural Passport summary (badges + bonus points). */
export function useCultureExplorerSummary(
  options: UseCultureExplorerSummaryOptions = {},
) {
  return useQuery<CultureExplorerSummary>({
    queryKey: cultureExplorerKeys.summary(),
    queryFn: () => api.cultureExplorer.summary(),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  } as UseQueryOptions<CultureExplorerSummary>);
}

interface UseCultureExplorerQuestsOptions {
  city?: string;
  country?: string;
  enabled?: boolean;
}

/** Fetches active Quests scoped to the given city/country. */
export function useCultureExplorerQuests({
  city,
  country,
  enabled = true,
}: UseCultureExplorerQuestsOptions) {
  const params = { city: city ?? '', country: country ?? '' };
  return useQuery<CultureExplorerQuestsResponse>({
    queryKey: cultureExplorerKeys.quests(params),
    queryFn: () => api.cultureExplorer.quests({ city, country }),
    enabled,
    staleTime: 60_000,
  } as UseQueryOptions<CultureExplorerQuestsResponse>);
}
