/**
 * When a marketplace listing has no host logo or avatar, show CulturePass branding
 * on a stable, varied gradient pattern keyed by listing id (visual identity without uploads).
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { CultureTokens } from '@/design-system/tokens/theme';

const PRIMARY: [string, string][] = [
  [CultureTokens.violet + 'EE', CultureTokens.coral + 'BB'],
  [CultureTokens.teal + 'DD', CultureTokens.violet + '99'],
  [CultureTokens.violet + 'DD', CultureTokens.teal + 'AA'],
  [CultureTokens.coral + 'CC', CultureTokens.violet + 'AA'],
];

const OVERLAY: [string, string][] = [
  [CultureTokens.coral + '66', CultureTokens.violet + '44'],
  [CultureTokens.violet + '44', CultureTokens.teal + '33'],
  [CultureTokens.teal + '44', CultureTokens.violet + '55'],
  [CultureTokens.violet + '55', CultureTokens.coral + '44'],
];

export function listingHostPatternIndex(id: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % PRIMARY.length;
}

export function DefaultHostBrandMark({
  size,
  listingId,
  borderRadius,
}: {
  size: number;
  listingId: string;
  borderRadius?: number;
}) {
  const idx = listingHostPatternIndex(listingId);
  const outerR = borderRadius ?? Math.round(size * 0.16);
  const inset = Math.max(3, Math.round(size * 0.08));
  const innerR = Math.max(4, outerR - inset);
  const logoSize = Math.round(Math.max(14, size - inset * 2 - Math.round(size * 0.14)));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: outerR,
          overflow: 'hidden',
        },
        SHADOW,
      ]}
    >
      <LinearGradient
        colors={PRIMARY[idx]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={OVERLAY[idx]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      />
      <View
        style={[
          styles.inner,
          {
            top: inset,
            left: inset,
            right: inset,
            bottom: inset,
            borderRadius: innerR,
          },
        ]}
      >
        <Image
          source={require('@/assets/images/culturepass-logo.png')}
          style={{ width: logoSize, height: logoSize }}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const SHADOW = Platform.select({
  ios: {
    shadowColor: 'rgb(0,45,80)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 4 },
  web: { boxShadow: '0px 2px 10px rgba(0,45,80,0.14)' } as object,
  default: {},
});
