import {
  buildDestinationListingHref,
  destinationBrowseSubtitle,
  filterEventsByExploreCategory,
  filterVenuesByExploreCategory,
  isVenuePrimaryExploreCategory,
  matchesExploreBlob,
} from '@/components/city/destinationLayout';

describe('destinationLayout explore filters', () => {
  it('matches dining and shopping blobs', () => {
    expect(matchesExploreBlob('indian restaurant sydney', 'dining')).toBe(true);
    expect(matchesExploreBlob('boutique retail store', 'shopping')).toBe(true);
    expect(matchesExploreBlob('live concert', 'dining')).toBe(false);
  });

  it('filters events by explore category', () => {
    const events = [
      { id: '1', category: 'Film', tags: ['cinema'] },
      { id: '2', category: 'Music', tags: ['concert'] },
    ];
    expect(filterEventsByExploreCategory(events, 'events')).toHaveLength(2);
    expect(filterEventsByExploreCategory(events, 'movies')).toHaveLength(1);
    expect(filterEventsByExploreCategory(events, 'artists')).toHaveLength(1);
  });

  it('builds listing hrefs and subtitles', () => {
    expect(destinationBrowseSubtitle('Kannada')).toContain('Kannada');
    expect(destinationBrowseSubtitle()).toBe('Explore listings across different categories.');
    expect(buildDestinationListingHref('festival', 'Sydney')).toContain('festival');
    expect(buildDestinationListingHref('event', 'Sydney')).toContain('q=Sydney');
  });

  it('filters venues for place-first categories', () => {
    const venues = [
      { id: 'a', name: 'Spice Lane', category: 'Restaurant' },
      { id: 'b', name: 'Town Hall', category: 'Venue' },
    ];
    expect(filterVenuesByExploreCategory(venues, 'dining')).toHaveLength(1);
    expect(filterVenuesByExploreCategory(venues, 'events')).toHaveLength(0);
    expect(isVenuePrimaryExploreCategory('directory')).toBe(true);
    expect(isVenuePrimaryExploreCategory('movies')).toBe(false);
  });
});