import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { M3SectionHeader } from '@/design-system/ui/M3SectionHeader';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { LuxeText } from '@/design-system/ui/LuxeText';
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
        {/* Luxe migration start: rail header using LuxeText for premium display voice */}
        <LuxeText variant="title3" style={{ color: '#FAF9F6', marginBottom: 4 }}>{title}</LuxeText>
        {subtitle && (
          <LuxeText variant="callout" style={{ color: '#A1A1AA', marginBottom: 12 }}>{subtitle}</LuxeText>
        )}
        {/* Original M3SectionHeader kept for "See all" action for now */}
        <M3SectionHeader title="" subtitle="" onAction={onSeeAll} />
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
