import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, MaterialExpressive, CultureTokens } from '@/design-system/tokens/theme';
import { M3SectionHeader } from '@/design-system/ui';
import { GlassView } from '@/design-system/ui/GlassView';
import { fmt, SOCIAL_DEFS } from '@/modules/profile/components/tabs/ProfileUtils';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { prk as prkStyles } from '@/modules/profile/components/tabs/ProfileStyles';
import { openExternalUrl } from '@/lib/openExternalUrl';

interface ProfileStatsActivitySectionProps {
  displayUser: any;
  perks: any[];
  perksLoading: boolean;
  nav: (path: string) => void;
}

export const ProfileStatsActivitySection = React.memo(({
  displayUser,
  perks,
  perksLoading,
  nav,
}: ProfileStatsActivitySectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();

  const userSocialLinks = (displayUser as Record<string, unknown>)?.socialLinks as Record<string, string> | undefined;
  const linkByKey = useMemo(
    () => ({ ...userSocialLinks, website: displayUser?.website }) as Record<string, string | undefined>,
    [userSocialLinks, displayUser?.website],
  );
  const activeSocials = useMemo(() => SOCIAL_DEFS.filter(s => linkByKey[s.key]?.trim()), [linkByKey]);

  const statsCards = [
    { id: 'communities', label: 'Communities', value: (displayUser?.communities as string[])?.length ?? 0, icon: 'people-outline' as const, color: CultureTokens.indigo },
    { id: 'interests', label: 'Interests', value: (displayUser?.interests as string[])?.length ?? 0, icon: 'sparkles-outline' as const, color: CultureTokens.gold },
    { id: 'perks', label: 'Perks', value: perks.length, icon: 'gift-outline' as const, color: CultureTokens.teal },
    { id: 'social', label: 'Social', value: activeSocials.length, icon: 'share-social-outline' as const, color: CultureTokens.coral },
  ];

  const activityFeed = [
    (displayUser?.communities?.length ?? 0) > 0 ? `Joined ${displayUser.communities.length} ${displayUser.communities.length === 1 ? 'community' : 'communities'}` : null,
    (displayUser?.interests?.length ?? 0) > 0 ? `Configured ${displayUser.interests.length} culture interests` : null,
    perks.length > 0 ? `Unlocked ${perks.length} perk opportunities` : null,
    displayUser?.website ? 'Published a public profile link' : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <>
      {/* Social */}
      {activeSocials.length > 0 ? (
        <View style={[styles.section, { paddingHorizontal: hPad }]}>
          <M3SectionHeader title="Social" />
          <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
            {activeSocials.map((s, i) => (
              <React.Fragment key={s.key}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: m3.surfaceContainerHigh }]}
                  onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const url = linkByKey[s.key]; if (url) openExternalUrl(url); }}
                  accessibilityRole="link"
                  accessibilityLabel={s.label}
                >
                  <View style={[styles.iconWell, { backgroundColor: s.color + '15' }]}>
                    <Ionicons name={s.icon} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.rowLabel, { flex: 1, color: m3.onSurface }]}>{s.label}</Text>
                  <Ionicons name="open-outline" size={16} color={m3.onSurfaceVariant} />
                </Pressable>
                {i < activeSocials.length - 1 ? <View style={[styles.divider, { backgroundColor: m3.outlineVariant }]} /> : null}
              </React.Fragment>
            ))}
          </View>
        </View>
      ) : null}

      {/* Perks Rail */}
      {(perksLoading || perks.length > 0) ? (
        <View style={[styles.section]}>
          <View style={{ paddingHorizontal: hPad }}>
            <M3SectionHeader title="Your perks" actionLabel="View all" onAction={() => nav('/perks')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[prkStyles.scroll, { paddingHorizontal: hPad }]}>
            {perksLoading
              ? [0, 1, 2].map(i => (
                  <GlassView key={`sk-${i}`} style={styles.perkCard} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={m3.primary} />
                  </GlassView>
                ))
              : perks.slice(0, 6).map(perk => (
                  <Pressable
                    key={perk.id}
                    onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); router.push({ pathname: '/p/[id]', params: { id: perk.id } }); }}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.perkCard, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={[styles.perkInner, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
                      <View style={[prkStyles.icon, { backgroundColor: CultureTokens.gold + '15' }]}>
                        <Ionicons name="gift" size={20} color={CultureTokens.gold} />
                      </View>
                      <Text style={[styles.perkTitle, { color: m3.onSurface }]} numberOfLines={2}>{perk.title}</Text>
                      {'discount' in perk && (perk as any).discount ? (
                        <View style={[styles.perkBadge, { backgroundColor: m3.tertiaryContainer }]}>
                          <Text style={[styles.perkBadgeText, { color: m3.onTertiaryContainer }]}>{(perk as any).discount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Stats Grid */}
      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader title="Stats" />
        <View style={styles.statsGrid}>
          {statsCards.map(item => (
            <View key={item.id} style={[styles.statsCell, { backgroundColor: m3.surfaceContainer, borderColor: m3.outlineVariant }]}>
              <View style={[styles.statsIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.statsNum, { color: m3.onSurface }]}>{fmt(item.value)}</Text>
              <Text style={[styles.statsLabel, { color: m3.onSurfaceVariant }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Activity */}
      <View style={[styles.section, { paddingHorizontal: hPad }]}>
        <M3SectionHeader title="Activity" />
        <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant, padding: 18, gap: 14 }]}>
          {activityFeed.length > 0 ? (
            activityFeed.map(entry => (
              <View key={entry} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: m3.primary }]} />
                <Text style={[styles.activityText, { color: m3.onSurface }]}>{entry}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.activityEmpty, { color: m3.onSurfaceVariant }]}>
              Your cultural activity appears here as you join communities and attend events.
            </Text>
          )}
        </View>
      </View>
    </>
  );
});

ProfileStatsActivitySection.displayName = 'ProfileStatsActivitySection';

const styles = StyleSheet.create({
  section: { marginTop: 36 },
  shell: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 56,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: MaterialExpressive.shape.cornerLarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 16,
  },
  perkCard: { width: 156 },
  perkInner: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: 1, padding: 16, minHeight: 132,
    gap: 8, overflow: 'hidden',
  },
  perkTitle: { fontSize: 14, fontFamily: FontFamily.bold },
  perkBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  perkBadgeText: { fontSize: 10, fontFamily: FontFamily.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statsCell: {
    flex: 1, minWidth: 130, padding: 16,
    borderRadius: MaterialExpressive.shape.cornerExtraLarge, borderWidth: 1,
  },
  statsIcon: { width: 36, height: 36, borderRadius: MaterialExpressive.shape.cornerLarge, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statsNum: { fontSize: 24, fontFamily: FontFamily.bold },
  statsLabel: { fontSize: 11, fontFamily: FontFamily.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  activityText: { fontSize: 14, fontFamily: FontFamily.medium, flex: 1 },
  activityEmpty: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
});
