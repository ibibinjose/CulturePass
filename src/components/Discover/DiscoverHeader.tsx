import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { FontFamily, FontSize, LineHeight, LetterSpacing, Vitrine } from '@/design-system/tokens/theme';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';
import { LocationPicker } from '@/modules/core/components';
import { Ionicons } from '@expo/vector-icons';
import { withAlpha } from '@/lib/withAlpha';

interface DiscoverHeaderProps {
  currentTime: string;
  weatherSummary: string;
  city: string;
  country: string;
  isAuthenticated: boolean;
  onRefresh?: () => void;
}

function DiscoverHeaderComponent({
  currentTime,
  weatherSummary,
  city,
}: DiscoverHeaderProps) {
  const colors = useColors();
  const vitrine = useDiscoverVitrine();
  const { isDesktop, hPad } = useLayout();
  const { user } = useAuth();
  const greetingColor = colors.text;
  const metaColor = vitrine ? Vitrine.onSurfaceVariant : colors.textSecondary;
  const accentColor = vitrine ? Vitrine.tertiary : colors.primary;

  const { timeGreeting, firstName } = useMemo(() => {
    const hour = new Date().getHours();
    const tg = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fn = user?.displayName?.split(' ')[0] ?? user?.username ?? null;
    return { timeGreeting: tg, firstName: fn };
  }, [user?.displayName, user?.username]);

  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;
  const discoverMetaGradient = useMemo(
    () => [withAlpha(accentColor, 0.2), withAlpha(colors.textSecondary, 0.08)] as [string, string],
    [accentColor, colors.textSecondary]
  );
  const discoverMetaBadgeBg = useMemo(() => withAlpha(accentColor, 0.1), [accentColor]);

  // Scale greeting font down for longer names so it never wraps
  const greetingFontSize = useMemo(() => {
    const len = greeting.length;
    if (len <= 20) return FontSize.hero;       // ≤ "Good morning, Alex" → full size
    if (len <= 26) return FontSize.hero - 2;   // medium names
    if (len <= 32) return FontSize.hero - 4;   // longer names
    return FontSize.hero - 6;                  // very long names
  }, [greeting]);
  const mobileMetaLabel = [currentTime, weatherSummary].filter(Boolean).join(' · ');

  return (
    <View>
      {isDesktop ? (
        <View style={[styles.heroDesktop, { paddingHorizontal: hPad }]}>
          <View style={styles.heroDesktopRow}>
            {vitrine ? (
              <View style={[styles.heritageBar, { backgroundColor: Vitrine.tertiary }]} accessibilityElementsHidden />
            ) : null}
            <View style={styles.heroDesktopLeft}>
              <LinearGradient
                colors={discoverMetaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.metaBadge, { backgroundColor: discoverMetaBadgeBg }]}
              >
                <Ionicons name="sparkles" size={12} color={accentColor} />
                <Text style={[styles.desktopMeta, { color: accentColor, fontWeight: '700', marginBottom: 0 }]}>
                  {currentTime}
                  {weatherSummary ? ` · ${weatherSummary}` : ''}
                </Text>
              </LinearGradient>
              <Text
                style={[styles.desktopGreeting, { color: greetingColor, fontSize: Math.min(48, greetingFontSize + 12) }]}
              >
                {greeting}
              </Text>
              <Text style={[styles.desktopSub, { color: metaColor }]}>
                {`Explore festivals, communities, and events in ${city}.`}
              </Text>
            </View>
          </View>
          <View style={styles.desktopActions}>
            <LocationPicker />
          </View>
        </View>
      ) : (
        <View style={[styles.mobileHero, { paddingHorizontal: hPad }]}>
          <LinearGradient
            colors={discoverMetaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.metaBadge, { backgroundColor: discoverMetaBadgeBg }]}
          >
            <Ionicons name="time" size={12} color={accentColor} />
            <Text style={[styles.mobileMetaLabel, { color: accentColor }]} numberOfLines={1}>
              {mobileMetaLabel}
            </Text>
          </LinearGradient>
          <Text style={[styles.mobileGreeting, { color: greetingColor, fontSize: greetingFontSize + 2 }]} numberOfLines={1}>
            {greeting}
          </Text>
          <View style={styles.mobileMetaRow}>
            <View style={styles.mobileMetaLocationWrap}>
              <LocationPicker variant="text" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mobileHero: {
    marginTop: 24,
    marginBottom: 24,
    gap: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  mobileMetaLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mobileGreeting: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.bold,
    letterSpacing: LetterSpacing.tight,
    lineHeight: LineHeight.hero,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  mobileMetaLocationWrap: {
    flexShrink: 1,
  },
  mobileMeta: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    opacity: 0.85,
  },

  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 32,
  },
  heroDesktopRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heritageBar: {
    width: 4,
    borderRadius: 3,
    marginTop: 6,
    minHeight: 56,
    alignSelf: 'flex-start',
  },
  heroDesktopLeft: { flex: 1 },
  desktopMeta: { fontSize: FontSize.chip, fontFamily: FontFamily.regular, marginBottom: 4 },
  desktopGreeting: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
    lineHeight: 42,
  },
  desktopSub: {
    fontSize: FontSize.callout,
    fontFamily: FontFamily.regular,
    lineHeight: LineHeight.callout,
    marginTop: 8,
  },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 24 },
});

export const DiscoverHeader = React.memo(DiscoverHeaderComponent);
