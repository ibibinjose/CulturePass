import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/design-system/ui/Button';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';

interface RailErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function RailErrorBanner({ message, onRetry, retryLabel = 'Try again' }: RailErrorBannerProps) {
  const colors = useColors();
  const { pad } = useDiscoverRailInsets();

  return (
    <View style={[styles.wrap, { paddingHorizontal: pad }]} accessibilityRole="alert">
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? (
        <Button variant="outline" size="sm" onPress={onRetry} accessibilityLabel={retryLabel}>
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
});
