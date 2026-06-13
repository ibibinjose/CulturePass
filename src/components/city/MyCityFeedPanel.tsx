import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { M3Button, M3Card, M3SectionHeader, Skeleton } from '@/design-system/ui';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { M3Typography, Radius } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { EventData, Profile } from '@/shared/schema';

interface MyCityFeedPanelProps {
  title: string;
  subtitle: string;
  isLoading: boolean;
  showVenues: boolean;
  events: EventData[];
  venues: Profile[];
  numCols: number;
  onClearFilters?: () => void;
}

export function MyCityFeedPanel({
  title,
  subtitle,
  isLoading,
  showVenues,
  events,
  venues,
  numCols,
  onClearFilters,
}: MyCityFeedPanelProps) {
  const m3Colors = useM3Colors();

  return (
    <View style={s.wrap}>
      <M3SectionHeader title={title} subtitle={subtitle} onAction={onClearFilters} actionLabel="Clear" />

      {isLoading ? (
        <View style={s.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.gridItem, { width: `${100 / numCols}%` as `${number}%` }]}>
              <Skeleton height={showVenues ? 72 : 240} borderRadius={Radius.lg} />
            </View>
          ))}
        </View>
      ) : showVenues ? (
        venues.length === 0 ? (
          <M3Card variant="outlined" style={s.empty}>
            <Ionicons name="business-outline" size={48} color={m3Colors.onSurfaceVariant} />
            <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface }]}>No places found</Text>
            <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>
              Try another category or open the directory.
            </Text>
            <M3Button variant="filled" onPress={() => router.push('/directory')}>
              Browse directory
            </M3Button>
          </M3Card>
        ) : (
          <View style={s.venueList}>
            {venues.map((venue, i) => (
              <Animated.View key={venue.id} entering={FadeInDown.delay(i * 35).springify()}>
                <Pressable
                  onPress={() => router.push({ pathname: '/profile/[id]', params: { id: venue.id } })}
                  style={({ pressed }) => [
                    s.venueRow,
                    {
                      backgroundColor: m3Colors.surface,
                      borderColor: m3Colors.outlineVariant,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={`View ${venue.name}`}
                >
                  <View style={[s.venueIcon, { backgroundColor: Luxe.colors.appBlue + '18' }]}>
                    <Ionicons name="business" size={18} color={Luxe.colors.appBlue} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
                      {venue.category || 'Culture host'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )
      ) : events.length === 0 ? (
        <M3Card variant="outlined" style={s.empty}>
          <Ionicons name="search-outline" size={48} color={m3Colors.onSurfaceVariant} />
          <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface }]}>No matches found</Text>
          {onClearFilters ? <M3Button variant="filled" onPress={onClearFilters}>Reset filters</M3Button> : null}
        </M3Card>
      ) : (
        <View style={s.grid}>
          {events.map((ev, i) => (
            <Animated.View
              key={ev.id}
              entering={FadeInDown.delay(i * 40).springify()}
              style={[s.gridItem, { width: `${100 / numCols}%` as `${number}%` }]}
            >
              <M3EventCard event={ev} variant="filled" />
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  gridItem: { padding: 8 },
  venueList: { gap: 10 },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  venueIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { padding: 40, alignItems: 'center', gap: 16, marginTop: 8 },
});