/**
 * AIAssistButton Component
 * 
 * Trigger button for AI text assistance modal.
 * Displays a "sparkles" icon button adjacent to text fields.
 * 
 * Requirements: 5, 11
 */

import React from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, Radius, SpringConfig, MotionTokens } from '@/design-system/tokens/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AIAssistButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

/**
 * AI Assist Button
 * 
 * A button that triggers the AI assistance modal.
 * Uses violet branding and sparkles icon to indicate AI functionality.
 */
export function AIAssistButton({ 
  onPress, 
  disabled = false,
  size = 'medium',
}: AIAssistButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(MotionTokens.pressScale, SpringConfig.snappy);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  const iconSize = size === 'small' ? 18 : 20;
  const buttonSize = size === 'small' ? 32 : 40;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          backgroundColor: disabled ? colors.surface : CultureTokens.violet,
          borderRadius: Radius.sm,
        },
        animatedStyle,
      ]}
      accessibilityLabel="AI Assist"
      accessibilityHint="Get AI suggestions to improve your text"
      accessibilityRole="button"
    >
      <Ionicons 
        name="sparkles" 
        size={iconSize} 
        color={disabled ? colors.textTertiary : '#FFFFFF'} 
      />
      {size === 'medium' && (
        <Text style={[styles.label, { color: '#FFFFFF' }]}>AI</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'opacity 0.2s',
      },
    }),
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
