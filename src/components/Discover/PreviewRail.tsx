/**
 * PreviewRail — generic horizontal rail used on the Discover screen
 * for Restaurants, Movies, Shopping, and Perks sections.
 *
 * Accepts a uniform PreviewItem shape so each domain only needs to
 * map its own data before passing it in.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { CardTokens, webShadow } from '@/design-system/tokens/theme';
import SectionHeader from './SectionHeader';

import type { PreviewItem } from '@/shared/schema/browse';
export type { PreviewItem } from '@/shared/schema/browse';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

interface PreviewRailProps {
  title: string;
  subtitle?: string;
  accentColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
  items: (PreviewItem | 'skeleton')[];
  isLoading?: boolean;
  seeAllRoute?: string;
  cardStyle?: 'portrait' | 'landscape';
}

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ colors, style }: { colors: ReturnType<typeof useColors>; style: Record<string, unknown> }) {
  return (
    <View style={[styles.card, style, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[styles.cardImgPlaceholder, { backgroundColor: colors.borderLight }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skeletonLine, { width: '70%', backgroundColor: colors.borderLight }]} />
        <View style={[styles.skeletonLine, { width: '45%', backgroundColor: colors.borderLight, marginTop: 6 }]} />
      </View>
    </View>
  );
}

// ── Real card ─────────────────────────────────────────────────────────────────

function PreviewCard({
  item,
  accentColor,
  colors,
  cardStyle,
}: {
  item: PreviewItem;
  accentColor: string;
  colors: ReturnType<typeof useColors>;
  cardStyle: 'portrait' | 'landscape';
}) {
  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) router.push(item.route as `/${string}`);
  };

  const isPortrait = cardStyle === 'portrait';

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.card,
        isPortrait ? styles.cardPortrait : styles.cardLandscape,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      {/* Image */}
      <View style={[styles.cardImg, isPortrait ? styles.cardImgPortrait : styles.cardImgLandscape]}>
        {item.imageUrl ? (
          <Image
            source={{ uri: normalizeRemoteImageUri(item.imageUrl) ?? undefined }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: accentColor + '20', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image-outline" size={28} color={accentColor + '80'} />
          </View>
        )}
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
        />
        {/* Badge on image */}
        {item.badge ? (
          <View
            style={[
              styles.imgBadge,
              { backgroundColor: item.badgeColor ?? accentColor },
            ]}
          >
            <Text style={styles.imgBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Text body */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── Rail ─────────────────────────────────────────────────────────────────────

function PreviewRailComponent({
  title,
  subtitle,
  accentColor,
  items,
  isLoading,
  seeAllRoute,
  cardStyle = 'portrait',
}: PreviewRailProps) {
  const colors = useColors();
  const { vPad } = useLayout();
  const { headerPadStyle, pad, padEnd } = useDiscoverRailInsets();

  if (!isLoading && items.length === 0) return null;

  const displayItems: (PreviewItem | 'skeleton')[] =
    isLoading ? ['skeleton', 'skeleton', 'skeleton', 'skeleton'] : items;

  const skeletonStyle = cardStyle === 'portrait'
    ? { width: PORTRAIT_W, height: PORTRAIT_H }
    : { width: LANDSCAPE_W, height: LANDSCAPE_H };

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={[styles.headerWrap, headerPadStyle]}>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          accentColor={accentColor}
          onSeeAll={seeAllRoute ? () => router.push(seeAllRoute as `/${string}`) : undefined}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: pad, paddingRight: padEnd }]}
      >
        {displayItems.map((item, idx) =>
          item === 'skeleton' ? (
            <SkeletonCard key={idx} colors={colors} style={skeletonStyle} />
          ) : (
            <PreviewCard
              key={item.id}
              item={item}
              accentColor={accentColor}
              colors={colors}
              cardStyle={cardStyle}
            />
          ),
        )}
      </ScrollView>
    </View>
  );
}

export const PreviewRail = React.memo(PreviewRailComponent);

// ── Dimensions ────────────────────────────────────────────────────────────────

const PORTRAIT_W  = 140;
const PORTRAIT_H  = 200;
const LANDSCAPE_W = 180;
const LANDSCAPE_H = 130;

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   {},
  headerWrap:  { marginBottom: 14 },
  scroll:      { gap: 12, paddingRight: 20 },

  card: {
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select<ViewStyle>({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 3 },
      web:     webShadow('0 4px 12px rgba(0,0,0,0.08)'),
    }),
  },
  cardPortrait:  { width: PORTRAIT_W,  height: PORTRAIT_H  },
  cardLandscape: { width: LANDSCAPE_W, height: LANDSCAPE_H },

  cardImg:         { overflow: 'hidden' },
  cardImgPortrait: { height: 130 },
  cardImgLandscape: { height: 85 },

  cardImgPlaceholder: { flex: 1 },

  imgBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imgBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    letterSpacing: 0.2,
  },

  cardBody: {
    padding: 10,
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.1,
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },

  skeletonLine: {
    height: 10,
    borderRadius: 5,
  },
});
