import { createLabCategoryHref } from '@/constants/navigation/createNav';

export const eventPaths = {
  list: '/events',
  create: '/hostspace/event/create',
  login: '/(onboarding)/login',
  calendar: '/(tabs)/calendar',
  contacts: '/contacts',
  communitiesCreate: createLabCategoryHref('community'),
  detail: (id: string) => `/e/${encodeURIComponent(id)}`,
  detailRoute: (id: string) => ({ pathname: '/e/[id]' as const, params: { id } }),
  ticket: (id: string) => `/tickets/${encodeURIComponent(id)}`,
  community: (id: string) => ({ pathname: '/c/[id]' as const, params: { id } }),
};
