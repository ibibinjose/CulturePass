import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import { CULTURE_DESTINATIONS, type CultureDestinationDefinition } from '@/constants/cultureDestinations';
import { cultureHubIndexLinkPath } from '@/lib/cultureHubDeepLink';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import SectionHeader from './SectionHeader';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

const CARD_SIZE = 168; // Square 1:1 size
const SNAP = CARD_SIZE + 14;

type CultureHubCardProps = {
  def: CultureDestinationDefinition;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  href: string;
};

function CultureHubCard({ def, onPress, colors, href }: CultureHubCardProps) {
  return (
    <Link href={href as any} asChild>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
          pressed && { opacity: 0.88 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open ${def.heroTitle} culture hub`}
      >
        <View style={s.imageContainer}>
          <Image
            source={{ uri: normalizeRemoteImageUri(def.heroImage) ?? undefined }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.75)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Badge */}
          <View style={[s.badge, { backgroundColor: CultureTokens.gold }]}>
            <Text style={s.badgeText} numberOfLines={1} ellipsizeMode="tail">
              {def.heroBadge}
            </Text>
          </View>

          {/* Title Overlay */}
          <View style={s.titleOverlay}>
            <Text style={[s.name, { color: '#fff' }]} numberOfLines={2}>
              {def.heroTitle}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function CultureHubRailComponent() {
  const colors = useColors();
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();
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

  const [selectedRegion, setSelectedRegion] = useState('All');

  const regions = useMemo(() => [
    { label: 'All', slugs: [] },
    { label: 'South Asian', slugs: ['kerala', 'gujarati', 'punjabi', 'tamil', 'telugu', 'bengali', 'marathi', 'kannada', 'odia', 'hindi'] },
    { label: 'East & SE Asian', slugs: ['filipino', 'vietnamese', 'korean', 'mandarin', 'japanese'] },
    { label: 'Middle Eastern', slugs: ['lebanese', 'persian'] },
    { label: 'African', slugs: ['somali', 'ethiopian', 'nigerian'] },
    { label: 'European', slugs: ['greek', 'italian', 'ukrainian'] },
    { label: 'Latin American', slugs: ['mexican'] },
  ], []);

  const filteredHubs = useMemo(() => {
    let list = Object.values(CULTURE_DESTINATIONS);
    if (selectedRegion !== 'All') {
      const regionData = regions.find(r => r.label === selectedRegion);
      if (regionData) {
        list = list.filter(h => regionData.slugs.includes(h.slug));
      }
    }
    return list.slice(0, 12);
  }, [selectedRegion, regions]);

  const openHub = (publicPath: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS === 'web') return;

    let safePath = publicPath.startsWith('/culturehub')
      ? publicPath
      : `/culturehub/${publicPath.replace(/^\//, '').split('/').pop() || ''}`;

    const href = cultureHubIndexLinkPath(safePath, prefs);
    router.push(href as never);
  };

  if (filteredHubs.length === 0) return null;

  return (
    <View style={{ marginBottom: vPad }}>
      <View style={headerPadStyle}>
        <SectionHeader
          title="Culture Hubs"
          subtitle="Explore diaspora language and culture communities"
          onSeeAll={() => router.push('/culturehub')}
        />
      </View>

      {/* Cultures / Regions Horizontal Scroll Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 8, paddingBottom: 12 }]}
        style={{ marginBottom: 4 }}
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
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active 
                    ? CultureTokens.indigo 
                    : (colors.borderLight + '4D'),
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
                  fontSize: 12,
                  fontFamily: active ? FontFamily.bold : FontFamily.medium,
                  color: active ? '#FFFFFF' : colors.text,
                }}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[scrollPadStyle, { gap: 14, flexDirection: 'row' }]}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
      >
        {filteredHubs.map((item) => {
          const targetHref = cultureHubIndexLinkPath(item.publicPath, prefs);
          return (
            <CultureHubCard
              key={item.slug}
              def={item}
              onPress={() => openHub(item.publicPath)}
              colors={colors}
              href={targetHref}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 110,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: FontFamily.bold,
    color: '#111827',
    letterSpacing: 0.3,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  name: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export const CultureHubRail = React.memo(CultureHubRailComponent);