import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesApi } from '@/modules/communities/api';
import { eventsApi } from '@/modules/events/api';
import { useAuth } from '@/lib/auth';
import {
  eventMatchesCity,
  mergeLocalWithFallback,
  rankEventsByLocation,
  scopeSubtitle,
  SPARSE_LIST_MIN,
  type LocationScope,
} from '@/lib/locationFallback';
import type { Community, EventData, Profile } from '@/shared/schema';
import {
  clearCommunityJoinedMark,
  getMarkedJoinedCommunityIds,
  markCommunityJoined,
} from '@/lib/community-storage';
import { communityKeys, type CommunitiesListParams } from './communityKeys';

export { communityKeys, type CommunitiesListParams };

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCommunities(params?: CommunitiesListParams) {
  return useQuery<Community[]>({
    queryKey: communityKeys.list(params),
    queryFn: () => communitiesApi.communities.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCommunity(id: string) {
  return useQuery<Community>({
    queryKey: communityKeys.detail(id),
    queryFn: () => communitiesApi.communities.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useJoinedCommunities() {
  const localJoinedQuery = useQuery<string[]>({
    queryKey: [...communityKeys.joined(), 'local'],
    queryFn: () => getMarkedJoinedCommunityIds(),
    staleTime: Infinity,
  });

  const remoteJoinedQuery = useQuery<{ communityIds: string[] }>({
    queryKey: communityKeys.joined(),
    queryFn: () => communitiesApi.communities.joined(),
    staleTime: 1000 * 60 * 2,
  });

  const mergedIds = Array.from(
    new Set([...(localJoinedQuery.data ?? []), ...(remoteJoinedQuery.data?.communityIds ?? [])]),
  );

  return {
    ...remoteJoinedQuery,
    data: { communityIds: mergedIds },
    isLoading: remoteJoinedQuery.isLoading && localJoinedQuery.isLoading,
    isFetching: remoteJoinedQuery.isFetching || localJoinedQuery.isFetching,
  };
}

export function useFollowingCommunityIds() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: communityKeys.followingCommunities(),
    queryFn: () => communitiesApi.social.followingCommunities(),
    select: (r) => r.communityIds ?? [],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCommunityMembers(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: communityKeys.members(id),
    queryFn: () => communitiesApi.communities.members(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCommunityRecommendedEvents(id: string, options?: { enabled?: boolean }) {
  return useQuery<EventData[]>({
    queryKey: communityKeys.events(id),
    queryFn: () => communitiesApi.communities.recommendedEvents(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  });
}

function todayDateOnly(): string {
  return new Date().toISOString().split('T')[0]!;
}

export type CommunityDisplayEventsResult = {
  events: EventData[];
  scope: LocationScope;
  scopeNote?: string;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown[]>;
};

/** Community events with local-first + national padding when the catalog is sparse. */
export function useCommunityDisplayEvents(
  community: Community | undefined,
  options?: { enabled?: boolean },
): CommunityDisplayEventsResult {
  const communityId = community?.id ?? '';
  const enabled = !!communityId && (options?.enabled ?? true);
  const city = (community?.city ?? '').trim();
  const country = (community?.country ?? 'Australia').trim();

  const recommendedQuery = useCommunityRecommendedEvents(communityId, { enabled });

  const needsSupplement =
    enabled && !recommendedQuery.isLoading && (recommendedQuery.data?.length ?? 0) < SPARSE_LIST_MIN;

  const supplementQuery = useQuery({
    queryKey: [...communityKeys.events(communityId), 'supplement', country, city],
    queryFn: async () => {
      const dateFrom = todayDateOnly();
      const merged: EventData[] = [];
      const seen = new Set<string>();

      const push = (list: EventData[]) => {
        for (const e of list) {
          if (!e?.id || seen.has(e.id)) continue;
          seen.add(e.id);
          merged.push(e);
        }
      };

      if (city) {
        const cityRes = await eventsApi.events.list({ city, country, dateFrom, pageSize: 20 });
        push(cityRes.events ?? []);
      }
      if (merged.length < SPARSE_LIST_MIN) {
        const countryRes = await eventsApi.events.list({ country, dateFrom, pageSize: 20 });
        push(countryRes.events ?? []);
      }
      return merged;
    },
    enabled: needsSupplement,
    staleTime: 1000 * 60 * 5,
  });

  const { events, scope, scopeNote } = useMemo(() => {
    const recommended = recommendedQuery.data ?? [];

    const inferScope = (items: EventData[]): LocationScope => {
      const linked = items.filter((e) => e.communityId === communityId).length;
      if (linked === 0) return 'national';
      if (linked < items.length) return 'mixed';
      const localish = items.filter((e) => !city || eventMatchesCity(e, city) || e.communityId === communityId).length;
      return localish < items.length ? 'mixed' : 'local';
    };

    if (recommended.length >= SPARSE_LIST_MIN) {
      const scope = inferScope(recommended);
      return {
        events: recommended,
        scope,
        scopeNote: scope === 'local' ? undefined : scopeSubtitle(scope, city, country),
      };
    }

    const ranked = rankEventsByLocation(supplementQuery.data ?? [], city, country);
    const merged = mergeLocalWithFallback(recommended, ranked, { minLocal: SPARSE_LIST_MIN, limit: 12 });
    return {
      events: merged.items,
      scope: merged.scope,
      scopeNote: scopeSubtitle(merged.scope, city, country),
    };
  }, [recommendedQuery.data, supplementQuery.data, city, country, communityId]);

  const refetch = () =>
    Promise.all([
      recommendedQuery.refetch(),
      needsSupplement ? supplementQuery.refetch() : Promise.resolve(),
    ]);

  return {
    events,
    scope,
    scopeNote,
    isLoading: recommendedQuery.isLoading || (needsSupplement && supplementQuery.isLoading),
    isFetching: recommendedQuery.isFetching || supplementQuery.isFetching,
    refetch,
  };
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesApi.communities.join(id),
    onSuccess: async (result, routeParam) => {
      const canonicalId = result.communityId ?? routeParam;
      await markCommunityJoined(canonicalId);
      queryClient.setQueryData([...communityKeys.joined(), 'local'], (prev: string[] | undefined) =>
        Array.from(new Set([...(prev ?? []), canonicalId])),
      );
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.joined() });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communitiesApi.communities.leave(id),
    onSuccess: async (result, routeParam) => {
      const canonicalId = result.communityId ?? routeParam;
      await clearCommunityJoinedMark(canonicalId);
      queryClient.setQueryData([...communityKeys.joined(), 'local'], (prev: string[] | undefined) =>
        (prev ?? []).filter((communityId) => communityId !== canonicalId),
      );
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
      queryClient.invalidateQueries({ queryKey: communityKeys.joined() });
    },
  });
}

export function useCommunityBusinesses(id: string, options?: { enabled?: boolean }) {
  return useQuery<{ businesses: Profile[] }>({
    queryKey: communityKeys.businesses(id),
    queryFn: () => communitiesApi.communities.businesses(id),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof communitiesApi.communities.create>[0]) =>
      communitiesApi.communities.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.all });
    },
  });
}
