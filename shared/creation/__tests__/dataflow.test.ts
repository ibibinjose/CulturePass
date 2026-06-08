import { describe, it, expect } from '@jest/globals';
import { resolveCreationDataflow, WIZARD_PATHS, PLATFORM_DATAFLOW } from '../dataflow';

describe('resolveCreationDataflow', () => {
  it('routes events to event wizard and events collection', () => {
    const flow = resolveCreationDataflow({
      id: 'event',
      entityType: 'event',
      group: 'events',
      kind: 'content',
      contentKind: 'event',
      requiresParent: true,
    });
    expect(flow.wizard).toBe('event');
    expect(flow.storage).toBe('events');
    expect(flow.manageTab).toBe('events');
    expect(flow.requiresParent).toBe(true);
  });

  it('routes venue pages to page-pro and hostPages', () => {
    const flow = resolveCreationDataflow({
      id: 'venue',
      entityType: 'venue',
      group: 'venues',
    });
    expect(flow.layer).toBe('owner');
    expect(flow.wizard).toBe('page-pro');
    expect(flow.storage).toBe('hostPages');
    expect(flow.draftStorage).toBe('hostPageDrafts');
    expect(flow.manageTab).toBe('pages');
  });

  it('routes offers to listings collection with offers tab', () => {
    const flow = resolveCreationDataflow({
      id: 'offer',
      entityType: 'business',
      group: 'events',
      kind: 'content',
      contentKind: 'offer',
      requiresParent: true,
    });
    expect(flow.wizard).toBe('listing');
    expect(flow.manageTab).toBe('offers');
  });

  it('routes CultureMarket to cultureShopListings', () => {
    const flow = resolveCreationDataflow({
      id: 'market-product',
      entityType: 'business',
      group: 'market',
      subCategory: 'product',
    });
    expect(flow.layer).toBe('market');
    expect(flow.wizard).toBe('culture-market');
    expect(flow.storage).toBe('cultureShopListings');
    expect(flow.manageTab).toBe('market');
  });

  it('exposes wizard paths for all wizard kinds', () => {
    expect(WIZARD_PATHS.event).toBe('/event/create');
    expect(WIZARD_PATHS['culture-market']).toBe('/pages/create/listing');
  });

  it('documents Firebase-backed platform flow', () => {
    expect(PLATFORM_DATAFLOW.database).toBe('Firestore (not Supabase)');
    expect(PLATFORM_DATAFLOW.collections.owner).toContain('hostPages');
  });
});