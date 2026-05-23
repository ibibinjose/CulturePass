import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius } from '@/design-system/tokens/theme';

type SaveToggleSize = 'sm' | 'md' | 'lg';

interface SaveToggleProps {
  saved: boolean;
  onToggle: () => void;
  size?: SaveToggleSize;
  tone?: 'default' | 'glass';
  style?: object;
}

export function SaveToggle({ saved, onToggle, size = 'md', style }: SaveToggleProps) {
  const colors = useColors();
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const containerSize = iconSize + 16;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from saved' : 'Save'}
      accessibilityState={{ selected: saved }}
      style={[
        styles.base,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: saved
            ? CultureTokens.indigo + '14'
            : colors.surfaceElevated,
          borderColor: saved ? CultureTokens.indigo + '40' : colors.borderLight,
        },
        style,
      ]}
    >
      <Ionicons
        name={saved ? 'bookmark' : 'bookmark-outline'}
        size={iconSize}
        color={saved ? CultureTokens.indigo : colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default SaveToggle;
