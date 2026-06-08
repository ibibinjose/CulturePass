import type { Community, EventData, Profile } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

export interface CommunityListParams {
  city?: string;
  country?: string;
  nationalityId?: string;
  cultureId?: string;
}

export interface CommunityCreateInput {
  name: string;
  handle?: string;
  title?: string;
  description?: string;
  communityCategory?: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  gallery?: string[];
  nationalityId?: string;
  cultureIds?: string[];
  languageIds?: string[];
  diasporaGroupIds?: string[];
  cultureTags?: string[];
  indigenousTags?: string[];
  isIndigenousOwned?: boolean;
  languages?: string[];
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  telegram?: string;
  joinMode?: 'open' | 'request' | 'invite';
  foundedDate?: string;
  foundedLocation?: string;
  foundingStory?: string;
  legalStatus?: import('@/shared/schema').CommunityLegalStatus;
  registrationNumber?: string;
  governingStructure?: string;
  leadership?: import('@/shared/schema').CommunityLeader[];
  partners?: import('@/shared/schema').CommunityPartner[];
}

export function createCommunitiesNamespace(request: ApiRequestFn) {
  return {
    list: async (params?: CommunityListParams) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      if (params?.nationalityId) qs.set('nationalityId', params.nationalityId);
      if (params?.cultureId) qs.set('cultureId', params.cultureId);
      const q = qs.toString();
      const res = await request<Community[] | { communities: Community[] }>('GET', `api/communities${q ? `?${q}` : ''}`);
      if (Array.isArray(res)) return res;
      return res.communities ?? [];
    },
    get: (id: string) => request<Community>('GET', `api/communities/${id}`),
    recommendedEvents: (id: string) => request<EventData[]>('GET', `api/communities/${id}/recommended-events`),
    members: (id: string) =>
      request<{
        members: {
          id: string;
          name: string;
          username?: string | null;
          avatarUrl?: string | null;
          city?: string | null;
          country?: string | null;
        }[];
      }>('GET', `api/communities/${id}/members`),
    businesses: (id: string) => request<{ businesses: Profile[] }>('GET', `api/communities/${id}/businesses`),
    join: (id: string) => request<{ success: boolean; communityId: string }>('POST', `api/communities/${id}/join`),
    leave: (id: string) => request<{ success: boolean; communityId?: string }>('DELETE', `api/communities/${id}/leave`),
    joined: () => request<{ communityIds: string[] }>('GET', 'api/communities/joined'),
    create: (data: CommunityCreateInput) =>
      request<{ community: Community }>('POST', 'api/communities', data).then((r) => r.community),
    update: (id: string, data: Partial<Community>) => request<Community>('PUT', `api/communities/${id}`, data),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/communities/${id}`),
    publish: (id: string) => request<{ success: boolean }>('POST', `api/communities/${id}/publish`),
  };
}
