import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import type { ReactNode } from 'react';
import { GlassView } from '@/design-system/ui/GlassView';
import { ScreenTokens } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';
import { TabPageChromeRow } from '@/modules/core/layout/tabs/TabHeaderChrome';
import { TabHeaderNativeShell } from '@/modules/core/layout/tabs/TabHeaderNativeShell';

interface TabPrimaryHeaderProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  topHeaderAction?: ReactNode;
  rightActions?: ReactNode;
  children?: ReactNode;
  hPad: number;
  topInset?: number;
  /** Page chrome (logo + title + search / notifications / account menu). */
  withGlobalNav?: boolean;
  /** Controls the divider under the chrome row (not the shell border). */
  showChromeHairline?: boolean;
  /** Use a plain solid surface on web instead of GlassView. */
  useSolidWebSurface?: boolean;
  /** Tighten vertical spacing on web headers. */
  denseWeb?: boolean;
}

export function TabPrimaryHeader({
  title,
  subtitle,
  locationLabel,
  topHeaderAction,
  rightActions,
  children,
  hPad,
  topInset = 0,
  withGlobalNav = true,
  showChromeHairline = false,
  useSolidWebSurface = false,
  denseWeb = false,
}: TabPrimaryHeaderProps) {
  const colors = useColors();
  const isWeb = Platform.OS === 'web';

  const webTopPad = topInset + ScreenTokens.topOffset;

  const chrome = withGlobalNav ? (
    <TabPageChromeRow
      title={title}
      subtitle={subtitle}
      locationLabel={locationLabel}
      topHeaderAction={topHeaderAction}
      showHairline={showChromeHairline}
    />
  ) : null;

  const toolbar = rightActions ? (
    <View style={styles.toolbarRow}>{rightActions}</View>
  ) : null;

  const body = (
    <>
      {chrome}
      {toolbar}
      {children ? <View style={styles.extra}>{children}</View> : null}
    </>
  );

  if (isWeb) {
    if (useSolidWebSurface) {
      return (
        <View
          style={[
            {
              borderBottomWidth: MAIN_TAB_UI.headerBorderWidth,
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            },
            {
              boxShadow: '0px 2px 12px rgba(0,0,0,0.07)',
            } as object,
          ]}
        >
          <View
            style={[
              styles.wrapWeb,
              denseWeb && styles.wrapWebDense,
              { paddingHorizontal: hPad, paddingTop: webTopPad },
            ]}
          >
            <View style={styles.chromeContainer}>{body}</View>
          </View>
        </View>
      );
    }

    return (
      <GlassView
        borderRadius={0}
        bordered={false}
        style={[
          {
            borderBottomWidth: MAIN_TAB_UI.headerBorderWidth,
            borderBottomColor: colors.border,
          },
          {
            boxShadow: '0px 2px 12px rgba(0,0,0,0.07)',
          } as object,
        ]}
        contentStyle={[
          styles.wrapWeb,
          denseWeb && styles.wrapWebDense,
          { paddingHorizontal: hPad, paddingTop: webTopPad },
        ]}
      >
        <View style={styles.chromeContainer}>{body}</View>
      </GlassView>
    );
  }

  return (
    <TabHeaderNativeShell hPad={hPad}>
      <View style={styles.wrapNative}>{body}</View>
    </TabHeaderNativeShell>
  );
}

const styles = StyleSheet.create({
  wrapWeb: {
    paddingBottom: MAIN_TAB_UI.headerVerticalPadding,
    gap: 8,
  },
  wrapWebDense: {
    paddingBottom: 4,
    gap: 4,
  },
  wrapNative: {
    paddingBottom: MAIN_TAB_UI.headerVerticalPadding,
    gap: 8,
  },
  chromeContainer: {
    width: '100%',
    maxWidth: MAIN_TAB_UI.chromeMaxWidth,
    alignSelf: 'center',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
    marginBottom: 2,
  },
  extra: {
    marginTop: 2,
  },
});
