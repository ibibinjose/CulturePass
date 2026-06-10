import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FontFamily } from '@/design-system/tokens/theme';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

type PassCardStripProps = {
  tierLabel: string;
  compact?: boolean;
  lanyard?: boolean;
  colorVariant?: PassColorVariant;
};

/**
 * Full-bleed header strip — always edge-to-edge within PassCardShell.
 * Apple Wallet layout: logo mark left · tier badge right.
 * No overlap zone — avatar sits cleanly BELOW this strip.
 */
export function PassCardStrip({
  tierLabel,
  compact = false,
  lanyard = false,
  colorVariant = 'cyan',
}: PassCardStripProps) {
  const theme = getPassColorTheme(colorVariant);
  const tier = tierLabel.toUpperCase();
  const height = lanyard ? 60 : compact ? 44 : 52;

  return (
    <LinearGradient
      colors={[theme.stripStart, theme.stripEnd]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.strip, { height }]}
    >
      {/* Logo mark — minimal, one icon + brand name */}
      <View style={styles.logoGroup}>
        <Ionicons name="planet-outline" size={compact ? 12 : 14} color={theme.stripText} />
        <Text style={[styles.brand, { color: theme.stripText, fontSize: compact ? 10 : 11 }]}>
          CulturePass
        </Text>
      </View>

      {/* Tier — compact pill on right */}
      <View style={[styles.tierBadge, { backgroundColor: theme.stripTierBadgeBg, borderColor: theme.stripTierBadgeBorder }]}>
        <Text style={[styles.tier, { color: theme.stripText, fontSize: compact ? 9 : 10 }]}>{tier}</Text>
      </View>

      {/* Bottom separator line */}
      <View style={[styles.separator, { backgroundColor: theme.stripSeparator }]} pointerEvents="none" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  strip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tier: {
    fontFamily: FontFamily.bold,
    letterSpacing: 0.8,
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
});