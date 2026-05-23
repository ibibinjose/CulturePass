/**
 * Filter row shell: solid surface on native (no stacked glass), glass-style on web.
 */
import React, { type ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GlassView } from '@/design-system/ui/GlassView';
import { useColors } from '@/hooks/useColors';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';

export function FeedFilterRail({ children }: { children: ReactNode }) {
  const colors = useColors();

  if (Platform.OS === 'web') {
    return (
      <GlassView
        borderRadius={0}
        bordered={false}
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth * 2,
          borderBottomColor: colors.borderLight,
        }}
        contentStyle={styles.webInner}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.nativeRail,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 2,
            }
          : null,
        Platform.OS === 'android' ? { elevation: 1 } : null,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webInner: {
    paddingVertical: 0,
  },
  nativeRail: {
    borderBottomWidth: MAIN_TAB_UI.headerBorderWidth,
  },
});
