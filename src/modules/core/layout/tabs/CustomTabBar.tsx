/**
 * CustomTabBar — production bottom navigation for iOS and Android.
 *
 * Active tab: violet→coral gradient pill with white icon + vibrant label.
 * Inactive tabs: muted tertiary icons + subdued label.
 * Spring animation on press/release for tactile feel.
 * Desktop web uses the sidebar instead.
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
// import type { Route } from '@react-navigation/native';
type Route<T extends string, P extends object | undefined = object | undefined> = {
  key: string;
  name: T;
  params?: P;
  path?: string;
};

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
  SpringConfig,
  TabBarTokens,
} from '@/design-system/tokens/theme';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';
import { withAlpha } from '@/lib/withAlpha';

type MainTabName = 'index' | 'calendar' | 'community' | 'city' | 'my-space';

type MainTabConfig = {
  name: MainTabName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
};

const MAIN_TABS: readonly MainTabConfig[] = [
  {
    name: 'index',
    label: 'Discover',
    icon: 'compass-outline',
    activeIcon: 'compass',
    accessibilityLabel: 'Discover tab',
  },
  {
    name: 'calendar',
    label: 'Calendar',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    accessibilityLabel: 'Calendar tab',
  },
  {
    name: 'community',
    label: 'Community',
    icon: 'people-outline',
    activeIcon: 'people',
    accessibilityLabel: 'Community tab',
  },
  {
    name: 'city',
    label: 'My City',
    icon: 'location-outline',
    activeIcon: 'location',
    accessibilityLabel: 'My City tab',
  },
  {
    name: 'my-space',
    label: 'Profile',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
    accessibilityLabel: 'Profile tab',
  },
] as const;

const TAB_CONFIG_BY_NAME = new Map<string, MainTabConfig>(
  MAIN_TABS.map((tab) => [tab.name, tab]),
);

function isMainTabRoute(route: Route<string>): route is Route<MainTabName> {
  return TAB_CONFIG_BY_NAME.has(route.name);
}

/** Gradient stop colors for the active pill — violet → coral brand sweep */
const ACTIVE_PILL_GRADIENT: [string, string] = [CultureTokens.violet, CultureTokens.coral];

type TabItemProps = {
  config: MainTabConfig;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  itemStyle?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TabItem = memo(function TabItem({
  config,
  isActive,
  onPress,
  onLongPress,
  itemStyle,
}: TabItemProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.90, SpringConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={config.accessibilityLabel}
      accessibilityHint={
        isActive
          ? 'Selected. Double tap to refresh or scroll to top.'
          : 'Double tap to open.'
      }
      hitSlop={styles.hitSlop}
      android_ripple={
        Platform.OS === 'android'
          ? { color: withAlpha(CultureTokens.violet, 0.14), borderless: false }
          : undefined
      }
      style={[styles.tabItem, itemStyle, animatedStyle]}
    >
      {/* Icon pill */}
      <View style={[styles.iconWell, isActive && styles.iconWellActive]}>
        {isActive && (
          <LinearGradient
            colors={ACTIVE_PILL_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: Radius.full }]}
          />
        )}
        <Ionicons
          name={isActive ? config.activeIcon : config.icon}
          size={22}
          color={isActive ? '#FFFFFF' : colors.textTertiary}
        />
      </View>

      {/* Label */}
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? CultureTokens.violet : colors.textTertiary,
            fontFamily: isActive ? FontFamily.semibold : FontFamily.regular,
          },
        ]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {config.label}
      </Text>
    </AnimatedPressable>
  );
});

export function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop } = useLayout();

  const visibleRoutes = useMemo(
    () => (state?.routes || []).filter(isMainTabRoute),
    [state?.routes],
  );

  const activeRouteKey = state?.routes && state?.index !== undefined
    ? state.routes[state.index]?.key
    : undefined;
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? Spacing.sm : Spacing.xs,
  );
  const minTouchTarget = Platform.OS === 'android' ? 48 : MAIN_TAB_UI.minTouchTarget;
  const barHeight = TabBarTokens.heightMobile + bottomInset;

  const handlePress = useCallback(
    (route: Route<string>, isActive: boolean) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }

      if (!isActive && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (route: Route<string>) => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    },
    [navigation],
  );

  if (Platform.OS === 'web' && isDesktop) return null;

  const barBg =
    Platform.OS === 'ios'
      ? withAlpha(isDark ? '#0C0A09' : '#FFFFFF', 0.84)
      : (isDark ? '#0C0A09' : colors.surface);

  const barBorderColor = isDark
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(0,0,0,0.09)';

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.bar,
          {
            minHeight: barHeight,
            paddingBottom: bottomInset,
            backgroundColor: barBg,
            borderTopColor: barBorderColor,
          },
          Platform.OS === 'android' ? styles.androidElevation : styles.iosShadow,
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={isDark ? 52 : 60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.row}>
          {visibleRoutes.map((route: Route<string>) => {
            const config = TAB_CONFIG_BY_NAME.get(route.name);
            if (!config) return null;
            const isActive = activeRouteKey === route.key;
            return (
              <TabItem
                key={route.key}
                config={config}
                isActive={isActive}
                onPress={() => handlePress(route, isActive)}
                onLongPress={() => handleLongPress(route)}
                itemStyle={{ minHeight: minTouchTarget }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'transparent',
  },
  bar: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    minHeight: TabBarTokens.heightMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Spacing.sm,
    paddingTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: Radius.md,
    paddingHorizontal: 2,
  },
  iconWell: {
    width: 48,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconWellActive: {
    width: 56,
  },
  tabLabel: {
    width: '100%',
    textAlign: 'center',
    fontSize: FontSize.tab,
    lineHeight: 14,
    letterSpacing: 0,
  },
  androidElevation: {
    elevation: 8,
  },
  iosShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  hitSlop: {
    top: 4,
    bottom: 4,
    left: 2,
    right: 2,
  },
});
