import type { ApiRequestFn } from '../client';
import type { WidgetNearbyEventItem, WidgetSpotlightItem, WidgetUpcomingTicketItem } from '@/shared/schema';
import type { createTicketsBackedWidgetHelpers } from './events';

export function createWidgetsNamespace(
  request: ApiRequestFn,
  eventWidgetHelpers: ReturnType<typeof createTicketsBackedWidgetHelpers>,
) {
  return {
    spotlight: (limit = 1) =>
      request<WidgetSpotlightItem[]>('GET', `api/indigenous/spotlights?limit=${Math.max(1, limit)}`),

    happeningNearYou: (params: { city?: string; country?: string; limit?: number } = {}) =>
      eventWidgetHelpers.happeningNearYou(params) as Promise<WidgetNearbyEventItem[]>,

    upcomingTicket: (userId: string) =>
      eventWidgetHelpers.upcomingTicket(userId) as Promise<WidgetUpcomingTicketItem | null>,
  };
}
