import type { EventData } from '@/shared/schema';

type ExternalEventLike = Pick<EventData, 'externalTicketUrl' | 'externalUrl' | 'sourceSystem'> & {
  metadata?: Record<string, unknown> | null;
};

/** Returns the outbound ticket URL when ticketing is handled off-platform (e.g. Eventbrite, Eventik). */
export function getExternalTicketUrl(event: ExternalEventLike): string | null {
  const direct = event.externalTicketUrl ?? event.externalUrl;
  const trimmed = typeof direct === 'string' ? direct.trim() : '';
  if (trimmed) return trimmed;

  const meta = event.metadata ?? {};
  const sourceUrl = meta.sourceUrl;
  if (typeof sourceUrl === 'string' && sourceUrl.trim().startsWith('http')) {
    return sourceUrl.trim();
  }

  const eventbriteId = meta.eventbriteId;
  if (eventbriteId != null && String(eventbriteId).trim()) {
    return `https://www.eventbrite.com.au/e/${String(eventbriteId).trim()}`;
  }

  return null;
}

export function usesExternalTicketing(event: ExternalEventLike): boolean {
  if (getExternalTicketUrl(event)) return true;

  const meta = event.metadata ?? {};
  if (meta.externalTicketingOnly === true) return true;

  const provider = meta.ticketProvider;
  if (provider === 'eventbrite' || provider === 'eventik') return true;

  return event.sourceSystem === 'eventbrite' || event.sourceSystem === 'eventik';
}

/** Human label for the ticket provider when known from metadata. */
export function externalTicketProviderLabel(event: EventData): string {
  const provider = (event as EventData & { metadata?: { ticketProvider?: string } }).metadata?.ticketProvider;
  if (provider === 'eventik') return 'Eventik';
  if (provider === 'eventbrite') return 'Eventbrite';
  if (event.sourceSystem === 'eventbrite') return 'Eventbrite';
  if (event.sourceSystem === 'eventik') return 'Eventik';
  return 'event site';
}