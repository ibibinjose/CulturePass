/**
 * Floating bottom navigation that mirrors main tab destinations (Discover, Events,
 * Community, My City). Use on stack screens where the tab bar is hidden. Hidden on
 * desktop web (sidebar handles navigation).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '@/design-system/ui/GlassView';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens, LiquidGlassTokens } from '@/design-system/tokens/theme';
import { useLayout } from '@/hooks/useLayout';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';

const DESTINATIONS = [
  { href: '/(tabs)' as const, label: 'Discover', icon: 'compass-outline' as const },
  { href: '/(tabs)/calendar' as const, label: 'Events', icon: 'calendar-outline' as const },
  { href: '/(tabs)/community' as const, label: 'Community', icon: 'people-outline' as const },
  { href: '/(tabs)/city' as const, label: 'My City', icon: 'location-outline' as const },
] as const;

/** Extra ScrollView / FlatList padding so content clears the floating tab bar + safe area. */
export function mainDestinationsScrollBottomPad(showQuickNav: boolean, bottomInset: number): number {
  if (!showQuickNav) return 40 + bottomInset;
  const navShell = MAIN_TAB_UI.tabBarOuterHeight + Math.max(bottomInset, 10) + 8;
  return 24 + navShell;
}

export function MainDestinationsQuickNav() {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();

  if (Platform.OS === 'web' && isDesktop) return null;

  const bottomPad = Math.max(insets.bottom, 10);
  const pillShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.14,
      shadowRadius: 16,
    },
    android: { elevation: 14 },
    web: {
      boxShadow: isDark
        ? '0px 6px 20px rgba(0,0,0,0.6)'
        : '0px 6px 20px rgba(44,42,114,0.18)',
    },
    default: {},
  });

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]} pointerEvents="box-none">
      <GlassView
        borderRadius={LiquidGlassTokens.corner.mainCard}
        bordered
        style={[
          styles.pill,
          pillShadow,
          {
            borderColor: colors.borderLight,
            overflow: 'hidden',
            width: '100%',
            maxWidth: MAIN_TAB_UI.chromeMaxWidth,
            alignSelf: 'center',
          },
        ]}
        contentStyle={styles.pillInner}
      >
        <LinearGradient
          colors={[CultureTokens.violet, CultureTokens.emerald, 'rgba(34, 197, 94, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topLine}
        />
        {DESTINATIONS.map((d) => (
          <Pressable
            key={d.href}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${d.label}`}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace(d.href);
            }}
          >
            <Ionicons name={d.icon} size={22} color={colors.textSecondary} />
            <Text style={[styles.itemLabel, { color: colors.textSecondary }]} numberOfLines={1}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  pill: {
    minHeight: MAIN_TAB_UI.tabBarOuterHeight,
  },
  pillInner: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MAIN_TAB_UI.tabBarInnerHeight,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 0,
  },
  itemLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
  },
});
