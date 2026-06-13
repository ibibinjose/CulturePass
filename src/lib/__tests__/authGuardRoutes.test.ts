import { describe, expect, it } from '@jest/globals';
import { isAuthProtectedRoute, isPrivateProfileRoute } from '../authGuardRoutes';

describe('authGuardRoutes', () => {
  describe('isPrivateProfileRoute', () => {
    it('protects MySpace shell routes', () => {
      expect(isPrivateProfileRoute(['profile'])).toBe(true);
      expect(isPrivateProfileRoute(['profile', 'edit'])).toBe(true);
      expect(isPrivateProfileRoute(['profile', 'qr'])).toBe(true);
    });

    it('allows public entity profiles', () => {
      expect(isPrivateProfileRoute(['profile', 'community-abc'])).toBe(false);
      expect(isPrivateProfileRoute(['profile', 'CP-U590D86'])).toBe(false);
    });
  });

  describe('isAuthProtectedRoute', () => {
    it('protects private profile and create flows', () => {
      expect(isAuthProtectedRoute(['profile'])).toBe(true);
      expect(isAuthProtectedRoute(['profile', 'community-1'])).toBe(false);
      expect(isAuthProtectedRoute(['pages', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['listing', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['hostspace', 'community', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['hostspace', 'event', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['(tabs)', 'myspace'])).toBe(true);
    });

    it('allows public marketing membership routes', () => {
      expect(isAuthProtectedRoute(['membership'])).toBe(false);
      expect(isAuthProtectedRoute(['membership', 'upgrade'])).toBe(false);
      expect(isAuthProtectedRoute(['membership', 'plans'])).toBe(true);
    });

    it('allows public static routes', () => {
      expect(isAuthProtectedRoute(['(static)', 'about'])).toBe(false);
      expect(isAuthProtectedRoute(['event', 'abc123'])).toBe(false);
    });
  });
});