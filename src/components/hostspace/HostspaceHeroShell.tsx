import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DESTINATION_HERO_GRADIENT } from '@/components/city/destinationLayout';
import { type HostspaceShellMode } from '@/components/hostspace/hostspaceLayout';
import { M3Button, M3Card } from '@/design-system/ui';
import { M3Typography, FontFamily, Radius, gradients } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { useM3Colors } from '@/hooks/useM3Colors';
import { navigateToCreationLab } from '@/lib/creationRouting';
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

interface HostspaceHeroShellProps {
  mode: HostspaceShellMode;
  heroHeight: number;
  topInset: number;
  hPad: number;
  headline: string;
  subtitle: string;
  eyebrow?: string;
  stats: StatItem[];
  quickActions: QuickAction[];
  primaryCta?: { label: string; onPress: () => void };
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

export function HostspaceHeroShell({
  mode,
  heroHeight,
  topInset,
  hPad,
  headline,
  subtitle,
  eyebrow,
  stats,
  quickActions,
  primaryCta,
}: HostspaceHeroShellProps) {
  const m3Colors = useM3Colors();
  const badge =
    eyebrow ??
    (mode === 'create' || mode === 'create-page' ? 'CREATION LAB' : 'HOST WORKSPACE');

  const defaultCta = {
    label: mode === 'create' || mode === 'create-page' ? 'Browse categories' : 'Create',
    onPress: () => navigateToCreationLab(`hostspace_hero_${mode}`),
  };
  const cta = primaryCta ?? defaultCta;

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

        <View style={[s.heroBody, { paddingHorizontal: hPad, paddingTop: topInset + 24 }]}>
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={[s.badge, { backgroundColor: Luxe.colors.gold, borderColor: Luxe.colors.gold }]}>
              <Text style={[M3Typography.labelSmall, s.badgeText]}>{badge}</Text>
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(140).springify()} style={[s.title, M3Typography.displayMedium]}>
            {headline}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(200).springify()} style={s.subtitle}>
            {subtitle}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(260).springify()} style={s.ctaRow}>
            <M3Button variant="filled" onPress={cta.onPress} style={s.ctaBtn} leftIcon="add-circle-outline">
              {cta.label}
            </M3Button>
            {mode === 'manage' ? (
              <M3Button
                variant="tonal"
                leftIcon="analytics-outline"
                onPress={() => router.push('/hostspace/dashboard' as never)}
                style={s.ctaBtn}
              >
                Dashboard
              </M3Button>
            ) : null}
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
  heroBody: { paddingBottom: 36, alignItems: 'center', gap: 6 },
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
    maxWidth: 400,
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