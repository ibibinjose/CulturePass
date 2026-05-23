import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { M3SectionHeader } from '@/design-system/ui/M3SectionHeader';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { useLayout } from '@/hooks/useLayout';
import type { EventData } from '@/shared/schema';

interface M3EventRailProps {
  title: string;
  subtitle?: string;
  data: EventData[];
  onSeeAll?: () => void;
}

export function M3EventRail({ title, subtitle, data, onSeeAll }: M3EventRailProps) {
  const { hPad, windowSizeClass } = useLayout();

  const isExpanded = windowSizeClass === 'expanded';
  const isMedium = windowSizeClass === 'medium';

  const cardWidth = isExpanded ? 320 : isMedium ? 280 : 260;

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: hPad }}>
        <M3SectionHeader title={title} subtitle={subtitle} onAction={onSeeAll} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: hPad, gap: 16 }}
        snapToInterval={cardWidth + 16}
        decelerationRate="fast"
      >
        {data.map((event) => (
          <View key={event.id} style={{ width: cardWidth }}>
            <M3EventCard event={event} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
});
