import React, { useMemo, useCallback } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import {
  ProfileHeroSection,
  ProfileActionButtons,
  ProfileLinksSection,
  ProfileMembershipSection,
  ProfileBioRootsSection,
  ProfileStatsActivitySection,
  ProfileIdentityContactSection,
  ProfileSignOutSection,
} from './sections';

interface ProfileContentProps {
  userId: string | null;
  displayUser: any;
  isOrganizer: boolean;
  isAdmin: boolean;
  matchedCultures: any[];
  tierKey: string;
  perks: any[];
  perksLoading: boolean;
  handleShare: () => void;
  setShowScanner: (show: boolean) => void;
  setShowCultureMap: (show: boolean) => void;
  logout: () => Promise<void>;
}

export function ProfileContent({
  userId,
  displayUser,
  isOrganizer,
  isAdmin,
  matchedCultures,
  tierKey,
  perks,
  perksLoading,
  handleShare,
  setShowScanner,
  setShowCultureMap,
  logout,
}: ProfileContentProps) {
  const nav = useCallback((path: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push(path as any);
  }, []);

  const displayName = displayUser?.displayName || displayUser?.username || 'CulturePass Member';
  const handle = displayUser?.handle ?? displayUser?.username;
  const locationText = [displayUser?.city, displayUser?.country].filter(Boolean).join(', ');
  const hasCultures = matchedCultures.length > 0;

  const languages = useMemo(() => {
    if (!displayUser?.languages) return [];
    if (Array.isArray(displayUser.languages)) return displayUser.languages;
    return (displayUser.languages as string).split(',').map(s => s.trim()).filter(Boolean);
  }, [displayUser?.languages]);

  return (
    <>
      <ProfileHeroSection
        displayUser={displayUser}
        displayName={displayName}
        handle={handle}
        locationText={locationText}
        hasCultures={hasCultures}
        matchedCultures={matchedCultures}
        setShowCultureMap={setShowCultureMap}
        nav={nav}
      />

      <ProfileActionButtons
        nav={nav}
        setShowScanner={setShowScanner}
        handleShare={handleShare}
      />

      <ProfileLinksSection
        isAdmin={isAdmin}
        isOrganizer={isOrganizer}
        nav={nav}
      />

      <ProfileMembershipSection
        tierKey={tierKey}
        createdAt={displayUser?.createdAt}
        rewardPoints={displayUser?.rewardPointsEarned ?? displayUser?.rewardPoints ?? 0}
        nav={nav}
      />

      <ProfileBioRootsSection
        displayUser={displayUser}
        languages={languages}
        matchedCultures={matchedCultures}
        setShowCultureMap={setShowCultureMap}
      />

      <ProfileStatsActivitySection
        displayUser={displayUser}
        perks={perks}
        perksLoading={perksLoading}
        nav={nav}
      />

      <ProfileIdentityContactSection
        userId={userId}
        displayUser={displayUser}
        tierKey={tierKey}
        locationText={locationText}
        nav={nav}
      />

      <ProfileSignOutSection logout={logout} />
    </>
  );
}
