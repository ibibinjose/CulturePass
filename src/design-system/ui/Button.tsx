import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/hooks/useColors';
import { ButtonTokens, MotionTokens } from '@/design-system/tokens/theme';

import {
  type ButtonProps,
  resolveCulturePassButtonPalette,
  buttonGradientColors,
  culturePassButtonStyles as styles,
} from './buttonShared';

export type { ButtonProps } from './buttonShared';

/** Web/default: avoids static `react-native-reanimated` import during Expo web SSR. Native: `Button.native.tsx`. */
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
  const { backgroundColor, textColor, borderColor, isGradient } = resolveCulturePassButtonPalette(
    variant,
    colors,
    isDark,
  );
  const resolvedGradientColors = buttonGradientColors(gradientColorsProp);
  const buttonHeight = ButtonTokens.height[size] || ButtonTokens.height.md;
  const horizontalPadding = ButtonTokens.paddingH[size] || ButtonTokens.paddingH.md;
  const fontSize = ButtonTokens.fontSize[size] || ButtonTokens.fontSize.md;

  const handlePress = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    if (haptic && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPress={handlePress}
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
          transform: [{ scale: pressed && !isDisabled ? MotionTokens.pressScale : 1 }],
        },
        fullWidth && styles.fullWidth,
        style,
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
    </Pressable>
  );
}

export default Button;
