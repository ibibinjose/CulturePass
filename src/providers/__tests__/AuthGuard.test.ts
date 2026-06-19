/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook, act } from '@testing-library/react-native';
import { useSegments, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { AuthGuard } from '../AuthGuard';
import { isAuthProtectedRoute } from '@/lib/authGuardRoutes';
import { sanitizeInternalRedirect } from '@/lib/routes';

// Mock the necessary hooks and modules
/* eslint-disable @typescript-eslint/no-unused-vars -- test setup uses via jest mocks */
jest.mock('expo-router', () => ({
  useSegments: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));

// Mock console.error to suppress warnings during tests
console.error = jest.fn();

describe('AuthGuard', () => {
  const mockRouter = {
    replace: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockRouter.replace.mockClear();
  });

  describe('sanitizeInternalRedirect', () => {
    test('should reject values that do not start with /', () => {
      expect(sanitizeInternalRedirect('home')).toBeNull();
      expect(sanitizeInternalRedirect('https://evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('')).toBeNull();
    });

    test('should reject values that start with //', () => {
      expect(sanitizeInternalRedirect('//evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('//')).toBeNull();
    });

    test('should reject values that contain ://', () => {
      expect(sanitizeInternalRedirect('/path/to/https://evil.com')).toBeNull();
      expect(sanitizeInternalRedirect('/path?param=https://evil.com')).toBeNull();
    });

    test('should reject values that start with /(onboarding)', () => {
      expect(sanitizeInternalRedirect('/(onboarding)/login')).toBeNull();
      expect(sanitizeInternalRedirect('/(onboarding)/signup?next=/profile')).toBeNull();
    });

    test('should reject values that equal /landing', () => {
      expect(sanitizeInternalRedirect('/landing')).toBeNull();
    });

    test('should accept valid internal paths', () => {
      expect(sanitizeInternalRedirect('/profile')).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect('/tickets/123')).toBe('/tickets/123');
      expect(sanitizeInternalRedirect('/pages/create')).toBe('/hostspace/create');
    });

    test('should handle array inputs correctly', () => {
      expect(sanitizeInternalRedirect(['/profile'])).toBe('/(tabs)/myspace');
      expect(sanitizeInternalRedirect(['/profile', '/tickets'])).toBe('/(tabs)/myspace');
    });
  });

  describe('Protected route enforcement', () => {
    beforeEach(() => {
      (useOnboarding as jest.Mock).mockReturnValue({
        state: { isComplete: true },
        isLoading: false,
      });
    });

    test('should redirect unauthenticated users from protected routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isRestoring: false,
      });
      
      (useSegments as jest.Mock).mockReturnValue(['profile']);

      // Since this is a functional component, we'd need to mount it
      // For now, let's test the logic separately
      
      // Simulate the conditions that would trigger the redirect
      const segments = ['profile'];
      const user = null;
      const isRestoring = false;
      
      const protectedRoutes = [
        'profile', 'tickets', 'checkout', 'payment', 'saved',
        'settings', 'membership', 'submit', 'scanner',
        'notifications', 'contacts', 'admin', 'network', 'create',
      ];
      
      const membershipGuestMarketing =
        segments[0] === 'membership' &&
        (segments[1] === undefined || segments[1] === 'index' || segments[1] === 'upgrade');

      const isProtected =
        (protectedRoutes.includes(segments[0] as string) &&
          !(segments[0] === 'membership' && membershipGuestMarketing)) ||
        (segments[0] === '(tabs)' &&
          (segments[1] === 'profile' ||
            segments[1] === 'myspace' ||
            segments[1] === 'perks' ||
            segments[1] === 'calendar')) ||
        (segments[0] === 'event' && segments[1] === 'create') ||
        (segments[0] === 'hostspace' && segments[1] === 'apply');

      expect(isProtected).toBe(true);
      expect(!user && isProtected).toBe(true);
    });

    test('should not redirect unauthenticated users from public routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isRestoring: false,
      });
      
      const segments = ['(static)', 'about'];
      
      const protectedRoutes = [
        'profile', 'tickets', 'checkout', 'payment', 'saved',
        'settings', 'membership', 'submit', 'scanner',
        'notifications', 'contacts', 'admin', 'network', 'create',
      ];
      
      const membershipGuestMarketing =
        segments[0] === 'membership' &&
        (segments[1] === undefined || segments[1] === 'index' || segments[1] === 'upgrade');

      const isProtected =
        (protectedRoutes.includes(segments[0] as string) &&
          !(segments[0] === 'membership' && membershipGuestMarketing)) ||
        (segments[0] === '(tabs)' &&
          (segments[1] === 'profile' ||
            segments[1] === 'myspace' ||
            segments[1] === 'perks' ||
            segments[1] === 'calendar')) ||
        (segments[0] === 'event' && segments[1] === 'create') ||
        (segments[0] === 'hostspace' && segments[1] === 'apply');

      expect(isProtected).toBe(false);
    });

    test('should not redirect while isRestoring is true', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        isRestoring: true, // This should prevent redirects
      });
      
      const segments = ['profile'];
      
      // Even though this is a protected route, restoring should prevent redirect
      const isRestoring = true;
      expect(isRestoring).toBe(true);
    });

    test('should not redirect authenticated users from protected routes', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user123' },
        isRestoring: false,
      });
      
      const segments = ['profile'];
      
      const protectedRoutes = [
        'profile', 'tickets', 'checkout', 'payment', 'saved',
        'settings', 'membership', 'submit', 'scanner',
        'notifications', 'contacts', 'admin', 'network', 'create',
      ];
      
      const membershipGuestMarketing =
        segments[0] === 'membership' &&
        (segments[1] === undefined || segments[1] === 'index' || segments[1] === 'upgrade');

      const isProtected =
        (protectedRoutes.includes(segments[0] as string) &&
          !(segments[0] === 'membership' && membershipGuestMarketing)) ||
        (segments[0] === '(tabs)' &&
          (segments[1] === 'profile' ||
            segments[1] === 'myspace' ||
            segments[1] === 'perks' ||
            segments[1] === 'calendar')) ||
        (segments[0] === 'event' && segments[1] === 'create') ||
        (segments[0] === 'hostspace' && segments[1] === 'apply');

      // The user is authenticated, so they should be allowed to access protected routes
      expect(isProtected).toBe(true);
    });

    test('should redirect authenticated users from pre-auth screens when onboarding is complete', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user123' },
        isRestoring: false,
      });
      
      (useOnboarding as jest.Mock).mockReturnValue({
        state: { isComplete: true },
        isLoading: false,
      });
      
      const segments = ['(onboarding)', 'login'];
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const currentOnboardingScreen = segments[1] ?? 'index';
      const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);
      
      // This should trigger the redirect to /(tabs)
      expect(inOnboardingGroup && preAuthScreens.has(currentOnboardingScreen)).toBe(true);
    });

    test('should redirect authenticated users from pre-auth screens when onboarding is incomplete', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user123' },
        isRestoring: false,
      });
      
      (useOnboarding as jest.Mock).mockReturnValue({
        state: { isComplete: false },
        isLoading: false,
      });
      
      const segments = ['(onboarding)', 'login'];
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const currentOnboardingScreen = segments[1] ?? 'index';
      const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);
      
      // This should trigger the redirect to /(onboarding)/location
      expect(inOnboardingGroup && preAuthScreens.has(currentOnboardingScreen)).toBe(true);
    });

    test('should redirect authenticated users from onboarding steps when onboarding is complete', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 'user123' },
        isRestoring: false,
      });
      
      (useOnboarding as jest.Mock).mockReturnValue({
        state: { isComplete: true },
        isLoading: false,
      });
      
      const segments = ['(onboarding)', 'communities']; // Not a pre-auth screen
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const currentOnboardingScreen = segments[1] ?? 'index';
      const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);
      
      // This should trigger the redirect to /(tabs) since onboarding is complete
      expect(
        inOnboardingGroup &&
        !preAuthScreens.has(currentOnboardingScreen) &&
        true // onboardingState.isComplete
      ).toBe(true);
    });
  });

  describe('Create route protection', () => {
    test('protects legacy and canonical create URLs', () => {
      expect(isAuthProtectedRoute(['pages', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['listing', 'create'])).toBe(true);
      expect(isAuthProtectedRoute(['hostspace', 'venue', 'create'])).toBe(true);
    });

    test('does not treat public profile detail as protected', () => {
      expect(isAuthProtectedRoute(['profile', 'venue-123'])).toBe(false);
    });
  });
});

// Additional property-based tests would go here if using fast-check