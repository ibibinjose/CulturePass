/**
 * ConnectTeaser — coming-soon rail for social connection features.
 *
 * Surfaces the CulturePass social roadmap (Meetups, Groups, Culture Match,
 * Matrimony, Language Circles) as visually distinct teaser cards.
 * Each card is tappable and registers an expression of interest.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, FontSize } from '@/design-system/tokens/theme';

// ─── Feature definitions ──────────────────────────────────────────────────────

interface ConnectFeature {
  id: string;
  emoji: string;
  title: string;
  description: string;
  /** Opaque card fills (no translucent gradients — readable on web). */
  fillLight: string;
  fillDark: string;
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  interestMessage: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const safe = hex.replace('#', '').trim();
  const value = safe.length === 3
    ? safe.split('').map((c) => c + c).join('')
    : safe;
  const int = Number.parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!;
}

function alpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

const FEATURES: ConnectFeature[] = [
  {
    id: 'meetups',
    emoji: '🤝',
    title: 'CulturePass Meetups',
    description: 'Attend casual cultural gatherings and activities near you.',
    fillLight: '#0078FF',
    fillDark: '#0078FF',
    accentColor: '#0078FF',
    icon: 'people-circle-outline',
    interestMessage: 'You\'re on the early list for CulturePass Meetups — we\'ll notify you when it launches in your city.',
  },
  {
    id: 'groups',
    emoji: '👥',
    title: 'Cultural Groups',
    description: 'Join hobby circles, diaspora chapters and interest clubs.',
    fillLight: '#BD00FF',
    fillDark: '#BD00FF',
    accentColor: '#BD00FF',
    icon: 'grid-outline',
    interestMessage: 'Noted! We\'ll let you know when Cultural Groups launches so you can find your people.',
  },
  {
    id: 'culture-match',
    emoji: '💫',
    title: 'Culture Match',
    description: 'Meet people who share your roots, language and values.',
    fillLight: '#FF9A00',
    fillDark: '#FF9A00',
    accentColor: '#FF9A00',
    icon: 'heart-circle-outline',
    interestMessage: 'You\'re on the waitlist for Culture Match — culturally intelligent connections, coming soon.',
  },
  {
    id: 'matrimony',
    emoji: '💍',
    title: 'Matrimony',
    description: 'Find a life partner within your culture and community.',
    fillLight: '#01FF1F',
    fillDark: '#01FF1F',
    accentColor: '#01FF1F',
    icon: 'diamond-outline',
    interestMessage: 'Added to the early access list for CulturePass Matrimony. We\'ll reach out when it\'s ready.',
  },
  {
    id: 'language-circles',
    emoji: '🗣️',
    title: 'Language Circles',
    description: 'Practice languages with native speakers in your city.',
    fillLight: '#E3FF00',
    fillDark: '#E3FF00',
    accentColor: '#E3FF00',
    icon: 'chatbubbles-outline',
    interestMessage: 'Great — you\'re on the list for Language Circles. We\'ll notify you when it launches near you.',
  },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: ConnectFeature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const isDark = useIsDark();
  const cardFill = isDark ? feature.fillDark : feature.fillLight;
  const luminance = relativeLuminance(cardFill);
  const useDarkInk = luminance > 0.46;
  const primaryTextColor = useDarkInk ? '#0F172A' : '#FFFFFF';
  const secondaryTextColor = useDarkInk ? '#1E293B' : '#E2E8F0';
  const tertiaryTextColor = useDarkInk ? '#334155' : '#CBD5E1';
  const badgeBg = useDarkInk ? alpha('#FFFFFF', '33') : alpha('#000000', '33');
  const badgeBorder = useDarkInk ? alpha('#FFFFFF', '66') : alpha('#000000', '66');
  const footerBorder = useDarkInk ? alpha('#FFFFFF', '55') : alpha('#000000', '44');
  const footerChevron = useDarkInk ? '#475569' : '#E2E8F0';
  const notifyIconColor = useDarkInk ? '#0F172A' : '#FFFFFF';

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `${feature.emoji}  ${feature.title}`,
      feature.interestMessage,
      [{ text: 'Got it', style: 'default' }],
    );
  }, [feature]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${feature.title} — coming soon. Tap to register interest.`}
      style={({ pressed }) => [card.root, { opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: cardFill }]} />

      {/* Border */}
      <View style={[card.border, { borderColor: `${feature.accentColor}30` }]} />

      {/* Coming Soon badge */}
      <View style={[card.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
        <View style={[card.badgeDot, { backgroundColor: useDarkInk ? '#0F172A' : '#FFFFFF' }]} />
        <Text style={[card.badgeText, { color: tertiaryTextColor }]}>Coming Soon</Text>
      </View>

      {/* Body */}
      <View style={card.body}>
        <Text style={card.emoji}>{feature.emoji}</Text>
        <Text style={[card.title, { color: primaryTextColor }]} numberOfLines={2}>
          {feature.title}
        </Text>
        <Text style={[card.desc, { color: secondaryTextColor }]} numberOfLines={3}>
          {feature.description}
        </Text>
      </View>

      {/* Notify me footer */}
      <View style={[card.footer, { borderTopColor: footerBorder }]}>
        <Ionicons name="notifications-outline" size={12} color={notifyIconColor} />
        <Text style={[card.notifyText, { color: primaryTextColor }]}>Notify me</Text>
        <Ionicons name="chevron-forward" size={11} color={footerChevron} style={{ marginLeft: 'auto' }} />
      </View>
    </Pressable>
  );
}

const card = StyleSheet.create({
  root: {
    width: 192,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.18)' } as any,
    }),
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    margin: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
  },
  emoji: {
    fontSize: 30,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.bold,
    lineHeight: 20,
  },
  desc: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  notifyText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});

// ─── ConnectTeaser (exported) ─────────────────────────────────────────────────

export function ConnectTeaser() {
  const colors = useColors();
  const { hPad } = useLayout();

  return (
    <View style={[rail.wrapper, { paddingHorizontal: hPad }]}>
      <View
        style={[
          rail.panel,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        {/* Section header */}
        <View style={rail.header}>
          <View style={[rail.accent, { backgroundColor: CultureTokens.coral }]} />
          <View style={{ flex: 1 }}>
            <Text style={[rail.title, { color: colors.text }]}>Meet · Connect · Belong</Text>
            <Text style={[rail.subtitle, { color: colors.textSecondary }]}>
              Social features coming to CulturePass
            </Text>
          </View>
          <View
            style={[
              rail.roadmapPill,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            ]}
          >
            <Text style={[rail.roadmapText, { color: CultureTokens.indigo }]}>Roadmap</Text>
          </View>
        </View>

        {/* Horizontal card scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={rail.scroll}
          decelerationRate="fast"
          snapToInterval={204}
          snapToAlignment="start"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const rail = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 12px rgba(15, 23, 42, 0.08)' } as object,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  accent: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  title: {
    fontSize: FontSize.body2,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  roadmapPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  roadmapText: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.3,
  },
  scroll: {
    gap: 12,
    paddingRight: 8,
  },
});
