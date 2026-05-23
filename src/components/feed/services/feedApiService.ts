import { api } from '@/lib/api';

export function fetchFeedList(params: { city?: string; country?: string; pageSize?: number }) {
  return api.feed.list(params);
}

export function fetchFeedCommunities(params: { city?: string; country?: string }) {
  return api.communities.list(params);
}
