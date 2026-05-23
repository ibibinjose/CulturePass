import type { EventData } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export type FeedItem = {
  id: string;
  kind: 'event' | 'announcement' | 'welcome' | 'milestone';
  score: number;
  matchReasons: string[];
  event?: EventData;
  communityId?: string;
  communityName?: string;
  communityImageUrl?: string | null;
  body?: string;
  imageUrl?: string | null;
  postStyle?: 'standard' | 'story';
  authorId?: string;
  likesCount?: number;
  commentsCount?: number;
  members?: number;
  createdAt: string;
};

export type FeedComment = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  body: string;
  createdAt: string;
};

export function createFeedNamespace(request: ApiRequestFn) {
  return {
  list: (params: { city?: string; country?: string; page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set('city', params.city);
    if (params.country) qs.set('country', params.country);
    if (params.page != null) qs.set('page', String(params.page));
    if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
    return request<{
      items: FeedItem[];
      total: number;
      page: number;
      pageSize: number;
      hasNextPage: boolean;
    }>('GET', `api/feed${qs.toString() ? `?${qs}` : ''}`);
  },

  createPost: (payload: {
    communityId: string;
    communityName: string;
    body: string;
    imageUrl?: string;
    postStyle?: 'standard' | 'story';
  }) =>
    request<{ id: string; createdAt: string }>('POST', 'api/feed/posts', payload),

  deletePost: (postId: string) =>
    request<{ success: boolean }>('DELETE', `api/feed/posts/${encodeURIComponent(postId)}`),

  getComments: (postId: string) =>
    request<{ comments: FeedComment[] }>('GET', `api/feed/posts/${encodeURIComponent(postId)}/comments`),

  addComment: (postId: string, body: string) =>
    request<FeedComment>('POST', `api/feed/posts/${encodeURIComponent(postId)}/comments`, { body }),

  toggleLike: (postId: string) =>
    request<{ liked: boolean; likesCount: number }>('POST', `api/feed/posts/${encodeURIComponent(postId)}/like`),

  getLike: (postId: string) =>
    request<{ liked: boolean; likesCount: number }>('GET', `api/feed/posts/${encodeURIComponent(postId)}/like`),
  };
}
