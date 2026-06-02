/**
 * LuxeCard — Second stunning primitive of the Luxe Heritage 2026 system.
 *
 * Premium, culturally warm card with layered glass, refined elevation,
 * and beautiful press states. Uses ONLY luxe tokens.
 *
 * Variants:
 * - default: Elevated surface with subtle shadow
 * - glass: Signature layered glassmorphism
 * - tonal: Soft filled surface
 */

import React from 'react';
import { View, Pressable, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useIsDark } from '@/hooks/useColors';

import { Luxe } from '@/design-system/tokens/luxeHeritage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type LuxeCardVariant = 'default' | 'glass' | 'tonal' | 'filled';
export type LuxeCardSize = 'sm' | 'md' | 'lg';

interface LuxeCardProps {
  variant?: LuxeCardVariant;
  size?: LuxeCardSize;
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  tone?: 'auto' | 'light' | 'dark';
}

const sizeTokens = {
  sm: { padding: Luxe.spacing.sm, radius: Luxe.radius.md },
  md: { padding: Luxe.spacing.md, radius: Luxe.radius.lg },
  lg: { padding: Luxe.spacing.lg, radius: Luxe.radius.xl },
} as const;

export function LuxeCard({
  variant = 'default',
  size = 'md',
  children,
  onPress,
  style,
  haptic = true,
  disabled = false,
  accessibilityLabel,
  tone = 'auto',
  ...rest
}: LuxeCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.985, Luxe.spring.snappy);
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Luxe.spring.smooth);
  };

  const systemIsDark = useIsDark();
  const t = sizeTokens[size];

  const getSurfaceStyle = () => {
    const isDark = tone === 'auto' ? systemIsDark : tone === 'dark';
    const c = isDark ? Luxe.colors.dark : Luxe.colors.light;

    switch (variant) {
      case 'glass':
        return {
          backgroundColor: c.glass,
          borderWidth: 1,
          borderColor: c.glassBorder,
          ...(Platform.OS === 'web' && { backdropFilter: 'blur(20px)' }),
        };
      case 'tonal':
      case 'filled':
        return {
          backgroundColor: isDark ? '#1F1A3D' : '#E8E0FF',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: c.surfaceElevated,
          borderWidth: 0,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 4,
              }),
        };
    }
  };

  const surfaceStyle = getSurfaceStyle();

  const content = (
    <View style={[styles.inner, { padding: t.padding, borderRadius: t.radius }, surfaceStyle, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.base, animatedStyle]}
        accessibilityLabel={accessibilityLabel}
        {...rest}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={styles.base} accessibilityLabel={accessibilityLabel} {...rest}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  inner: {
    // Children control their own spacing
  },
});

export default LuxeCard;
