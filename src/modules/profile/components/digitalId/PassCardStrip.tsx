import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily } from '@/design-system/tokens/theme';
import { WALLET_PASS_THEME } from '@/modules/profile/components/digitalId/walletPassTheme';

type PassCardStripProps = {
  tierLabel: string;
  compact?: boolean;
};

export function PassCardStrip({ tierLabel, compact = false }: PassCardStripProps) {
  const tier = tierLabel.toUpperCase();
  return (
    <LinearGradient
      colors={[WALLET_PASS_THEME.cyanDarkHex, WALLET_PASS_THEME.cyanDeepHex]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.strip, compact && styles.stripCompact]}
    >
      <Text style={[styles.brand, compact && styles.brandCompact]}>CULTUREPASS ID</Text>
      <View style={[styles.tierBadge, compact && styles.tierBadgeCompact]}>
        <Text style={[styles.tier, compact && styles.tierCompact]}>{tier}</Text>
      </View>
      <View style={styles.separator} pointerEvents="none" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  stripCompact: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  brand: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: WALLET_PASS_THEME.nameOnCyan,
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
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  tierBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tier: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: WALLET_PASS_THEME.nameOnCyan,
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
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});