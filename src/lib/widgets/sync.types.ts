import type {
  WidgetNearbyEventItem,
  WidgetSpotlightItem,
  WidgetUpcomingTicketItem,
} from '@/lib/api';

export type CultureWidgetSnapshotPayload = {
  spotlight: WidgetSpotlightItem | null;
  nearby: WidgetNearbyEventItem[];
  upcomingTicket: WidgetUpcomingTicketItem | null;
  displayName?: string;
  culturePassId?: string;
  city?: string;
  country?: string;
  /** Membership tier label, e.g. "CulturePass+" */
  membershipTier?: string;
  /** ISO 8601 date string for membership renewal/expiry */
  membershipExpiry?: string;
  /** Formatted cashback balance string, e.g. "$12.50" */
  cashbackBalance?: string;
};
