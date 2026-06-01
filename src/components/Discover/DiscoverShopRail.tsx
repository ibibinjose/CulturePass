/**
 * DiscoverShopRail — horizontal CultureMarket listings rail for the Discover screen.
 * Shows featured listings; tapping "See all" opens /CultureMarket.
 * Self-fetching so it drops into any screen without prop drilling.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { fetchListingsWithFallback } from '@/lib/cultureShopDeals';
import { ShopListingCard } from '@/modules/marketplace/ShopListingCard';
import {
  CultureTokens,
  FontFamily,
  Radius,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import type { ShopListing } from '@/shared/schema';

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ width }: { width: number }) {
  const colors = useColors();
  const imageH = Math.round(width * (166 / 280));
  return (
    <View style={[styles.skeleton, { width, backgroundColor: colors.surface }]}>
      <View style={[styles.skeletonImg, { height: imageH, backgroundColor: colors.borderLight }]} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '60%', backgroundColor: colors.borderLight }]} />
        <View style={[styles.skeletonLine, { width: '85%', height: 14, marginTop: 6, backgroundColor: colors.borderLight }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 6, backgroundColor: colors.borderLight }]} />
      </View>
    </View>
  );
}

// ─── Sell CTA card ────────────────────────────────────────────────────────────

function SellCtaCard({
  width,
  colors,
}: {
  width: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={() => router.push('/hostspace/create?category=market-listing' as never)}
      style={({ pressed }) => [styles.sellCard, { width, opacity: pressed ? 0.9 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="List your business on CultureMarket"
    >
      <LinearGradient
        colors={SignatureGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sellCardContent}>
        <View style={styles.sellCardIcon}>
          <Ionicons name="storefront" size={28} color={colors.textInverse} />
        </View>
        <Text style={[styles.sellCardTitle, { color: colors.textInverse }]}>List your{'\n'}business</Text>
        <Text style={[styles.sellCardSub, { color: colors.textInverse, opacity: 0.75 }]}>Free · Sell, service{'\n'}or link your site</Text>
        <View style={styles.sellCardCta}>
          <Text style={[styles.sellCardCtaText, { color: colors.textInverse }]}>Get started →</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  /** Filter by category, or undefined for featured/all */
  category?: string;
  title?: string;
  subtitle?: string;
}

export function DiscoverShopRail({
  category,
  title = 'CultureMarket Deals',
  subtitle = 'Products, services & offers from cultural businesses',
}: Props) {
  const colors = useColors();
  const { hPad } = useLayout();

  const { data, isLoading } = useQuery({
    queryKey: ['discover-shop-rail', category ?? 'featured'],
    queryFn: () =>
      fetchListingsWithFallback({
        category: category as any,
        featured: !category,
        limit: 8,
      }),
    staleTime: 3 * 60 * 1000,
  });

  const listings = data?.listings ?? [];

  const handlePress = useCallback((l: ShopListing) => {
    router.push(`/CultureMarket/${l.id}` as any);
  }, []);

  const CARD_W = 180;

  // Don't render if we got no data and aren't loading
  if (!isLoading && listings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {/* Section header */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, { backgroundColor: CultureTokens.coral }]} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/CultureMarket' as any)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="See all CultureMarket listings"
        >
          <Text style={[styles.seeAll, { color: CultureTokens.teal }]}>See all →</Text>
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
          scrollEnabled={false}
        >
          {[1, 2, 3, 4].map((k) => (
            <View key={k} style={{ marginRight: 12 }}>
              <SkeletonCard width={CARD_W} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]}
          decelerationRate="fast"
          snapToInterval={CARD_W + 12}
          snapToAlignment="start"
        >
          {listings.map((l) => (
            <View key={l.id} style={{ marginRight: 12 }}>
              <ShopListingCard
                listing={l}
                width={CARD_W}
                onPress={() => handlePress(l)}
              />
            </View>
          ))}
          {/* Sell CTA as last tile */}
          <View style={{ marginRight: hPad }}>
            <SellCtaCard width={CARD_W} colors={colors} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerDot: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 20 : 18,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  seeAll: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    paddingBottom: 2,
  },

  scroll: {
    paddingBottom: 8,
    paddingTop: 2,
  },

  // Skeleton
  skeleton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonImg: {
    width: '100%',
    borderTopRightRadius: 8,
  },
  skeletonBody: {
    padding: 8,
    paddingTop: 10,
    minHeight: 80,
  },
  skeletonLine: {
    height: 11,
    borderRadius: 4,
  },

  // Sell CTA card
  sellCard: {
    borderRadius: 8,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
    height: 240,
    justifyContent: 'flex-end',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } as any,
    }),
  },
  sellCardContent: {
    padding: 14,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sellCardIcon: {
    marginBottom: 10,
  },
  sellCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 6,
  },
  sellCardSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
    marginBottom: 14,
  },
  sellCardCta: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  sellCardCtaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
