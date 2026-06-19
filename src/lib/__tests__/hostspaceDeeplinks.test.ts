import {
  buildHostspaceManageHref,
  resolveHostspaceCreateRedirect,
  resolveHostspaceManageTab,
} from '../hostspaceDeeplinks';

describe('hostspaceDeeplinks', () => {
  describe('resolveHostspaceManageTab', () => {
    test('defaults to all', () => {
      expect(resolveHostspaceManageTab({})).toBe('all');
    });

    test('reads tab and manageTab aliases', () => {
      expect(resolveHostspaceManageTab({ tab: 'events' })).toBe('events');
      expect(resolveHostspaceManageTab({ manageTab: 'market' })).toBe('market');
    });

    test('ignores invalid tabs', () => {
      expect(resolveHostspaceManageTab({ tab: 'invalid' })).toBe('all');
    });
  });

  describe('buildHostspaceManageHref', () => {
    test('omits tab for all', () => {
      expect(buildHostspaceManageHref('all')).toBe('/hostspace');
      expect(buildHostspaceManageHref()).toBe('/hostspace');
    });

    test('adds tab query for filtered views', () => {
      expect(buildHostspaceManageHref('pages')).toBe('/hostspace?tab=pages');
    });
  });

  describe('resolveHostspaceCreateRedirect', () => {
    test('returns null for manage hub', () => {
      expect(resolveHostspaceCreateRedirect({})).toBeNull();
      expect(resolveHostspaceCreateRedirect({ tab: 'events' })).toBeNull();
    });

    test('redirects legacy panel=create to catalog', () => {
      expect(resolveHostspaceCreateRedirect({ panel: 'create' })).toBe('/hostspace/create');
    });

    test('redirects category to canonical create path', () => {
      expect(resolveHostspaceCreateRedirect({ category: 'venue' })).toBe('/hostspace/venue/create');
      expect(resolveHostspaceCreateRedirect({ panel: 'create', category: 'event' })).toBe(
        '/hostspace/event/create',
      );
    });

    test('redirects org/community categories to unified page form', () => {
      expect(resolveHostspaceCreateRedirect({ category: 'community' })).toBe(
        '/hostspace/create/page?type=community',
      );
      expect(resolveHostspaceCreateRedirect({ entityType: 'council' })).toBe(
        '/hostspace/create/page?type=council',
      );
    });

    test('forwards draft and intent params', () => {
      expect(
        resolveHostspaceCreateRedirect({ category: 'venue', draftId: 'd1', intent: 'onboarding' }),
      ).toBe('/hostspace/venue/create?draftId=d1&intent=onboarding');
    });
  });
});