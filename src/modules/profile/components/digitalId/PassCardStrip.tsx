import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

type PassCardStripProps = {
  tierLabel: string;
  compact?: boolean;
  lanyard?: boolean;
  /** Official lanyard — centered CULTUREPASS on wordmark gradient, no tier badge */
  official?: boolean;
  colorVariant?: PassColorVariant;
};

/**
 * Full-bleed header strip — always edge-to-edge within PassCardShell.
 * Official lanyard: centered CULTUREPASS · wordmark gradient · gold rule below.
 * Default: logo mark left · tier badge right.
 */
export function PassCardStrip({
  tierLabel,
  compact = false,
  lanyard = false,
  official = false,
  colorVariant = 'cyan',
}: PassCardStripProps) {
  const theme = getPassColorTheme(colorVariant, tierLabel);
  const tier = tierLabel.toUpperCase();
  const height = official ? 56 : lanyard ? 60 : compact ? 44 : 52;
  const stripColors: [string, string] = official
    ? [CultureTokens.cultureRed, CultureTokens.appBlue]
    : [theme.stripStart, theme.stripEnd];
  const cultureColor = colorVariant === 'white' ? CultureTokens.indigo : '#FFFFFF';

  return (
    <LinearGradient
      colors={stripColors}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.strip, official && styles.stripOfficial, { height }]}
    >
      {official ? (
        <Text style={styles.officialBrand} accessibilityRole="header">
          CULTUREPASS
        </Text>
      ) : (
        <>
          <View style={styles.logoGroup}>
            <Ionicons name="finger-print" size={compact ? 12 : 14} color={theme.stripText} />
            <Text style={[styles.brand, { fontSize: compact ? 10 : 11 }]}>
              <Text style={{ color: cultureColor }}>CULTURE</Text>
              <Text style={{ color: CultureTokens.teal }}>PASS</Text>
              <Text style={{ color: CultureTokens.heritageGold }}> ID</Text>
            </Text>
          </View>

          <View style={[styles.tierBadge, { backgroundColor: theme.stripTierBadgeBg, borderColor: theme.stripTierBadgeBorder }]}>
            <Text style={[styles.tier, { color: theme.stripText, fontSize: compact ? 9 : 10 }]}>{tier}</Text>
          </View>
        </>
      )}

      {!official ? (
        <View style={[styles.separator, { backgroundColor: theme.stripSeparator }]} pointerEvents="none" />
      ) : null}
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
  stripOfficial: {
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  officialBrand: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    letterSpacing: 2.2,
    color: '#FFFFFF',
    textAlign: 'center',
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