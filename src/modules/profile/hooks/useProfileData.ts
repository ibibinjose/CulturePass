import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/hooks/useRole';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { usePerks } from '@/hooks/queries/usePerks';
import { identityFeature } from '@/features';
import { NATIONALITIES } from '@/constants/cultures';
import { NAT_COORDS } from '@/modules/profile/components/tabs/ProfileUtils';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { User } from '@shared/schema';

export function useProfileData() {
  const { userId, user: authUser, logout } = useAuth();
  const { isOrganizer, isAdmin } = useRole();
  const { state: onboarding } = useOnboarding();
  const queryClient = useQueryClient();

  const {
    data: featureUser,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['feature-identity-profile', userId],
    queryFn: () => identityFeature.getIdentityFeatureProfile(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: perks = [], isLoading: perksLoading, refetch: refetchPerks } = usePerks();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchPerks()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProfile, refetchPerks]);

  const displayUser = useMemo((): Partial<User> => {
    const a = (authUser ?? {}) as Partial<User>;
    const u = (featureUser ?? {}) as Partial<User>;
    return {
      ...a,
      ...u,
      id: (u.id ?? a.id ?? userId) as string | undefined,
      email: u.email ?? a.email,
      username: u.username ?? a.username,
      displayName: u.displayName ?? a.displayName,
      city: u.city ?? a.city,
      country: u.country ?? a.country,
      bio: u.bio ?? a.bio,
      avatarUrl: u.avatarUrl ?? a.avatarUrl,
      handle: u.handle ?? a.handle,
      createdAt: u.createdAt ?? a.createdAt,
      culturePassId: u.culturePassId ?? a.culturePassId,
      website: u.website ?? a.website,
      phone: u.phone ?? a.phone,
      followersCount: u.followersCount ?? a.followersCount,
      followingCount: u.followingCount ?? a.followingCount,
      likesCount: u.likesCount ?? a.likesCount,
      socialLinks: u.socialLinks ?? a.socialLinks,
      membership: u.membership ?? a.membership,
      languages: u.languages ?? a.languages,
      communities: u.communities ?? a.communities,
      interests: u.interests ?? a.interests,
      ethnicityText: u.ethnicityText ?? a.ethnicityText,
      lgaCode: u.lgaCode ?? a.lgaCode,
      councilId: u.councilId ?? a.councilId,
    };
  }, [featureUser, authUser, userId]);

  const matchedCultures = useMemo(() => {
    const natId = onboarding?.nationalityId;
    const cultureIds: string[] = onboarding?.cultureIds ?? [];
    const natIds = new Set<string>(natId ? [natId] : []);
    cultureIds.forEach((cid) => {
      const nat = Object.values(NATIONALITIES).find((n) => n.cultureIds.includes(cid));
      if (nat) natIds.add(nat.id);
    });
    return Array.from(natIds)
      .map((id, idx) => {
        const nat = NATIONALITIES[id];
        const coords = NAT_COORDS[id];
        if (!nat || !coords) return null;
        return {
          id: `${id}-${idx}`,
          name: nat.label,
          emoji: nat.emoji,
          lat: coords.lat,
          lng: coords.lng,
          color: CultureTokens.gold,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [onboarding?.nationalityId, onboarding?.cultureIds]);

  const tierKey = useMemo(() => {
    const raw = String(
      featureUser?.membership?.tier ?? authUser?.subscriptionTier ?? 'free'
    ).toLowerCase();
    return raw === 'sydney-local' ? 'plus' : raw;
  }, [featureUser?.membership?.tier, authUser?.subscriptionTier]);

  return {
    userId,
    authUser,
    displayUser,
    isOrganizer,
    isAdmin,
    onboarding,
    perks,
    perksLoading,
    refreshing,
    onRefresh,
    isProfileLoading,
    isProfileError,
    profileError,
    refetchProfile,
    matchedCultures,
    tierKey,
    logout,
    queryClient,
  };
}
