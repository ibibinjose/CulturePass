import {
  api,
  type WidgetNearbyEventItem,
  type WidgetSpotlightItem,
  type WidgetUpcomingTicketItem,
} from '@/lib/api';

type FetchWidgetSyncInput = {
  city?: string;
  country?: string;
  userId?: string;
  isAuthenticated: boolean;
};

export async function fetchWidgetSyncData({
  city,
  country,
  userId,
  isAuthenticated,
}: FetchWidgetSyncInput): Promise<{
  spotlight: WidgetSpotlightItem | null;
  nearby: WidgetNearbyEventItem[];
  upcomingTicket: WidgetUpcomingTicketItem | null;
}> {
  const [spotlights, nearby, upcomingTicket] = await Promise.all([
    api.widgets.spotlight(1),
    city
      ? api.widgets.happeningNearYou({
          city,
          country,
          limit: 5,
        })
      : Promise.resolve([] as WidgetNearbyEventItem[]),
    userId && isAuthenticated ? api.widgets.upcomingTicket(userId) : Promise.resolve(null),
  ]);

  return {
    spotlight: spotlights[0] ?? null,
    nearby,
    upcomingTicket,
  };
}
