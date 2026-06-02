import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useLayout } from '@/hooks/useLayout';
import { Spacing } from '@/design-system/tokens/theme';

interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Reduce horizontal padding (useful for full-bleed elements inside) */
  noHorizontalPadding?: boolean;
  /** Reduce top padding */
  noTopPadding?: boolean;
  /** Use tighter padding (good for cards/lists) */
  compact?: boolean;
}

/**
 * PageContainer
 * 
 * Provides consistent, responsive page padding across the app.
 * Use this as the root wrapper inside most screens for better UI consistency
 * and to avoid the "crowded" feeling the team has been addressing.
 */
export function PageContainer({
  children,
  style,
  noHorizontalPadding = false,
  noTopPadding = false,
  compact = false,
}: PageContainerProps) {
  const { isDesktop } = useLayout();

  const horizontalPadding = noHorizontalPadding
    ? 0
    : compact
    ? Spacing.md
    : isDesktop
    ? Spacing.xl
    : Spacing.lg;

  const topPadding = noTopPadding ? 0 : compact ? Spacing.md : Spacing.lg;

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});