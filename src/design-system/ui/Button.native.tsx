import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/hooks/useColors';
import { ButtonTokens, SpringConfig, MotionTokens } from '@/design-system/tokens/theme';

import {
  type ButtonProps,
  resolveCulturePassButtonPalette,
  buttonGradientColors,
  culturePassButtonStyles as styles,
} from './buttonShared';

export type { ButtonProps } from './buttonShared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading,
  fullWidth,
  style,
  labelStyle,
  textStyle,
  haptic = true,
  gradientColors: gradientColorsProp,
  children,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(MotionTokens.pressScale, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  const handlePress = (e: any) => {
    if (isDisabled) return;
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  const { backgroundColor, textColor, borderColor, isGradient } = resolveCulturePassButtonPalette(
    variant,
    colors,
    isDark,
  );
  const resolvedGradientColors = buttonGradientColors(gradientColorsProp);
  const buttonHeight = ButtonTokens.height[size] || ButtonTokens.height.md;
  const horizontalPadding = ButtonTokens.paddingH[size] || ButtonTokens.paddingH.md;
  const fontSize = ButtonTokens.fontSize[size] || ButtonTokens.fontSize.md;

  return (
    <AnimatedPressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: buttonHeight,
          paddingHorizontal: horizontalPadding,
          backgroundColor: isGradient ? 'transparent' : backgroundColor,
          borderColor,
          borderRadius: ButtonTokens.radius,
          opacity: isDisabled ? 0.62 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
        animatedStyle,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={resolvedGradientColors}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
          style={[StyleSheet.absoluteFill, { borderRadius: ButtonTokens.radius }]}
        />
      ) : null}

      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {leftIcon ? (
              <Ionicons name={leftIcon} size={buttonHeight * 0.4} color={textColor} />
            ) : null}
            {typeof children === 'string' ? (
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize,
                  },
                  labelStyle,
                  textStyle,
                ]}
              >
                {children}
              </Text>
            ) : (
              children
            )}
            {rightIcon ? (
              <Ionicons name={rightIcon} size={buttonHeight * 0.4} color={textColor} />
            ) : null}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

export default Button;
