import React from 'react';
import { View, type ViewProps, type ViewStyle, type StyleProp } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface CardSurfaceProps extends ViewProps {
  bordered?: boolean;
  borderRadius?: number;
  colors?: { surface?: string; borderLight?: string };
  contentStyle?: StyleProp<ViewStyle>;
}

export function CardSurface({
  bordered = true,
  borderRadius = 14,
  colors,
  style,
  contentStyle,
  children,
  ...rest
}: CardSurfaceProps) {
  const theme = useColors();
  return (
    <View
      {...rest}
      style={[
        {
          borderRadius,
          backgroundColor: colors?.surface ?? theme.surface,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors?.borderLight ?? theme.borderLight,
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

export default CardSurface;
