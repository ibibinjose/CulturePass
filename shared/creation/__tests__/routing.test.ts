import { describe, it, expect } from '@jest/globals';
import { resolveCreateNavigation, isPageProCategory } from '../routing';

describe('resolveCreateNavigation', () => {
  it('routes event category to /event/create with parent profile', () => {
    const intent = resolveCreateNavigation(
      { id: 'event', entityType: 'event', group: 'events', kind: 'content', contentKind: 'event', requiresParent: true },
      { parentProfileId: 'prof-1' },
    );
    expect(intent.pathname).toBe('/event/create');
    expect(intent.params.publisherProfileId).toBe('prof-1');
    expect(intent.manageTab).toBe('events');
  });

  it('routes venue to page-pro wizard', () => {
    const intent = resolveCreateNavigation({ id: 'venue', entityType: 'venue', group: 'venues' });
    expect(intent.pathname).toBe('/pages/create');
    expect(intent.params.entityType).toBe('venue');
    expect(intent.storage).toBe('hostPages');
  });

  it('routes market product to culture-market listing wizard', () => {
    const intent = resolveCreateNavigation({
      id: 'market-product',
      entityType: 'business',
      group: 'market',
      subCategory: 'product',
    });
    expect(intent.pathname).toBe('/pages/create/listing');
    expect(intent.params.type).toBe('product');
  });

  it('identifies page-pro categories', () => {
    expect(isPageProCategory({ id: 'community', entityType: 'community', group: 'communities' })).toBe(true);
    expect(isPageProCategory({ id: 'event', entityType: 'event', group: 'events' })).toBe(false);
  });
});