import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useM3Colors } from '@/hooks/useM3Colors';
import { MaterialExpressive, MotionTokens } from '@/design-system/tokens/theme';

export interface M3FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: any;
  variant?: 'primary' | 'surface' | 'secondary' | 'tertiary';
}

/** Web/default: Reanimated omitted for Expo web SSR. Native uses `M3FAB.native.tsx`. */
export function M3FAB({ icon, onPress, style, variant = 'primary' }: M3FABProps) {
  const colors = useM3Colors();

  let backgroundColor = colors.primaryContainer;
  let iconColor = colors.onPrimaryContainer;

  switch (variant) {
    case 'surface':
      backgroundColor = colors.surfaceContainerHigh;
      iconColor = colors.primary;
      break;
    case 'secondary':
      backgroundColor = colors.secondaryContainer;
      iconColor = colors.onSecondaryContainer;
      break;
    case 'tertiary':
      backgroundColor = colors.tertiaryContainer;
      iconColor = colors.onTertiaryContainer;
      break;
  }

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor,
          borderRadius: MaterialExpressive.shape.cornerLarge,
          elevation: MaterialExpressive.elevation.fab,
          transform: [{ scale: pressed ? MotionTokens.pressScale : 1 }],
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
});
