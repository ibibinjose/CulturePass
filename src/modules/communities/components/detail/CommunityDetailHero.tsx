import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { M3Button } from '@/design-system/ui';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { getCommunityLabel } from '@/lib/community';
import type { Community } from '@/shared/schema';

function StatPill({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[heroStyles.statValue, accent ? { color: accent } : { color: '#fff' }]}>{value}</Text>
      <Text style={heroStyles.statLabel}>{label}</Text>
    </View>
  );
}

function HeroIdentity({
  community,
  locationLabel,
  headline,
  memberCountValue,
  eventCount,
  activityLabel,
  activityColor,
  isJoined,
  joinPending,
  onJoinToggle,
  webLayout,
}: {
  community: Community;
  locationLabel: string | null;
  headline: string;
  memberCountValue: number;
  eventCount: number;
  activityLabel: string;
  activityColor?: string;
  isJoined: boolean;
  joinPending: boolean;
  onJoinToggle: () => void;
  webLayout: boolean;
}) {
  const m3Colors = useM3Colors();
  const { hPad } = useLayout();
  const showHeadline = headline !== community.description;

  const body = (
    <>
      <View
        style={[
          heroStyles.heroAvatar,
          webLayout && heroStyles.heroAvatarWeb,
          { backgroundColor: m3Colors.primaryContainer, borderColor: 'rgba(255,255,255,0.4)' },
        ]}
      >
        {community.imageUrl ? (
          <Image source={{ uri: community.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Text style={[heroStyles.heroAvatarInitial, { color: m3Colors.onPrimaryContainer }]}>
            {community.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={heroStyles.heroNameScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            heroStyles.heroName,
            webLayout && heroStyles.heroNameWeb,
            M3Typography.headlineLarge,
            { color: '#fff' },
          ]}
          numberOfLines={1}
        >
          {community.name}
        </Text>
      </ScrollView>

      <Text style={[heroStyles.heroLabel, M3Typography.labelLarge, { color: 'rgba(255,255,255,0.8)' }]}>
        {getCommunityLabel(community)}
        {locationLabel ? ` · ${locationLabel}` : ''}
      </Text>

      {showHeadline ? (
        <Text
          style={[heroStyles.heroHeadline, M3Typography.bodyMedium, { color: 'rgba(255,255,255,0.9)' }]}
          numberOfLines={3}
        >
          {headline}
        </Text>
      ) : null}

      <View
        style={[
          heroStyles.heroStats,
          webLayout && heroStyles.heroStatsWeb,
          { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.2)' },
        ]}
      >
        <StatPill
          value={memberCountValue > 0 ? memberCountValue.toLocaleString() : '—'}
          label="Members"
        />
        <View style={[heroStyles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        <StatPill value={`${eventCount}`} label="Events" />
        <View style={[heroStyles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
        <StatPill value={activityLabel} label="Activity" accent={activityColor} />
      </View>

      <View style={[heroStyles.heroActions, webLayout && heroStyles.heroActionsWeb]}>
        <M3Button
          onPress={onJoinToggle}
          variant="filled"
          loading={joinPending}
          style={[
            webLayout ? heroStyles.heroJoinButtonWeb : { flex: 1 },
            heroStyles.heroJoinBtn,
          ]}
          labelStyle={heroStyles.heroJoinLabel}
        >
          {isJoined ? 'Joined ✓' : 'Join Community'}
        </M3Button>
      </View>
    </>
  );

  if (webLayout) {
    return <View style={[heroStyles.heroBody, heroStyles.heroBodyWeb, { paddingHorizontal: 24 }]}>{body}</View>;
  }

  return (
    <Animated.View entering={FadeInUp.duration(320)} style={[heroStyles.heroBody, { paddingHorizontal: hPad }]}>
      {body}
    </Animated.View>
  );
}

export function CommunityDetailHero({
  community,
  heroImage,
  accent,
  locationLabel,
  headline,
  memberCountValue,
  eventCount,
  activityLabel,
  activityColor,
  isJoined,
  joinPending,
  onJoinToggle,
  isExpanded,
}: {
  community: Community;
  heroImage?: string | null;
  accent: string;
  locationLabel: string | null;
  headline: string;
  memberCountValue: number;
  eventCount: number;
  activityLabel: string;
  activityColor?: string;
  isJoined: boolean;
  joinPending: boolean;
  onJoinToggle: () => void;
  isExpanded: boolean;
}) {
  const isWeb = Platform.OS === 'web';
  const identityProps = {
    community,
    locationLabel,
    headline,
    memberCountValue,
    eventCount,
    activityLabel,
    activityColor,
    isJoined,
    joinPending,
    onJoinToggle,
    webLayout: isWeb,
  };

  return (
    <View
      style={[
        heroStyles.hero,
        isWeb && heroStyles.heroWeb,
        { minHeight: isWeb ? 300 : isExpanded ? 400 : 320 },
      ]}
    >
      {heroImage ? (
        <Image pointerEvents="none" source={{ uri: heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <LinearGradient
          pointerEvents="none"
          colors={[accent, '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      />

      <HeroIdentity {...identityProps} />
    </View>
  );
}

const heroStyles = StyleSheet.create({
  hero: { minHeight: 380, overflow: 'hidden', paddingBottom: 40, justifyContent: 'center' },
  heroWeb: { minHeight: 300, paddingBottom: 18 },
  heroBody: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 10 : 24,
    paddingBottom: Platform.OS === 'web' ? 8 : 16,
  },
  heroBodyWeb: { marginTop: 10 },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarWeb: {
    width: 74,
    height: 74,
    borderRadius: 18,
  },
  heroAvatarInitial: { fontSize: 36, fontFamily: FontFamily.bold },
  heroName: { marginTop: 16, textAlign: 'center', maxWidth: '100%' },
  heroNameScroll: { justifyContent: 'center' },
  heroNameWeb: { marginTop: 10 },
  heroLabel: { marginTop: 4, textAlign: 'center' },
  heroHeadline: { marginTop: 12, textAlign: 'center', maxWidth: 520, opacity: 0.9 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroStatsWeb: {
    marginTop: 14,
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  heroStatDivider: { width: 1, height: 24 },
  statValue: { fontSize: 18, fontFamily: FontFamily.bold, color: '#fff' },
  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%', maxWidth: 400 },
  heroActionsWeb: { marginTop: 14, maxWidth: 320 },
  heroJoinButtonWeb: { alignSelf: 'center', minWidth: 220 },
  heroJoinBtn: {
    backgroundColor: CultureTokens.indigo,
    borderColor: CultureTokens.coral,
    borderWidth: 3,
  },
  heroJoinLabel: { color: '#FFFFFF' },
});
