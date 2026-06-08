import { api as legacyApi } from '@/lib/api';
export { ApiError } from '@/lib/api';
export type {
  EventListParams,
  SearchParams,
  FeaturedCityData,
} from '@/lib/api';
export type {
  MembershipSummary,
  RewardsSummary,
  WalletTransaction,
  CouncilData,
  AppUpdate,
  UpdateCategory,
} from '@/shared/schema';

/**
 * App-facing API surface during migration.
 * Keeps call-sites off `@/lib/api` while domains continue to split
 * into module-local services.
 */
export const modulesApi = {
  auth: legacyApi.auth,
  uploads: legacyApi.uploads,
  media: legacyApi.media,
  paymentMethods: legacyApi.paymentMethods,
  rollout: legacyApi.rollout,
  events: legacyApi.events,
  tickets: legacyApi.tickets,
  stripe: legacyApi.stripe,
  search: legacyApi.search,
  discover: legacyApi.discover,
  users: legacyApi.users,
  notifications: legacyApi.notifications,
  membership: legacyApi.membership,
  wallet: legacyApi.wallet,
  rewards: legacyApi.rewards,
  perks: legacyApi.perks,
  profiles: legacyApi.profiles,
  hostPages: legacyApi.hostPages,
  communities: legacyApi.communities,
  privacy: legacyApi.privacy,
  account: legacyApi.account,
  restaurants: legacyApi.restaurants,
  shopping: legacyApi.shopping,
  movies: legacyApi.movies,
  activities: legacyApi.activities,
  offerings: legacyApi.offerings,
  businesses: legacyApi.businesses,
  council: legacyApi.council,
  locations: legacyApi.locations,
  cities: legacyApi.cities,
  cpid: legacyApi.cpid,
  social: legacyApi.social,
  reports: legacyApi.reports,
  support: legacyApi.support,
  culture: legacyApi.culture,
  widgets: legacyApi.widgets,
  feed: legacyApi.feed,
  calendar: legacyApi.calendar,
  cultureToday: legacyApi.cultureToday,
  updates: legacyApi.updates,
  admin: legacyApi.admin,
  raw: legacyApi.raw,
  baseUrl: legacyApi.baseUrl,
};
