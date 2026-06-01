import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import SectionHeader from './SectionHeader';
import EventCard from './EventCard';
import { EventCardSkeleton } from '@/modules/events/components/EventCardSkeleton';
import { RailErrorBanner } from './RailErrorBanner';
import type { EventData } from '@/shared/schema';

import { LayoutRules } from '@/design-system/tokens/theme';

const RAIL_CARD_WIDTH = 256;
const RAIL_ITEM_GAP = LayoutRules.betweenCards;

interface EventRailProps {
  title: string;
  subtitle?: string;
  data: (EventData | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  snapInterval?: number;
  isLive?: boolean;
  schedulingMode?: 'default' | 'live_and_countdown';
  errorMessage?: string | null;
  onRetry?: () => void;
}

function EventRailComponent({
  title,
  subtitle,
  data,
  isLoading,
  onSeeAll,
  isLive,
  schedulingMode = 'default',
  errorMessage,
  onRetry,
}: EventRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();

  const safeData = data.filter((item): item is EventData | string => item != null);
  const hasRealItems = safeData.some((item) => typeof item !== 'string');

  if (!isLoading && !hasRealItems && !errorMessage) return null;

  return (
    <View style={[styles.container, { marginBottom: vPad }]}>
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      </View>
      {errorMessage && !isLoading && !hasRealItems ? (
        <RailErrorBanner message={errorMessage} onRetry={onRetry} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={[scrollPadStyle, { gap: RAIL_ITEM_GAP }]}
          snapToInterval={RAIL_CARD_WIDTH + RAIL_ITEM_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
        >
          {safeData.map((item, index) =>
            typeof item === 'string' ? (
              <View key={item} style={{ width: RAIL_CARD_WIDTH }}>
                <EventCardSkeleton />
              </View>
            ) : (
              <EventCard
                key={item.id}
                event={item}
                index={index}
                isLive={isLive}
                layout="stacked"
                schedulingMode={schedulingMode}
              />
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
});

export const EventRail = React.memo(EventRailComponent);
