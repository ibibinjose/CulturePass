import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communitiesApi } from '@/modules/communities/api';
import { useAuth } from '@/lib/auth';
import type { Community, EventData, Profile } from '@/shared/schema';
import {
  clearCommunityJoinedMark,
  getMarkedJoinedCommunityIds,
  markCommunityJoined,
} from '@/lib/community-storage';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['/api/communities'] as const,
  list: (params?: CommunitiesListParams) => ['/api/communities', 'list', params] as const,
  detail: (id: string) => ['/api/communities', id] as const,
  joined: () => ['/api/communities', 'joined'] as const,
  followingCommunities: () => ['/api/social/following-communities'] as const,
  members: (id: string) => ['/api/communities', id, 'members'] as const,
  events: (id: string) => ['/api/communities', id, 'events'] as const,
  businesses: (id: string) => ['/api/communities', id, 'businesses'] as const,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunitiesListParams {
  city?: string;
  country?: string;
  nationalityId?: string;
  cultureId?: string;
}

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
