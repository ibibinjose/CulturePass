/**
 * Section wrapper for Page Pro Wizard steps — clearer visual hierarchy
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing, Radius } from '@/design-system/tokens/theme';

export interface WizardFormSectionProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  optional?: boolean;
}

export function WizardFormSection({
  title,
  subtitle,
  icon,
  children,
  optional,
}: WizardFormSectionProps) {
  const colors = useM3Colors();

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.outlineVariant },
      ]}
    >
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name={icon} size={18} color={colors.onPrimaryContainer} />
          </View>
        ) : null}
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[M3Typography.titleSmall, { color: colors.onSurface }]}>{title}</Text>
            {optional ? (
              <Text style={[M3Typography.labelSmall, { color: colors.onSurfaceVariant }]}>Optional</Text>
            ) : null}
          </View>
          {subtitle ? (
            <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  body: { gap: Spacing.xs },
});