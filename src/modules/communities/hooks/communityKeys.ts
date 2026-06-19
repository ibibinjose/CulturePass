/** React Query keys for community directory endpoints — keep dependency-free. */

export interface CommunitiesListParams {
  city?: string;
  country?: string;
  nationalityId?: string;
  cultureId?: string;
  limit?: number;
}

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