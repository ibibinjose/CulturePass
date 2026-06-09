/**
 * UNiDAYS-style 1:1 marketplace tile for CultureShop feed sections.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, CultureTokens, TextStyles, FontFamily } from '@/design-system/tokens/theme';
import { MARKETPLACE_TILE_OVERLAY as O } from '@/design-system/tokens/marketplaceTileOverlay';
import type { MarketplaceTile } from '@/shared/schema';

type Props = {
  tile: MarketplaceTile;
  size: number;
  /** When true and tile.premiumLocked, show lock affordance (actual navigation handled by parent). */
  showPremiumLock: boolean;
  onPress: () => void;
};

export function MarketplaceSquareTile({ tile, size, showPremiumLock, onPress }: Props) {
  const colors = useColors();
  const lockedVisual = tile.premiumLocked && showPremiumLock;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, width: size }]}
      accessibilityRole="button"
      accessibilityLabel={
        lockedVisual
          ? `${tile.title}. Premium offer. Double tap to upgrade.`
          : `${tile.title}. ${tile.subtitle ?? ''}. Double tap to open.`
      }
    >
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderColor: O.border,
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        {tile.imageUrl ? (
          <Image
            source={{ uri: tile.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.primarySoft }]}>
            <Ionicons
              name={tile.kind === 'shop' ? 'bag-handle-outline' : 'gift-outline'}
              size={Math.min(40, size * 0.22)}
              color={CultureTokens.violet}
            />
          </View>
        )}

        <LinearGradient
          colors={[...O.gradientBottom]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {tile.badge ? (
          <View style={[styles.badge, { backgroundColor: CultureTokens.coral }]}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {tile.badge}
            </Text>
          </View>
        ) : null}

        {lockedVisual ? (
          <View style={[styles.lockChip, { borderColor: colors.borderLight, backgroundColor: O.lockChipOverlayBg }]}>
            <Ionicons name="lock-closed" size={14} color={O.lockIcon} />
          </View>
        ) : null}

        <View style={styles.caption}>
          <Text style={styles.title} numberOfLines={2}>
            {tile.title}
          </Text>
          {tile.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {tile.subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
  },
  badge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    maxWidth: '72%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: O.titleText,
  },
  lockChip: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xl,
  },
  title: {
    ...TextStyles.body,
    fontFamily: FontFamily.semibold,
    fontSize: Platform.OS === 'web' ? 13 : 12,
    lineHeight: 16,
    color: O.titleText,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    color: O.subtitleText,
  },
});
