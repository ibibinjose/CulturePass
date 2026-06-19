import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { isAuthProtectedRoute } from '@/lib/authGuardRoutes';
import { routeWithRedirect } from '@/lib/routes';

/**
 * Global route protector: guests → login; authenticated users → tabs or onboarding.
 */
export function AuthGuard() {
  const { user, isRestoring, emailVerified } = useAuth();
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (isRestoring) return;

    const isProtected = isAuthProtectedRoute(segments);

    const inOnboardingGroup = segments[0] === '(onboarding)';
    const currentOnboardingScreen = segments[1] ?? 'index';
    const preAuthScreens = new Set(['index', 'login', 'signup', 'forgot-password']);

    if (!user && isProtected) {
      const redirectTo =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : `/${segments.join('/')}`;
      router.replace(routeWithRedirect('/(onboarding)/login', redirectTo) as never);
    } else if (
      user &&
      !emailVerified
    ) {
      if (segments[0] !== '(onboarding)' || segments[1] !== 'verify-email') {
        router.replace('/(onboarding)/verify-email');
      }
    } else if (
      user &&
      !onboardingLoading &&
      inOnboardingGroup &&
      currentOnboardingScreen === 'verify-email'
    ) {
      router.replace(onboardingState.isComplete ? '/(tabs)' : '/(onboarding)/location');
    } else if (
      user &&
      !onboardingLoading &&
      inOnboardingGroup &&
      preAuthScreens.has(currentOnboardingScreen)
    ) {
      router.replace(onboardingState.isComplete ? '/(tabs)' : '/(onboarding)/location');
    } else if (
      user &&
      !onboardingLoading &&
      inOnboardingGroup &&
      !preAuthScreens.has(currentOnboardingScreen) &&
      onboardingState.isComplete &&
      // Interests finishes into Creation Lab — avoid racing router.push('/hostspace/create')
      currentOnboardingScreen !== 'interests'
    ) {
      router.replace('/(tabs)');
    }
  }, [user, emailVerified, segments, isRestoring, onboardingLoading, onboardingState.isComplete, router]);

  return null;
}