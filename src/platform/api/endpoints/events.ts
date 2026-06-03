import type { EventData, PaginatedEventsResponse, Ticket, EventAnalyticsData, PromoCode } from '@/shared/schema';
import type { ApiRequestFn } from '../client';

/** GET /api/events/:id/ticket-quote — server-side pricing (+ optional Firestore promo). */
export interface TicketQuoteResponse {
  tierName: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  discountCents: number;
  promoCode: string | null;
}

export interface EventListParams {
  city?: string;
  country?: string;
  category?: string;
  communityId?: string;
  page?: number;
  pageSize?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  eventType?: string;
  isFeatured?: boolean;
  organizerId?: string;
  isFree?: boolean;
  includeOngoing?: boolean;
  publisherProfileId?: string;
  venueProfileId?: string;
  tag?: string;
  lgaCode?: string;
  councilId?: string;
}

export function createEventsNamespace(request: ApiRequestFn) {
  return {
    list: (params: EventListParams = {}) => {
      const qs = new URLSearchParams();
      if (params.city) qs.set('city', params.city);
      if (params.country) qs.set('country', params.country);
      if (params.category) qs.set('category', params.category);
      if (params.communityId) qs.set('communityId', params.communityId);
      if (params.page != null) qs.set('page', String(params.page));
      if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
      if (params.q) qs.set('q', params.q);
      if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
      if (params.dateTo) qs.set('dateTo', params.dateTo);
      if (params.eventType) qs.set('eventType', params.eventType);
      if (params.isFeatured !== undefined) qs.set('isFeatured', String(params.isFeatured));
      if (params.organizerId) qs.set('organizerId', params.organizerId);
      if (params.isFree !== undefined) qs.set('isFree', String(params.isFree));
      if (params.publisherProfileId) qs.set('publisherProfileId', params.publisherProfileId);
      if (params.venueProfileId) qs.set('venueProfileId', params.venueProfileId);
      if (params.tag) qs.set('tag', params.tag);
      if (params.lgaCode) qs.set('lgaCode', params.lgaCode);
      if (params.councilId) qs.set('councilId', params.councilId);

      const query = qs.toString();
      return request<PaginatedEventsResponse>('GET', `api/events${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<EventData>('GET', `api/events/${id}`),
    ticketQuote: (
      eventId: string,
      params: { quantity: number; tierName?: string; promoCode?: string },
    ) => {
      const qs = new URLSearchParams({ quantity: String(params.quantity) });
      if (params.tierName) qs.set('tierName', params.tierName);
      if (params.promoCode?.trim()) qs.set('promoCode', params.promoCode.trim());
      return request<TicketQuoteResponse>('GET', `api/events/${eventId}/ticket-quote?${qs}`);
    },
    create: (data: Partial<EventData>) => request<EventData>('POST', 'api/events', data),
    update: (id: string, data: Partial<EventData>) => request<EventData>('PUT', `api/events/${id}`, data),
    publish: (id: string) => request<{ success: boolean }>('POST', `api/events/${id}/publish`),
    nearby: (params: { lat: number; lng: number; radius?: number; pageSize?: number }) => {
      const qs = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng) });
      if (params.radius != null) qs.set('radius', String(params.radius));
      if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
      return request<{ events: EventData[]; total: number; radiusKm: number }>('GET', `api/events/nearby?${qs}`);
    },
    popular: (params: { city?: string; country?: string; pageSize?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.city) qs.set('city', params.city);
      if (params.country) qs.set('country', params.country);
      if (params.pageSize != null) qs.set('pageSize', String(params.pageSize));
      const query = qs.toString();
      return request<{ events: EventData[]; total: number }>(
        'GET',
        `api/events/popular${query ? `?${query}` : ''}`,
      );
    },
    rsvp: (eventId: string, status: 'going' | 'maybe' | 'not_going') =>
      request<{ status: string }>('POST', `api/events/${eventId}/rsvp`, { status }),
    myRsvp: (eventId: string) =>
      request<{ status: 'going' | 'maybe' | 'not_going' | null }>('GET', `api/events/${eventId}/rsvp/me`),
    attendees: (eventId: string, limit = 5) =>
      request<{ attendees: { id: string; name: string; avatarUrl?: string | null }[] }>(
        'GET',
        `api/events/${eventId}/attendees?limit=${Math.min(12, Math.max(1, limit))}`,
      ),
    trackTicketClick: (eventId: string) => request<{ ok: boolean }>('POST', `api/events/${eventId}/ticket-click`),
    favorite: (eventId: string, favorite: boolean) =>
      request<{ success?: boolean; favorite?: boolean }>('POST', `api/events/${eventId}/favorite`, { favorite }),
    remove: (id: string) => request<{ success: boolean }>('DELETE', `api/events/${id}`),
    contactOrganizer: (eventId: string, payload: { message: string; contactMethod?: string }) =>
      request<{ requestId?: string; success: boolean }>('POST', `api/events/${eventId}/contact-organizer`, payload),
    getAnalytics: (eventId: string) =>
      request<EventAnalyticsData>('GET', `api/events/${eventId}/analytics`),
    messageAttendees: (eventId: string, title: string, body: string) =>
      request<{ ok: boolean; recipientsCount: number }>('POST', `api/events/${eventId}/message`, { title, body }),

    // Host promos (ticket discounts scoped to event)
    promos: {
      list: (eventId: string) =>
        request<{ promos: PromoCode[] }>('GET', `api/events/${eventId}/promos`),
      create: (eventId: string, data: {
        code: string;
        discountType: 'fixed' | 'percent';
        discountValue: number;
        maxRedemptions?: number | null;
        expiresAt?: string | null;
        note?: string;
      }) => request<{ id: string; code: string }>('POST', `api/events/${eventId}/promos`, data),
    },
  };
}

export function createTicketsBackedWidgetHelpers(
  events: ReturnType<typeof createEventsNamespace>,
  tickets: {
    forUser: (userId: string) => Promise<Ticket[]>;
  },
) {
  function parseEventStartIso(event: EventData): string | null {
    if (!event.date) return null;
    const datePart = event.date.trim();
    const timePart = (event.time ?? '00:00').trim();
    if (!datePart) return null;
    return `${datePart}T${timePart.length > 0 ? timePart : '00:00'}:00`;
  }

  return {
    parseEventStartIso,
    happeningNearYou: async (params: { city?: string; country?: string; limit?: number } = {}) => {
      const limit = params.limit ?? 3;
      const response = await events.list({
        city: params.city,
        country: params.country,
        page: 1,
        pageSize: Math.max(6, limit * 3),
      });
      const now = Date.now();
      const upcoming = response.events
        .map((event) => ({ event, startsAt: parseEventStartIso(event) }))
        .filter((item) => item.startsAt !== null && Date.parse(item.startsAt) >= now)
        .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))
        .slice(0, limit)
        .map((item) => item.event);
      return upcoming;
    },
    upcomingTicket: async (userId: string) => {
      const userTickets = await tickets.forUser(userId);
      const now = Date.now();
      const candidate = userTickets
        .filter((ticket) => ticket.status === 'confirmed' || ticket.status === 'reserved')
        .map((ticket) => {
          const snapshotStart = ticket.eventSnapshot?.startAt ?? null;
          const flatDate = ticket.eventDate ?? ticket.date;
          const flatTime = (ticket.eventTime ?? '00:00').trim();
          const fromFlat = flatDate != null && flatDate.length > 0 ? `${flatDate.trim()}T${flatTime.length > 0 ? flatTime : '00:00'}:00` : null;
          const startsAt = snapshotStart ?? fromFlat;
          const startsAtMs = startsAt ? Date.parse(startsAt) : Number.POSITIVE_INFINITY;
          return { ticket, startsAtMs };
        })
        .filter((item) => Number.isFinite(item.startsAtMs) && item.startsAtMs >= now)
        .sort((a, b) => a.startsAtMs - b.startsAtMs)[0];

      if (!candidate) return null;
      let event: EventData | null = null;
      try {
        event = await events.get(candidate.ticket.eventId);
      } catch {
        event = null;
      }
      const startsAt = candidate.ticket.eventSnapshot?.startAt ?? (event ? parseEventStartIso(event) : null);
      return { ticket: candidate.ticket, event, startsAt };
    },
  };
}
