/**
 * CulturePass — Typed API Client
 *
 * Wraps apiRequest() with structured error handling, typed responses,
 * and consistent route helpers. Use this instead of calling apiRequest()
 * directly in screens — it eliminates duplicated fetch logic and gives
 * you full TypeScript inference throughout the app.
 *
 * Usage:
 *   import { api } from '@/lib/api';
 *   const events = await api.events.list({ city: 'Sydney', page: 1 });
 *
 * Architecture:
 *   • Transport: apiRequest / apiRequestMultipart from ./query-client (base URL, auth headers, JSON).
 *   • Surface: a single `api` object with domain namespaces (events, tickets, profiles, …).
 *   • New endpoints: add methods on the appropriate namespace; keep paths aligned with functions/src/handlers/*.
 */

import { apiRequestMultipart, getApiUrl } from './query-client';
import { request } from '../platform/api/client';
import { createEventsNamespace, createTicketsBackedWidgetHelpers } from '../platform/api/endpoints/events';
import { createCommunitiesNamespace } from '../platform/api/endpoints/communities';
import {
  createMembershipNamespace,
  createPaymentMethodsNamespace,
  createRewardsNamespace,
  createWalletNamespace,
} from '../platform/api/endpoints/payment';
import { createPerksNamespace } from '../platform/api/endpoints/perks';
import { createPerksClassifyNamespace } from '../platform/api/endpoints/perksClassify';
import { createCultureShopNamespace } from '../platform/api/endpoints/cultureShop';
import { createHostApplicationNamespace } from '../platform/api/endpoints/hostApplication';
import { createDiscoverFlowNamespace, createDiscoverNamespace } from '../platform/api/endpoints/discover';
import { createSearchFlowNamespace, createSearchNamespace } from '../platform/api/endpoints/search';
import { createCouncilNamespace } from '../platform/api/endpoints/council';
import { createLocationsNamespace } from '../platform/api/endpoints/locations';
import { createCitiesNamespace } from '../platform/api/endpoints/cities';
import { createCalendarFlowNamespace } from '../platform/api/endpoints/calendar';
import { createHostDraftsNamespace } from '../platform/api/endpoints/hostDrafts';
import { createDeepLinksNamespace } from '../platform/api/endpoints/deepLinks';
import { createNotificationsResolveNamespace } from '../platform/api/endpoints/notificationsResolve';
import { createProfilesNamespace } from '../platform/api/endpoints/createProfilesNamespace';
import { createHostPagesNamespace } from '../platform/api/endpoints/createHostPagesNamespace';
import { createAdminNamespace } from '../platform/api/endpoints/admin';
import { createCultureNamespace } from '../platform/api/endpoints/culture';
import { createFeedNamespace } from '../platform/api/endpoints/feed';
import { createSocialNamespace } from '../platform/api/endpoints/social';
import { createAuthNamespace } from '../platform/api/endpoints/auth';
import { createTicketsNamespace } from '../platform/api/endpoints/tickets';
import { createStripeNamespace } from '../platform/api/endpoints/stripe';
import { createWidgetsNamespace } from '../platform/api/endpoints/widgets';
import { createUsersNamespace } from '../platform/api/endpoints/users';
import { createNotificationsNamespace } from '../platform/api/endpoints/notifications';
import { createDirectoryNamespaces } from '../platform/api/endpoints/directory';
import { createPrivacyNamespace, createAccountNamespace } from '../platform/api/endpoints/privacyAccount';
import {
  createAiNamespace,
  createCalendarSettingsNamespace,
  createCultureExplorerNamespace,
  createCultureTodayNamespace,
  createCultureXNamespace,
  createCpidNamespace,
  createMediaNamespace,
  createReportsNamespace,
  createRolloutNamespace,
  createSupportNamespace,
  createUpdatesNamespace,
} from '../platform/api/endpoints/misc';
import { createUploadsNamespace } from '../platform/api/endpoints/uploads';
import { createCommunityHomeBannerNamespace } from '../platform/api/endpoints/communityHomeBanner';
import { createWaitlistNamespace } from '../platform/api/endpoints/waitlist';
import { createReviewsNamespace } from '../platform/api/endpoints/reviews';

export type { CultureSuggestParams, IndigenousOrganisation, IndigenousFestival, IndigenousBusiness, IndigenousTraditionalLand } from '../platform/api/endpoints/culture';
export type { FeedItem, FeedComment } from '../platform/api/endpoints/feed';
export type { SocialUserMini } from '../platform/api/endpoints/social';
export type { ImageUploadResponse } from '../platform/api/endpoints/uploads';

export type { MembershipSummary, Notification, CouncilData, CouncilLgaContext, RewardsSummary, WalletSummary, WalletTransaction, WidgetSpotlightItem, WidgetNearbyEventItem, WidgetUpcomingTicketItem, CouncilListResponse, ActivityData, ActivityInput } from '@/shared/schema';
export type { EventListParams } from '../platform/api/endpoints/events';
export type {
  ProfileListParams,
  ProfileDraft,
  ProfileVersion,
  ProfileAnalytics,
  HandleAvailabilityResponse,
  ABNLookupResponse,
  DraftSaveResponse,
  PublishResponse,
  RollbackResponse,
} from '../platform/api/endpoints/createProfilesNamespace';

export { ApiError } from '../platform/api/client';
export type { ContinueBrowsingItem, CommunityEventsResponse } from '../platform/api/endpoints/discover';
export type { TrendingSearchItem, SearchSuggestionsResponse, SearchParams } from '../platform/api/endpoints/search';
export type { AustralianState, LocationEntry, LocationsResponse } from '../platform/api/endpoints/locations';
export type { FeaturedCityData } from '../platform/api/endpoints/cities';
export type { CalendarDot, CalendarDotsResponse, CalendarSubscribeResponse } from '../platform/api/endpoints/calendar';
export type { EventDraft, EventDraftInput } from '../platform/api/endpoints/hostDrafts';
export type { DeepLinkResolution, OGMetaResponse } from '../platform/api/endpoints/deepLinks';
export type { ClassifiedPerks } from '../platform/api/endpoints/perksClassify';
export type { NotificationResolution } from '../platform/api/endpoints/notificationsResolve';

const auth = createAuthNamespace(request);
const events = createEventsNamespace(request);
const tickets = createTicketsNamespace(request);
const eventWidgetHelpers = createTicketsBackedWidgetHelpers(events, { forUser: tickets.forUser });
const stripeApi = createStripeNamespace(request);
const search = createSearchNamespace(request);
const discover = createDiscoverNamespace(request);
const culture = createCultureNamespace(request);
const feed = createFeedNamespace(request);
const widgets = createWidgetsNamespace(request, eventWidgetHelpers);
const users = createUsersNamespace(request);
const notifications = createNotificationsNamespace(request);
const membership = createMembershipNamespace(request);
const wallet = createWalletNamespace(request);
const rewards = createRewardsNamespace(request);
const perks = createPerksNamespace(request);
const perksClassify = createPerksClassifyNamespace(request);
const cultureShop = createCultureShopNamespace(request);
const hostApplications = createHostApplicationNamespace(request);
const discoverFlow = createDiscoverFlowNamespace(request);
const searchFlow = createSearchFlowNamespace(request);
const calendarFlow = createCalendarFlowNamespace(request);
const hostDrafts = createHostDraftsNamespace(request);
const deepLinks = createDeepLinksNamespace(request);
const notificationsResolve = createNotificationsResolveNamespace(request);
const media = createMediaNamespace(request);
const paymentMethods = createPaymentMethodsNamespace(request);
const rollout = createRolloutNamespace(request);
const profiles = createProfilesNamespace(request);
const hostPages = createHostPagesNamespace(request);
const communities = createCommunitiesNamespace(request);
const privacy = createPrivacyNamespace(request);
const account = createAccountNamespace(request);
const { restaurants, shopping, movies, activities, offerings, businesses } = createDirectoryNamespaces(request);
const council = createCouncilNamespace(request);
const locations = createLocationsNamespace(request);
const cities = createCitiesNamespace(request);
const social = createSocialNamespace(request);
const reports = createReportsNamespace(request);
const support = createSupportNamespace(request);
const cpid = createCpidNamespace(request);
const uploads = createUploadsNamespace(apiRequestMultipart);
const calendar = createCalendarSettingsNamespace(request);
const cultureX = createCultureXNamespace(request);
const cultureExplorer = createCultureExplorerNamespace(request);
const cultureToday = createCultureTodayNamespace(request);
const updates = createUpdatesNamespace(request);
const admin = createAdminNamespace(request);
const communityHomeBanner = createCommunityHomeBannerNamespace(request);
const ai = createAiNamespace(request);
const waitlist = createWaitlistNamespace(request);
const reviews = createReviewsNamespace(request);

export const api = {
  auth,
  uploads,
  media,
  paymentMethods,
  rollout,
  events,
  tickets,
  stripe: stripeApi,
  search,
  discover,
  discoverFlow,
  searchFlow,
  calendarFlow,
  hostDrafts,
  deepLinks,
  perksClassify,
  notificationsResolve,
  users,
  notifications,
  membership,
  wallet,
  rewards,
  perks,
  cultureShop,
  cultureMarket: cultureShop,
  hostApplications,
  profiles,
  hostPages,
  communities,
  privacy,
  account,
  restaurants,
  shopping,
  movies,
  activities,
  offerings,
  businesses,
  council,
  locations,
  cities,
  cpid,
  social,
  reports,
  support,
  culture,
  widgets,
  feed,
  calendar,
  cultureToday,
  cultureX,
  cultureExplorer,
  updates,
  admin,
  communityHomeBanner,
  ai,
  waitlist,
  reviews,

  /** Raw request — use when a specific endpoint isn't covered above */
  raw: request,
  /** Base URL — useful for constructing non-JSON endpoints (e.g. image URLs) */
  baseUrl: getApiUrl,
};
