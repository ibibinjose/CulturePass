import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { M3Card } from '@/design-system/ui/M3Card';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { M3Typography } from '@/design-system/tokens/typography';
import { useM3Colors } from '@/hooks/useM3Colors';
import { formatEventDateTime } from '@/lib/dateUtils';
import { router } from 'expo-router';
import { eventPaths } from '@/modules/events/services/navigation';
import type { EventData } from '@/shared/schema';
import { getEventCoverImageUrl } from '@/modules/events/utils/eventCoverImage';

interface M3EventCardProps {
  event: EventData;
  variant?: 'elevated' | 'filled' | 'outlined';
}

export function M3EventCard({ event, variant = 'filled' }: M3EventCardProps) {
  const colors = useM3Colors();
  const attendingCount = event.attending || event.rsvpGoing || 0;
  const isVerified = (event.organizerReputationScore ?? 0) > 0 || event.isFeatured;
  const coverImageUrl = getEventCoverImageUrl(event);

  const handlePress = () => {
    router.push(eventPaths.detailRoute(event.id));
  };

  return (
    <M3Card
      variant={variant}
      onPress={handlePress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        <CultureImage
          uri={coverImageUrl}
          style={styles.image}
        />

        {/* Attendance Badge */}
        {attendingCount > 0 && (
          <View style={[styles.attendingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Ionicons name="people" size={10} color="#FFFFFF" />
            <Text style={[M3Typography.labelSmall, { color: '#FFFFFF', marginLeft: 4 }]}>
              {attendingCount.toLocaleString()}
            </Text>
          </View>
        )}

        {event.priceCents === 0 && (
          <View style={[styles.badge, { backgroundColor: colors.tertiaryContainer }]}>
            <Text style={[M3Typography.labelSmall, { color: colors.onTertiaryContainer }]}>FREE</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        {/* Trust Layer: Verification */}
        {isVerified && (
          <View style={styles.trustRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={[M3Typography.labelSmall, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
              {event.hostName ? `Verified by ${event.hostName}` : 'Community Verified'}
            </Text>
          </View>
        )}

        <Text style={[M3Typography.titleMedium, { color: colors.onSurface }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            {formatEventDateTime(event.date, event.time)}
          </Text>
        </View>
        {event.venue && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>
        )}
      </View>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  },
  content: {
    padding: 16,
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
    gap: 8,
    marginTop: 2,
  },
});
