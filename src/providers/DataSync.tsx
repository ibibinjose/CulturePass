import { useEffect, useRef } from 'react';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth, subscriptionTierForOnboarding } from '@/lib/auth';
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
        const hasCulture =
          !!(user.culturalIdentity?.nationalityId || (user.culturalIdentity?.cultureIds?.length ?? 0) > 0);
        const profileLooksEstablished =
          !!user.city &&
          !!user.country &&
          ((user.interests?.length ?? 0) > 0 ||
            (user.communities?.length ?? 0) > 0 ||
            hasCulture ||
            !!user.lgaCode ||
            !!user.councilId);
        if (!state.isComplete && profileLooksEstablished) {
          await completeOnboarding();
        }
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
