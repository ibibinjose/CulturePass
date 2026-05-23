import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, ChipTokens, Radius } from '@/design-system/tokens/theme';

type FilterItem = string | { id: string; label: string };

interface FilterChipsProps {
  items?: FilterItem[];
  selected?: string[];
  onToggle?: (id: string) => void;
  style?: ViewStyle;
}

function FilterChips({ items = [], selected = [], onToggle, style }: FilterChipsProps) {
  const colors = useColors();
  const safeItems = Array.isArray(items) ? items : [];
  const safeSelected = Array.isArray(selected) ? selected : [];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, style]}
    >
      {safeItems.map((item) => {
        const id = typeof item === 'string' ? item : (item?.id ?? item?.label ?? '');
        const label = typeof item === 'string' ? item : (item?.label ?? String(id));
        const active = safeSelected.includes(id);

        return (
          <Pressable
            key={id}
            onPress={() => onToggle?.(id)}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked: active }}
            style={[
              styles.chip,
              {
                borderColor: active ? CultureTokens.indigo : colors.borderLight,
                backgroundColor: active ? colors.primarySoft : colors.surface,
              },
            ]}
          >
            <Text style={[styles.label, { color: active ? CultureTokens.indigo : colors.textSecondary }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      {safeItems.length === 0 ? <View /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: ChipTokens.paddingH,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: ChipTokens.fontSize,
  },
});

export default FilterChips;
