import { api } from '@/lib/api';
export { ApiError } from '@/lib/api';

export const profileApi = {
  auth: api.auth,
  raw: api.raw,
  notifications: api.notifications,
  cpid: api.cpid,
  users: api.users,
  events: api.events,
  feed: api.feed,
  tickets: api.tickets,
  communities: api.communities,
};
