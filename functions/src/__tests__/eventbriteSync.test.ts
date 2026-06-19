import {
  AUSTRALIAN_EVENT_FINDER_COMMUNITY_ID,
  DEFAULT_EVENTBRITE_SYNC_CONFIG,
  eventbriteFirestoreId,
  extractEventbriteIdsFromHtml,
  mapEventbriteToFirestore,
  parseEventbriteLocalDateTime,
  resolveEventbriteImageUrl,
  resolveEventbriteTicketUrl,
  stripEventbriteHtml,
} from '../services/eventbriteSync';

describe('eventbriteSync', () => {
  it('builds deterministic Firestore ids', () => {
    expect(eventbriteFirestoreId('123456789')).toBe('cpass_eventbrite_123456789');
  });

  it('strips HTML from descriptions', () => {
    expect(stripEventbriteHtml('<p>Diwali <strong>festival</strong></p>')).toBe('Diwali festival');
  });

  it('parses Eventbrite local datetime', () => {
    expect(parseEventbriteLocalDateTime('2026-08-29T13:30:00')).toEqual({
      date: '2026-08-29',
      time: '13:30',
    });
  });

  it('resolves ticket URL from event url', () => {
    expect(
      resolveEventbriteTicketUrl({
        id: '999',
        url: 'https://www.eventbrite.com.au/e/sample-event-tickets-123456789',
      }),
    ).toBe('https://www.eventbrite.com.au/e/sample-event-tickets-123456789');
  });

  it('extracts event ids from browse HTML', () => {
    const html =
      '<a href="https://www.eventbrite.com.au/e/foo-tickets-1989365416513">A</a>' +
      '<a href="https://www.eventbrite.com.au/e/bar-tickets-1988365340258">B</a>';
    expect(extractEventbriteIdsFromHtml(html)).toEqual(['1989365416513', '1988365340258']);
  });

  it('resolves logo image URL', () => {
    const url = 'https://img.evbuc.com/123/logo.png';
    expect(
      resolveEventbriteImageUrl({
        id: '1',
        logo: { original: { url } },
      }),
    ).toBe(url);
  });

  it('maps Eventbrite event to published Firestore event with external tickets', () => {
    const now = '2026-06-13T05:00:00.000Z';
    const mapped = mapEventbriteToFirestore(
      {
        id: '123456789',
        name: { text: 'Sydney Cultural Night Market' },
        description: { text: '<p>Food, music, and crafts.</p>' },
        url: 'https://www.eventbrite.com.au/e/sydney-cultural-night-market-tickets-123456789',
        status: 'live',
        online_event: false,
        is_free: false,
        start: { timezone: 'Australia/Sydney', local: '2026-09-10T18:00:00', utc: '2026-09-10T08:00:00Z' },
        end: { timezone: 'Australia/Sydney', local: '2026-09-10T22:00:00', utc: '2026-09-10T12:00:00Z' },
        logo: { url: 'https://img.evbuc.com/123/logo.png' },
        organizer: { id: 'org1', name: 'Culture Collective' },
        venue: {
          id: 'v1',
          name: 'Darling Harbour',
          address: {
            city: 'Sydney',
            region: 'NSW',
            country: 'AU',
            postal_code: '2000',
            localized_address_display: 'Darling Harbour, Sydney NSW',
          },
        },
        ticket_availability: {
          minimum_ticket_price: { currency: 'AUD', value: 1500, display: '15.00 AUD' },
        },
      },
      DEFAULT_EVENTBRITE_SYNC_CONFIG,
      now,
    );

    expect(mapped).not.toBeNull();
    expect(mapped!.id).toBe('cpass_eventbrite_123456789');
    expect(mapped!.communityId).toBe(AUSTRALIAN_EVENT_FINDER_COMMUNITY_ID);
    expect(mapped!.externalTicketUrl).toContain('eventbrite.com.au');
    expect(mapped!.sourceSystem).toBe('eventbrite');
    expect(mapped!.status).toBe('published');
    expect(mapped!.entryType).toBe('ticketed');
    expect(mapped!.priceCents).toBe(1500);
    expect(mapped!.tiers).toEqual([]);
    expect(mapped!.metadata?.externalTicketingOnly).toBe(true);
    expect(mapped!.metadata?.ticketProvider).toBe('eventbrite');
    expect(mapped!.tags).toContain('eventbrite');
    expect(mapped!.city).toBe('Sydney');
  });

  it('skips ended events', () => {
    const mapped = mapEventbriteToFirestore(
      {
        id: 'ended',
        name: { text: 'Past event' },
        status: 'live',
        start: { local: '2020-01-01T10:00:00' },
        end: { utc: '2020-01-01T12:00:00Z' },
      },
      DEFAULT_EVENTBRITE_SYNC_CONFIG,
      '2026-06-13T05:00:00.000Z',
    );
    expect(mapped).toBeNull();
  });
});