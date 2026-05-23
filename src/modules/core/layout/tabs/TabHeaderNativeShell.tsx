/**
 * Solid tab header chrome for iOS/Android — one safe-area inset, no stacked BlurView/GlassView.
 * Web: use GlassView in the caller instead (this component is not used on web).
 */
import React, { type ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { MAIN_TAB_UI, TAB_HEADER_NATIVE_INSET_GAP } from '@/modules/core/layout/tabs/mainTabTokens';

type TabHeaderNativeShellProps = {
  hPad: number;
  children: ReactNode;
  style?: object;
  /** When false, only top/side padding + background (e.g. nested section). */
  showBottomBorder?: boolean;
  zIndex?: number;
};

export function TabHeaderNativeShell({
  hPad,
  children,
  style,
  showBottomBorder = true,
  zIndex,
}: TabHeaderNativeShellProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const topPad =
    Platform.OS === 'web'
      ? TAB_HEADER_NATIVE_INSET_GAP
      : insets.top + TAB_HEADER_NATIVE_INSET_GAP;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
          borderBottomWidth: showBottomBorder ? MAIN_TAB_UI.headerBorderWidth : 0,
          borderBottomColor: showBottomBorder ? colors.border : 'transparent',
          paddingTop: topPad,
          paddingHorizontal: hPad,
          zIndex: zIndex ?? 100,
        },
        Platform.OS === 'ios' && showBottomBorder
          ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 3,
            }
          : null,
        Platform.OS === 'android' && showBottomBorder ? { elevation: 2 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
});
