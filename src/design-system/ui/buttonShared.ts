import type { ReactNode } from 'react';
import type {
  PressableProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ButtonTokens,
  CultureTokens,
  gradients,
} from '@/design-system/tokens/theme';

type AppColors = ReturnType<typeof import('@/hooks/useColors').useColors>;
type AppIsDark = ReturnType<typeof import('@/hooks/useColors').useIsDark>;

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'gradient'
  | 'danger'
  | 'gold'
  | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  haptic?: boolean;
  gradientColors?: string[];
  children?: ReactNode;
}

export function resolveCulturePassButtonPalette(
  variant: ButtonVariant | undefined,
  colors: AppColors,
  isDark: AppIsDark,
): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  isGradient: boolean;
} {
  const v = variant ?? 'primary';
  let backgroundColor: string = colors.primary;
  let textColor: string = colors.textInverse;
  let borderColor = 'transparent';
  let isGradient = v === 'gradient';

  switch (v) {
    case 'secondary':
      backgroundColor = colors.surfaceElevated;
      textColor = colors.text;
      break;
    case 'outline':
      backgroundColor = 'transparent';
      textColor = colors.text;
      borderColor = colors.border;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = colors.text;
      break;
    case 'danger':
      backgroundColor = colors.error;
      textColor = '#FFFFFF';
      break;
    case 'gold':
      backgroundColor = CultureTokens.gold;
      textColor = '#1C1917';
      break;
    case 'glass':
      backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
      textColor = colors.text;
      borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      break;
    case 'gradient':
      isGradient = true;
      textColor = '#FFFFFF';
      break;
    default:
      backgroundColor = colors.primary;
      textColor = colors.textInverse;
  }

  return { backgroundColor, textColor, borderColor, isGradient };
}

export function buttonGradientColors(custom?: string[]) {
  return (custom || gradients.culturepassBrand) as unknown as readonly [
    string,
    string,
    ...string[],
  ];
}

export const culturePassButtonStyles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
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
    gap: ButtonTokens.iconGap,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
});
