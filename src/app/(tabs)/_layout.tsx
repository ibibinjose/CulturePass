// app/(tabs)/_layout.tsx
import { View, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { Tabs, useRouter, useSegments, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { CustomTabBar } from '@/modules/core/layout/tabs/CustomTabBar';
import { CultureTodayProvider } from '@/contexts/CultureTodayContext';
import { NavigationStateProvider } from '@/contexts/NavigationStateContext';
import { useLayout } from '@/hooks/useLayout';
import { M3NavigationRail, RailDestination } from '@/modules/core/layout/navigation/M3NavigationRail';
import { buildScreenAnnouncement } from '@/lib/accessibility';

const RAIL_DESTINATIONS: RailDestination[] = [
  { name: 'index', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  { name: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'community', label: 'Community', icon: 'people-outline', activeIcon: 'people' },
  { name: 'city', label: 'My City', icon: 'location-outline', activeIcon: 'location' },
  { name: 'my-space', label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

/**
 * Main Tab Layout — CulturePass
 * Bottom bar: Home · Calendar · Community · My City · Profile.
 * Secondary routes stay addressable but are hidden from the bottom bar.
 */
const TAB_NAMES: Record<string, string> = {
  index: 'Discover',
  calendar: 'Calendar',
  community: 'Community',
  city: 'My City',
  'my-space': 'Profile',
};

export default function TabsLayout() {
  const { isCompact } = useLayout();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const prevPathnameRef = useRef('');

  // Find current active tab from segments
  // segments for (tabs) usually look like ["(tabs)", "index"]
  const activeTab = Array.from(segments)[1] || 'index';
  const tabName = TAB_NAMES[activeTab] ?? activeTab;

  // Screen reader announcement on tab/screen change (Req 16.1)
  useEffect(() => {
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;
    const announcement = buildScreenAnnouncement(tabName, tabName);
    const timer = setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(announcement);
    }, 300); // small delay for transition to complete (Req 16.1 < 500ms)
    return () => clearTimeout(timer);
  }, [pathname, tabName]);

  const showRail = !isCompact && Platform.OS !== 'web'; // On web we might have a Sidebar already

  return (
    <NavigationStateProvider>
    <CultureTodayProvider>
      <View style={styles.tabShell}>
        {showRail && (
          <M3NavigationRail
            destinations={RAIL_DESTINATIONS}
            activeRouteName={activeTab}
            onNavigate={(name) => router.push(`/(tabs)/${name}`)}
          />
        )}
        <View style={styles.tabsFlex}>
        <Tabs
          tabBar={(props) => isCompact ? <CustomTabBar {...props} /> : null}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            lazy: true,
            tabBarStyle: {
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
          }}
          initialRouteName="index"
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="city"
        options={{
          title: 'My City',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'location' : 'location-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-space"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="host" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="menu" options={{ href: null }} />
      <Tabs.Screen name="communities/index" options={{ href: null }} />
        </Tabs>
        </View>
      </View>
    </CultureTodayProvider>
    </NavigationStateProvider>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    flex: 1,
    flexDirection: 'row',
  },
  tabsFlex: {
    flex: 1,
  },
});
