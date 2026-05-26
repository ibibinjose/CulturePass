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
  getM3ButtonSize,
  m3ButtonStyles as styles,
} from './m3ButtonShared';

export type { M3ButtonProps } from './m3ButtonShared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Premium M3 Button with tactile feedback and expressive states. */
export function M3Button({
  variant = 'filled',
  size = 'md',
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
  const layout = React.useMemo(() => getM3ButtonSize(size), [size]);

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

  const horizontalPadding = variant === 'text' ? layout.paddingH / 2 : layout.paddingH;

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
          minHeight: layout.height,
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
              <Ionicons name={leftIcon as any} size={size === 'sm' ? 16 : 18} color={textColor} />
            ) : null}
            {typeof children === 'string' ? (
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontSize: layout.fontSize,
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
              <Ionicons name={rightIcon as any} size={size === 'sm' ? 16 : 18} color={textColor} />
            ) : null}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}
