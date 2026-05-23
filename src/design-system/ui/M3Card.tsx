import React, { type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useM3Colors } from '@/hooks/useM3Colors';
import { MaterialExpressive, MotionTokens } from '@/design-system/tokens/theme';

type M3CardVariant = 'elevated' | 'filled' | 'outlined';

export interface M3CardProps extends ViewProps {
  variant?: M3CardVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

function resolveM3CardSurface(
  variant: M3CardVariant,
  colors: ReturnType<typeof useM3Colors>,
) {
  let backgroundColor = colors.surfaceContainer;
  let borderColor = 'transparent';
  let elevation = 0;

  switch (variant) {
    case 'elevated':
      backgroundColor = colors.surfaceContainerLow;
      elevation = MaterialExpressive.elevation.level1;
      break;
    case 'filled':
      backgroundColor = colors.surfaceContainerHighest;
      break;
    case 'outlined':
      backgroundColor = colors.surface;
      borderColor = colors.outlineVariant;
      break;
  }

  return { backgroundColor, borderColor, elevation };
}

/** Shared implementation (web + native): avoids loading Reanimated at module init when native/JS Reanimated versions can mismatch. */
export function M3Card({
  variant = 'filled',
  onPress,
  style,
  children,
  ...rest
}: M3CardProps) {
  const colors = useM3Colors();
  const { backgroundColor, borderColor, elevation } = resolveM3CardSurface(variant, colors);

  const baseStatic = [
    styles.base,
    {
      backgroundColor,
      borderColor,
      elevation,
      borderRadius: MaterialExpressive.shape.cornerLarge,
    },
    style,
  ];

  if (!onPress) {
    return (
      <View {...rest} style={baseStatic as StyleProp<ViewStyle>}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      {...rest}
      onPress={onPress}
      style={({ pressed }) => [
        ...baseStatic,
        { transform: [{ scale: pressed ? MotionTokens.pressScale : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
