import {
  DEFAULT_EVENTIK_SYNC_CONFIG,
  eventikFirestoreId,
  mapEventikDetailToFirestore,
  parseEventikDateTime,
  resolveEventikImageUrl,
  stripHtml,
} from '../services/eventikSync';

describe('eventikSync', () => {
  it('builds deterministic Firestore ids', () => {
    expect(eventikFirestoreId(151886)).toBe('cpass_eventik_151886');
  });

  it('strips HTML from descriptions', () => {
    expect(stripHtml('<h3><strong>SMYM Basketball</strong></h3>')).toBe('SMYM Basketball');
  });

  it('resolves banner URLs from string or array payloads', () => {
    const url = 'https://eventik.com.au/wp-content/uploads/banner.png';
    expect(resolveEventikImageUrl(url)).toBe(url);
    expect(resolveEventikImageUrl([url])).toBe(url);
    expect(resolveEventikImageUrl('', { _event_banner: [url] })).toBe(url);
  });

  it('parses Eventik datetime strings', () => {
    expect(parseEventikDateTime('2026-08-29 13:30:00')).toEqual({
      date: '2026-08-29',
      time: '13:30',
    });
  });

  it('maps WPEM detail to published Firestore event with external tickets', () => {
    const now = '2026-06-13T04:00:00.000Z';
    const mapped = mapEventikDetailToFirestore(
      {
        id: 151886,
        name: 'Christ on the Court 2026',
        slug: 'christ-on-the-court-2026',
        permalink: 'https://eventik.com.au/event/christ-on-the-court-2026/',
        status: 'publish',
        description: '<h3><strong>SMYM Basketball Competition </strong></h3>',
        images: 'https://eventik.com.au/wp-content/uploads/2025/06/Poster.png',
        event_categories: [{ name: 'Indian', slug: 'india' }],
        event_types: [{ name: 'Game or Competition', slug: 'competition' }],
        meta_data: {
          _event_start_date: '2026-08-29 13:30:00',
          _event_end_date: '2026-08-29 20:00:00',
          _event_location: 'St Michael\'s College, Henley Beach',
          geolocation_city: 'Henley Beach',
          geolocation_state_short: 'SA',
          geolocation_country_long: 'Australia',
          geolocation_lat: '-34.9150171',
          geolocation_long: '138.5041272',
          geolocation_formatted_address: '15 Mitton Ave, Henley Beach SA 5022, Australia',
          _paid_tickets: [{ ticket_name: 'General Admission', ticket_price: '15' }],
          _event_ticket_options: 'paid/free',
        },
      },
      DEFAULT_EVENTIK_SYNC_CONFIG,
      now,
    );

    expect(mapped).not.toBeNull();
    expect(mapped!.id).toBe('cpass_eventik_151886');
    expect(mapped!.communityId).toBe(DEFAULT_EVENTIK_SYNC_CONFIG.communityId);
    expect(mapped!.externalTicketUrl).toBe('https://eventik.com.au/event/christ-on-the-court-2026/');
    expect(mapped!.sourceSystem).toBe('eventik');
    expect(mapped!.status).toBe('published');
    expect(mapped!.entryType).toBe('ticketed');
    expect(mapped!.priceCents).toBe(1500);
    expect(mapped!.tiers).toEqual([]);
    expect(mapped!.metadata?.externalTicketingOnly).toBe(true);
    expect(mapped!.tags).toContain('eventik');
    expect(mapped!.imageUrl).toBe('https://eventik.com.au/wp-content/uploads/2025/06/Poster.png');
  });

  it('maps array image payloads from WPEM', () => {
    const banner = 'https://eventik.com.au/wp-content/uploads/event-manager-uploads/event_banner/2026/06/KARUPPU.png';
    const mapped = mapEventikDetailToFirestore(
      {
        id: 151791,
        name: 'KARUPPU DANCE WORKSHOP',
        slug: 'karuppu',
        permalink: 'https://eventik.com.au/event/karuppu/',
        status: 'publish',
        description: 'Workshop',
        images: [banner],
        meta_data: {
          _event_banner: [banner],
          _event_start_date: '2026-07-01 18:00:00',
          geolocation_city: 'Sydney',
          geolocation_country_long: 'Australia',
        },
      },
      DEFAULT_EVENTIK_SYNC_CONFIG,
      '2026-06-13T04:00:00.000Z',
    );
    expect(mapped?.imageUrl).toBe(banner);
    expect(mapped?.heroImageUrl).toBe(banner);
  });

  it('skips non-published listings', () => {
    const mapped = mapEventikDetailToFirestore(
      {
        id: 1,
        name: 'Draft',
        slug: 'draft',
        permalink: 'https://eventik.com.au/event/draft/',
        status: 'draft',
        description: '',
        meta_data: {},
      },
      DEFAULT_EVENTIK_SYNC_CONFIG,
      '2026-06-13T04:00:00.000Z',
    );
    expect(mapped).toBeNull();
  });
});