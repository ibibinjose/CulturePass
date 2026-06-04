import type { ApiRequestFn } from '../client';
import type {
  AppUpdate,
  CultureExplorerQuestsResponse,
  CultureExplorerSummary,
  CultureTodayEntry,
  EventData,
  SupportTicket,
  SupportTicketDepartment,
  UpdateCategory,
} from '@/shared/schema';
import type { CalendarSettings } from '@/shared/schema/user';

export function createMediaNamespace(request: ApiRequestFn) {
  return {
    attach: (data: {
      targetType: string;
      targetId: string;
      imageUrl: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
    }) => request<{ success?: boolean; id?: string }>('POST', 'api/media/attach', data),
    base64: (url: string) =>
      request<{ dataUrl: string }>('GET', `api/media/base64?url=${encodeURIComponent(url)}`),
  };
}

export function createRolloutNamespace(request: ApiRequestFn) {
  return {
    config: () =>
      request<{ phase: string; features: Record<string, boolean> }>('GET', 'api/rollout/config'),
  };
}

export function createReportsNamespace(request: ApiRequestFn) {
  return {
    submit: (payload: {
      targetType: string;
      targetId: string;
      reason: string;
      details?: string;
      userAgent?: string;
    }) => request<{ id: string }>('POST', 'api/reports/v2', payload),
  };
}

export function createSupportNamespace(request: ApiRequestFn) {
  return {
    createTicket: (payload: {
      department: SupportTicketDepartment;
      toEmail?: string;
      subject?: string;
      message: string;
      appVersion?: string;
      platform?: string;
    }) => request<{ ok: boolean; ticket: SupportTicket }>('POST', 'api/support/tickets', payload),
  };
}

export function createCpidNamespace(request: ApiRequestFn) {
  return {
    lookup: (id: string) =>
      request<{
        cpid?: string;
        name?: string;
        username?: string;
        tier?: string;
        org?: string;
        avatarUrl?: string;
        city?: string;
        country?: string;
        bio?: string;
        entityType?: 'user' | 'profile' | string;
        targetId?: string;
        userId?: string;
      }>('GET', `api/cpid/lookup/${encodeURIComponent(id)}`),
  };
}

export function createCalendarSettingsNamespace(request: ApiRequestFn) {
  return {
    getSettings: () => request<CalendarSettings>('GET', 'api/calendar/settings'),
    updateSettings: (settings: Partial<CalendarSettings>) =>
      request<CalendarSettings>('PUT', 'api/calendar/settings', settings),
  };
}

export function createCultureXNamespace(request: ApiRequestFn) {
  return {
    subscribe: (payload: { email: string; city?: string; country?: string }) =>
      request<{ ok: boolean }>('POST', 'api/culture-x/subscribe', payload),
  };
}

export function createCultureExplorerNamespace(request: ApiRequestFn) {
  return {
    summary: () => request<CultureExplorerSummary>('GET', 'api/culture-explorer/summary'),
    quests: (params: { city?: string; country?: string } = {}) => {
      const qs = new URLSearchParams();
      if (params.city) qs.set('city', params.city);
      if (params.country) qs.set('country', params.country);
      const query = qs.toString();
      return request<CultureExplorerQuestsResponse>(
        'GET',
        `api/culture-explorer/quests${query ? `?${query}` : ''}`,
      );
    },
  };
}

export function createCultureTodayNamespace(request: ApiRequestFn) {
  return {
    today: () =>
      request<{
        dayKey: string;
        entries: CultureTodayEntry[];
        promoTitle?: string;
        promoSubtitle?: string;
      }>('GET', 'api/culture-today/today'),

    month: (m: number) =>
      request<{ month: number; entries: CultureTodayEntry[] }>('GET', `api/culture-today/month/${m}`),

    day: (dayKey: string) =>
      request<{ dayKey: string; entries: CultureTodayEntry[] }>(
        'GET',
        `api/culture-today/day/${encodeURIComponent(dayKey)}`,
      ),

    taggedEvents: (pageSize = 24) =>
      request<{ events: EventData[]; total: number }>(
        'GET',
        `api/culture-today/events?pageSize=${pageSize}`,
      ),
  };
}

export function createUpdatesNamespace(request: ApiRequestFn) {
  return {
    list: (params?: { category?: UpdateCategory; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.limit) qs.set('limit', String(params.limit));
      const q = qs.toString();
      return request<{ updates: AppUpdate[] }>('GET', `api/updates${q ? `?${q}` : ''}`);
    },
    get: (id: string) => request<AppUpdate>('GET', `api/updates/${id}`),
  };
}

export function createAiNamespace(request: ApiRequestFn) {
  return {
    assist: (params: {
      text: string;
      operation:
        | 'improve'
        | 'professional'
        | 'expand'
        | 'shorten'
        | 'tone-friendly'
        | 'tone-professional'
        | 'tone-enthusiastic'
        | 'tone-formal';
      fieldType: 'tagline' | 'description' | 'guidelines';
    }) => request<{ suggestedText: string }>('POST', 'api/ai/assist', params),
  };
}
