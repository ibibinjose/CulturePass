import type { ApiRequestFn } from '../client';

/** Public profile snippet returned by social network endpoints */
export interface SocialUserMini {
  id: string;
  displayName: string;
  username: string | null;
  handle: string | null;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
}

export function createSocialNamespace(request: ApiRequestFn) {
  return {
  follow: (targetType: 'user' | 'profile' | 'community', targetId: string) =>
    request<{ ok: boolean }>('POST', `api/social/follow/${targetType}/${targetId}`),

  unfollow: (targetType: 'user' | 'profile' | 'community', targetId: string) =>
    request<{ ok: boolean }>('DELETE', `api/social/follow/${targetType}/${targetId}`),

  /** Check if the current user is following the target */
  isFollowing: async (targetType: 'user' | 'profile' | 'community', targetId: string) => {
    try {
      const res = await request<{ following: boolean }>('GET', `api/social/is-following/${targetType}/${targetId}`);
      return res.following;
    } catch {
      return false;
    }
  },

  /** CulturePass users you follow */
  followingUsers: (limit?: number) =>
    request<{ users: SocialUserMini[] }>(
      'GET',
      `api/social/following-users${limit != null ? `?limit=${encodeURIComponent(String(limit))}` : ''}`,
    ),

  /** Users who follow you */
  followers: (limit?: number) =>
    request<{ users: SocialUserMini[] }>(
      'GET',
      `api/social/followers${limit != null ? `?limit=${encodeURIComponent(String(limit))}` : ''}`,
    ),

  /** Record that you saved someone’s contact so they can see “added you” */
  contactSave: (targetUserId: string) =>
    request<{ ok: boolean }>('POST', 'api/social/contact-save', { targetUserId }),

  /** People who saved your contact */
  contactInbound: (limit?: number) =>
    request<{ items: { user: SocialUserMini; createdAt: string }[] }>(
      'GET',
      `api/social/contact-inbound${limit != null ? `?limit=${encodeURIComponent(String(limit))}` : ''}`,
    ),

  /** Suggested members (same city; excludes users you already follow) */
  suggestions: (limit?: number) =>
    request<{ users: SocialUserMini[] }>(
      'GET',
      `api/social/suggestions${limit != null ? `?limit=${encodeURIComponent(String(limit))}` : ''}`,
    ),

  /** Community profile IDs the signed-in user follows (social follow, not necessarily a member) */
  followingCommunities: () =>
    request<{ communityIds: string[] }>('GET', 'api/social/following-communities'),
  };
}
