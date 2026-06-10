import React, { type ReactNode } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { getPassColorTheme, type PassColorVariant } from '@/modules/profile/components/digitalId/passCardUtils';

type PassCardShellProps = {
  width: number;
  height: number;
  colorVariant?: PassColorVariant;
  nativeID?: string;
  children: ReactNode;
};

export function PassCardShell({ width, height, colorVariant = 'cyan', nativeID, children }: PassCardShellProps) {
  const theme = getPassColorTheme(colorVariant);
  const shadow = theme.shellShadowNative;
  return (
    <View
      nativeID={nativeID}
      {...(Platform.OS === 'web' && nativeID ? ({ id: nativeID } as object) : {})}
      style={[
        styles.card,
        {
          width,
          height,
          backgroundColor: theme.bodyBg,
          borderColor: theme.bodyBorder,
          ...Platform.select({
            web: { boxShadow: theme.shellShadowWeb } as object,
            default: {
              shadowColor: shadow.color,
              shadowOffset: { width: 0, height: shadow.offsetY },
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: colorVariant === 'white' ? 4 : 6,
            },
          }),
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});