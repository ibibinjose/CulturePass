import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ButtonTokens,
  MaterialExpressive,
} from '@/design-system/tokens/theme';

type M3SemanticColors = ReturnType<typeof import('@/hooks/useM3Colors').useM3Colors>;

export type M3Variant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text' | 'error' | 'gradient';

export interface M3ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: M3Variant;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
  children?: ReactNode;
}

export function resolveM3ButtonVisuals(
  variant: M3Variant,
  colors: M3SemanticColors,
): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  elevation: number;
} {
  let backgroundColor: string = 'transparent';
  let textColor: string = colors.primary;
  let borderColor: string = 'transparent';
  let elevation = 0;

  switch (variant) {
    case 'filled':
      backgroundColor = colors.primary;
      textColor = colors.onPrimary;
      break;
    case 'tonal':
      backgroundColor = colors.secondaryContainer;
      textColor = colors.onSecondaryContainer;
      break;
    case 'outlined':
      borderColor = colors.outline;
      textColor = colors.primary;
      break;
    case 'elevated':
      backgroundColor = colors.surfaceContainerLow;
      textColor = colors.primary;
      elevation = MaterialExpressive.elevation.level1;
      break;
    case 'text':
      textColor = colors.primary;
      break;
    case 'error':
      backgroundColor = colors.error;
      textColor = colors.onError;
      break;
    case 'gradient':
      // Background will be handled by LinearGradient in M3Button
      backgroundColor = 'transparent';
      textColor = '#FFFFFF';
      break;
  }

  return { backgroundColor, textColor, borderColor, elevation };
}

export const m3ButtonLayout = {
  buttonHeight: ButtonTokens.height.md,
  radius: MaterialExpressive.shape.full,
};

export const getM3ButtonSize = (size: 'sm' | 'md' | 'lg' = 'md') => {
  return {
    height: ButtonTokens.height[size],
    fontSize: ButtonTokens.fontSize[size],
    paddingH: ButtonTokens.paddingH[size],
  };
};

export const m3ButtonStyles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});
