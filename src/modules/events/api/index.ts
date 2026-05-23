import { api } from '@/lib/api';
export { ApiError } from '@/lib/api';
export type { EventListParams } from '@/lib/api';

export const eventsApi = {
  events: api.events,
  tickets: api.tickets,
  stripe: api.stripe,
  profiles: api.profiles,
  communities: api.communities,
  council: api.council,
};
