/**
 * Category section with header + responsive wrap grid of 1:1 tiles (UNiDAYS-style).
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router, type Href } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { Spacing, CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { useLayout } from '@/hooks/useLayout';
import type { MarketplaceSection, MarketplaceTile } from '@/shared/schema';
import { MarketplaceSquareTile } from '@/modules/marketplace/MarketplaceSquareTile';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { Luxe } from '@/design-system/tokens/luxeHeritage';

type Props = {
  section: MarketplaceSection;
  maxInnerWidth: number;
  isPlus: boolean;
  onNavigateTile: (tile: MarketplaceTile) => void;
};

export function MarketplaceFeedSection({ section, maxInnerWidth, isPlus, onNavigateTile }: Props) {
  const colors = useColors();
  const layout = useLayout();

  const { tileW, gap } = useMemo(() => {
    const cols = layout.isDesktop ? 4 : layout.isTablet ? 3 : 2;
    const gap = layout.columnGap;
    const inner = maxInnerWidth;
    const tileW = (inner - (cols - 1) * gap) / cols;
    return { tileW, gap };
  }, [layout.columnGap, layout.isDesktop, layout.isTablet, maxInnerWidth]);

  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <LuxeText variant="title" style={{ color: colors.text }} accessibilityRole="header">
            {section.title}
          </LuxeText>
          {section.subtitle ? (
            <LuxeText variant="body" style={{ color: colors.textSecondary, marginTop: 4, fontSize: 14 }}>
              {section.subtitle}
            </LuxeText>
          ) : null}
        </View>
        {section.viewMoreHref ? (
          <Pressable
            onPress={() => router.push(section.viewMoreHref as Href)}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, paddingLeft: Spacing.sm })}
            accessibilityRole="link"
            accessibilityLabel={section.viewMoreLabel ?? 'View more'}
          >
            <Text style={[styles.viewMore, { color: CultureTokens.teal }]}>
              {section.viewMoreLabel ?? 'View more'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.grid, { gap }]}>
        {section.items.map((tile) => (
          <View key={`${section.id}-${tile.kind}-${tile.id}`} style={{ width: tileW }}>
            <MarketplaceSquareTile
              tile={tile}
              size={tileW}
              showPremiumLock={!isPlus}
              onPress={() => onNavigateTile(tile)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Luxe.spacing.xl,
    width: '100%',
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Luxe.spacing.md,
    gap: Luxe.spacing.sm,
  },
  viewMore: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: Luxe.colors.dark.emerald,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
