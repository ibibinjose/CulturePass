// src/modules/profile/screens/ProfileTabScreen.tsx
//
// Material 3 Expressive — My Space tab
// Surface hierarchy: background → surfaceContainerLow (cards) → surfaceContainer →
//   surfaceContainerHigh (stats bar, pressed rows) → LiquidGlass (hero, identity)
// Text roles: onSurface (primary) · onSurfaceVariant (secondary) · onBackground (page)

import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  Platform, Share, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffectiveMainTabTopInset } from '@/hooks/useEffectiveMainTabTopInset';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { canonicalUserPath, siteUrl } from '@/lib/publicPaths';
import { profileShareDescription, profileShareMessage, profileShareTitle } from '@/lib/profileShare';
import {
  gradients, FontFamily,
  MaterialExpressive,
} from '@/design-system/tokens/theme';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { GuestProfileView } from '@/modules/profile/components/private/GuestProfileView';
import { ProfileScanner } from '@/components/scanner/ProfileScanner';
import {
  ProfileSkeleton,
  CultureMapModal,
} from '@/modules/profile/components/tabs/ProfileComponents';
import { useProfileData } from '../hooks/useProfileData';
import { ProfileContent } from '../components/tabs/ProfileContent';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const MY_SPACE_HEAD_TITLE = `My Space · ${APP_NAME}`;
const MY_SPACE_HEAD_DESC =
  'Your CulturePass home — profile, tickets, perks, and identity in one place.';
const MY_SPACE_HEAD_URL = `${SITE_ORIGIN}/my-space`;

function MySpaceHead() {
  return (
    <Head>
      <title>{MY_SPACE_HEAD_TITLE}</title>
      <meta name="description" content={MY_SPACE_HEAD_DESC} />
      <meta property="og:title" content={MY_SPACE_HEAD_TITLE} />
      <meta property="og:description" content={MY_SPACE_HEAD_DESC} />
      <meta property="og:url" content={MY_SPACE_HEAD_URL} />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={MY_SPACE_HEAD_URL} />
    </Head>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const effectiveTop = useEffectiveMainTabTopInset();
  const colors = useColors();
  const m3 = useM3Colors();

  const [showCultureMap, setShowCultureMap] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const {
    userId,
    displayUser,
    isOrganizer,
    isAdmin,
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
  } = useProfileData();

  const handleShare = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const name = displayUser?.displayName || displayUser?.username || 'a CulturePass member';
    const shareUrl = siteUrl(
      canonicalUserPath({
        id: userId || displayUser?.id || '',
        handle: displayUser?.handle,
        handleStatus: displayUser?.handleStatus,
        culturePassId: displayUser?.culturePassId,
      }),
    );
    const shareUser = {
      id: userId || displayUser?.id || '',
      displayName: name,
      username: displayUser?.username,
      handle: displayUser?.handle,
      handleStatus: displayUser?.handleStatus,
      culturePassId: displayUser?.culturePassId,
      bio: displayUser?.bio,
      avatarUrl: displayUser?.avatarUrl,
    };
    const title = profileShareTitle(shareUser);
    const message = profileShareMessage(shareUser);
    const text = profileShareDescription(shareUser);
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ title, text, url: shareUrl });
        else await navigator.clipboard?.writeText(shareUrl);
      } else if (Platform.OS === 'ios') await Share.share({ title, message: text, url: shareUrl });
      else await Share.share({ title, message });
    } catch { /* user cancelled */ }
  }, [displayUser, userId]);

  if (!userId) {
    return (
      <>
        <MySpaceHead />
        <GuestProfileView />
      </>
    );
  }
  if (isProfileLoading && !displayUser?.username && !displayUser?.email) {
    return (
      <>
        <MySpaceHead />
        <ProfileSkeleton colors={colors} topInset={effectiveTop} />
      </>
    );
  }

  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const handle = displayUser?.handle ?? displayUser?.username;

  return (
    <ErrorBoundary>
      <MySpaceHead />
      <View style={[sc.root, { backgroundColor: m3.background }]}>
        {/* Ambient brand gradient — decorative, behind all content */}
        <LinearGradient
          colors={[gradients.culturepassBrand[0] + '10', m3.background, m3.background]}
          locations={[0, 0.3, 1]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ProfileScanner
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            void queryClient.invalidateQueries({ queryKey: ['feature-identity-profile'] });
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={m3.primary} colors={[m3.primary]} />
          }
        >
          {/* ── PROFILE HEADER — compact, bigger logo + title ────────── */}
          <View style={[sc.profileBar, { paddingTop: (Platform.OS === 'web' ? 0 : insets.top) + 16 }]}>
            <View style={sc.profileBarRow}>
              {/* Brand lockup */}
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={sc.profileBarLogo}
                contentFit="contain"
              />
              <View style={sc.profileBarCenter}>
                <Text style={[sc.profileBarTitle, { color: m3.onBackground }]}>My space</Text>
                {handle ? (
                  <Text style={[sc.profileBarSub, { color: m3.onSurfaceVariant }]}>@{handle}</Text>
                ) : null}
              </View>
              {/* Glass action buttons */}
              <View style={sc.profileBarActions}>
                <Pressable
                  onPress={() => router.push('/profile/edit')}
                  style={[sc.profileBarBtn, { backgroundColor: m3.surfaceContainerHigh, borderColor: m3.outlineVariant }]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                >
                  <Ionicons name="pencil-outline" size={18} color={m3.onSurface} />
                </Pressable>
                <Pressable
                  onPress={() => router.push('/settings')}
                  style={[sc.profileBarBtn, { backgroundColor: m3.surfaceContainerHigh, borderColor: m3.outlineVariant }]}
                  accessibilityRole="button"
                  accessibilityLabel="Settings"
                >
                  <Ionicons name="settings-outline" size={18} color={m3.onSurface} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Error banner */}
          {isProfileError ? (
            <Pressable
              onPress={() => void refetchProfile()}
              style={[sc.errorBanner, { backgroundColor: m3.errorContainer, borderColor: m3.error + '55' }]}
              accessibilityRole="button"
              accessibilityLabel="Profile could not load. Tap to retry."
            >
              <Ionicons name="cloud-offline-outline" size={16} color={m3.onErrorContainer} />
              <Text style={[sc.errorText, { color: m3.onErrorContainer }]} numberOfLines={2}>
                {profileError instanceof Error ? profileError.message : 'Could not refresh profile.'}{' '}Tap to retry.
              </Text>
            </Pressable>
          ) : null}

          <ProfileContent
            userId={userId}
            displayUser={displayUser}
            isOrganizer={isOrganizer}
            isAdmin={isAdmin}
            matchedCultures={matchedCultures}
            tierKey={tierKey}
            perks={perks}
            perksLoading={perksLoading}
            handleShare={handleShare}
            setShowScanner={setShowScanner}
            setShowCultureMap={setShowCultureMap}
            logout={logout}
          />

        </ScrollView>

        {matchedCultures.length > 0 ? (
          <CultureMapModal
            visible={showCultureMap}
            onClose={() => setShowCultureMap(false)}
            cultures={matchedCultures}
            colors={colors}
          />
        ) : null}
      </View>
    </ErrorBoundary>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1 },
  // ── Custom compact profile header ─────────────────────────
  profileBar: { paddingBottom: 6 },
  profileBarRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, gap: 12,
  },
  profileBarLogo: { width: 44, height: 44, borderRadius: 13, flexShrink: 0 },
  profileBarCenter: { flex: 1, justifyContent: 'center' },
  profileBarTitle: {
    fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5, lineHeight: 28,
  },
  profileBarSub: { fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 17, marginTop: 1 },
  profileBarActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  profileBarBtn: {
    width: 38, height: 38,
    borderRadius: MaterialExpressive.shape.cornerLarge,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 8, marginHorizontal: 16, padding: 14,
    borderRadius: MaterialExpressive.shape.cornerMedium, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium },
});
