/**
 * 1:1 square tile for CultureShop daily deals — matches MarketplaceSquareTile visual language.
 */
import React from 'react';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { LuxeText } from '@/design-system/ui/LuxeText';
import type { DailyDeal } from '@/shared/schema';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { FontFamily } from '@/design-system/tokens/theme';

// Luxe premium treatment for Daily Deals tiles
const LUXE_TILE_BORDER = 'rgba(255,255,255,0.06)';
const LUXE_OVERLAY = 'rgba(0,0,0,0.88)';

function accentFromDeal(deal: DailyDeal): string {
  // Map to Luxe Heritage accents
  switch (deal.accentKey) {
    case 'teal':
      return Luxe.colors.dark.emerald;
    case 'coral':
      return Luxe.colors.dark.primary;
    case 'violet':
      return Luxe.colors.dark.accent;
    case 'indigo':
    default:
      return Luxe.colors.indigo;
  }
}

type Props = {
  deal: DailyDeal;
  size: number;
  isPlus: boolean;
  onPress: () => void;
};

export function DailyDealSquareTile({ deal, size, isPlus, onPress }: Props) {
  const accent = accentFromDeal(deal);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1, width: size }]}
      accessibilityRole="button"
      accessibilityLabel={
        deal.linkPolicy === 'premium_required' && !isPlus
          ? `${deal.title}. Premium required. Double tap to upgrade.`
          : `${deal.title}. Double tap to open.`
      }
    >
      <View style={[styles.tile, { width: size, height: size }]}>
        {deal.coverUrl ? (
          <Image
            source={{ uri: deal.coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={140}
          />
        ) : (
          <LinearGradient
            colors={[accent + '55', accent + '15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Stronger bottom gradient for better text legibility (Luxe style) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* Premium / Lock badges - Luxe treatment */}
        {deal.linkPolicy === 'premium_required' ? (
          !isPlus ? (
            <View style={styles.lockChip}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
            </View>
          ) : (
            <View style={styles.plusPill}>
              <Ionicons name="star" size={12} color={Luxe.colors.gold} />
              <Text style={styles.plusText}>Plus</Text>
            </View>
          )
        ) : null}

        <View style={styles.caption}>
          <LuxeText 
            variant="body" 
            style={styles.title} 
            numberOfLines={2}
          >
            {deal.title}
          </LuxeText>
          {deal.subtitle ? (
            <LuxeText 
              variant="caption" 
              style={styles.subtitle} 
              numberOfLines={2}
            >
              {deal.subtitle}
            </LuxeText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Luxe.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
  },
  plusPill: {
    position: 'absolute',
    top: Luxe.spacing.sm,
    right: Luxe.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Luxe.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.55)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  plusText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: Luxe.colors.gold,
  },
  lockChip: {
    position: 'absolute',
    top: Luxe.spacing.sm,
    right: Luxe.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Luxe.spacing.md,
    paddingBottom: Luxe.spacing.md,
    paddingTop: Luxe.spacing.xl,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: Platform.OS === 'web' ? 14 : 13,
    lineHeight: 17,
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.82)',
  },
});
