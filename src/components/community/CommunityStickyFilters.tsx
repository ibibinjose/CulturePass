import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { M3FilterChip } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/theme';
import { DestinationStickyBar } from '@/components/city/DestinationStickyBar';
import { useM3Colors } from '@/hooks/useM3Colors';
import {
  COMMUNITY_CATEGORY_CHIPS,
  COMMUNITY_SEGMENT_OPTIONS,
  type CommunityCategoryFilter,
  type CommunityHubSegment,
  type CommunityLocationFilter,
  type CommunitySortMode,
} from '@/components/community/communityHubLayout';

interface CommunityStickyFiltersProps {
  hPad: number;
  segment: CommunityHubSegment;
  onSegmentChange: (s: CommunityHubSegment) => void;
  category: CommunityCategoryFilter;
  onCategoryChange: (c: CommunityCategoryFilter) => void;
  location: CommunityLocationFilter;
  onLocationChange: (l: CommunityLocationFilter) => void;
  sort: CommunitySortMode;
  onSortChange: (s: CommunitySortMode) => void;
  resultCount: number;
  cityName: string;
}

const SORT_LABELS: Record<CommunitySortMode, string> = {
  activity: 'Most active',
  size: 'Largest',
  name: 'A–Z',
};

export function CommunityStickyFilters({
  hPad,
  segment,
  onSegmentChange,
  category,
  onCategoryChange,
  location,
  onLocationChange,
  sort,
  onSortChange,
  resultCount,
  cityName,
}: CommunityStickyFiltersProps) {
  const m3Colors = useM3Colors();

  const cycleSort = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onSortChange(sort === 'activity' ? 'size' : sort === 'size' ? 'name' : 'activity');
  };

  return (
    <DestinationStickyBar tone="m3">
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.segmentRow, { paddingHorizontal: hPad, paddingRight: hPad + 24 }]}
      >
        {COMMUNITY_SEGMENT_OPTIONS.map((opt) => (
          <M3FilterChip
            key={opt.id}
            label={opt.label}
            icon={opt.icon}
            compact
            selected={segment === opt.id}
            onPress={() => onSegmentChange(opt.id)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[s.chipRow, { paddingHorizontal: hPad, paddingRight: hPad + 32 }]}
      >
        {COMMUNITY_CATEGORY_CHIPS.map((cat) => (
          <M3FilterChip
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            compact
            selected={category === cat.id}
            onPress={() => onCategoryChange(cat.id)}
          />
        ))}
      </ScrollView>

      <View style={[s.metaRow, { paddingHorizontal: hPad }]}>
        <View style={s.locRow}>
          <M3FilterChip
            label="Near you"
            compact
            selected={location === 'near-you'}
            onPress={() => onLocationChange('near-you')}
          />
          <M3FilterChip
            label="All locations"
            compact
            selected={location === 'all'}
            onPress={() => onLocationChange('all')}
          />
        </View>

        <Pressable onPress={cycleSort} style={[s.sortBtn, { backgroundColor: m3Colors.surfaceContainer }]} accessibilityRole="button" accessibilityLabel="Change sort order">
          <Text style={[M3Typography.labelMedium, { color: m3Colors.onSurfaceVariant }]}>{SORT_LABELS[sort]}</Text>
          <Ionicons name="swap-vertical" size={14} color={m3Colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: hPad, paddingBottom: 10 }}>
        <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
          {resultCount} hub{resultCount === 1 ? '' : 's'}
          {location === 'near-you' ? ` near ${cityName}` : ' worldwide'}
        </Text>
      </View>
    </DestinationStickyBar>
  );
}

const s = StyleSheet.create({
  segmentRow: { gap: 8, paddingTop: 10, paddingBottom: 6 },
  chipRow: { gap: 8, paddingVertical: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    gap: 12,
  },
  locRow: { flexDirection: 'row', gap: 8, flex: 1, flexWrap: 'wrap' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
});