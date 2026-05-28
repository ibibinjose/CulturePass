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
import { formatEventDateTime } from '@/lib/dateUtils';
import { eventPaths } from '@/modules/events/services/navigation';
import type { EventData } from '@/shared/schema';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LuxeEventCardProps {
  event: EventData;
  variant?: 'default' | 'tonal' | 'glass';
}

export function LuxeEventCard({ event, variant = 'default' }: LuxeEventCardProps) {
  const attendingCount = event.attending || event.rsvpGoing || 0;
  const isVerified = (event.organizerReputationScore ?? 0) > 0 || event.isFeatured;

  const scale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const imgStyle = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));

  const handlePressIn = () => {
    scale.value = withSpring(0.988, { damping: 20, stiffness: 300 });
    imageScale.value = withSpring(1.03, { damping: 18, stiffness: 280 });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
    imageScale.value = withSpring(1, { damping: 18, stiffness: 220 });
  };

  const handlePress = () => {
    router.push(eventPaths.detailRoute(event.id));
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, cardStyle]}
    >
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.imageWrap, imgStyle]}>
          <CultureImage
            uri={event.imageUrl ?? undefined}
            style={styles.image}
          />
        </Animated.View>

        {/* Premium gradient for depth on event photos */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.55)']}
          locations={[0.4, 0.7, 0.95]}
          style={styles.imageOverlay}
        />

        {/* Attendance Badge */}
        {attendingCount > 0 && (
          <View style={[styles.attendingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Ionicons name="people" size={10} color="#FFFFFF" />
            <LuxeText variant="badge" style={{ color: '#FFFFFF', marginLeft: 4 }}>
              {attendingCount.toLocaleString()}
            </LuxeText>
          </View>
        )}

        {event.priceCents === 0 && (
          <View style={[styles.badge, { backgroundColor: Luxe.colors.emerald }]}>
            <LuxeText variant="badgeCaps" style={{ color: '#FFF' }}>FREE</LuxeText>
          </View>
        )}
      </View>
      <View style={styles.content}>
        {/* Trust Layer: Verification */}
        {isVerified && (
          <View style={styles.trustRow}>
            <Ionicons name="checkmark-circle" size={12} color={Luxe.colors.indigo} />
            <LuxeText variant="badge" style={{ color: Luxe.colors.indigo, fontWeight: '700', marginLeft: 4 }}>
              {event.hostName ? `Verified by ${event.hostName}` : 'Verified'}
            </LuxeText>
          </View>
        )}

        <LuxeText variant="bodyMedium" style={{ color: luxeDark.text }} numberOfLines={2}>
          {event.title}
        </LuxeText>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={Luxe.colors.terracotta} />
          <LuxeText variant="caption" style={{ color: luxeDark.textSecondary }}>
            {formatEventDateTime(event.date, event.time)}
          </LuxeText>
        </View>
        {event.venue && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={luxeDark.textTertiary} />
            <LuxeText variant="caption" style={{ color: luxeDark.textTertiary }} numberOfLines={1}>
              {event.venue}
            </LuxeText>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: luxeDark.surfaceElevated,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
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
  // Subtle gradient overlay for luxe photo treatment
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '48%',
    zIndex: 0,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 2,
  },
  attendingBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
