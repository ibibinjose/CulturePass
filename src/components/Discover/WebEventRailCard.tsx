import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/theme';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventData } from '@shared/schema';
import { formatEventDateTimeBadge } from '@/lib/dateUtils';
import { normalizeRemoteImageUri } from '@/lib/mediaUrls';

interface WebEventRailCardProps {
  event: EventData;
}

function WebEventRailCard({ event }: WebEventRailCardProps) {
  const colors = useColors();
  const dateChip = formatEventDateTimeBadge(event.date ?? '', event.time);
  const category = event.category || event.communityId || 'Event';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.webRailCard,
        pressed && { opacity: 0.9 },
        Platform.OS === 'web' && { cursor: 'pointer' as any },
      ]}
      onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.date ? `, ${event.date}` : ''}${event.venue ? `, ${event.venue}` : ''}`}
    >
      <Image source={{ uri: normalizeRemoteImageUri(event.imageUrl) ?? undefined }} style={styles.webRailImage} contentFit="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
        locations={[0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      {dateChip ? (
        <View style={styles.webRailDateChip}>
          <Text style={[styles.webRailDateChipText, { color: colors.textInverse }]}>{dateChip}</Text>
        </View>
      ) : null}
      <View style={styles.webRailCatTag}>
        <Text style={[styles.webRailCatText, { color: colors.textInverse }]} numberOfLines={1}>{category}</Text>
      </View>
      <View style={styles.webRailMeta}>
        <View style={styles.webRailTextRibbon}>
          <Text style={[styles.webRailTitle, { color: colors.textInverse }]} numberOfLines={2}>{event.title}</Text>
        </View>
        <View style={[styles.webRailVenueRow, styles.webRailTextRibbon]}>
          <Ionicons name="location-outline" size={11} color={`${colors.textInverse}BF`} />
          <Text style={[styles.webRailVenue, { color: `${colors.textInverse}D9` }]} numberOfLines={1}>{event.venue || event.city}</Text>
        </View>
        <View style={styles.webRailBottom}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.webRailPricePill}
          >
            <Text style={[styles.webRailPriceText, { color: colors.text }]}>{event.priceLabel || 'Free'}</Text>
          </LinearGradient>
            <Ionicons name="bookmark-outline" size={18} color={colors.textSecondary + 'B3'} />
        </View>
      </View>
    </Pressable>
  );
}

// ⚡ Bolt Optimization: Added React.memo() to prevent unnecessary re-renders of list items.
// Impact: Drastically reduces re-renders in WebRailSection lists during parent updates
// (e.g., when the route changes or global state updates), as individual event object props remain stable.
// Measurement: React Profiler / rendering count reduction proportional to list size.
export default React.memo(WebEventRailCard);

const styles = StyleSheet.create({
  webRailCard: {
    width: 250,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
  },
  webRailImage: {
    width: '100%',
    height: '100%',
  },
  webRailDateChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: CultureTokens.event, // saffron-ish date chip
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webRailDateChipText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  webRailCatTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(11,11,20,0.78)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    maxWidth: 100,
  },
  webRailCatText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  webRailMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
  },
  webRailTextRibbon: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,20,0.78)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  webRailTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Poppins_700Bold',
  },
  webRailVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webRailVenue: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  webRailBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  webRailPricePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  webRailPriceText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
});
