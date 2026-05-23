import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import EventCard from '@/components/Discover/EventCard';
import { M3SectionHeader } from '@/design-system/ui/M3SectionHeader';
import { usePopularEvents } from '@/hooks/queries/usePopularEvents';

const POPULAR_CARD_W = 256;

interface Props {
  city?: string;
  country?: string;
  hPad?: number;
  /** Defaults to navigating to the calendar; pass to override. */
  onSeeAll?: () => void;
}

/**
 * "Popular this week" rail — city/country-scoped events sorted by
 * `popularityScore`. Renders nothing while loading or when empty so the My
 * City screen does not show an empty section.
 */
export function PopularEventsRail({ city, country, hPad = 16, onSeeAll }: Props) {
  const { data, isLoading } = usePopularEvents({ city, country, pageSize: 12 });
  if (isLoading) return null;
  const events = data?.events ?? [];
  if (events.length === 0) return null;

  const goSeeAll = onSeeAll ?? (() => router.push('/(tabs)/calendar'));

  return (
    <View style={styles.section}>
      <View style={{ paddingHorizontal: hPad }}>
        <M3SectionHeader
          title="Popular this week"
          subtitle={city ? `Trending in ${city}` : 'Trending nearby'}
          onAction={goSeeAll}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={[styles.row, { paddingHorizontal: hPad }]}
      >
        {events.map((event, i) => (
          <View key={event.id} style={{ width: POPULAR_CARD_W }}>
            <EventCard
              event={event}
              index={i}
              layout="stacked"
              schedulingMode="live_and_countdown"
              containerWidth={POPULAR_CARD_W}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    gap: 16,
    paddingVertical: 8,
  },
});
