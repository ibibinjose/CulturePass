import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens, LiquidGlassTokens, SpringConfig } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { formatEventDateTime } from '@/lib/dateUtils';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';
import type { EventData } from '@/shared/schema';

const HERO_CARD_DESKTOP_WIDTH = 840;

interface HeroCarouselProps {
  events: EventData[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FeaturedEventItem({
  item,
  index,
  totalEvents,
  heroCardWidth,
  isDesktop,
  pad,
  styles,
  colors,
}: {
  item: EventData;
  index: number;
  totalEvents: number;
  heroCardWidth: number;
  isDesktop: boolean;
  pad: number;
  styles: ReturnType<typeof getStyles>;
  colors: ReturnType<typeof useColors>;
}) {
  const heroImageUri = normalizeRemoteImageUri(item.imageUrl);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.985, SpringConfig.snappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfig.smooth);
  };

  return (
    <View
      style={{
        width: heroCardWidth,
        paddingHorizontal: isDesktop ? 0 : pad,
        marginRight: isDesktop && index < totalEvents - 1 ? 24 : 0,
      }}
    >
      <AnimatedPressable
        style={[
          styles.heroCard,
          isDesktop && styles.heroCardDesktop,
          animatedStyle,
          Platform.OS === 'web' && { cursor: 'pointer' as const },
        ]}
        onPress={() => router.push({ pathname: '/e/[id]', params: { id: item.id } })}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Featured event: ${item.title}${item.venue ? `, at ${item.venue}` : ''}`}
        accessibilityHint="Opens event details"
      >
        {heroImageUri ? (
          <Image
            source={{ uri: heroImageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"           // Hero images are critical for first impression
            placeholderContentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[CultureTokens.violet, CultureTokens.teal]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.45, 1]}
        />

        <GlassView intensity={40} colorScheme="dark" style={styles.heroCardBadge}>
          <Text style={styles.heroCardBadgeText}>FEATURED</Text>
        </GlassView>

        <View style={styles.heroCardContent}>
          <View style={styles.heroCardMetaTop}>
            <GlassView
              intensity={30}
              colorScheme="dark"
              style={[
                styles.heroCardPrice,
                { backgroundColor: (item.priceCents === 0 || item.isFree) ? 'rgba(46, 196, 182, 0.5)' : 'rgba(0, 102, 204, 0.5)' }
              ]}
            >
              <Text style={styles.heroCardPriceText}>
                {(item.priceCents === 0 || item.isFree) ? 'FREE' : item.priceLabel || 'TICKETS'}
              </Text>
            </GlassView>
            <GlassView intensity={20} colorScheme="dark" style={styles.heroCardDateBox}>
              <Text style={styles.heroCardDateText}>{formatEventDateTime(item.date, item.time)}</Text>
            </GlassView>
          </View>

          <Text style={styles.heroCardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.heroCardLocationRow}>
            <Ionicons name="location" size={14} color={colors.eventDateOnMedia} style={{ opacity: 0.75 }} />
            <Text style={styles.heroCardLocation} numberOfLines={1}>{item.venue || item.city}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

function HeroCarouselComponent({ events }: HeroCarouselProps) {
  const colors = useColors();
  const { isDesktop, width, vPad } = useLayout();
  const { pad } = useDiscoverRailInsets();

  const styles = useMemo(() => getStyles(colors), [colors]);

  const heroCardWidth = isDesktop ? HERO_CARD_DESKTOP_WIDTH : width;
  const heroSnapInterval = isDesktop ? heroCardWidth + 24 : heroCardWidth;

  const renderFeaturedEvent = useCallback(({ item, index }: { item: EventData; index: number }) => (
    <FeaturedEventItem
      item={item}
      index={index}
      totalEvents={events.length}
      heroCardWidth={heroCardWidth}
      isDesktop={isDesktop}
      pad={pad}
      styles={styles}
      colors={colors}
    />
  ), [colors, events.length, heroCardWidth, isDesktop, pad, styles]);

  if (events.length === 0) {
    return (
      <View style={[styles.container, { marginBottom: vPad }]}>
        <View style={{ paddingHorizontal: isDesktop ? 0 : pad }}>
          <View style={[styles.emptyPoster, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <LinearGradient
              colors={[`${CultureTokens.violet}22`, `${CultureTokens.teal}18`, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <GlassView intensity={30} style={styles.emptyBadge}>
              <Text style={[styles.emptyBadgeText, { color: colors.text }]}>DISCOVER</Text>
            </GlassView>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No events yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Fresh events will appear here as soon as organizers publish in your selected city.
            </Text>
            <Pressable
              style={[styles.emptyCta, { borderColor: `${CultureTokens.violet}55`, backgroundColor: `${CultureTokens.violet}16` }]}
              onPress={() => router.push('/(domain)/events')}
              accessibilityRole="button"
              accessibilityLabel="Browse events"
            >
              <Ionicons name="sparkles" size={14} color={CultureTokens.violet} />
              <Text style={[styles.emptyCtaText, { color: CultureTokens.violet }]}>Browse Events</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderFeaturedEvent}
        pagingEnabled={!isDesktop}
        showsHorizontalScrollIndicator={false}
        snapToInterval={heroSnapInterval}
        decelerationRate="fast"
        snapToAlignment="start"
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({
          length: heroSnapInterval,
          offset: heroSnapInterval * index,
          index,
        })}
      />
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {},
  heroCard: { 
    height: 440,
    borderRadius: LiquidGlassTokens.corner.mainCard,
    overflow: 'hidden', 
    backgroundColor: colors.surface,
  },
  heroCardDesktop: { 
    boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
    elevation: 12
  },
  heroCardBadge: { 
    position: 'absolute', 
    top: 24,
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: 'hidden', 
    zIndex: 2,
    backgroundColor: CultureTokens.indigo,
    borderWidth: 1,
    borderColor: CultureTokens.indigo,
  },
  heroCardBadgeText: {
    ...TextStyles.badgeCaps,
    color: colors.eventDateOnMedia,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  heroCardContent: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 28,
    gap: 14
  },
  heroCardMetaTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCardPrice: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  heroCardPriceText: { ...TextStyles.badge, color: colors.eventDateOnMedia, fontSize: 12 },
  heroCardDateBox: { 
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: CultureTokens.indigo,
    borderWidth: 1,
    borderColor: CultureTokens.indigo,
  },
  heroCardDateText: { ...TextStyles.badge, color: colors.eventDateOnMedia, fontSize: 12 },
  heroCardTitle: {
    ...TextStyles.title,
    color: colors.eventDateOnMedia,
    lineHeight: 36,
    minHeight: 72,
    fontSize: 26,
  },
  heroCardLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroCardLocation: { ...TextStyles.cardTitle, color: colors.eventDateOnMedia, opacity: 0.75, fontSize: 14 },
  emptyPoster: {
    height: 420,
    borderRadius: LiquidGlassTokens.corner.mainCard,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 2,
  },
  emptyBadgeText: {
    ...TextStyles.badgeCaps,
    letterSpacing: 1.1,
    fontSize: 10.5,
  },
  emptyTitle: {
    ...TextStyles.title,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
  },
  emptyBody: {
    ...TextStyles.body,
    textAlign: 'center',
    maxWidth: 560,
    lineHeight: 22,
  },
  emptyCta: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyCtaText: {
    ...TextStyles.badge,
    fontSize: 13,
  },
});

export const HeroCarousel = React.memo(HeroCarouselComponent);
