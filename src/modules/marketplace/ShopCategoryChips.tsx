/**
 * ShopCategoryChips — horizontal scrollable category filter pills for CultureShop.
 */
import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import { SHOP_CATEGORIES, type ShopListingCategory } from '@/shared/schema';

const ACCENT_MAP: Record<string, string> = {
  coral:  CultureTokens.coral,
  violet: CultureTokens.violet,
  teal:   CultureTokens.teal,
  gold:   CultureTokens.gold,
};

type Props = {
  selected?: ShopListingCategory | null;
  onSelect: (cat: ShopListingCategory | null) => void;
  hPad?: number;
};

export function ShopCategoryChips({ selected, onSelect, hPad = 16 }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: hPad }]}
    >
      {/* All chip */}
      <Pressable
        onPress={() => onSelect(null)}
        style={({ pressed }) => [
          styles.chip,
          selected == null && [styles.chipActive, { borderColor: CultureTokens.violet }],
          !selected && { backgroundColor: CultureTokens.violet + '18' },
          { opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: selected == null }}
      >
        <Text
          style={[
            styles.chipLabel,
            { color: selected == null ? CultureTokens.violet : colors.textSecondary },
          ]}
        >
          All
        </Text>
      </Pressable>

      {SHOP_CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        const accent = ACCENT_MAP[cat.accentKey] ?? CultureTokens.violet;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(isActive ? null : cat.id)}
            style={({ pressed }) => [
              styles.chip,
              isActive && [styles.chipActive, { borderColor: accent }],
              isActive && { backgroundColor: accent + '18' },
              { opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={isActive ? accent : colors.textTertiary}
            />
            <Text
              style={[
                styles.chipLabel,
                { color: isActive ? accent : colors.textSecondary },
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
});
