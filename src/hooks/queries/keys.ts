/**
 * Centralized React Query key factory.
 *
 * Rules:
 *  - Keys are arrays — React Query matches by structural equality.
 *  - Coarser keys are prefixes of finer ones so that
 *    `invalidateQueries({ queryKey: eventKeys.all })` wipes every event query.
 *  - Keep this file as the single source of truth; never write raw string keys
 *    in query/mutation calls.
 */

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventKeys = {
  /** Matches every event query */
  all: ['events'] as const,
  /** Matches every event list query */
  lists: () => [...eventKeys.all, 'list'] as const,
  /** Matches a specific filtered list */
  list: (params: Record<string, unknown>) => [...eventKeys.lists(), params] as const,
  /** Matches every event detail query */
  details: () => [...eventKeys.all, 'detail'] as const,
  /** Matches a single event by id */
  detail: (id: string) => [...eventKeys.details(), id] as const,
  /** Matches nearby-events queries */
  nearby: (params: Record<string, unknown>) => [...eventKeys.all, 'nearby', params] as const,
  /** Matches popular-events (city/country scoped) queries */
  popular: (params: Record<string, unknown>) => [...eventKeys.all, 'popular', params] as const,
  /** Matches the current user's RSVP for an event */
  myRsvp: (eventId: string) => [...eventKeys.all, 'rsvp', eventId] as const,
};

// ─── Communities ──────────────────────────────────────────────────────────────

export const communityKeys = {
  all: ['communities'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...communityKeys.lists(), params] as const,
  detail: (id: string) => [...communityKeys.all, 'detail', id] as const,
  joined: () => [...communityKeys.all, 'joined'] as const,
};

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...profileKeys.lists(), params] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

// ─── Perks ────────────────────────────────────────────────────────────────────

export const perkKeys = {
  all: ['perks'] as const,
  lists: () => [...perkKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...perkKeys.lists(), params] as const,
  detail: (id: string) => [...perkKeys.all, 'detail', id] as const,
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const ticketKeys = {
  all: ['tickets'] as const,
  forUser: (userId: string) => [...ticketKeys.all, 'user', userId] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
};

// ─── Discover / Feed ──────────────────────────────────────────────────────────

export const discoverKeys = {
  all: ['discover'] as const,
  feed: (params: Record<string, unknown>) => [...discoverKeys.all, 'feed', params] as const,
  trending: () => [...discoverKeys.all, 'trending'] as const,
  communityHomeBanner: () => [...discoverKeys.all, 'communityHomeBanner'] as const,
};

// ─── Culture Explorer (Cultural Passport + Quests) ────────────────────────────

export const cultureExplorerKeys = {
  all: ['culture-explorer'] as const,
  summary: () => [...cultureExplorerKeys.all, 'summary'] as const,
  quests: (params: Record<string, unknown>) => [...cultureExplorerKeys.all, 'quests', params] as const,
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const feedKeys = {
  all: ['feed'] as const,
  list: (params: Record<string, unknown>) => [...feedKeys.all, 'list', params] as const,
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  forUser: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
};

// ─── Council ──────────────────────────────────────────────────────────────────

export const councilKeys = {
  all: ['council'] as const,
  lists: () => [...councilKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...councilKeys.lists(), params] as const,
  detail: (id: string) => [...councilKeys.all, 'detail', id] as const,
};

// ─── Search ───────────────────────────────────────────────────────────────────

export const searchKeys = {
  all: ['search'] as const,
  query: (params: Record<string, unknown>) => [...searchKeys.all, params] as const,
};

// ─── Flow (App Flow Improvements) ─────────────────────────────────────────────

export const flowKeys = {
  continueBrowsing: (userId: string) => ['discover', 'continue-browsing', userId] as const,
  communityEvents: (userId: string) => ['discover', 'community-events', userId] as const,
  searchTrending: (city: string) => ['search', 'trending', city] as const,
  searchSuggestions: (query: string) => ['search', 'suggestions', query] as const,
  calendarDots: (month: number, year: number) => ['calendar', 'dots', month, year] as const,
  eventDrafts: (userId: string) => ['host', 'drafts', userId] as const,
  deepLinkResolve: (prefix: string, id: string) => ['deep-link', prefix, id] as const,
  perksClassified: (userId: string) => ['perks', 'classified', userId] as const,
  notificationResolve: (notifId: string) => ['notification', 'resolve', notifId] as const,
} as const;

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const waitlistKeys = {
  all: ['waitlist'] as const,
  position: (eventId: string) => [...waitlistKeys.all, 'position', eventId] as const,
  count: (eventId: string) => [...waitlistKeys.all, 'count', eventId] as const,
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewKeys = {
  all: ['reviews'] as const,
  forEvent: (eventId: string) => [...reviewKeys.all, 'event', eventId] as const,
  forProfile: (profileId: string) => [...reviewKeys.all, 'profile', profileId] as const,
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  systemHealth: () => [...adminKeys.all, 'system', 'health'] as const,
  complianceSummary: () => [...adminKeys.all, 'compliance', 'summary'] as const,
  indexesHealth: () => [...adminKeys.all, 'indexes', 'health'] as const,
  auditLogs: (params: Record<string, unknown>) => [...adminKeys.all, 'auditLogs', params] as const,
  financeTransactions: (params: Record<string, unknown>) => [...adminKeys.all, 'finance', 'transactions', params] as const,
  financeConfig: () => [...adminKeys.all, 'finance', 'config'] as const,
  discoveryConfig: () => [...adminKeys.all, 'discovery', 'config'] as const,
  communityHomeBanners: () => [...adminKeys.all, 'communityHomeBanners'] as const,
  reports: (status: string) => [...adminKeys.all, 'reports', status] as const,
  platformConfig: () => [...adminKeys.all, 'platform', 'config'] as const,
  userDetail: (id: string) => [...adminKeys.all, 'user', id] as const,
  usersDirectory: () => [...adminKeys.all, 'users', 'directory'] as const,
  memberMonitoring: (params: Record<string, unknown>) => [...adminKeys.all, 'memberMonitoring', params] as const,
  citiesAdmin: () => [...adminKeys.all, 'cities', 'all'] as const,
  verificationTasks: (params: Record<string, unknown>) => [...adminKeys.all, 'verification', 'tasks', params] as const,
  verificationTask: (id: string) => [...adminKeys.all, 'verification', 'task', id] as const,
  verificationStats: () => [...adminKeys.all, 'verification', 'stats'] as const,
  hostPage: (id: string) => [...adminKeys.all, 'hostPage', id] as const,
  hostspaceOverview: () => [...adminKeys.all, 'hostspace', 'overview'] as const,
};
