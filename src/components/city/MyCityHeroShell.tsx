import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { M3Button, M3Card } from '@/design-system/ui';
import { M3Typography, FontFamily, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { CITY_HERO_BADGE_ON_GOLD } from '@/components/city/CityDestinationStyles';
import { DESTINATION_HERO_GRADIENT } from '@/components/city/destinationLayout';
import { useM3Colors } from '@/hooks/useM3Colors';
import { withAlpha } from '@/lib/withAlpha';

type StatItem = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  onPress?: () => void;
};

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

interface MyCityHeroShellProps {
  heroImage: string;
  heroHeight: number;
  topInset: number;
  hPad: number;
  cityName: string;
  country: string;
  tagline: string;
  isViewingNonHome: boolean;
  isAuthenticated: boolean;
  firstName: string | null;
  subscribed: boolean;
  onBackHome?: () => void;
  onShare: () => void;
  onSubscribe: () => void;
  stats: StatItem[];
  quickActions: QuickAction[];
}

function StatChip({
  icon,
  value,
  label,
  color,
  onPress,
}: StatItem) {
  const m3Colors = useM3Colors();
  const inner = (
    <View style={[s.statChip, { backgroundColor: withAlpha(color, 0.08), borderColor: withAlpha(color, 0.2) }]}>
      <View style={[s.statIcon, { backgroundColor: withAlpha(color, 0.14) }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface, fontFamily: FontFamily.bold }]}>{value}</Text>
      <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.86 }]} accessibilityRole="button" accessibilityLabel={`${value} ${label}`}>
      {inner}
    </Pressable>
  );
}

export function MyCityHeroShell({
  heroImage,
  heroHeight,
  topInset,
  hPad,
  cityName,
  country,
  tagline,
  isViewingNonHome,
  isAuthenticated,
  firstName,
  subscribed,
  onBackHome,
  onShare,
  onSubscribe,
  stats,
  quickActions,
}: MyCityHeroShellProps) {
  const m3Colors = useM3Colors();

  return (
    <View>
      <View style={[s.hero, { height: heroHeight }]}>
        <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient colors={DESTINATION_HERO_GRADIENT} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />

        <View style={[s.heroNav, { paddingTop: topInset + 10, paddingHorizontal: hPad }]}>
          {isViewingNonHome && onBackHome ? (
            <M3Button variant="tonal" leftIcon="home-outline" onPress={onBackHome} style={s.navBtn} accessibilityLabel="Back to home city" />
          ) : (
            <View style={s.navBtnSpacer} />
          )}

          <Pressable onPress={() => router.push('/cities')} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, flex: 1, alignItems: 'center' }]}>
            <M3Card variant="elevated" style={[s.locPill, { borderColor: withAlpha(Luxe.colors.appBlue, 0.22) }]}>
              <Ionicons name="location" size={14} color={Luxe.colors.appBlue} />
              <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface }]} numberOfLines={1}>
                {cityName}
              </Text>
              <View style={[s.locDivider, { backgroundColor: m3Colors.outlineVariant }]} />
              <Text style={[M3Typography.labelMedium, { color: Luxe.colors.appBlue, fontFamily: FontFamily.bold }]}>Change</Text>
            </M3Card>
          </Pressable>

          <View style={s.navActions}>
            <M3Button variant="tonal" leftIcon="share-social-outline" onPress={onShare} style={s.navBtn} accessibilityLabel="Share city" />
            <M3Button variant="tonal" leftIcon="settings-outline" onPress={() => router.push('/settings')} style={s.navBtn} accessibilityLabel="City settings" />
          </View>
        </View>

        <View style={[s.heroBody, { paddingHorizontal: hPad }]}>
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View
              style={[
                s.badge,
                {
                  backgroundColor: isViewingNonHome ? withAlpha(Luxe.colors.indigo, 0.88) : Luxe.colors.gold,
                  borderColor: isViewingNonHome ? Luxe.colors.indigo : Luxe.colors.gold,
                },
              ]}
            >
              <Text
                style={[
                  M3Typography.labelSmall,
                  {
                    color: isViewingNonHome ? '#FFFFFF' : CITY_HERO_BADGE_ON_GOLD,
                    letterSpacing: 1.4,
                    fontFamily: FontFamily.bold,
                  },
                ]}
              >
                {isViewingNonHome ? 'EXPLORING' : 'MY CITY'}
              </Text>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(140).springify()} style={[s.cityTitle, M3Typography.displayLarge]}>
            {cityName}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={s.tagline}>
            {isAuthenticated && firstName && !isViewingNonHome
              ? `Welcome home, ${firstName} — ${tagline}`
              : tagline}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(260).springify()} style={s.ctaRow}>
            {subscribed ? (
              <M3Button variant="tonal" leftIcon="notifications" onPress={onSubscribe} style={s.ctaBtn}>
                Subscribed
              </M3Button>
            ) : (
              <Pressable onPress={onSubscribe} accessibilityRole="button" accessibilityLabel="Get city updates">
                <LinearGradient colors={Luxe.gradients.emeraldIndigo} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.subscribeBtn}>
                  <Ionicons name="notifications-outline" size={17} color="#FFFFFF" />
                  <Text style={s.subscribeText}>Get updates</Text>
                </LinearGradient>
              </Pressable>
            )}
            <M3Button
              variant="tonal"
              leftIcon="open-outline"
              onPress={() =>
                router.push({
                  pathname: '/city/[name]',
                  params: { name: cityName, country },
                } as never)
              }
              style={s.ctaBtn}
            >
              City hub
            </M3Button>
          </Animated.View>
        </View>
      </View>

      <View style={[s.statDockWrap, { marginTop: -34, paddingHorizontal: hPad }]}>
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
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  navBtn: { width: 46, height: 46, borderRadius: 14, paddingHorizontal: 0 },
  navBtnSpacer: { width: 46, height: 46 },
  navActions: { flexDirection: 'row', gap: 8 },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    maxWidth: 220,
  },
  locDivider: { width: 1, height: 14 },
  heroBody: { paddingBottom: 44, alignItems: 'center', gap: 6 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  cityTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    ...Platform.select({
      web: { textShadow: '0 2px 18px rgba(0,0,0,0.45)' } as object,
      default: {},
    }),
  },
  tagline: {
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 340,
    paddingHorizontal: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  ctaBtn: { minWidth: 128 },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    minWidth: 148,
    justifyContent: 'center',
  },
  subscribeText: { color: '#FFFFFF', fontFamily: FontFamily.bold, fontSize: 14 },
  statDockWrap: { zIndex: 20, marginBottom: 12 },
  statDock: {
    borderRadius: Radius.lg,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  statRow: { gap: 10, paddingHorizontal: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 108,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { gap: 10, paddingBottom: 8, paddingTop: 4 },
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

