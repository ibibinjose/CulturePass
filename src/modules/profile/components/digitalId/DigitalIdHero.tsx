import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, FontFamily, SignatureGradient } from '@/design-system/tokens/theme';
import { DIGITAL_ID_BRAND } from '@/modules/profile/components/digitalId/digitalIdBrand';

type DigitalIdHeroProps = {
  width: number;
  tierLabel: string;
  isDark: boolean;
};

/**
 * Signature-gradient hero strip for /profile/qr — one flagship CTA surface per screen rules.
 */
export function DigitalIdHero({ width, tierLabel, isDark }: DigitalIdHeroProps) {
  return (
    <View style={[styles.wrap, { width }]}>
      <LinearGradient
        colors={SignatureGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.inner}>
          <View style={styles.badgeRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="finger-print" size={18} color="#fff" />
            </View>
            <View style={styles.badgeText}>
              <Text style={styles.brand}>{DIGITAL_ID_BRAND.name}</Text>
              <Text style={styles.tagline}>{DIGITAL_ID_BRAND.tagline}</Text>
            </View>
            <View style={styles.tierChip}>
              <Text style={styles.tierText}>{tierLabel.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.headline}>Your Digital ID</Text>
          <Text style={styles.sub}>
            Business card · Lanyard badge · Wallet passes · Event check-in
          </Text>
          <View style={styles.platformRow}>
            {Platform.OS === 'ios' || Platform.OS === 'web' ? (
              <View style={styles.platformPill}>
                <Ionicons name="logo-apple" size={12} color="#fff" />
                <Text style={styles.platformLabel}>Apple Wallet</Text>
              </View>
            ) : null}
            {Platform.OS === 'android' || Platform.OS === 'web' ? (
              <View style={styles.platformPill}>
                <Ionicons name="logo-google" size={12} color="#fff" />
                <Text style={styles.platformLabel}>Google Wallet</Text>
              </View>
            ) : null}
            <View style={[styles.platformPill, styles.domainPill]}>
              <Ionicons name="globe-outline" size={12} color="#fff" />
              <Text style={styles.platformLabel}>{DIGITAL_ID_BRAND.domainDisplay}</Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.glowOrb,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)' },
          ]}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: `0 12px 32px ${CultureTokens.indigo}33` } as object,
      default: {
        shadowColor: CultureTokens.violet,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  gradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { flex: 1, gap: 1 },
  brand: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.82)',
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tierText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  sub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  domainPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  platformLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  glowOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    top: -40,
    right: -30,
  },
});