import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens } from '@/design-system/tokens/theme';
import { luxeDark, RICH_INDIGO, EMERALD_HARMONY } from '@/design-system/tokens/luxeHeritage';
import SectionHeader from './SectionHeader';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { RailErrorBanner } from './RailErrorBanner';
import { DiscoverRailErrorBoundary } from './DiscoverRailErrorBoundary';
import { useFeaturedCities, cityGradient, type FeaturedCityData } from '@/hooks/useFeaturedCities';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

const goCitiesHub = () => {
  router.push('/cities');
};

// ---------------------------------------------------------------------------
// New Luxe Color Palette (heritage 2026) — applied across Discover
// ---------------------------------------------------------------------------

const CITY_RAIL_TITLE_COLOR = RICH_INDIGO;           // Sophisticated cultural depth (excellent contrast on light + dark)
const CITY_RAIL_SUBTITLE_COLOR = EMERALD_HARMONY;     // Vibrant teal – highly readable on white backgrounds
const CITY_CARD_NAME_COLOR = '#F5F0E6';               // Premium warm luxe cream – excellent contrast + subtle warmth
const CITY_CARD_COUNTRY_COLOR = '#7FD8C2';            // Brighter emerald harmony – vibrant yet readable on dark overlays

const CARD_OVERLAY = 'rgba(10, 8, 20, 0.78)';         // Richer dark luxe overlay for vibrant text contrast
const CARD_FALLBACK_BG = luxeDark.surfaceSecondary;

// ---------------------------------------------------------------------------
// City card — shared between native grid and web rail
// ---------------------------------------------------------------------------

const CARD_HEIGHT = 120;

function CityCard({
  city,
  width,
}: {
  city: FeaturedCityData;
  width: number;
}) {
  const gradient = cityGradient(city.countryCode);
  const [imageFailed, setImageFailed] = useState(false);
  const onImageError = useCallback(() => setImageFailed(true), []);

  useEffect(() => {
    setImageFailed(false);
  }, [city.id, city.imageUrl]);

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/city/[name]' as never,
      params: { name: city.name, country: city.countryName },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [s.card, { width, height: CARD_HEIGHT, opacity: pressed ? 0.9 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${city.name}, ${city.countryName}`}
    >
      {/* Background: image if available, else gradient */}
      {city.imageUrl && !imageFailed ? (
        <Image
          key={city.imageUrl}
          source={{ uri: normalizeRemoteImageUri(city.imageUrl) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
          onError={onImageError}
        />
      ) : (
        <LinearGradient
          colors={gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Improved vertical gradient overlay for better text readability */}
      <LinearGradient
        colors={['transparent', CARD_OVERLAY]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Text Content */}
      <View style={s.textWrap}>
        <Text style={s.emoji}>{city.countryEmoji}</Text>
        <Text style={[s.cityName, { color: CITY_CARD_NAME_COLOR }]} numberOfLines={1}>
          {city.name}
        </Text>
        <Text style={[s.countryName, { color: CITY_CARD_COUNTRY_COLOR }]} numberOfLines={1}>
          {city.countryName}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Skeleton placeholder
// ---------------------------------------------------------------------------

function CityCardSkeleton({ width }: { width: number }) {
  return <Skeleton width={width} height={CARD_HEIGHT} borderRadius={16} />;
}

// ---------------------------------------------------------------------------
// CityRail — 2-column wrapped grid on native, horizontal scroll on web
// ---------------------------------------------------------------------------

function CityRailComponent() {
  const { hPad, vPad } = useLayout();
  const { headerPadStyle, scrollPadStyle } = useDiscoverRailInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { cities, isLoading, isError, refetch: refetchCities } = useFeaturedCities();

  const isNative = Platform.OS !== 'web';

  // Card width calculation
  const cardWidth = useMemo(() => {
    if (!isNative) return 160;
    const gap = 12;
    return Math.floor((screenWidth - hPad * 2 - gap) / 2);
  }, [isNative, screenWidth, hPad]);

  // Loading skeleton items
  const skeletonData = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

  if (isNative) {
    // Native: 2-column grid
    return (
      <View style={[s.container, { marginBottom: vPad }]}>
        <View style={headerPadStyle}>
          <SectionHeader
            title="Explore Cities"
            subtitle="Discover culture nationwide"
            titleColor={CITY_RAIL_TITLE_COLOR}
            subtitleColor={CITY_RAIL_SUBTITLE_COLOR}
            accentColor={CITY_RAIL_TITLE_COLOR}
            onSeeAll={goCitiesHub}
          />
        </View>

        <DiscoverRailErrorBoundary
          sectionKey="cities-rail"
          fallbackMessage="Could not load cities right now."
          onRetry={() => void refetchCities()}
        >
          {isLoading ? (
          <View style={[s.grid, { paddingHorizontal: hPad }]}>
            {skeletonData.map((k) => (
              <CityCardSkeleton key={k} width={cardWidth} />
            ))}
          </View>
        ) : (
          <FlatList
            data={cities}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            removeClippedSubviews={false}
            contentContainerStyle={[s.grid, { paddingHorizontal: hPad }]}
            columnWrapperStyle={s.row}
            renderItem={({ item }) => <CityCard city={item} width={cardWidth} />}
          />
        )}
      </DiscoverRailErrorBoundary>
      </View>
    );
  }

  // Web: horizontal scroll rail
  return (
    <View style={[s.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader
          title="Explore Cities"
          subtitle="Discover culture nationwide"
          titleColor={CITY_RAIL_TITLE_COLOR}
          subtitleColor={CITY_RAIL_SUBTITLE_COLOR}
          accentColor={CITY_RAIL_TITLE_COLOR}
          onSeeAll={goCitiesHub}
        />
      </View>

      {isError && !isLoading && cities.length === 0 ? (
        <RailErrorBanner message="Could not load cities. Try again." onRetry={() => void refetchCities()} />
      ) : isLoading ? (
        <View style={[s.webSkeletonRow, scrollPadStyle]}>
          {skeletonData.map((k) => (
            <CityCardSkeleton key={k} width={cardWidth} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CityCard city={item} width={cardWidth} />}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={[scrollPadStyle, { gap: 12 }]}
          snapToInterval={cardWidth + 12}
          snapToAlignment="start"
          decelerationRate="fast"
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  container: {},
  
  // Native grid
  grid: { gap: 12 },
  row: { gap: 12, marginBottom: 12 },
  
  // Web rail
  webSkeletonRow: { flexDirection: 'row', gap: 12 },

  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: CARD_FALLBACK_BG,
  },

  textWrap: {
    padding: 12,
    gap: 2,
  },

  emoji: {
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 2,
  },

  cityName: {
    ...TextStyles.title3,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  countryName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export const CityRail = React.memo(CityRailComponent);