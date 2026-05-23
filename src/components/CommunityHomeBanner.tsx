/**
 * Compact Discover banner for community homes — copy and imagery from admin API.
 * Dismissal is keyed by banner id + revision so new publishes or admin triggers re-show.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, SlideOutUp } from 'react-native-reanimated';

import { api } from '@/lib/api';
import { discoverKeys } from '@/hooks/queries/keys';
import { useCommunityHomeBannerDismiss } from '@/hooks/useCommunityHomeBannerDismiss';
import { CultureTokens, Spacing, Radius, FontFamily } from '@/design-system/tokens/theme';

export function CommunityHomeBanner() {
  const { data, isLoading } = useQuery({
    queryKey: discoverKeys.communityHomeBanner(),
    queryFn: () => api.communityHomeBanner.getActive(),
    staleTime: 5 * 60_000,
  });

  const banner = data?.banner;
  const { visible, dismissBanner, loaded } = useCommunityHomeBannerDismiss(banner);

  if (isLoading || !loaded || !visible || !banner) return null;

  const onCta = () => {
    const route = banner.ctaRoute?.trim() || '/(tabs)/community';
    router.push(route as never);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      exiting={SlideOutUp}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={[CultureTokens.violet, CultureTokens.indigo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={banner.title}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.94 }]}
        >
          {banner.imageUrl ? (
            <Image
              source={{ uri: banner.imageUrl }}
              style={styles.thumb}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={styles.iconWell}>
              <MaterialCommunityIcons name="home-heart" size={22} color={CultureTokens.gold} />
            </View>
          )}

          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {banner.title}
            </Text>
            {banner.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {banner.subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.ctaChip}>
            <Text style={styles.ctaText} numberOfLines={1}>
              {banner.ctaLabel || 'Explore'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        <Pressable
          onPress={dismissBanner}
          hitSlop={10}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Dismiss banner"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: Radius.md,
    minHeight: 72,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xl + 4,
    flex: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.1,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
  },
  ctaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: 108,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    flexShrink: 1,
  },
  close: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
