import {
  getExternalTicketUrl,
  usesExternalTicketing,
} from '../lib/externalTicketing';

describe('externalTicketing', () => {
  it('detects Eventbrite imports by externalTicketUrl', () => {
    const event = {
      externalTicketUrl: 'https://www.eventbrite.com.au/e/sample-tickets-123',
      sourceSystem: 'eventbrite',
      metadata: { externalTicketingOnly: true, ticketProvider: 'eventbrite' },
    };
    expect(usesExternalTicketing(event)).toBe(true);
    expect(getExternalTicketUrl(event)).toContain('eventbrite.com.au');
  });

  it('falls back to metadata sourceUrl and eventbriteId', () => {
    const event = {
      sourceSystem: 'eventbrite',
      metadata: { eventbriteId: '999888777', sourceUrl: 'https://www.eventbrite.com.au/e/fallback' },
    };
    expect(usesExternalTicketing(event)).toBe(true);
    expect(getExternalTicketUrl(event)).toBe('https://www.eventbrite.com.au/e/fallback');
  });

  it('does not flag native CulturePass events', () => {
    const event = {
      sourceSystem: undefined,
      externalTicketUrl: null,
      metadata: {},
    };
    expect(usesExternalTicketing(event)).toBe(false);
  });
});