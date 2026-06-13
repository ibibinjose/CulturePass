import React, { useMemo, useState } from 'react';
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
  onClearAll?: () => void;
}

const SORT_LABELS: Record<CommunitySortMode, string> = {
  activity: 'Most active',
  size: 'Largest',
  name: 'A–Z',
};

function countActiveFilters(
  segment: CommunityHubSegment,
  category: CommunityCategoryFilter,
  location: CommunityLocationFilter,
  sort: CommunitySortMode,
): number {
  let count = 0;
  if (segment !== 'discover') count += 1;
  if (category !== 'all') count += 1;
  if (location !== 'near-you') count += 1;
  if (sort !== 'activity') count += 1;
  return count;
}

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
  onClearAll,
}: CommunityStickyFiltersProps) {
  const m3Colors = useM3Colors();
  const [expanded, setExpanded] = useState(true);

  const activeCount = useMemo(
    () => countActiveFilters(segment, category, location, sort),
    [segment, category, location, sort],
  );

  const segmentLabel = COMMUNITY_SEGMENT_OPTIONS.find((o) => o.id === segment)?.label ?? 'Discover';
  const categoryLabel = COMMUNITY_CATEGORY_CHIPS.find((c) => c.id === category)?.label ?? 'All';
  const locationLabel = location === 'near-you' ? `Near ${cityName}` : 'All locations';

  const cycleSort = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onSortChange(sort === 'activity' ? 'size' : sort === 'size' ? 'name' : 'activity');
  };

  const toggleExpanded = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    setExpanded((v) => !v);
  };

  const handleClearAll = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onClearAll?.();
  };

  const resultMeta = `${resultCount} hub${resultCount === 1 ? '' : 's'}${
    location === 'near-you' ? ` near ${cityName}` : ' worldwide'
  }`;

  if (!expanded) {
    return (
      <DestinationStickyBar tone="m3">
        <Pressable
          onPress={toggleExpanded}
          style={[s.collapsedRow, { paddingHorizontal: hPad }]}
          accessibilityRole="button"
          accessibilityLabel={`Show filters. ${segmentLabel}, ${categoryLabel}, ${locationLabel}, ${SORT_LABELS[sort]}. ${resultMeta}`}
        >
          <Ionicons name="options-outline" size={18} color={m3Colors.primary} />
          <Text
            style={[M3Typography.labelMedium, s.collapsedSummary, { color: m3Colors.onSurface }]}
            numberOfLines={1}
          >
            {segmentLabel} · {categoryLabel} · {locationLabel}
          </Text>
          <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
            {resultMeta}
          </Text>
          <Ionicons name="chevron-down" size={18} color={m3Colors.onSurfaceVariant} />
        </Pressable>
      </DestinationStickyBar>
    );
  }

  return (
    <DestinationStickyBar tone="m3">
      {/* Row 1 — hub segment + result meta + hide */}
      <View style={[s.topRow, { paddingHorizontal: hPad }]}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={s.segmentScroll}
          contentContainerStyle={s.segmentRow}
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

        <View style={s.topTrailing}>
          <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
            {resultMeta}
          </Text>
          <Pressable
            onPress={toggleExpanded}
            style={[s.iconBtn, { backgroundColor: m3Colors.surfaceContainer }]}
            accessibilityRole="button"
            accessibilityLabel="Hide filters"
            hitSlop={6}
          >
            <Ionicons name="chevron-up" size={16} color={m3Colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      {/* Row 2 — categories, location, sort (single horizontal rail) */}
      <View style={[s.filterRow, { paddingLeft: hPad }]}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={s.chipScroll}
          contentContainerStyle={[s.chipRow, { paddingRight: 8 }]}
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

          <View style={[s.divider, { backgroundColor: m3Colors.outlineVariant }]} />

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
        </ScrollView>

        <View style={[s.actionStrip, { paddingRight: hPad, borderLeftColor: m3Colors.outlineVariant }]}>
          <Pressable
            onPress={cycleSort}
            style={[s.sortBtn, { backgroundColor: m3Colors.surfaceContainer }]}
            accessibilityRole="button"
            accessibilityLabel={`Sort: ${SORT_LABELS[sort]}`}
            hitSlop={4}
          >
            <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>
              {SORT_LABELS[sort]}
            </Text>
            <Ionicons name="swap-vertical" size={14} color={m3Colors.onSurfaceVariant} />
          </Pressable>

          {activeCount > 0 && onClearAll ? (
            <Pressable
              onPress={handleClearAll}
              style={[s.iconBtn, { backgroundColor: m3Colors.errorContainer }]}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              hitSlop={4}
            >
              <Ionicons name="close-circle-outline" size={16} color={m3Colors.onErrorContainer} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </DestinationStickyBar>
  );
}

const s = StyleSheet.create({
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minHeight: 48,
  },
  collapsedSummary: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  segmentScroll: {
    flex: 1,
    minWidth: 0,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  topTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    maxWidth: '42%',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  chipScroll: {
    flex: 1,
    minWidth: 0,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth * 2,
    height: 20,
    marginHorizontal: 2,
    alignSelf: 'center',
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    maxWidth: 108,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as object,
      default: {},
    }),
  },
});