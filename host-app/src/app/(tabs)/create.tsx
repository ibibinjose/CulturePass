import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  FontFamily,
  M3Typography,
  Radius,
  Spacing,
} from '@/design-system/tokens/theme';

type CreateOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  secondaryColor: string;
  badge?: string;
  route: string;
};

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: 'event',
    title: 'Event',
    subtitle: 'Festivals, performances, workshops, and live cultural experiences.',
    icon: 'musical-notes-outline',
    color: CultureTokens.indigo,
    secondaryColor: CultureTokens.violet,
    badge: 'Most popular',
    route: '/create/event',
  },
  {
    id: 'community',
    title: 'Community',
    subtitle: 'Build a cultural hub for your diaspora group, club, or organisation.',
    icon: 'people-outline',
    color: CultureTokens.coral,
    secondaryColor: CultureTokens.gold,
    route: '/create/community',
  },
  {
    id: 'listing',
    title: 'Marketplace Listing',
    subtitle: 'List products, services, or cultural business offerings.',
    icon: 'storefront-outline',
    color: CultureTokens.teal,
    secondaryColor: CultureTokens.emerald ?? CultureTokens.teal,
    route: '/create/listing',
  },
  {
    id: 'venue',
    title: 'Venue',
    subtitle: 'Register a space for cultural events and community gatherings.',
    icon: 'business-outline',
    color: CultureTokens.violet,
    secondaryColor: CultureTokens.indigo,
    route: '/create/venue',
  },
];

function CreateCard({ option, index }: { option: CreateOption; index: number }) {
  const colors = useColors();
  const m3 = useM3Colors();

  function handlePress() {
    router.push(option.route as any);
  }

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 80).springify()}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Icon well with gradient */}
        <LinearGradient
          colors={[option.color + '22', option.secondaryColor + '0A']}
          style={styles.iconWell}
        >
          <Ionicons name={option.icon} size={28} color={option.color} />
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: m3.onSurface }]}>{option.title}</Text>
            {option.badge ? (
              <View style={[styles.badge, { backgroundColor: CultureTokens.indigo + '18' }]}>
                <Text style={[styles.badgeText, { color: CultureTokens.indigo }]}>{option.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardSubtitle, { color: m3.onSurfaceVariant }]} numberOfLines={2}>
            {option.subtitle}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={m3.onSurfaceVariant} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CreateScreen() {
  const colors = useColors();
  const m3 = useM3Colors();
  const insets = useSafeAreaInsets();
  const { hPad } = useLayout();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.teal + '0E', CultureTokens.indigo + '08', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingHorizontal: hPad, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <Text style={[styles.title, { color: m3.onSurface }]}>Create</Text>
          <Text style={[styles.subtitle, { color: m3.onSurfaceVariant }]}>
            What do you want to build today?
          </Text>
        </Animated.View>

        {/* Create options */}
        <View style={styles.cardList}>
          {CREATE_OPTIONS.map((option, i) => (
            <CreateCard key={option.id} option={option} index={i} />
          ))}
        </View>

        {/* Tip section */}
        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={[styles.tipCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Ionicons name="bulb-outline" size={20} color={CultureTokens.gold} />
          <Text style={[styles.tipText, { color: m3.onSurfaceVariant }]}>
            <Text style={{ color: m3.onSurface, fontFamily: FontFamily.semibold }}>Pro tip: </Text>
            Add rich images and a detailed description to increase discovery and ticket sales.
          </Text>
        </Animated.View>

        {/* Help link */}
        <TouchableOpacity
          style={styles.helpRow}
          onPress={() => router.push('/help' as any)}
        >
          <Ionicons name="help-circle-outline" size={16} color={m3.onSurfaceVariant} />
          <Text style={[styles.helpText, { color: m3.onSurfaceVariant }]}>
            Need help? Visit the{' '}
            <Text style={{ color: CultureTokens.indigo }}>Creator Help Center</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: 24 },
  header: { gap: 6 },
  title: {
    ...M3Typography.headlineMedium,
    fontFamily: FontFamily.bold,
  },
  subtitle: { ...M3Typography.bodyLarge },
  cardList: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  iconWell: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: {
    ...M3Typography.titleMedium,
    fontFamily: FontFamily.semibold,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 0.3 },
  cardSubtitle: { ...M3Typography.bodySmall, lineHeight: 18 },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  tipText: { ...M3Typography.bodySmall, flex: 1, lineHeight: 18 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  helpText: { ...M3Typography.bodySmall },
});
