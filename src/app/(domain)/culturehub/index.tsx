import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, TextInput } from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens, gradients } from '@/design-system/tokens/theme';
import { M3TopAppBar } from '@/design-system/ui';
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

  const isDark = useIsDark();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRegion, setSelectedRegion] = React.useState('All');

  const regions = useMemo(() => [
    { label: 'All', slugs: [] },
    { label: 'South Asian', slugs: ['kerala', 'gujarati', 'punjabi', 'tamil', 'telugu', 'bengali', 'marathi', 'kannada', 'odia', 'hindi'] },
    { label: 'East & SE Asian', slugs: ['filipino', 'vietnamese', 'korean', 'mandarin', 'japanese'] },
    { label: 'Middle Eastern', slugs: ['lebanese', 'persian'] },
    { label: 'African', slugs: ['somali', 'ethiopian', 'nigerian'] },
    { label: 'European', slugs: ['greek', 'italian', 'ukrainian'] },
    { label: 'Latin American', slugs: ['mexican'] },
  ], []);

  const hubs = useMemo(() => {
    let list = Object.values(CULTURE_DESTINATIONS).sort((a, b) =>
      a.heroTitle.localeCompare(b.heroTitle, undefined, { sensitivity: 'base' }),
    );

    if (selectedRegion !== 'All') {
      const regionData = regions.find(r => r.label === selectedRegion);
      if (regionData) {
        list = list.filter(h => regionData.slugs.includes(h.slug));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (h) =>
          h.heroTitle.toLowerCase().includes(q) ||
          h.tagline.toLowerCase().includes(q) ||
          h.matchTerms.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [searchQuery, selectedRegion, regions]);


  const gap = 12;
  const cardSize = useMemo(() => {
    if (isDesktop) {
      const containerW = Math.min(960, contentWidth) - hPad * 2;
      return Math.floor((containerW - gap * 3) / 4);
    }
    return Math.floor((width - hPad * 2 - gap * 2) / 3);
  }, [isDesktop, contentWidth, width, hPad]);

  const openHub = (publicPath: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Safety net: force correct /culturehub/ base (in case data has legacy paths)
    let safePath = publicPath;
    if (!safePath.startsWith('/culturehub')) {
      const slug = safePath.replace(/^\//, '').split('/').pop() || safePath;
      safePath = `/culturehub/${slug}`;
    }

    const href = cultureHubIndexLinkPath(safePath, prefs);
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
        <M3TopAppBar
          title="Culture Hubs"
          onBack={goBack}
          denseWeb
          webChromeless
        />

        <ScrollView
          contentContainerStyle={{
            paddingTop: 72,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: hPad,
            maxWidth: isDesktop ? 960 : undefined,
            width: isDesktop ? contentWidth : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Clean hero */}
          <View style={[styles.heroBlock, { marginTop: 8 }]}>
            <View style={styles.heroRow}>
              <View style={[styles.heroIconWrap, { backgroundColor: CultureTokens.indigo + '15' }]}>
                <Ionicons name="planet-outline" size={24} color={CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[TextStyles.title3, { color: colors.text, fontSize: 22, lineHeight: 28 }]}>
                  Culture hubs
                </Text>
                <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4, lineHeight: 20, fontSize: 14 }]}>
                  Curated pages for language and diaspora communities.
                </Text>
              </View>
            </View>
          </View>

          {/* Search */}
          <View style={{ marginBottom: 20, marginTop: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.borderLight,
                paddingHorizontal: 14,
                height: 50,
              }}
            >
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={{ flex: 1, marginLeft: 10, fontSize: 16, color: colors.text }}
                placeholder="Search cultures or languages..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Cultures / Regions Horizontal Scroll Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            style={{ marginBottom: 8 }}
          >
            {regions.map((r) => {
              const active = selectedRegion === r.label;
              return (
                <Pressable
                  key={r.label}
                  onPress={() => {
                    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRegion(r.label);
                  }}
                  style={({ pressed }) => [
                    {
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active 
                        ? CultureTokens.indigo 
                        : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)'),
                      borderWidth: 1,
                      borderColor: active ? 'transparent' : colors.borderLight,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${r.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium',
                      color: active ? '#FFFFFF' : colors.text,
                    }}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text
            style={[
              TextStyles.caption,
              {
                color: colors.textTertiary,
                marginBottom: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontFamily: 'Poppins_600SemiBold',
              },
            ]}
          >
            All hubs ({hubs.length})
          </Text>

          <View style={styles.grid}>
            {hubs.map((def) => (
              <Pressable
                key={def.slug}
                onPress={() => openHub(def.publicPath)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    width: cardSize,
                    height: cardSize,
                    borderColor: colors.borderLight,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${def.heroTitle} hub`}
              >
                {def.heroImage ? (
                  <Image source={{ uri: def.heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <LinearGradient
                    colors={[...gradients.midnight]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.92)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.cardOverlayContent, { padding: isDesktop ? 12 : 8 }]}>
                  <View style={[styles.badge, { backgroundColor: CultureTokens.gold }]}>
                    <Text style={[styles.badgeText, { fontSize: isDesktop ? 8.5 : 7 }]} numberOfLines={1}>
                      {def.heroBadge}
                    </Text>
                  </View>
                  <Text style={[styles.cardTitle, { fontSize: isDesktop ? 16 : 12 }]} numberOfLines={1}>
                    {def.heroTitle}
                  </Text>
                  {isDesktop && (
                    <Text style={styles.cardTagline} numberOfLines={2}>
                      {def.tagline}
                    </Text>
                  )}
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
  heroBlock: { marginBottom: 4 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 6px 24px rgba(0,0,0,0.12)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      default: { elevation: 4 },
    }),
  },
  cardOverlayContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 2,
  },
  badgeText: {
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardTagline: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(241, 245, 249, 0.85)',
    lineHeight: 15,
  },
});
