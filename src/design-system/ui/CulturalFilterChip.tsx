import React from 'react';
import {
  Text,
  Platform,
  ViewStyle,
  TextStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCulturalTheme } from '@/providers/CulturalThemeProvider';
import { ChipTokens } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

interface CulturalFilterChipProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconStyle?: ViewStyle;
}

export const CulturalFilterChip: React.FC<CulturalFilterChipProps> = ({
  label,
  icon,
  selected = false,
  disabled = false,
  style,
  textStyle,
  iconStyle,
  onPress,
  ...pressableProps
}) => {
  const theme = useCulturalTheme();
  const [hovered, setHovered] = React.useState(false);

  const isDark = theme.isDark;
  const isHovered = hovered && !selected;

  // === Selected (clicked) colours ===
  const selectedBg = withAlpha(theme.primary, isDark ? 0.28 : 0.18);
  const selectedBorder = theme.primary;
  const selectedContent = theme.primary;

  // === Unselected (not clicked) colours ===
  // Improved visibility by using higher contrast colors
  const unselectedBg = isDark 
    ? withAlpha(theme.onSurface, 0.12)
    : withAlpha(theme.onSurface, 0.12);
  const unselectedBorder = isDark 
    ? withAlpha(theme.onSurface, 0.30)
    : withAlpha(theme.onSurface, 0.24);
  const unselectedContent = withAlpha(theme.onSurface, isDark ? 0.95 : 0.85);

  // Hover (web) — subtle preview of selection
  const hoverBg = isHovered 
    ? withAlpha(theme.primary, isDark ? 0.18 : 0.12) // Adjusted for better contrast
    : undefined;
  const hoverBorder = isHovered 
    ? withAlpha(theme.primary, isDark ? 0.58 : 0.48) // Increased for better visibility
    : undefined;

  const chipStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ChipTokens.height,
    paddingHorizontal: ChipTokens.paddingH,
    paddingVertical: ChipTokens.paddingV,
    borderRadius: ChipTokens.radius,
    borderWidth: 1,
    borderColor: selected 
      ? selectedBorder 
      : hoverBorder ?? unselectedBorder,
    backgroundColor: selected 
      ? selectedBg 
      : hoverBg ?? unselectedBg,
    opacity: disabled ? 0.5 : 1,
    gap: ChipTokens.gap,
    // Subtle lift on hover for web
    ...(isHovered && Platform.OS === 'web'
      ? { transform: [{ scale: 1.01 }] as any }
      : {}),
    ...style,
  };

  const contentColor = selected || isHovered 
    ? selectedContent 
    : unselectedContent;

  const textStyles: TextStyle = {
    fontFamily: 'Poppins_500Medium',
    fontSize: ChipTokens.fontSize,
    color: contentColor,
    ...textStyle,
  };

  return (
    <Pressable
      style={chipStyle}
      onPress={disabled ? undefined : onPress}
      onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
      android_ripple={selected ? { color: withAlpha(theme.primary, 0.2) } : { color: withAlpha(theme.onSurface, 0.1) }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      {...pressableProps}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={14} 
          color={contentColor} 
          style={iconStyle}
        />
      )}
      <Text style={textStyles}>{label}</Text>
    </Pressable>
  );
};

export default CulturalFilterChip;