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
  const isWhite = colorVariant === 'white';
  const isBlack = colorVariant === 'black';

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
            web: {
              boxShadow: isWhite
                ? '0 2px 8px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.10), 0 20px 48px rgba(15,23,42,0.06)'
                : isBlack
                ? '0 4px 16px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.45), 0 32px 64px rgba(0,0,0,0.25)'
                : `0 4px 16px ${theme.bodyBorder}55, 0 12px 32px ${theme.bodyBorder}40, 0 24px 56px ${theme.bodyBorder}20`,
            } as object,
            default: {
              shadowColor: shadow.color,
              shadowOffset: { width: 0, height: shadow.offsetY },
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: isWhite ? 4 : 8,
            },
          }),
        },
      ]}
    >
      {children}
      {/* Inner top-edge highlight for glass/depth effect */}
      <View
        style={[
          styles.innerHighlight,
          { backgroundColor: isBlack ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.28)' },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    pointerEvents: 'none',
  },
});