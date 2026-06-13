import { useEffect, useRef } from 'react';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth, subscriptionTierForOnboarding } from '@/lib/auth';
import {
  isLocalOnboardingMidFlow,
  isServerOnboardingProfileComplete,
} from '@/lib/onboardingCompletion';
import { identifyUser, resetUser } from '@/lib/analytics';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Bridges auth user state into OnboardingContext without making AuthProvider
 * depend on OnboardingContext (avoids circular deps). Render inside both providers.
 */
export function DataSync() {
  const { user } = useAuth();
  const {
    setCity,
    setCountry,
    setInterests,
    setCommunities,
    setSubscriptionTier,
    state,
    resetOnboarding,
    completeOnboarding,
  } = useOnboarding();
  const prevUserIdRef = useRef<string | null>(null);

  usePushNotifications();

  useEffect(() => {
    async function syncOnboarding() {
      if (user && prevUserIdRef.current !== user.id) {
        prevUserIdRef.current = user.id;
        identifyUser(user.id, {
          email: user.email,
          city: user.city,
          country: user.country,
          subscriptionTier: user.subscriptionTier,
        });
      } else if (!user && prevUserIdRef.current !== null) {
        prevUserIdRef.current = null;
        resetUser();
        resetOnboarding();
        return;
      }

      if (!user) return;

      // During redo/mid-flow onboarding, local state owns the truth — do not re-hydrate from server.
      if (state.isComplete) {
        if (user.city && user.city !== state.city) setCity(user.city);
        if (user.country && user.country !== state.country) setCountry(user.country);
        if (JSON.stringify(user.interests ?? []) !== JSON.stringify(state.interests)) {
          setInterests(user.interests ?? []);
        }
        if (JSON.stringify(user.communities ?? []) !== JSON.stringify(state.communities)) {
          setCommunities(user.communities ?? []);
        }
        const nextTier = subscriptionTierForOnboarding(user.subscriptionTier);
        if (nextTier !== state.subscriptionTier) {
          setSubscriptionTier(nextTier);
        }
      } else if (
        isServerOnboardingProfileComplete(user) &&
        !isLocalOnboardingMidFlow(state, user.interests?.length ?? 0)
      ) {
        await completeOnboarding();
      }
    }
    syncOnboarding();
  }, [
    user,
    user?.id,
    user?.city,
    user?.country,
    user?.interests,
    user?.communities,
    user?.subscriptionTier,
    state.isComplete,
    state.city,
    state.country,
    state.interests,
    state.communities,
    state.subscriptionTier,
    setCity,
    setCountry,
    setInterests,
    setCommunities,
    setSubscriptionTier,
    completeOnboarding,
    resetOnboarding,
  ]);

  return null;
}
