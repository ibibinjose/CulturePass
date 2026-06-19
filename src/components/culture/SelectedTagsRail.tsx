/**
 * Removable chips summarising current tag selections.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, Radius, Spacing } from '@/design-system/tokens/theme';

export type SelectedTagItem = {
  id: string;
  label: string;
  emoji?: string;
  onRemove: () => void;
};

export interface SelectedTagsRailProps {
  title: string;
  items: SelectedTagItem[];
  emptyLabel: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceColor: string;
  testID?: string;
}

export function SelectedTagsRail({
  title,
  items,
  emptyLabel,
  textColor,
  mutedColor,
  borderColor,
  surfaceColor,
  testID = 'selected-tags-rail',
}: SelectedTagsRailProps) {
  return (
    <View
      style={[styles.root, { borderColor, backgroundColor: surfaceColor }]}
      testID={testID}
    >
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: mutedColor }]}>{emptyLabel}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={item.onRemove}
              style={[styles.chip, { borderColor: CultureTokens.indigo + '44', backgroundColor: CultureTokens.indigo + '12' }]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.label}`}
            >
              {item.emoji ? <Text style={styles.emoji}>{item.emoji}</Text> : null}
              <Text style={[styles.chipLabel, { color: textColor }]} numberOfLines={1}>
                {item.label}
              </Text>
              <Ionicons name="close" size={14} color={mutedColor} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  empty: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  rail: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: 200,
  },
  emoji: { fontSize: 13 },
  chipLabel: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
});