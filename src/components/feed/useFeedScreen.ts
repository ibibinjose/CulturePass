import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { createCommunityPost } from '@/lib/feedService';
import { uploadPostImage } from '@/lib/storage';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';

import { feedKeys, communityKeys } from '@/hooks/queries/keys';
import { fetchFeedCommunities, fetchFeedList } from '@/components/feed/services/feedApiService';

import type { Community, EventData } from '@/shared/schema';
import type { FeedFilter, FeedPost, ListItem } from '@/components/feed/types';

const IS_WEB = Platform.OS === 'web';

function buildCommunityStub(item: Record<string, unknown>): Community {
  return {
    id: (item.communityId as string | undefined) ?? '',
    name: (item.communityName as string | undefined) ?? '',
    imageUrl: (item.communityImageUrl as string | undefined) ?? undefined,
  } as Community;
}

function mapServerItemToPost(item: Record<string, any>): FeedPost {
  const comm = buildCommunityStub(item);

  if (item.kind === 'event' && item.event) {
    return {
      id: item.id,
      kind: 'event',
      event: item.event as EventData,
      community: comm,
      createdAt: item.createdAt,
      score: item.score,
      matchReason: item.matchReasons,
    };
  }

  if (item.kind === 'milestone') {
    return {
      id: item.id,
      kind: 'milestone',
      community: comm,
      members: item.members ?? 0,
      createdAt: item.createdAt,
      score: item.score,
      matchReason: item.matchReasons,
    };
  }

  if (item.kind === 'welcome') {
    return {
      id: item.id,
      kind: 'welcome',
      community: comm,
      createdAt: item.createdAt,
      score: item.score,
      matchReason: item.matchReasons,
    };
  }

  if (item.kind === 'collection-highlight') {
    return {
      id: item.id,
      kind: 'collection-highlight',
      community: comm,
      tokenName: item.tokenName,
      tokenImage: item.tokenImage,
      userName: item.userName,
      createdAt: item.createdAt,
      score: item.score,
      matchReason: item.matchReasons,
    };
  }

  return {
    id: item.id,
    kind: 'announcement',
    community: comm,
    body: item.body ?? '',
    postStyle: item.postStyle === 'story' ? 'story' : undefined,
    imageUrl: item.imageUrl ?? undefined,
    authorId: item.authorId,
    likesCount: item.likesCount,
    commentsCount: item.commentsCount,
    createdAt: item.createdAt,
    score: item.score,
    matchReason: item.matchReasons,
  };
}

export function useFeedScreen({ isDesktop }: { isDesktop: boolean }) {
  const { state } = useOnboarding();
  const { user: authUser, isAuthenticated } = useAuth();
  const { hasRole } = useRole();
  const queryClient = useQueryClient();

  const canPostStoryStatus = hasRole('organizer', 'business', 'admin', 'platformAdmin');

  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [createPostMode, setCreatePostMode] = useState<'standard' | 'story'>('standard');
  const [localPosts, setLocalPosts] = useState<FeedPost[]>([]);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('for-you');

  const feedQueryKey = useMemo(
    () => feedKeys.list({ city: state.city, country: state.country }),
    [state.city, state.country],
  );

  const feedQuery = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => fetchFeedList({ city: state.city, country: state.country, pageSize: 50 }),
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const communitiesQuery = useQuery<Community[]>({
    queryKey: communityKeys.list({ city: state.city, country: state.country }),
    queryFn: () => fetchFeedCommunities({ city: state.city, country: state.country }),
    staleTime: 5 * 60 * 1000,
  });

  const communities = useMemo(() => communitiesQuery.data ?? [], [communitiesQuery.data]);

  useEffect(() => {
    setLocalPosts([]);
  }, [state.city, state.country]);

  useEffect(() => {
    if (feedQuery.data && !feedQuery.isFetching) setLocalPosts([]);
  }, [feedQuery.data, feedQuery.isFetching]);

  const openComposer = useCallback((mode: 'standard' | 'story' = 'standard') => {
    setCreatePostMode(mode);
    setShowCreatePost(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: feedQueryKey }),
        queryClient.refetchQueries({ queryKey: communityKeys.list({ city: state.city, country: state.country }) }),
      ]);
      if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, feedQueryKey, state.city, state.country]);

  const handleNewPost = useCallback(async (
    communityId: string,
    communityName: string,
    body: string,
    imageUri?: string,
    postStyle: 'standard' | 'story' = 'standard',
  ) => {
    if (!authUser) return;
    const comm = communities.find((c) => c.id === communityId);
    if (!comm) return;

    const tempPost: FeedPost = {
      id: `local-${Math.random().toString(36).slice(2)}-${Date.now()}`,
      kind: 'announcement',
      community: comm,
      body,
      postStyle: postStyle === 'story' ? 'story' : undefined,
      authorId: authUser.id,
      createdAt: new Date().toISOString(),
      imageUrl: imageUri,
    };
    setLocalPosts((prev) => [tempPost, ...prev]);

    (async () => {
      try {
        let finalImageUrl: string | undefined;
        if (imageUri) finalImageUrl = await uploadPostImage(imageUri, authUser.id);
        await createCommunityPost({
          authorId: authUser.id,
          authorName: authUser.username || authUser.email || 'User',
          communityId,
          communityName,
          body,
          imageUrl: finalImageUrl,
          postStyle,
        });
        await queryClient.invalidateQueries({ queryKey: feedQueryKey });
      } catch (err) {
        if (__DEV__) console.error('[CultureFeed] Failed to create post:', err);
      }
    })();
  }, [authUser, communities, queryClient, feedQueryKey]);

  const posts = useMemo<FeedPost[]>(() => {
    const serverItems = (feedQuery.data?.items ?? []) as unknown as Record<string, any>[];
    const serverPosts = serverItems.map(mapServerItemToPost);
    return [...localPosts, ...serverPosts];
  }, [feedQuery.data, localPosts]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'events') return posts.filter((p) => p.kind === 'event');
    if (activeFilter === 'communities') return posts.filter((p) => p.kind !== 'event');
    return posts;
  }, [posts, activeFilter]);

  const postCounts = useMemo(() => {
    let eventCount = 0;
    for (const post of posts) if (post.kind === 'event') eventCount += 1;
    return { eventCount, commCount: posts.length - eventCount };
  }, [posts]);

  const listItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [...filteredPosts];
    const insertAt = isDesktop ? 5 : 4;
    if (items.length >= insertAt) {
      items.splice(insertAt, 0, { kind: '_trending', id: 'trending-interstitial', city: state.city || '' });
    }
    return items;
  }, [filteredPosts, state.city, isDesktop]);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'Australia';

  return {
    // state
    activeFilter,
    setActiveFilter,
    refreshing,
    showCreatePost,
    createPostMode,

    // data
    communities,
    authUser,
    isAuthenticated,
    canPostStoryStatus,
    feedData: feedQuery.data,
    isLoading: feedQuery.isLoading,
    isFetching: feedQuery.isFetching,
    listItems,
    postCounts,
    locationLabel,
    city: state.city || '',

    // actions
    openComposer,
    closeComposer: () => setShowCreatePost(false),
    handleRefresh,
    handleNewPost,
  };
}

