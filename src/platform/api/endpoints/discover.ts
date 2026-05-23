import type { ApiRequestFn } from '../client';
import type { DiscoverFeedContract, EventData } from '@/shared/schema';

export function createDiscoverNamespace(request: ApiRequestFn) {
  return {
    trending: () => request<EventData[]>('GET', 'api/discover/trending'),
    feed: (userId: string, params?: { city?: string; country?: string }) => {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.country) qs.set('country', params.country);
      const q = qs.toString();
      return request<DiscoverFeedContract>('GET', `api/discover/${userId}${q ? `?${q}` : ''}`);
    },
    feedback: (payload: Record<string, unknown>) =>
      request<{ ok: boolean }>('POST', 'api/discover/feedback', payload),
  };
}

export interface ContinueBrowsingItem {
  eventId: string;
  event: EventData;
  visitedAt: string;
}

export interface CommunityEventsResponse {
  events: EventData[];
  windowStart: string;
  windowEnd: string;
}

function normalizeCommunityEventsResponse(payload: unknown): CommunityEventsResponse {
  const fallback = {
    events: [],
    windowStart: new Date().toISOString(),
    windowEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (!payload || typeof payload !== 'object') return fallback;

  if (Array.isArray(payload)) {
    return { ...fallback, events: payload as EventData[] };
  }

  const record = payload as Record<string, unknown>;
  return {
    events: Array.isArray(record.events) ? record.events as EventData[] : [],
    windowStart: typeof record.windowStart === 'string' ? record.windowStart : fallback.windowStart,
    windowEnd: typeof record.windowEnd === 'string' ? record.windowEnd : fallback.windowEnd,
  };
}

export function createDiscoverFlowNamespace(request: ApiRequestFn) {
  return {
    /** Recent visits for current user (Continue Browsing rail) */
    continueBrowsing: () =>
      request<{ items: ContinueBrowsingItem[] }>('GET', 'api/discover/continue-browsing'),

    /** Events from joined communities within a 7-day window */
    communityEvents: async () => {
      const payload = await request<unknown>('GET', 'api/discover/community-events');
      return normalizeCommunityEventsResponse(payload);
    },
  };
}
