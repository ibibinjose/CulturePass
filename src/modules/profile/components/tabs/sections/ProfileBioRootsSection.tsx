import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { FontFamily, MaterialExpressive } from '@/design-system/tokens/theme';
import { M3SectionHeader } from '@/design-system/ui';
import { communityFlags } from '@/constants/onboardingCommunities';
import { COMMUNITY_COLOR } from '../ProfileTabUtils';
import * as Haptics from 'expo-haptics';
import { profileSectionLayout } from './profileSectionLayout';

interface ProfileBioRootsSectionProps {
  displayUser: any;
  languages: string[];
  matchedCultures: any[];
  setShowCultureMap: (show: boolean) => void;
}

export const ProfileBioRootsSection = React.memo(({
  displayUser,
  languages,
  matchedCultures,
  setShowCultureMap,
}: ProfileBioRootsSectionProps) => {
  const m3 = useM3Colors();
  const { hPad } = useLayout();
  const [interestsExpanded, setInterestsExpanded] = useState(false);

  const communities = (displayUser?.communities as string[]) ?? [];
  const interests = (displayUser?.interests as string[]) ?? [];
  const visibleInterests = interestsExpanded || interests.length <= 8 ? interests : interests.slice(0, 8);
  const hasCultures = matchedCultures.length > 0;

  return (
    <>
      {displayUser?.bio ? (
        <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
          <M3SectionHeader title="About" />
          <View style={[styles.shell, profileSectionLayout.shellPad18, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
            <Text style={[styles.bioText, { color: m3.onSurface }]} numberOfLines={12}>{displayUser.bio}</Text>
          </View>
        </View>
      ) : null}

      {(displayUser?.ethnicityText || languages.length > 0 || communities.length > 0 || hasCultures) ? (
        <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
          <M3SectionHeader title="Roots & culture" actionLabel="Map" onAction={() => setShowCultureMap(true)} />
          <View style={[styles.shell, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant, overflow: 'hidden' }]}>
            {(displayUser?.ethnicityText || hasCultures) ? (
              <View style={[styles.heritageBanner, { backgroundColor: m3.secondaryContainer }]}>
                <Text style={styles.heritageEmoji} numberOfLines={1}>
                  {displayUser?.ethnicityText
                    ? communityFlags[displayUser.ethnicityText as string] ?? '🌏'
                    : matchedCultures[0]?.emoji ?? '🌏'}
                </Text>
                <Text style={[styles.heritageName, { color: m3.onSecondaryContainer }]} numberOfLines={2}>
                  {(displayUser?.ethnicityText as string) || matchedCultures[0]?.name}
                </Text>
              </View>
            ) : null}

            {(languages.length > 0 || communities.length > 0) ? (
              <View style={profileSectionLayout.chipBlock}>
                {languages.length > 0 ? (
                  <View style={styles.chipSection}>
                    <Text style={[styles.chipSectionLabel, { color: m3.onSurfaceVariant }]} numberOfLines={1}>Languages I speak</Text>
                    <View style={styles.chipRow}>
                      {languages.map(lang => (
                        <View key={lang} style={[styles.m3Chip, { backgroundColor: m3.surfaceContainerHighest, borderColor: m3.outlineVariant }]}>
                          <Text style={[styles.m3ChipText, { color: m3.onSurface }]} numberOfLines={1}>🗣 {lang}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {communities.length > 0 ? (
                  <View style={styles.chipSection}>
                    <Text style={[styles.chipSectionLabel, { color: m3.onSurfaceVariant }]} numberOfLines={1}>My communities</Text>
                    <View style={styles.chipRow}>
                      {communities.slice(0, 12).map(c => {
                        const color = COMMUNITY_COLOR[c] ?? m3.primary;
                        const flag = communityFlags[c] ?? '🌐';
                        return (
                          <View key={c} style={[styles.m3Chip, styles.communityChip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                            <Text style={styles.communityChipEmoji} numberOfLines={1}>{flag}</Text>
                            <Text style={[styles.m3ChipText, { color }]} numberOfLines={1}>{c}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {interests.length > 0 ? (
        <View style={[profileSectionLayout.section, { paddingHorizontal: hPad }]}>
          <M3SectionHeader title="Interests" />
          <View style={[styles.shell, profileSectionLayout.shellPad16, { backgroundColor: m3.surfaceContainerLow, borderColor: m3.outlineVariant }]}>
            <View style={styles.chipRow}>
              {visibleInterests.map((tag, i) => (
                <View key={tag + i} style={[styles.m3Chip, { backgroundColor: m3.secondaryContainer, borderColor: m3.outlineVariant }]}>
                  <Text style={[styles.m3ChipText, { color: m3.onSecondaryContainer }]} numberOfLines={1}>{tag}</Text>
                </View>
              ))}
            </View>
            {interests.length > 8 ? (
              <Pressable
                onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setInterestsExpanded(v => !v); }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.expandToggle, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.expandToggleText, { color: m3.primary }]} numberOfLines={1}>
                  {interestsExpanded ? 'Show less' : `Show all (${interests.length})`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </>
  );
});

ProfileBioRootsSection.displayName = 'ProfileBioRootsSection';

const styles = StyleSheet.create({
  shell: {
    borderRadius: MaterialExpressive.shape.cornerExtraLarge,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  bioText: { fontSize: 15, fontFamily: FontFamily.regular, lineHeight: 23 },
  heritageBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 },
  heritageEmoji: { fontSize: 36 },
  heritageName: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.4, flex: 1 },
  chipSection: { gap: 12 },
  chipSectionLabel: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  m3Chip: {
    borderRadius: MaterialExpressive.shape.full, borderWidth: 1,
    paddingVertical: 7, paddingHorizontal: 14,
  },
  m3ChipText: { fontSize: 13, fontFamily: FontFamily.medium },
  communityChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  communityChipEmoji: { fontSize: 15 },
  expandToggle: { marginTop: 12, alignSelf: 'flex-start', paddingVertical: 6 },
  expandToggleText: { fontSize: 14, fontFamily: FontFamily.bold },
});