import React, { useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getStateForCity, GLOBAL_REGIONS } from '@/constants/locations';
import { CULTURE_DESTINATIONS, type CultureDestinationDefinition } from '@/constants/cultureDestinations';
import { cultureHubIndexLinkPath } from '@/lib/cultureHubDeepLink';
import { CultureTokens, CardTokens, FontFamily } from '@/design-system/tokens/theme';
import SectionHeader from './SectionHeader';

const CARD_W = 200;
const IMG_H = 120;
const SNAP = CARD_W + 14;

function CultureHubCard({ def, onPress, colors }: {
  def: CultureDestinationDefinition;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${def.heroTitle} culture hub`}
    >
      <View style={s.imgWrap}>
        <Image source={{ uri: def.heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
        <View style={[s.badge, { backgroundColor: CultureTokens.gold }]}>
          <Text style={s.badgeText}>{def.heroBadge}</Text>
        </View>
      </View>
      <View style={s.body}>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>{def.heroTitle}</Text>
        <Text style={[s.tagline, { color: colors.textSecondary }]} numberOfLines={2}>{def.tagline}</Text>
      </View>
    </Pressable>
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

  const hubs = useMemo(
    () => Object.values(CULTURE_DESTINATIONS).slice(0, 12),
    [],
  );

  const openHub = (publicPath: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const href = cultureHubIndexLinkPath(publicPath, prefs);
    router.push(href as never);
  };

  if (hubs.length === 0) return null;

  return (
    <View style={{ marginBottom: vPad }}>
      <View style={headerPadStyle}>
        <SectionHeader
          title="Culture Hubs"
          subtitle="Explore diaspora language and culture communities"
          onSeeAll={() => router.push('/culture')}
        />
      </View>
      <FlatList
        horizontal
        data={hubs}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => (
          <CultureHubCard def={item} onPress={() => openHub(item.publicPath)} colors={colors} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: 14 }]}
        snapToInterval={SNAP}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: CardTokens.radius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imgWrap: { width: '100%', height: IMG_H, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 9, fontFamily: FontFamily.bold, color: '#0F172A', letterSpacing: 0.8 },
  body: { padding: 12, gap: 4 },
  title: { fontSize: 15, fontFamily: FontFamily.bold },
  tagline: { fontSize: 11, fontFamily: FontFamily.regular, lineHeight: 16 },
});

export const CultureHubRail = React.memo(CultureHubRailComponent);
