import { api } from '@/lib/api';
export { ApiError } from '@/lib/api';

export const communitiesApi = {
  communities: api.communities,
  social: api.social,
};
