import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, MaterialExpressive } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { ProfileAvatar } from '@/modules/profile/components/tabs/ProfileComponents';
import { fmt } from '@/modules/profile/components/tabs/ProfileUtils';
import { profileSectionLayout } from './profileSectionLayout';

interface ProfileHeroSectionProps {
  displayUser: any;
  displayName: string;
  handle?: string;
  locationText: string;
  hasCultures: boolean;
  matchedCultures: any[];
  setShowCultureMap: (show: boolean) => void;
  nav: (path: string) => void;
}

export const ProfileHeroSection = React.memo(({
  displayUser,
  displayName,
  handle,
  locationText,
  hasCultures,
  matchedCultures,
  setShowCultureMap,
  nav,
}: ProfileHeroSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  return (
    <GlassView
      style={[profileSectionLayout.heroGlassOuter, { marginHorizontal: hPad }]}
      contentStyle={styles.heroContent}
    >
      <ProfileAvatar user={displayUser} displayName={displayName} size={88} />

      <Text style={[styles.heroName, { color: m3.onSurface }]} numberOfLines={2}>
        {displayName}
      </Text>

      {(handle || locationText) ? (
        <View style={styles.heroMeta}>
          {handle ? (
            <Text style={[styles.heroHandle, { color: m3.onSurfaceVariant }]} numberOfLines={1}>@{handle}</Text>
          ) : null}
          {handle && locationText ? (
            <Text style={[styles.heroDot, { color: m3.onSurfaceVariant }]} numberOfLines={1}>·</Text>
          ) : null}
          {locationText ? (
            <View style={styles.heroLocRow}>
              <Ionicons name="location-outline" size={11} color={m3.onSurfaceVariant} />
              <Text style={[styles.heroLocText, { color: m3.onSurfaceVariant }]} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {hasCultures ? (
        <Pressable
          style={styles.culturePills}
          onPress={() => setShowCultureMap(true)}
          accessibilityRole="button"
          accessibilityLabel="View cultural heritage map"
        >
          {matchedCultures.slice(0, 4).map((c: any) => (
            <View key={c.id} style={[styles.culturePill, { backgroundColor: m3.secondaryContainer, borderColor: m3.outlineVariant }]}>
              <Text style={styles.culturePillEmoji} numberOfLines={1}>{c.emoji}</Text>
              <Text style={[styles.culturePillText, { color: m3.onSecondaryContainer }]} numberOfLines={1}>{c.name}</Text>
            </View>
          ))}
          {matchedCultures.length > 4 ? (
            <View style={[styles.culturePill, { backgroundColor: m3.surfaceContainerHigh, borderColor: m3.outlineVariant }]}>
              <Text style={[styles.culturePillText, { color: m3.onSurfaceVariant }]} numberOfLines={1}>+{matchedCultures.length - 4}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <View style={[styles.statsBar, { backgroundColor: m3.surfaceContainerHigh, borderColor: m3.outlineVariant }]}>
        {[
          { label: 'Followers', value: displayUser?.followersCount ?? 0, href: '/network?tab=followers' as const },
          { label: 'Following', value: displayUser?.followingCount ?? 0, href: '/network?tab=following' as const },
          { label: 'Likes', value: displayUser?.likesCount ?? 0, href: '/profile/edit' as const },
        ].map((stat, i, arr) => (
          <React.Fragment key={stat.label}>
            <Pressable
              style={styles.statItem}
              onPress={() => nav(stat.href)}
              accessibilityRole="button"
              accessibilityLabel={`${fmt(stat.value)} ${stat.label}`}
            >
              <Text style={[styles.statNum, { color: m3.onSurface }]} numberOfLines={1}>{fmt(stat.value)}</Text>
              <Text style={[styles.statLabel, { color: m3.onSurfaceVariant }]} numberOfLines={1}>{stat.label}</Text>
            </Pressable>
            {i < arr.length - 1 ? (
              <View style={[styles.statDivider, { backgroundColor: m3.outlineVariant }]} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </GlassView>
  );
});

ProfileHeroSection.displayName = 'ProfileHeroSection';

const styles = StyleSheet.create({
  heroContent: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  heroName: {
    marginTop: 14, fontSize: 22, fontFamily: FontFamily.bold,
    letterSpacing: -0.4, textAlign: 'center',
  },
  heroMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 5, marginBottom: 2, flexWrap: 'wrap', justifyContent: 'center',
  },
  heroHandle: { fontSize: 14, fontFamily: FontFamily.regular },
  heroDot: { fontSize: 14 },
  heroLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroLocText: { fontSize: 12, fontFamily: FontFamily.regular },
  culturePills: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginTop: 14, marginBottom: 4,
  },
  culturePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: MaterialExpressive.shape.full, borderWidth: 1,
  },
  culturePillEmoji: { fontSize: 14 },
  culturePillText: { fontSize: 12, fontFamily: FontFamily.semibold },
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 20, width: '100%', borderRadius: MaterialExpressive.shape.cornerLarge,
    paddingVertical: 16, paddingHorizontal: 8, borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: FontFamily.regular, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
});