import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Luxe, luxeDark } from '@/design-system/tokens/theme';
import { LuxeText } from '@/design-system/ui';
import { CultureImage } from '@/design-system/ui/CultureImage';
import type { Community } from '@/shared/schema';
import { getCommunityProfilePathId, getCommunityMemberCount } from '@/lib/community';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LuxeCommunityCardProps {
  community: Community;
  variant?: 'default' | 'tonal' | 'glass' | 'featured';
  size?: 'default' | 'large';
}

export function LuxeCommunityCard({ community, variant = 'default', size = 'default' }: LuxeCommunityCardProps) {
  const scale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.988, Luxe.spring?.snappy ?? { damping: 20, stiffness: 300 });
    imageScale.value = withSpring(1.035, Luxe.spring?.snappy ?? { damping: 18, stiffness: 280 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Luxe.spring?.smooth ?? { damping: 18, stiffness: 220 });
    imageScale.value = withSpring(1, Luxe.spring?.smooth ?? { damping: 18, stiffness: 220 });
  };

  const handlePress = () => {
    router.push({
      pathname: '/c/[id]',
      params: { id: getCommunityProfilePathId(community) },
    });
  };

  const members = getCommunityMemberCount(community);
  const isFeatured = variant === 'featured' || size === 'large';
  const aspect = isFeatured ? 1.35 : 1.6;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, cardStyle, isFeatured && styles.cardFeatured]}
    >
      <View style={[styles.imageContainer, { aspectRatio: aspect }]}>
        {community.imageUrl ? (
          <Animated.View style={[styles.imageWrap, imageStyle]}>
            <CultureImage
              uri={community.imageUrl}
              style={styles.image}
              contentFit="cover"
            />
          </Animated.View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: Luxe.colors.indigo + '20' }]}>
            <LuxeText variant="display" style={{ color: Luxe.colors.indigo }}>
              {community.name.charAt(0).toUpperCase()}
            </LuxeText>
          </View>
        )}

        {/* Premium gradient overlay (smooth fade for luxe readability) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.72)']}
          locations={[0.35, 0.62, 0.92]}
          style={styles.imageOverlay}
        />

        {/* Verified badge */}
        {community.isVerified && (
          <View style={[styles.badge, { backgroundColor: Luxe.colors.terracotta }]}>
            <Ionicons name="checkmark" size={13} color="#FFF" />
          </View>
        )}

        {/* Featured / Trending pill for prominent treatment */}
        {isFeatured && (
          <View style={styles.featuredPill}>
            <Ionicons name="trending-up" size={12} color="#FFF" />
            <LuxeText variant="badgeCaps" style={{ color: '#FFF', marginLeft: 4, fontWeight: '700' }}>
              TRENDING
            </LuxeText>
          </View>
        )}

        {/* Overlaid content on image for bigger photo impact */}
        <View style={[styles.imageContent, isFeatured && styles.imageContentLarge]}>
          <LuxeText
            variant="title3"
            style={{ color: '#FFFFFF', fontWeight: '700' }}
            numberOfLines={1}
          >
            {community.name}
          </LuxeText>

          <View style={styles.imageMetaRow}>
            <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.92)" />
            <LuxeText variant="caption" style={{ color: 'rgba(255,255,255,0.88)', marginLeft: 4 }}>
              {members.toLocaleString()}
            </LuxeText>

            {!!community.city && (
              <>
                <LuxeText variant="caption" style={{ color: 'rgba(255,255,255,0.45)', marginHorizontal: 6 }}>·</LuxeText>
                <LuxeText variant="caption" style={{ color: 'rgba(255,255,255,0.88)' }} numberOfLines={1}>
                  {community.city}
                </LuxeText>
              </>
            )}
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
    backgroundColor: luxeDark.surfaceElevated,
    borderRadius: 16,
  },
  cardFeatured: {
    // More prominent shadow / presence for trending cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: luxeDark.surfaceElevated,
    position: 'relative',
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Smooth premium gradient overlay (replaces solid for luxe depth)
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62%',
    zIndex: 0,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 3,
  },
  featuredPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Luxe.colors.terracotta,
    zIndex: 3,
  },
  // Text content overlaid on the image
  imageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 13,
    paddingTop: 28,
    zIndex: 1,
  },
  imageContentLarge: {
    padding: 16,
    paddingTop: 32,
  },
  imageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
});
