/**
 * Category section with header + responsive wrap grid of 1:1 tiles (UNiDAYS-style).
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router, type Href } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import type { MarketplaceSection, MarketplaceTile } from '@/shared/schema';
import { MarketplaceSquareTile } from '@/modules/marketplace/MarketplaceSquareTile';
import { CultureTokens, FontFamily, Spacing, TextStyles } from '@/design-system/tokens/theme';

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
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
            {section.title}
          </Text>
          {section.subtitle ? (
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{section.subtitle}</Text>
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
    marginTop: Spacing.xl,
    width: '100%',
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 22 : 20,
    letterSpacing: -0.35,
  },
  sectionSub: {
    ...TextStyles.body,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  viewMore: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    marginTop: Platform.OS === 'web' ? 4 : 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
