import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens, gradients } from '@/design-system/tokens/theme';
import { CULTURE_DESTINATIONS } from '@/constants/cultureDestinations';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import { cultureHubIndexLinkPath } from '@/lib/cultureHubDeepLink';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { APP_NAME } from '@/lib/app-meta';
import { useSafeBack } from '@/lib/navigation';

export default function CultureHubIndexScreen() {
  const colors = useColors();
  const goBack = useSafeBack();
  const { hPad, isDesktop, contentWidth, width } = useLayout();
  const insets = useSafeAreaInsets();
  const { state: onboarding } = useOnboarding();

  const prefs = useMemo(() => {
    const country = onboarding.country?.trim() || 'Australia';
    const city = onboarding.city?.trim();
    let stateCode: string | undefined;
    if (city) {
      const st = getStateForCity(city);
      const row = st ? GLOBAL_REGIONS.find((r) => r.value === st) : undefined;
      if (row?.country === country) stateCode = st;
    }
    return { country, stateCode };
  }, [onboarding.country, onboarding.city]);

  const hubs = useMemo(
    () =>
      Object.values(CULTURE_DESTINATIONS).sort((a, b) =>
        a.heroTitle.localeCompare(b.heroTitle, undefined, { sensitivity: 'base' }),
      ),
    [],
  );

  const topPad = Platform.OS === 'web' ? 20 : insets.top + 12;
  const innerGridW = isDesktop ? Math.min(960, contentWidth) - hPad * 2 : width - hPad * 2;
  const cardMin = isDesktop ? Math.max(280, (innerGridW - 14) / 2) : undefined;

  const openHub = (publicPath: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const href = cultureHubIndexLinkPath(publicPath, prefs);
    router.push(href as never);
  };

  return (
    <ErrorBoundary>
      {Platform.OS === 'web' && (
        <Head>
          <title>{`Culture & language hubs · ${APP_NAME}`}</title>
          <meta
            name="description"
            content="Browse diaspora culture hubs — Kerala, Gujarati, Tamil, Filipino, and more. Open in your country or worldwide."
          />
        </Head>
      )}
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Culture hubs', headerShown: false }} />
        <LinearGradient
          colors={[gradients.culturepassBrand[0] + '14', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.45 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ScrollView
          contentContainerStyle={{
            paddingTop: topPad,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: hPad,
            maxWidth: isDesktop ? 960 : undefined,
            width: isDesktop ? contentWidth : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={goBack}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View style={[styles.backCircle, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Ionicons name="chevron-back" size={22} color={CultureTokens.indigo} />
            </View>
            <Text style={[TextStyles.callout, { color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }]}>
              Back
            </Text>
          </Pressable>

          <View style={styles.heroBlock}>
            <View style={[styles.heroIconWrap, { backgroundColor: CultureTokens.indigo + '18' }]}>
              <Ionicons name="planet-outline" size={28} color={CultureTokens.indigo} />
            </View>
            <Text style={[TextStyles.title2, { color: colors.text, marginTop: 14, fontSize: 30, lineHeight: 36 }]}>
              Culture hubs
            </Text>
            <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 10, lineHeight: 22 }]}>
              Curated pages for language and diaspora communities. Each hub opens in{' '}
              <Text style={{ fontFamily: 'Poppins_600SemiBold', color: colors.text }}>{prefs.country}</Text>
              — switch to worldwide or near me inside the hub.
            </Text>
          </View>

          <View
            style={[
              styles.hintCard,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <Ionicons name="link-outline" size={20} color={CultureTokens.teal} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[TextStyles.caption, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                Shareable links
              </Text>
              <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 4, lineHeight: 18 }]}>
                Country, state, scope, and distance settings sync in the URL for easy sharing.
              </Text>
            </View>
          </View>

          <Text
            style={[
              TextStyles.caption,
              {
                color: colors.textTertiary,
                marginTop: 22,
                marginBottom: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontFamily: 'Poppins_600SemiBold',
              },
            ]}
          >
            All hubs ({hubs.length})
          </Text>

          <View style={[styles.grid, isDesktop && cardMin ? { flexDirection: 'row', flexWrap: 'wrap' } : undefined]}>
            {hubs.map((def) => (
              <Pressable
                key={def.slug}
                onPress={() => openHub(def.publicPath)}
                style={({ pressed }) => [
                  styles.card,
                  isDesktop && cardMin ? { width: cardMin, maxWidth: cardMin } : undefined,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${def.heroTitle} hub`}
              >
                <View style={styles.thumbWrap}>
                  {def.heroImage ? (
                    <Image source={{ uri: def.heroImage }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <LinearGradient
                      colors={[...gradients.midnight]}
                      style={styles.thumb}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.badgeOnImage, { backgroundColor: CultureTokens.gold }]}>
                    <Text style={[TextStyles.caption, { color: '#0F172A', fontSize: 10, fontFamily: 'Poppins_700Bold' }]}>
                      {def.heroBadge}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={[TextStyles.title3, { color: colors.text }]}>{def.heroTitle}</Text>
                  <Text
                    style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 6, lineHeight: 18 }]}
                    numberOfLines={2}
                  >
                    {def.tagline}
                  </Text>
                </View>
                <View style={[styles.chevronCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="chevron-forward" size={18} color={CultureTokens.indigo} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBlock: { marginBottom: 8 },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: 18,
    ...Platform.select({
      web: { boxShadow: '0 2px 14px rgba(0,0,0,0.05)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      default: { elevation: 2 },
    }),
  },
  grid: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    paddingRight: 14,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      default: { elevation: 3 },
    }),
  },
  thumbWrap: { width: 108, height: 108, position: 'relative', overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  badgeOnImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBody: { flex: 1, paddingVertical: 14, minWidth: 0 },
  chevronCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
