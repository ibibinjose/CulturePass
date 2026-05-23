/**
 * 1:1 square tile for CultureShop daily deals — matches MarketplaceSquareTile visual language.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import type { DailyDeal } from '@/shared/schema';
import { CultureTokens, FontFamily, Radius, Spacing, TextStyles } from '@/design-system/tokens/theme';

function accentFromDeal(deal: DailyDeal): string {
  switch (deal.accentKey) {
    case 'teal':
      return CultureTokens.teal;
    case 'coral':
      return CultureTokens.coral;
    case 'violet':
      return CultureTokens.violet;
    case 'indigo':
    default:
      return CultureTokens.indigo;
  }
}

type Props = {
  deal: DailyDeal;
  size: number;
  isPlus: boolean;
  onPress: () => void;
};

export function DailyDealSquareTile({ deal, size, isPlus, onPress }: Props) {
  const colors = useColors();
  const accent = accentFromDeal(deal);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, width: size }]}
      accessibilityRole="button"
      accessibilityLabel={
        deal.linkPolicy === 'premium_required' && !isPlus
          ? `${deal.title}. Premium required. Double tap to upgrade.`
          : `${deal.title}. Double tap to open.`
      }
    >
      <View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {deal.coverUrl ? (
          <Image
            source={{ uri: deal.coverUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <LinearGradient
            colors={[accent + '66', accent + '22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.gradient}
          pointerEvents="none"
        />

        {deal.linkPolicy === 'premium_required' ? (
          !isPlus ? (
            <View style={[styles.lockChip, { borderColor: colors.borderLight, backgroundColor: 'rgba(0,0,0,0.45)' }]}>
              <Ionicons name="lock-closed" size={14} color="#fff" />
            </View>
          ) : (
            <View style={[styles.plusPill, { borderColor: CultureTokens.gold + 'aa', backgroundColor: 'rgba(0,0,0,0.35)' }]}>
              <Ionicons name="star" size={12} color={CultureTokens.gold} />
              <Text style={[styles.plusText, { color: CultureTokens.gold }]}>Plus</Text>
            </View>
          )
        ) : null}

        <View style={styles.caption}>
          <Text style={styles.title} numberOfLines={2}>
            {deal.title}
          </Text>
          {deal.subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {deal.subtitle}
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  kindPill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    maxWidth: '58%',
  },
  kindPillText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  plusPill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  plusText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
  },
  lockChip: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
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
    paddingTop: Spacing.lg,
  },
  title: {
    ...TextStyles.body,
    fontFamily: FontFamily.semibold,
    fontSize: Platform.OS === 'web' ? 13 : 12,
    lineHeight: 16,
    color: '#fff',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.88)',
  },
});
