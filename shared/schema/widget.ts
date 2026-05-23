import type { EventData } from './event';
import type { Ticket } from './ticket';

export interface WidgetSpotlightItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  city?: string;
  country?: string;
}

export interface WidgetNearbyEventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  isFree?: boolean;
  priceCents?: number;
}

export interface WidgetUpcomingTicketItem {
  ticket: Ticket;
  event: EventData | null;
  startsAt: string | null;
}
