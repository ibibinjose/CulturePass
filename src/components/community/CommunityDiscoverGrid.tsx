import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { M3Button, M3Card, Skeleton } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/theme';
import { LuxeCommunityCard } from '@/modules/communities/components/LuxeCommunityCard';
import { useM3Colors } from '@/hooks/useM3Colors';
import type { Community } from '@/shared/schema';

interface CommunityDiscoverGridProps {
  communities: Community[];
  numColumns: number;
  isLoading?: boolean;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
}

export function CommunityDiscoverGrid({
  communities,
  numColumns,
  isLoading = false,
  onClearFilters,
  emptyTitle = 'No communities found',
  emptyBody = 'Try changing filters or explore culture hubs for diaspora communities.',
}: CommunityDiscoverGridProps) {
  const m3Colors = useM3Colors();

  if (isLoading) {
    return (
      <View style={[s.grid, { gap: 12 }]}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: `${100 / numColumns}%` as `${number}%`, padding: 6 }}>
            <Skeleton height={220} borderRadius={16} />
          </View>
        ))}
      </View>
    );
  }

  if (communities.length === 0) {
    return (
      <M3Card variant="outlined" style={s.empty}>
        <Ionicons name="search-outline" size={48} color={m3Colors.onSurfaceVariant} />
        <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface, textAlign: 'center' }]}>{emptyTitle}</Text>
        <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, textAlign: 'center' }]}>{emptyBody}</Text>
        {onClearFilters ? (
          <M3Button variant="filled" onPress={onClearFilters}>
            Reset filters
          </M3Button>
        ) : null}
      </M3Card>
    );
  }

  return (
    <View style={s.grid}>
      {communities.map((community, i) => (
        <Animated.View
          key={community.id}
          entering={FadeInDown.delay((i % numColumns) * 40).springify()}
          style={{ width: `${100 / numColumns}%` as `${number}%`, padding: 6 }}
        >
          <LuxeCommunityCard community={community} />
        </Animated.View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  empty: { padding: 40, alignItems: 'center', gap: 14, marginTop: 8 },
});