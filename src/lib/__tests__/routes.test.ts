import { sanitizeInternalRedirect, routeWithRedirect } from '../routes';

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
      expect(sanitizeInternalRedirect('/profile')).toBe('/profile');
      expect(sanitizeInternalRedirect('/tickets/123')).toBe('/tickets/123');
      expect(sanitizeInternalRedirect('/hostspace/apply')).toBe('/hostspace/apply');
      expect(sanitizeInternalRedirect('/membership/plans')).toBe('/membership/plans');
    });

    test('should handle array inputs correctly', () => {
      expect(sanitizeInternalRedirect(['/profile'])).toBe('/profile');
      expect(sanitizeInternalRedirect(['/profile', '/tickets'])).toBe('/profile');
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
        params: { redirectTo: '/profile' }
      });
    });

    test('should handle complex redirect paths', () => {
      const result = routeWithRedirect('/login', '/hostspace/apply?initialTypes=creator');
      expect(result).toEqual({
        pathname: '/login',
        params: { redirectTo: '/hostspace/apply?initialTypes=creator' }
      });
    });
  });
});