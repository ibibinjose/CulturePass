import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '@/design-system/tokens/theme';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

type PassCardStripProps = {
  tierLabel: string;
  compact?: boolean;
  lanyard?: boolean;
  colorVariant?: PassColorVariant;
};

export function PassCardStrip({ tierLabel, compact = false, lanyard = false, colorVariant = 'cyan' }: PassCardStripProps) {
  const theme = getPassColorTheme(colorVariant);
  const tier = tierLabel.toUpperCase();
  return (
    <LinearGradient
      colors={[theme.stripStart, theme.stripEnd]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.strip, compact && styles.stripCompact, lanyard && styles.stripLanyard]}
    >
      <View style={[styles.stripRow, compact && styles.stripRowCompact, lanyard && styles.stripRowLanyard]}>
        <Text style={[styles.brand, compact && styles.brandCompact, { color: theme.stripText }]}>CULTUREPASS ID</Text>
        <View style={[styles.tierBadge, compact && styles.tierBadgeCompact, { backgroundColor: theme.stripTierBadgeBg, borderColor: theme.stripTierBadgeBorder }]}>
          <Text style={[styles.tier, compact && styles.tierCompact, { color: theme.stripText }]}>{tier}</Text>
        </View>
      </View>
      {lanyard ? <View style={styles.lanyardOverlapZone} /> : null}
      <View style={[styles.separator, { backgroundColor: theme.stripSeparator }]} pointerEvents="none" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'relative',
  },
  stripCompact: {},
  stripLanyard: {
    paddingTop: 2,
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  stripRowCompact: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  stripRowLanyard: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  /** Reserved zone under the ID row — avatar overlaps here only. */
  lanyardOverlapZone: {
    height: 18,
  },
  brand: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.5,
  },
  brandCompact: {
    fontSize: 10,
    letterSpacing: 1.3,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tier: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 1.1,
  },
  tierCompact: {
    fontSize: 9,
    letterSpacing: 0.9,
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
});