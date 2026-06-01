import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useSegments } from 'expo-router';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
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

    const protectedRoutes = [
      'profile',
      'tickets',
      'checkout',
      'payment',
      'saved',
      'settings',
      'membership',
      'submit',
      'scanner',
      'notifications',
      'contacts',
      'admin',
      'network',
      'create',
    ];

    const membershipGuestMarketing =
      segments[0] === 'membership' &&
      (segments[1] === undefined || segments[1] === 'index' || segments[1] === 'upgrade');

    const isProtected =
      (protectedRoutes.includes(segments[0] as string) &&
        !(segments[0] === 'membership' && membershipGuestMarketing)) ||
      (segments[0] === '(tabs)' &&
        (segments[1] === 'profile' ||
          segments[1] === 'my-space' ||
          segments[1] === 'perks' ||
          segments[1] === 'calendar')) ||
      (segments[0] === 'event' && segments[1] === 'create');

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
      onboardingState.isComplete
    ) {
      router.replace('/(tabs)');
    }
  }, [user, emailVerified, segments, isRestoring, onboardingLoading, onboardingState.isComplete, router]);

  return null;
}