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

import { useM3Colors } from '@/hooks/useM3Colors';
import { MotionTokens, SpringConfig, SignatureGradient } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';

import {
  type M3ButtonProps,
  resolveM3ButtonVisuals,
  m3ButtonLayout,
  m3ButtonStyles as styles,
} from './m3ButtonShared';

export type { M3ButtonProps } from './m3ButtonShared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Premium M3 Button with tactile feedback and expressive states. */
export function M3Button({
  variant = 'filled',
  leftIcon,
  rightIcon,
  loading,
  fullWidth,
  style,
  labelStyle,
  haptic = true,
  children,
  disabled,
  onPress,
  ...rest
}: M3ButtonProps) {
  const colors = useM3Colors();
  const isDisabled = disabled || loading;
  const { backgroundColor, textColor, borderColor, elevation } = resolveM3ButtonVisuals(variant, colors);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withSpring(MotionTokens.pressScale, SpringConfig.snappy);
    opacity.value = withSpring(0.9, SpringConfig.snappy);
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
    opacity.value = withSpring(1, SpringConfig.smooth);
  };

  const horizontalPadding = variant === 'text' ? 12 : 24;

  return (
    <AnimatedPressable
      {...rest}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          minHeight: m3ButtonLayout.buttonHeight,
          paddingHorizontal: horizontalPadding,
          backgroundColor,
          borderColor,
          borderRadius: m3ButtonLayout.radius,
          elevation,
        },
        fullWidth && styles.fullWidth,
        animatedStyle,
        isDisabled && { opacity: 0.38, elevation: 0 },
        style,
      ]}
    >
      {variant === 'gradient' && (
        <LinearGradient
          colors={SignatureGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: m3ButtonLayout.radius }]}
        />
      )}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {leftIcon ? (
              <Ionicons name={leftIcon} size={18} color={textColor} />
            ) : null}
            {typeof children === 'string' ? (
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize: 14,
                    letterSpacing: 0.15,
                  },
                  labelStyle,
                ]}
              >
                {children}
              </Text>
            ) : (
              children
            )}
            {rightIcon ? (
              <Ionicons name={rightIcon} size={18} color={textColor} />
            ) : null}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}
