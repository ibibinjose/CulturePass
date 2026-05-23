import type { CommunityHomeBanner } from '@/shared/schema/communityHomeBanner';
import type { ApiRequestFn } from '../client';

export function createCommunityHomeBannerNamespace(request: ApiRequestFn) {
  return {
    getActive: () =>
      request<{ banner: CommunityHomeBanner }>('GET', 'api/community-home-banner'),
  };
}
