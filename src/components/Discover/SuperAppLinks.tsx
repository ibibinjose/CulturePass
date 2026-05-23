import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';

interface AppLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const APP_LINKS: AppLink[] = [
  { id: 'culturemarket', label: 'Market', icon: 'storefront', color: CultureTokens.coral, route: '/CultureMarket' },
  { id: 'cultureshop', label: 'Deals', icon: 'pricetag', color: CultureTokens.gold, route: '/CultureShop' },
  /** Indigo / violet — gold (#FFEA5E)wash + icon had insufficient contrast on web */
  { id: 'events', label: 'Events', icon: 'calendar', color: CultureTokens.indigo, route: '/events' },
  { id: 'directory', label: 'Directory', icon: 'storefront', color: CultureTokens.indigo, route: '/(tabs)/directory' },
  { id: 'community', label: 'Community', icon: 'people', color: CultureTokens.purple, route: '/(tabs)/community' },
  { id: 'calendar', label: 'Calendar', icon: 'today', color: CultureTokens.teal, route: '/(tabs)/calendar' },
  { id: 'city', label: 'My city', icon: 'location', color: CultureTokens.indigo, route: '/(tabs)/city' },
  { id: 'search', label: 'Search', icon: 'search', color: CultureTokens.purple, route: '/search' },
  { id: 'movies', label: 'Movies', icon: 'film', color: CultureTokens.violet, route: '/movies' },
  { id: 'dining', label: 'Dining', icon: 'restaurant', color: CultureTokens.coral, route: '/restaurants' },
];

export function SuperAppLinks() {
  const colors = useColors();
  const { hPad } = useLayout();

  return (
    <View style={{ marginBottom: 24 }}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.row,
          {
            paddingHorizontal: hPad,
          },
        ]}
        style={styles.scroll}
      >
        {APP_LINKS.map((link) => (
          <Pressable
            key={link.id}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(link.route as any);
            }}
            accessibilityRole="button"
            accessibilityLabel={link.label}
          >
            {({ pressed }) => (
              <GlassView
                intensity={15}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.surface + (pressed ? 'B3' : '80'),
                    borderColor: colors.borderLight,
                    shadowColor: link.color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: pressed ? 0.2 : 0.05,
                    shadowRadius: 4,
                  },
                ]}
              >
                <LinearGradient
                  colors={[link.color + '30', link.color + '10']}
                  style={styles.iconWrap}
                >
                  <Ionicons
                    name={link.icon as any}
                    size={16}
                    color={link.color}
                  />
                </LinearGradient>
                <Text style={[styles.label, { color: colors.text }]}>{link.label}</Text>
              </GlassView>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { overflow: 'visible' },
  row: {
    gap: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 6,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },
});
