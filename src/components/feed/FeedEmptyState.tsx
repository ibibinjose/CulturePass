import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { FeedFilter } from '@/components/feed/types';

type Props = {
  activeFilter: FeedFilter;
  hPad: number;
};

export function FeedEmptyState({ activeFilter, hPad }: Props) {
  const colors = useColors();

  const a11yLabel =
    activeFilter === 'events'
      ? 'No events in feed. Browse events to find something near you.'
      : activeFilter === 'communities'
        ? 'No community updates. Browse communities to join groups.'
        : 'Feed is empty. Explore communities or events to get started.';

  const title =
    activeFilter === 'events'
      ? 'No events in your area yet'
      : activeFilter === 'communities'
        ? 'No community updates yet'
        : 'Your feed is quiet';

  const subtitle =
    activeFilter === 'events'
      ? 'Check back soon or browse all events in your city'
      : activeFilter === 'communities'
        ? 'Join communities to see their updates here'
        : 'Follow communities and explore events — your personalised feed will fill up here';

  return (
    <View
      style={[styles.wrap, { paddingHorizontal: hPad }]}
      accessibilityRole="none"
      accessible
      accessibilityLabel={a11yLabel}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name="chatbubbles-outline" size={34} color={colors.textTertiary} accessible={false} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryCta,
            { backgroundColor: CultureTokens.indigo },
            Platform.OS === 'ios' && pressed ? { opacity: 0.9 } : null,
          ]}
          onPress={() => router.push(activeFilter === 'events' ? '/events' : '/(tabs)/community')}
          accessibilityRole="button"
          accessibilityHint="Opens the events or communities browse screen"
          android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.25)' } : undefined}
        >
          <Text style={[styles.primaryCtaText, { color: colors.textOnBrandGradient }]}>
            {activeFilter === 'events' ? 'Browse events' : 'Browse communities'}
          </Text>
        </Pressable>
        {activeFilter === 'for-you' && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryCta,
              { borderColor: colors.border },
              Platform.OS === 'ios' && pressed ? { opacity: 0.85 } : null,
            ]}
            onPress={() => router.push('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Go to Discovery"
            accessibilityHint="Opens the discovery home with featured rails"
            {...(Platform.OS === 'android'
              ? { android_ripple: { color: CultureTokens.indigo + '18', borderless: false } }
              : {})}
          >
            <Text style={[styles.secondaryCtaText, { color: colors.text }]}>Explore Discovery</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 24,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 21,
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  primaryCta: {
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 24,
  },
  primaryCtaText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 18,
  },
  secondaryCta: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  secondaryCtaText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
});
