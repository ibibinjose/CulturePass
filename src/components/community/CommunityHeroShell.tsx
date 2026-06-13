import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { M3Button, M3Card } from '@/design-system/ui';
import { M3Typography, FontFamily, Radius, gradients } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { DESTINATION_HERO_GRADIENT } from '@/components/city/destinationLayout';
import { useM3Colors } from '@/hooks/useM3Colors';
import { withAlpha } from '@/lib/withAlpha';

type StatItem = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
};

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

interface CommunityHeroShellProps {
  heroHeight: number;
  topInset: number;
  hPad: number;
  cityName: string;
  headline: string;
  subtitle: string;
  isAuthenticated: boolean;
  stats: StatItem[];
  quickActions: QuickAction[];
}

function StatChip({ icon, value, label, color }: StatItem) {
  const m3Colors = useM3Colors();
  return (
    <View style={[s.statChip, { backgroundColor: withAlpha(color, 0.08), borderColor: withAlpha(color, 0.2) }]}>
      <View style={[s.statIcon, { backgroundColor: withAlpha(color, 0.14) }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface, fontFamily: FontFamily.bold }]}>{value}</Text>
      <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

export function CommunityHeroShell({
  heroHeight,
  topInset,
  hPad,
  cityName,
  headline,
  subtitle,
  isAuthenticated,
  stats,
  quickActions,
}: CommunityHeroShellProps) {
  const m3Colors = useM3Colors();

  return (
    <View>
      <View style={[s.hero, { height: heroHeight }]}>
        <LinearGradient
          colors={[...gradients.culturepassBrand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={DESTINATION_HERO_GRADIENT} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />

        <View style={[s.heroNav, { paddingTop: topInset + 10, paddingHorizontal: hPad }]}>
          <View style={s.navSpacer} />
          <M3Card variant="elevated" style={[s.locPill, { borderColor: withAlpha(Luxe.colors.indigo, 0.22) }]}>
            <Ionicons name="location" size={14} color={Luxe.colors.indigo} />
            <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface }]} numberOfLines={1}>
              {cityName}
            </Text>
          </M3Card>
          <View style={s.navActions}>
            {isAuthenticated ? (
              <M3Button
                variant="tonal"
                leftIcon="add-circle-outline"
                onPress={() => router.push('/create/community')}
                style={s.navBtn}
                accessibilityLabel="Create community hub"
              />
            ) : (
              <View style={s.navSpacer} />
            )}
          </View>
        </View>

        <View style={[s.heroBody, { paddingHorizontal: hPad }]}>
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[s.badge, { backgroundColor: Luxe.colors.gold, borderColor: Luxe.colors.gold }]}>
              <Text style={[M3Typography.labelSmall, s.badgeText]}>COMMUNITY HUB</Text>
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(140).springify()} style={[s.title, M3Typography.displayMedium]}>
            {headline}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(200).springify()} style={s.subtitle}>
            {subtitle}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(260).springify()} style={s.ctaRow}>
            <M3Button variant="filled" onPress={() => router.push('/culturehub')} style={s.ctaBtn}>
              Culture hubs
            </M3Button>
            <M3Button variant="tonal" leftIcon="calendar-outline" onPress={() => router.push('/(tabs)/calendar')} style={s.ctaBtn}>
              Events
            </M3Button>
          </Animated.View>
        </View>
      </View>

      <View style={[s.statDockWrap, { marginTop: -32, paddingHorizontal: hPad }]}>
        <M3Card variant="elevated" style={s.statDock}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statRow}>
            {stats.map((stat) => (
              <StatChip key={stat.label} {...stat} />
            ))}
          </ScrollView>
        </M3Card>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.quickRow, { paddingHorizontal: hPad, paddingRight: hPad + 24 }]}
      >
        {quickActions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [
              s.quickChip,
              {
                backgroundColor: withAlpha(action.color, 0.1),
                borderColor: withAlpha(action.color, 0.24),
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={16} color={action.color} />
            <Text style={[M3Typography.labelMedium, { color: m3Colors.onSurface, fontFamily: FontFamily.semibold }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10 },
  navSpacer: { width: 46, height: 46 },
  navActions: { flexDirection: 'row' },
  navBtn: { width: 46, height: 46, borderRadius: 14, paddingHorizontal: 0 },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    maxWidth: 200,
  },
  heroBody: { paddingBottom: 40, alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm, borderWidth: 1, marginBottom: 4 },
  badgeText: { color: '#0F172A', letterSpacing: 1.4, fontFamily: FontFamily.bold },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    ...Platform.select({ web: { textShadow: '0 2px 16px rgba(0,0,0,0.4)' } as object, default: {} }),
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
    paddingHorizontal: 8,
  },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 14 },
  ctaBtn: { minWidth: 130 },
  statDockWrap: { zIndex: 20, marginBottom: 10 },
  statDock: { borderRadius: Radius.lg, paddingVertical: 10 },
  statRow: { gap: 10, paddingHorizontal: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 100,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quickRow: { gap: 10, paddingBottom: 6, paddingTop: 2 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});