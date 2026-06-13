import type { FirestoreEvent } from '../services/events';

type ExternalEventFields = Pick<FirestoreEvent, 'externalTicketUrl' | 'sourceSystem'> & {
  metadata?: Record<string, unknown> | null;
};

export function getExternalTicketUrl(event: ExternalEventFields): string | null {
  const direct = event.externalTicketUrl;
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

export function usesExternalTicketing(event: ExternalEventFields): boolean {
  if (getExternalTicketUrl(event)) return true;

  const meta = event.metadata ?? {};
  if (meta.externalTicketingOnly === true) return true;

  const provider = meta.ticketProvider;
  if (provider === 'eventbrite' || provider === 'eventik') return true;

  return event.sourceSystem === 'eventbrite' || event.sourceSystem === 'eventik';
}

export function externalTicketingBlockedMessage(event: ExternalEventFields): string {
  const provider = event.metadata?.ticketProvider;
  if (provider === 'eventbrite') return 'Tickets for this event are sold on Eventbrite.';
  if (provider === 'eventik') return 'Tickets for this event are sold on Eventik.';
  return 'Tickets for this event are sold on the organiser\'s website.';
}