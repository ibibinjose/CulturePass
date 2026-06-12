import { describe, it, expect } from '@jest/globals';
import { resolveCreateNavigation, isPageProCategory } from '../routing';

describe('resolveCreateNavigation', () => {
  it('routes event category to /hostspace/event/create with parent host page', () => {
    const intent = resolveCreateNavigation(
      { id: 'event', entityType: 'event', group: 'communities', kind: 'content', contentKind: 'event', requiresParent: true },
      { parentHostPageId: 'page-1' },
    );
    expect(intent.pathname).toBe('/hostspace/event/create');
    expect(intent.params.pageId).toBe('page-1');
    expect(intent.manageTab).toBe('events');
  });

  it('routes org host listings with parent host page id', () => {
    const dining = resolveCreateNavigation(
      { id: 'dining', entityType: 'restaurant', group: 'communities', kind: 'content', requiresParent: true },
      { parentHostPageId: 'org-page-9' },
    );
    expect(dining.pathname).toBe('/hostspace/dining/create');
    expect(dining.params.pageId).toBe('org-page-9');
  });

  it('routes venue to page-pro wizard', () => {
    const intent = resolveCreateNavigation({ id: 'venue', entityType: 'venue', group: 'venues' });
    expect(intent.pathname).toBe('/hostspace/venue/create');
    expect(intent.params.entityType).toBeUndefined();
    expect(intent.storage).toBe('hostPages');
  });

  it('routes market product to culture-market listing wizard', () => {
    const intent = resolveCreateNavigation({
      id: 'market-product',
      entityType: 'business',
      group: 'market',
      subCategory: 'product',
    });
    expect(intent.pathname).toBe('/hostspace/listing');
    expect(intent.params.type).toBe('product');
  });

  it('routes organisation & community types to unified form', () => {
    const community = resolveCreateNavigation({ id: 'community', entityType: 'community', group: 'communities' });
    expect(community.pathname).toBe('/hostspace/create/page');
    expect(community.params.type).toBe('community');

    const ngo = resolveCreateNavigation({ id: 'ngo', entityType: 'organizer', group: 'communities', subCategory: 'ngo' });
    expect(ngo.pathname).toBe('/hostspace/create/page');
    expect(ngo.params.type).toBe('ngo');

    const catalog = resolveCreateNavigation({
      id: 'organisation-community',
      entityType: 'community',
      group: 'communities',
    });
    expect(catalog.pathname).toBe('/hostspace/create/page');
    expect(catalog.params.type).toBe('community');
  });

  it('identifies page-pro categories', () => {
    expect(isPageProCategory({ id: 'community', entityType: 'community', group: 'communities' })).toBe(true);
    expect(isPageProCategory({ id: 'event', entityType: 'event', group: 'communities' })).toBe(false);
  });

  it('routes Page Pro templates with template param', () => {
    const hub = resolveCreateNavigation(
      { id: 'template-community-hub', entityType: 'community', group: 'templates' },
      { templateId: 'community-hub' },
    );
    expect(hub.pathname).toBe('/hostspace/create/page');
    expect(hub.params.type).toBe('community');
    expect(hub.params.template).toBe('community-hub');

    const venue = resolveCreateNavigation(
      { id: 'template-indie-venue', entityType: 'venue', group: 'templates' },
      { templateId: 'indie-venue' },
    );
    expect(venue.pathname).toBe('/hostspace/venue/create');
    expect(venue.params.template).toBe('indie-venue');
  });
});