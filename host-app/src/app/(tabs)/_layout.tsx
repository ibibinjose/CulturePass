import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';

type TabRoute = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabRoute[] = [
  { name: 'index',   title: 'Dashboard', icon: 'grid-outline',        iconActive: 'grid' },
  { name: 'events',  title: 'Events',    icon: 'calendar-outline',     iconActive: 'calendar' },
  { name: 'scanner', title: 'Scanner',   icon: 'scan-outline',         iconActive: 'scan' },
  { name: 'create',  title: 'Create',    icon: 'add-circle-outline',   iconActive: 'add-circle' },
];

function HostTabBar({ state, descriptors, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS.find(t => t.name === route.name) ?? TABS[0];
        const isFocused = state.index === index;
        const scale = useSharedValue(1);

        const animStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }));

        function onPress() {
          scale.value = withSpring(0.9, { damping: 15 }, () => {
            scale.value = withSpring(1, { damping: 15 });
          });
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Animated.View key={route.key} style={[styles.tabItem, animStyle]}>
            <TouchableOpacity onPress={onPress} style={styles.tabTouchable} activeOpacity={1}>
              {isFocused ? (
                <LinearGradient
                  colors={[CultureTokens.violet, CultureTokens.coral]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.activeWell}
                >
                  <Ionicons name={tab.iconActive} size={22} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveWell}>
                  <Ionicons name={tab.icon} size={22} color={colors.textTertiary} />
                </View>
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? CultureTokens.violet : colors.textTertiary },
                  isFocused && styles.tabLabelActive,
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HostTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="events"  options={{ title: 'Events' }} />
      <Tabs.Screen name="scanner" options={{ title: 'Scanner' }} />
      <Tabs.Screen name="create"  options={{ title: 'Create' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabTouchable: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  activeWell: {
    width: 56,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveWell: {
    width: 56,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
  },
  tabLabelActive: {
    fontFamily: FontFamily.semibold,
  },
});
