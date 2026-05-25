import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useM3Colors } from '@/hooks/useM3Colors';
import { MaterialExpressive, SpringConfig, MotionTokens } from '@/design-system/tokens/theme';

export interface M3FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: any;
  variant?: 'primary' | 'surface' | 'secondary' | 'tertiary';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function M3FAB({ icon, onPress, style, variant = 'primary' }: M3FABProps) {
  const colors = useM3Colors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(MotionTokens.pressScale, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.fab,
        {
          backgroundColor,
          borderRadius: MaterialExpressive.shape.cornerLarge,
          elevation: MaterialExpressive.elevation.fab,
        },
        style,
        animatedStyle,
      ]}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { 
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { 
        elevation: 8 
      },
      default: { 
        elevation: 8 
      },
    }),
  },
});