import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCulturalTheme } from '@/providers/CulturalThemeProvider';
import { ButtonTokens, MotionTokens, AccessibilityTokens, IconSize } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

export type CulturalButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
export type CulturalButtonSize = 'sm' | 'md' | 'lg';

interface CulturalButtonProps extends TouchableOpacityProps {
  variant?: CulturalButtonVariant;
  size?: CulturalButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  iconOnly?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const CulturalButton: React.FC<CulturalButtonProps> = ({
  variant = 'filled',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconOnly = false,
  children,
  style,
  textStyle,
  haptic = false,
  onPress,
  ...touchableOpacityProps
}) => {
  const theme = useCulturalTheme();
  
  // Calculate dimensions based on size
  const height = ButtonTokens.height[size];
  const paddingHorizontal = ButtonTokens.paddingH[size];
  const fontSize = ButtonTokens.fontSize[size];
  
  // Determine button styles based on variant
  const getBackgroundColor = () => {
    if (disabled) return theme.isDark ? withAlpha(theme.onSurface, 0.12) : withAlpha(theme.onSurface, 0.12);
    
    switch (variant) {
      case 'filled':
        return theme.primary;
      case 'tonal':
        return withAlpha(theme.primary, 0.1);
      case 'elevated':
        return theme.surface;
      case 'outlined':
      case 'text':
        return 'transparent';
      default:
        return theme.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return withAlpha(theme.onSurface, 0.12);
    
    switch (variant) {
      case 'outlined':
        return theme.primary;
      case 'elevated':
        return withAlpha(theme.onSurface, 0.12);
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return withAlpha(theme.onSurface, 0.38);
    
    switch (variant) {
      case 'filled':
        return theme.onPrimary;
      case 'tonal':
      case 'elevated':
      case 'outlined':
      case 'text':
        return theme.primary;
      default:
        return theme.onPrimary;
    }
  };

  const handlePress = (e: any) => {
    if (loading || disabled) return;
    if (onPress) onPress(e);
  };

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height,
    paddingHorizontal: iconOnly ? height / 4 : paddingHorizontal,
    borderRadius: ButtonTokens.radius,
    backgroundColor: getBackgroundColor(),
    borderWidth: 1,
    borderColor: getBorderColor(),
    opacity: loading ? 0.8 : 1,
    width: fullWidth ? '100%' : iconOnly ? height : undefined,
    ...Platform.select({
      ios: {
        shadowColor: variant === 'elevated' ? theme.onSurface : 'transparent',
        shadowOffset: variant === 'elevated' ? { width: 0, height: 1 } : { width: 0, height: 0 },
        shadowOpacity: variant === 'elevated' ? 0.2 : 0,
        shadowRadius: variant === 'elevated' ? 1 : 0,
      },
      android: {
        elevation: variant === 'elevated' ? 2 : 0,
      },
      web: {
        boxShadow: variant === 'elevated' 
          ? `0px 1px 2px ${withAlpha(theme.onSurface, 0.3)}, 0px 1px 3px ${withAlpha(theme.onSurface, 0.15)}`
          : 'none',
      },
    }),
    ...style,
  };

  const textStyles: TextStyle = {
    fontFamily: 'Poppins_600SemiBold',
    fontSize,
    color: getTextColor(),
    textAlign: 'center',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={MotionTokens.pressScale}
      accessibilityState={{ disabled: disabled || loading }}
      {...touchableOpacityProps}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'sm' ? 'small' : 'small'} 
          color={variant === 'filled' ? theme.onPrimary : theme.primary} 
        />
      ) : (
        <>
          {leftIcon && (
            <Ionicons 
              name={leftIcon} 
              size={size === 'sm' ? IconSize.sm : IconSize.md} 
              color={getTextColor()} 
              style={{ marginRight: children ? ButtonTokens.iconGap : 0 }}
            />
          )}
          
          {!iconOnly && (
            <Text style={textStyles}>{children}</Text>
          )}
          
          {rightIcon && (
            <Ionicons 
              name={rightIcon} 
              size={size === 'sm' ? IconSize.sm : IconSize.md} 
              color={getTextColor()} 
              style={{ marginLeft: children ? ButtonTokens.iconGap : 0 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default CulturalButton;