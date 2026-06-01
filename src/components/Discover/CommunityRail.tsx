import React from 'react';
import { View, FlatList, StyleSheet, Platform } from 'react-native';
import { useDiscoverRailInsets } from '@/components/Discover/discoverLayout';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import SectionHeader from './SectionHeader';
import CommunityCard from './CommunityCard';
import { CommunityCardSkeleton } from '@/modules/communities/components/CommunityCardSkeleton';
import { RailErrorBanner } from './RailErrorBanner';
import type { Community } from '@/shared/schema';

const DEFAULT_SNAP_INTERVAL = 236;

interface CommunityRailProps {
  title: string;
  subtitle?: string;
  data: (Community | string)[];
  isLoading?: boolean;
  onSeeAll?: () => void;
  snapInterval?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
}

function CommunityRailComponent({
  title,
  subtitle,
  data,
  isLoading,
  onSeeAll,
  snapInterval = DEFAULT_SNAP_INTERVAL,
  errorMessage,
  onRetry,
}: CommunityRailProps) {
  const { headerPadStyle, scrollPadStyle, vPad } = useDiscoverRailInsets();
  const { isDesktop } = useLayout();
  const colors = useColors();

  const hasRealItems = data.some((item) => typeof item !== 'string');
  const cardWidth = isDesktop ? 272 : snapInterval;
  const cardGap = isDesktop ? 16 : 14;

  if (!isLoading && !hasRealItems && !errorMessage) return null;

  return (
    <View
      style={[
        styles.container,
        { marginBottom: vPad },
        isDesktop && { backgroundColor: colors.surface + '66', borderRadius: 18, paddingTop: 6, paddingBottom: 4 },
      ]}
    >
      <View style={headerPadStyle}>
        <SectionHeader title={title} subtitle={subtitle} onSeeAll={onSeeAll} />
      </View>
      {errorMessage && !isLoading && !hasRealItems ? (
        <RailErrorBanner message={errorMessage} onRetry={onRetry} />
      ) : (
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth }}>
            {typeof item === 'string' ? (
              <CommunityCardSkeleton />
            ) : (
              <CommunityCard community={item} index={index} />
            )}
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[scrollPadStyle, { gap: cardGap, alignItems: 'stretch' }]}
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({
          length: cardWidth + cardGap,
          offset: (cardWidth + cardGap) * index,
          index,
        })}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

export const CommunityRail = React.memo(CommunityRailComponent);
