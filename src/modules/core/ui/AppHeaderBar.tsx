/**
 * AppHeaderBar — consistent surface-coloured top bar across iOS, Android, Web.
 * Use on payment, tickets, profile, and other secondary screens.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FontFamily, FontSize, LineHeight, HeaderTokens, ScreenTokens } from '@/design-system/tokens/theme';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';
import { goBackOrReplace } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

/** Standard height of the AppHeaderBar content row (excluding safe-area inset). */
export const APP_HEADER_BAR_HEIGHT = HeaderTokens.height;

export interface AppHeaderBarProps {
  /** Page title */
  title: string;
  /** Optional subtitle shown below the title */
  subtitle?: string;
  /** Back fallback route when no history */
  backFallback?: string;
  /** Right action: icon + onPress */
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
  /**
   * Top padding for safe area.
   * Pass `0` explicitly to suppress. Omit to auto-read from safe-area insets (native)
   * or use 0 (web).
   */
  topInset?: number;
}

export function AppHeaderBar({
  title,
  subtitle,
  backFallback = '/(tabs)',
  rightAction,
  topInset,
}: AppHeaderBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const resolvedInset = (topInset ?? (isWeb ? 0 : insets.top)) + ScreenTokens.topOffset;

  const handleBack = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    goBackOrReplace(backFallback);
  };

  const handleRight = () => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    rightAction?.onPress();
  };

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: resolvedInset,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        Platform.OS === 'ios' && styles.iosShadow,
        Platform.OS === 'android' && styles.androidElevation,
        isWeb && (styles.webShadow as object),
      ]}
    >
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
          ]}
          onPress={handleBack}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
            ]}
            onPress={handleRight}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label ?? 'Action'}
          >
            <Ionicons name={rightAction.icon} size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  androidElevation: {
    elevation: 2,
  },
  webShadow: {
    boxShadow: '0px 1px 4px rgba(0,0,0,0.07)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: APP_HEADER_BAR_HEIGHT,
  },
  btn: {
    width: MAIN_TAB_UI.minTouchTarget,
    height: MAIN_TAB_UI.minTouchTarget,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnPlaceholder: {
    width: MAIN_TAB_UI.minTouchTarget,
    height: MAIN_TAB_UI.minTouchTarget,
    flexShrink: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    minWidth: 0,
  },
  title: {
    fontSize: HeaderTokens.titleFontSize,
    lineHeight: HeaderTokens.titleFontSize + 6,
    fontFamily: HeaderTokens.titleFontFamily,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: FontSize.caption,
    lineHeight: LineHeight.caption,
    fontFamily: FontFamily.regular,
  },
});
