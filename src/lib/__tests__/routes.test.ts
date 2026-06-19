import { sanitizeInternalRedirect, routeWithRedirect, normalizeSystemPath, remapLegacyPath } from '../routes';

describe('Route Utilities', () => {
  describe('sanitizeInternalRedirect', () => {
    test('should reject any redirect value that does not begin with /', () => {
      expect(sanitizeInternalRedirect('home')).toBeNull();
      expect(sanitizeInternalRedirect('https://evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('')).toBeNull();
      expect(sanitizeInternalRedirect(undefined)).toBeNull();
      expect(sanitizeInternalRedirect(null)).toBeNull();
    });

    test('should reject any redirect value that begins with //', () => {
      expect(sanitizeInternalRedirect('//evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('//path')).toBeNull();
    });

    test('should reject any redirect value that contains ://', () => {
      expect(sanitizeInternalRedirect('/path/to/https://evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('/path?param=https://evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('/path/http://example.com')).toBeNull();
    });

    test('should reject any redirect value whose path begins with /(onboarding) or equals /landing', () => {
      expect(sanitizeInternalRedirect('/(onboarding)/login')).toBeNull();
      expect(sanitizeInternalRedirect('/(onboarding)/signup')).toBeNull();
      expect(sanitizeInternalRedirect('/(onboarding)/index')).toBeNull();
      expect(sanitizeInternalRedirect('/landing')).toBeNull();
    });

    test('should return safe internal paths beginning with /', () => {
      expect(sanitizeInternalRedirect('/profile')).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect('/tickets/123')).toBe('/tickets/123');
      expect(sanitizeInternalRedirect('/pages/create')).toBe('/hostspace/create');
      expect(sanitizeInternalRedirect('/membership/plans')).toBe('/membership/plans');
    });

    test('should normalize tab shortcuts for onboarding redirects', () => {
      expect(sanitizeInternalRedirect('/community')).toBe('/(tabs)/community');
      expect(sanitizeInternalRedirect('/discover')).toBe('/(tabs)');
      expect(sanitizeInternalRedirect('/calendar')).toBe('/(tabs)/calendar');
      expect(sanitizeInternalRedirect('/myspace')).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect('/MySpace')).toBe('/myspace');
    });

    test('should handle array inputs correctly', () => {
      expect(sanitizeInternalRedirect(['/profile'])).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect(['/profile', '/tickets'])).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect(['/invalid', '/profile'])).toBe('/invalid'); // Takes first element
    });

    test('should never throw an exception for any input', () => {
      // These should all return safely without throwing
      expect(() => sanitizeInternalRedirect('string')).not.toThrow();
      expect(() => sanitizeInternalRedirect('/valid/path')).not.toThrow();
      expect(() => sanitizeInternalRedirect(null)).not.toThrow();
      expect(() => sanitizeInternalRedirect(undefined)).not.toThrow();
      expect(() => sanitizeInternalRedirect([])).not.toThrow();
      expect(() => sanitizeInternalRedirect({} as any)).not.toThrow();
      expect(() => sanitizeInternalRedirect(123 as any)).not.toThrow();
      expect(() => sanitizeInternalRedirect(true as any)).not.toThrow();
    });
  });

  describe('routeWithRedirect', () => {
    test('should return pathname when redirectTo is invalid', () => {
      expect(routeWithRedirect('/login', null)).toBe('/login');
      expect(routeWithRedirect('/login', 'invalid')).toBe('/login');
      expect(routeWithRedirect('/login', '//evil.com')).toBe('/login');
    });

    test('should return object with params when redirectTo is valid', () => {
      const result = routeWithRedirect('/login', '/profile');
      expect(result).toEqual({
        pathname: '/login',
        params: { redirectTo: '/(tabs)/myspace' }
      });
    });

    test('should handle complex redirect paths', () => {
      const result = routeWithRedirect('/login', '/pages/create?entityType=creator');
      expect(result).toEqual({
        pathname: '/login',
        params: { redirectTo: '/hostspace/creator/create' }
      });
    });
  });

  describe('normalizeSystemPath', () => {
    test('should allow trusted production deep links', () => {
      expect(normalizeSystemPath('https://culturepass.app/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
      expect(normalizeSystemPath('https://culturekerala.com/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
    });

    test('should allow local development deep links', () => {
      expect(normalizeSystemPath('http://localhost:8081/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
      expect(normalizeSystemPath('http://127.0.0.1:8081/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
      expect(normalizeSystemPath('http://192.168.1.105:8081/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
      expect(normalizeSystemPath('http://myphone.local:8081/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
    });

    test('should block untrusted deep links', () => {
      expect(normalizeSystemPath('https://evil.com/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe('/');
    });

    test('should fall back to raw path for non-url strings', () => {
      expect(normalizeSystemPath('/culturehub/kerala?country=Australia&scope=single&state=NSW')).toBe(
        '/culturehub/kerala?country=Australia&scope=single&state=NSW'
      );
    });

    test('should remap legacy MySpace paths to /myspace', () => {
      expect(remapLegacyPath('/my-space')).toBe('/myspace');
      expect(remapLegacyPath('/MySpace')).toBe('/myspace');
    });

    test('should remap legacy listing create to hostspace category create', () => {
      expect(remapLegacyPath('/listing/create')).toBe('/hostspace/business/create');
      expect(remapLegacyPath('/listing/create?listingEntityType=community')).toBe(
        '/hostspace/community/create',
      );
    });

    test('should remap legacy /pages/create paths to /hostspace/create', () => {
      expect(remapLegacyPath('/pages/create')).toBe('/hostspace/create');
      expect(remapLegacyPath('/pages/create?category=community')).toBe('/hostspace/community/create');
      expect(remapLegacyPath('/pages/create/listing')).toBe('/hostspace/listing');
      expect(remapLegacyPath('/hostspace/create')).toBe('/hostspace/create');
      expect(remapLegacyPath('/hostspace/create/page')).toBe('/hostspace/create/page');
      expect(remapLegacyPath('/hostspace/create/page?entityType=community')).toBe(
        '/hostspace/create/page?entityType=community',
      );
      expect(remapLegacyPath('/event/create')).toBe('/hostspace/event/create');
      expect(remapLegacyPath('/hostspace?panel=create&category=venue')).toBe('/hostspace/venue/create');
      expect(remapLegacyPath('/hostspace?category=community&intent=onboarding')).toBe(
        '/hostspace/community/create?intent=onboarding',
      );
      expect(remapLegacyPath('/hostspace?entityType=venue')).toBe('/hostspace/venue/create');
    });

    test('should normalize legacy paths (restaurant, movie, shop, perk, activity)', () => {
      expect(normalizeSystemPath('/restaurant/123')).toBe('/b/123');
      expect(normalizeSystemPath('/restaurants/123')).toBe('/b/123');
      expect(normalizeSystemPath('/movie/123')).toBe('/e/123');
      expect(normalizeSystemPath('/movies/123')).toBe('/e/123');
      expect(normalizeSystemPath('/shop/123')).toBe('/CultureMarket/123');
      expect(normalizeSystemPath('/perk/123')).toBe('/perks/123');
      expect(normalizeSystemPath('/activity/123')).toBe('/activities/123');
    });
  });
});