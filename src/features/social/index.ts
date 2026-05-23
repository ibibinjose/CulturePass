import { api } from '@/lib/api';

export async function followSocialTarget(targetType: 'user' | 'profile' | 'community', targetId: string) {
  return api.social.follow(targetType, targetId);
}

export async function unfollowSocialTarget(targetType: 'user' | 'profile' | 'community', targetId: string) {
  return api.social.unfollow(targetType, targetId);
}

export async function listSocialFeed(params: { city?: string; country?: string; page?: number; pageSize?: number }) {
  return api.feed.list(params);
}
