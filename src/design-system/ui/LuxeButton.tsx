/**
 * LuxeButton — First stunning primitive of the Luxe Heritage 2026 design system.
 *
 * Visually premium, culturally warm, cross-platform.
 * Uses ONLY the new luxe tokens from luxeHeritage.
 *
 * Signature: Layered gradient CTAs, springy press, haptics, beautiful glass/tonal variants.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsDark } from '@/hooks/useColors';

import {
  Luxe,
  TERRACOTTA_GLOW,
  DEEP_SAFFRON,
  HERITAGE_GOLD,
  DEEP_PLUM,
  RICH_INDIGO,
} from '@/design-system/tokens/luxeHeritage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type LuxeButtonVariant = 'filled' | 'glass' | 'tonal' | 'outlined' | 'gold' | 'plum' | 'ghost';
export type LuxeButtonSize = 'sm' | 'md' | 'lg';

interface LuxeButtonProps {
  variant?: LuxeButtonVariant;
  size?: LuxeButtonSize;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: any;
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'image' | 'text' | 'none';
  gradientColors?: [string, string, ...string[]];
  tone?: 'auto' | 'light' | 'dark';
}

const sizeTokens = {
  sm: { height: 40, paddingH: 16, fontSize: 13, iconSize: 16 },
  md: { height: 52, paddingH: 22, fontSize: 15, iconSize: 19 },
  lg: { height: 60, paddingH: 28, fontSize: 17, iconSize: 22 },
} as const;

const getVariantStyles = (variant: LuxeButtonVariant, isDark: boolean) => {
  const dark = Luxe.colors.dark;
  const light = Luxe.colors.light;
  const c = isDark ? dark : light;

  switch (variant) {
    case 'filled':
      return {
        background: 'transparent', // gradient handled in render
        text: '#FFFFFF',
        border: 'transparent',
        isGradient: true,
        gradient: [TERRACOTTA_GLOW, DEEP_SAFFRON] as [string, string],
      };
    case 'glass':
      return {
        background: c.glass,
        text: c.text,
        border: c.glassBorder,
        isGradient: false,
      };
    case 'tonal':
      return {
        background: isDark ? '#1F1A3D' : '#E8E0FF',
        text: isDark ? '#C8C1FF' : RICH_INDIGO,
        border: 'transparent',
        isGradient: false,
      };
    case 'outlined':
      return {
        background: 'transparent',
        text: c.text,
        border: c.border,
        isGradient: false,
      };
    case 'gold':
      return {
        background: 'transparent',
        text: '#1C1917',
        border: 'transparent',
        isGradient: true,
        gradient: [HERITAGE_GOLD, '#E6A900'] as [string, string],
      };
    case 'plum':
      return {
        background: 'transparent',
        text: '#FFFFFF',
        border: 'transparent',
        isGradient: true,
        gradient: [DEEP_PLUM, '#4B0082'] as [string, string],
      };
    case 'ghost':
      return {
        background: 'transparent',
        text: c.primary,
        border: 'transparent',
        isGradient: false,
      };
    default:
      return {
        background: 'transparent',
        text: '#FFFFFF',
        border: 'transparent',
        isGradient: true,
        gradient: [TERRACOTTA_GLOW, DEEP_SAFFRON] as [string, string],
      };
  }
};

export function LuxeButton({
  variant = 'filled',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  style,
  children,
  onPress,
  gradientColors,
  tone = 'auto',
  ...rest
}: LuxeButtonProps) {
  const isDisabled = disabled || loading;
  const tokens = sizeTokens[size];
  const systemIsDark = useIsDark();
  const isDark = tone === 'auto' ? systemIsDark : tone === 'dark';

  const v = getVariantStyles(variant, isDark);

  // Accessible contrast-guaranteed disabled colors
  const disabledBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const disabledText = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';
  const disabledBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

  const buttonTextColor = isDisabled ? disabledText : v.text;
  const buttonBgColor = isDisabled 
    ? (variant === 'outlined' ? 'transparent' : disabledBg)
    : (v.isGradient || gradientColors ? 'transparent' : v.background);
  const buttonBorderColor = isDisabled
    ? (variant === 'outlined' ? disabledBorder : 'transparent')
    : (variant === 'outlined' ? v.border : 'transparent');

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(0.96, Luxe.spring.snappy);
    opacity.value = withSpring(0.85, Luxe.spring.snappy);
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Luxe.spring.smooth);
    opacity.value = withSpring(1, Luxe.spring.smooth);
  };

  const handlePress = () => {
    if (!isDisabled && onPress) {
      if (haptic && Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={buttonTextColor}
          style={{ marginRight: leftIcon || rightIcon ? 8 : 0 }}
        />
      ) : leftIcon ? (
        <Ionicons
          name={leftIcon}
          size={tokens.iconSize}
          color={buttonTextColor}
          style={{ marginRight: 8 }}
        />
      ) : null}

      <Text
        style={[
          Luxe.typography.styles.bodyMedium,
          {
            fontSize: tokens.fontSize,
            color: buttonTextColor,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>

      {rightIcon && !loading && (
        <Ionicons
          name={rightIcon}
          size={tokens.iconSize}
          color={buttonTextColor}
          style={{ marginLeft: 8 }}
        />
      )}
    </View>
  );

  const isGradient = !isDisabled && (v.isGradient || !!gradientColors);
  const finalGradientColors = gradientColors ?? v.gradient ?? [TERRACOTTA_GLOW, DEEP_SAFFRON];

  const buttonStyle = [
    styles.base,
    {
      height: tokens.height,
      paddingHorizontal: tokens.paddingH,
      backgroundColor: buttonBgColor,
      borderWidth: variant === 'outlined' ? 1.5 : 0,
      borderColor: buttonBorderColor,
      width: fullWidth ? '100%' : undefined,
    },
    style,
  ];

  if (isGradient) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[buttonStyle, animatedStyle]}
        {...rest}
      >
        <LinearGradient
          colors={finalGradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[buttonStyle, animatedStyle]}
      {...rest}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Luxe.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Subtle shadow on web for depth
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LuxeButton;
