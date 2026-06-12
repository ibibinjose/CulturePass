/**
 * Section header for heritage / discovery tag pickers.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CultureTokens, Spacing } from '@/design-system/tokens/theme';

export interface TagSectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  max?: number;
  titleColor: string;
  subtitleColor: string;
  accentColor?: string;
}

export function TagSectionHeader({
  title,
  subtitle,
  count,
  max,
  titleColor,
  subtitleColor,
  accentColor = CultureTokens.indigo,
}: TagSectionHeaderProps) {
  const atMax = max != null && count != null && count >= max;

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {max != null && count != null ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: atMax ? CultureTokens.coral + '18' : accentColor + '14',
                borderColor: atMax ? CultureTokens.coral + '44' : accentColor + '33',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: atMax ? CultureTokens.coral : accentColor }]}>
              {count}/{max}
            </Text>
          </View>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      ) : null}
      {atMax ? (
        <Text style={[styles.limitHint, { color: CultureTokens.coral }]}>
          Maximum reached — remove a tag to add another.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4, marginBottom: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  limitHint: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});