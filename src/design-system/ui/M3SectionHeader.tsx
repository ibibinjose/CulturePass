import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { M3Button } from './M3Button';

interface M3SectionHeaderProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function M3SectionHeader({
  title,
  subtitle,
  onAction,
  actionLabel = 'See all',
}: M3SectionHeaderProps) {
  const colors = useM3Colors();

  return (
    <View style={styles.container}>
      <View style={styles.textSection}>
        <Text style={[M3Typography.titleLarge, { color: colors.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {onAction && (
        <M3Button variant="text" onPress={onAction}>
          {actionLabel}
        </M3Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingRight: 4,
  },
  textSection: {
    flex: 1,
  },
});
