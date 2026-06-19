import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LuxeCard, LuxeText } from '@/design-system/ui';
import { CardTokens } from '@/design-system/tokens/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { getAuthScreenPalette } from '@/components/onboarding/authScreenTheme';

type ValueProp = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
};

const DEFAULT_VALUE_PROPS: ValueProp[] = [
  { icon: 'calendar-outline', title: 'Events', desc: "Discover what's on this week." },
  { icon: 'people-outline', title: 'Communities', desc: 'Join and share with your people.' },
  { icon: 'gift-outline', title: 'Perks', desc: 'Member-only rewards & offers.' },
];

const HOST_VALUE_PROPS: ValueProp[] = [
  { icon: 'calendar-outline', title: 'Create Events', desc: 'Publish ticketed or free events and manage bookings easily.' },
  { icon: 'storefront-outline', title: 'List on CultureMarket', desc: 'Sell products, services, or list your cultural business.' },
  { icon: 'people-outline', title: 'Build Communities', desc: 'Create groups, cultural associations, and member circles.' },
];

type AuthWebMarketingPanelProps = {
  enterAnimation: (delay: number) => AnimatedProps<typeof Animated.View>['entering'];
  variant?: 'login' | 'signup' | 'host';
};

export function AuthWebMarketingPanel({
  enterAnimation,
  variant = 'login',
}: AuthWebMarketingPanelProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const palette = getAuthScreenPalette(variant, isDark, colors);
  const isHost = variant === 'host';
  const valueProps = isHost ? HOST_VALUE_PROPS : DEFAULT_VALUE_PROPS;

  const kicker = isHost ? 'CREATOR HUB' : 'CULTUREPASS';
  const headline = isHost
    ? 'Empower your diaspora.'
    : variant === 'signup'
      ? 'Your cultural home,\nanywhere.'
      : 'Connecting cultures, building belonging.';
  const lead = isHost
    ? 'Publish ticketed or free events, sell products/services, build communities, and reach diaspora members.'
    : variant === 'signup'
      ? 'The premium marketplace for diaspora communities — events, businesses, and member perks.'
      : 'A premium cultural lifestyle marketplace built for diaspora cities.';

  return (
    <View style={[styles.panel, { backgroundColor: palette.panelBackground, borderColor: palette.panelBorder }]}>
      <Animated.View entering={enterAnimation(40)} style={styles.kickerRow}>
        <View style={[styles.dot, { backgroundColor: palette.accent }]} />
        <LuxeText variant="badgeCaps" style={[styles.kickerText, { color: palette.text }]}>
          {kicker}
        </LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(70)}>
        <LuxeText variant="displayHero" style={[styles.headline, { color: palette.text }]}>
          {headline}
        </LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(100)}>
        <LuxeText variant="hero" style={[styles.lead, { color: palette.textSecondary }]}>
          {lead}
        </LuxeText>
      </Animated.View>

      <Animated.View entering={enterAnimation(130)} style={styles.valueGrid}>
        {valueProps.map((item, index) => (
          <Animated.View key={item.title} entering={enterAnimation(160 + index * 30)}>
            <LuxeCard variant="glass" style={[styles.valueCard, { backgroundColor: palette.surfaceElevated, borderColor: palette.border }]}>
              <View style={[styles.valueStripe, { backgroundColor: palette.accent }]} />
              <View style={[styles.valueIcon, { backgroundColor: palette.accentMuted }]}>
                <Ionicons name={item.icon} size={18} color={palette.accent} />
              </View>
              <View style={styles.valueText}>
                <LuxeText variant="title3" style={[styles.valueTitle, { color: palette.text }]}>
                  {item.title}
                </LuxeText>
                <LuxeText variant="caption" style={[styles.valueDesc, { color: palette.textSecondary }]}>
                  {item.desc}
                </LuxeText>
              </View>
            </LuxeCard>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 360,
    maxWidth: 560,
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  kickerText: { letterSpacing: 1.5 },
  headline: {},
  lead: { marginTop: 12, maxWidth: 520 },
  valueGrid: { gap: 12, marginTop: 8, maxWidth: 520 },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: CardTokens.radius,
  },
  valueStripe: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 999,
  },
  valueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { flex: 1, minWidth: 0 },
  valueTitle: {},
  valueDesc: { marginTop: 2 },
});