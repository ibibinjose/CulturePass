import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
  FlatList, Alert, type ListRenderItemInfo, RefreshControl, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import { queryClient } from '@/lib/query-client';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
// useCanEdit used inline for per-card ownership check
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { CreatorFAB } from '@/design-system/ui/CreatorActions';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { CultureTokens, FontFamily, TextStyles, CardTokens } from '@/design-system/tokens/theme';
import { createLabCategoryHref } from '@/constants/navigation/createNav';
import type { ActivityData } from '@/shared/schema';

const isWeb = Platform.OS === 'web';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_CATEGORIES = [
  { id: 'All',      label: 'All',      icon: 'apps-outline' as const },
  { id: 'Tours',    label: 'Tours',    icon: 'compass-outline' as const },
  { id: 'Classes',  label: 'Classes',  icon: 'school-outline' as const },
  { id: 'Outdoor',  label: 'Outdoor',  icon: 'leaf-outline' as const },
  { id: 'Wellness', label: 'Wellness', icon: 'heart-outline' as const },
  { id: 'Cultural', label: 'Cultural', icon: 'color-palette-outline' as const },
  { id: 'Sports',   label: 'Sports',   icon: 'football-outline' as const },
];

const SKELETON_COUNT = 6;
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x240/1a1a2e/eee?text=Activity';

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ActivityCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Skeleton width="100%" height={140} borderRadius={CardTokens.radius} />
      <View style={s.cardBody}>
        <Skeleton width={60} height={12} borderRadius={4} />
        <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// ─── Activity card ────────────────────────────────────────────────────────────

const ActivityCard = React.memo(function ActivityCard({
  activity,
  canEdit,
  onEdit,
  onDelete,
}: {
  activity: ActivityData;
  canEdit: boolean;
  onEdit: (a: ActivityData) => void;
  onDelete: (a: ActivityData) => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/activities/[id]', params: { id: activity.id } })}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${activity.name}`}
    >
      <Image
        source={{ uri: activity.imageUrl || PLACEHOLDER_IMAGE }}
        style={s.cardImage}
        contentFit="cover"
        transition={200}
      />

      {activity.isPromoted && (
        <View style={[s.promotedBadge, { backgroundColor: CultureTokens.gold }]}>
          <Ionicons name="star" size={10} color="#fff" />
          <Text style={s.promotedText}>Featured</Text>
        </View>
      )}

      <View style={s.cardBody}>
        {/* Category badge */}
        <View style={[s.categoryBadge, { backgroundColor: CultureTokens.teal + '18', borderColor: CultureTokens.teal + '40' }]}>
          <Text style={[s.categoryText, { color: CultureTokens.teal }]}>{activity.category}</Text>
        </View>

        {/* Name */}
        <Text numberOfLines={2} style={[s.cardName, { color: colors.text }]}>
          {activity.name}
        </Text>

        {/* Duration & Price */}
        <View style={s.metaRow}>
          {activity.duration ? (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]}>{activity.duration}</Text>
            </View>
          ) : null}
          <View style={s.metaItem}>
            <Ionicons name="pricetag-outline" size={13} color={colors.textTertiary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>{activity.priceLabel || 'Free'}</Text>
          </View>
        </View>

        {/* Rating */}
        {activity.rating != null && activity.rating > 0 ? (
          <View style={s.ratingRow}>
            <Ionicons name="star" size={13} color={CultureTokens.gold} />
            <Text style={[s.ratingText, { color: colors.text }]}>{activity.rating.toFixed(1)}</Text>
            {activity.reviewsCount != null && activity.reviewsCount > 0 ? (
              <Text style={[s.reviewsText, { color: colors.textTertiary }]}>
                ({activity.reviewsCount})
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Owner actions */}
        {canEdit && (
          <View style={s.ownerActions}>
            <Pressable
              onPress={() => onEdit(activity)}
              style={[s.ownerBtn, { backgroundColor: CultureTokens.indigo + '14' }]}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${activity.name}`}
            >
              <Ionicons name="create-outline" size={14} color={CultureTokens.indigo} />
            </Pressable>
            <Pressable
              onPress={() => onDelete(activity)}
              style={[s.ownerBtn, { backgroundColor: CultureTokens.coral + '14' }]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${activity.name}`}
            >
              <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function emptyStateMessage(searchQuery: string, filtersActive: boolean): string {
  if (searchQuery.trim()) {
    return `No results for "${searchQuery.trim()}".`;
  }
  if (filtersActive) {
    return 'Try adjusting your filters.';
  }
  return 'No activities available yet.';
}

const ListEmpty = React.memo(function ListEmpty({
  filtersActive,
  searchQuery,
  colors,
  onClearFilters,
}: {
  filtersActive: boolean;
  searchQuery: string;
  colors: ReturnType<typeof useColors>;
  onClearFilters: () => void;
}) {
  const showReset = filtersActive || searchQuery.trim().length > 0;
  const description = emptyStateMessage(searchQuery, filtersActive);

  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name="compass-outline" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No activities found</Text>
      <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>{description}</Text>
      {showReset ? (
        <Pressable
          style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
          onPress={onClearFilters}
          accessibilityRole="button"
          accessibilityLabel="Reset filters"
        >
          <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
          <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();
  const { user, hasRole } = useAuth();

  const numCols = isDesktop ? 3 : 2;
  const colGap = isDesktop ? 20 : 12;

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryKey = useMemo(
    () => ['activities', state.city, state.country, selectedCategory === 'All' ? undefined : selectedCategory],
    [state.city, state.country, selectedCategory],
  );

  const {
    data: activities = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey,
    queryFn: () =>
      modulesApi.activities.list({
        city: state.city || undefined,
        country: state.country || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      }),
  });

  // ── Client-side search filter ──
  const filteredActivities = useMemo(() => {
    if (!debouncedSearch) return activities;
    const q = debouncedSearch.toLowerCase();
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q),
    );
  }, [activities, debouncedSearch]);

  const filtersActive = selectedCategory !== 'All';

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => modulesApi.activities.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const handleEdit = useCallback((activity: ActivityData) => {
    router.push({ pathname: '/activities/[id]', params: { id: activity.id, edit: '1' } });
  }, []);

  const handleDelete = useCallback((activity: ActivityData) => {
    Alert.alert(
      'Delete activity',
      `Remove "${activity.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(activity.id),
        },
      ],
    );
  }, [deleteMutation]);

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSearchQuery('');
  }, []);

  // ── Render helpers ──
  const hasRenderedRef = useRef(false);
  useEffect(() => {
    if (filteredActivities.length > 0) hasRenderedRef.current = true;
  }, [filteredActivities.length]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<ActivityData>) => {
    const canEdit =
      !!user &&
      (user.id === item.ownerId || hasRole('admin', 'platformAdmin', 'moderator'));

    const entering = !hasRenderedRef.current
      ? FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)
      : undefined;

    return (
      <Animated.View entering={entering} style={s.flexOne}>
        <ActivityCard
          activity={item}
          canEdit={canEdit}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Animated.View>
    );
  }, [user, hasRole, handleEdit, handleDelete]);

  const renderSkeletonItem = useCallback(() => (
    <View style={s.flexOne}>
      <ActivityCardSkeleton />
    </View>
  ), []);

  const skeletonData = useMemo(() => Array.from({ length: SKELETON_COUNT }), []);
  const keyExtractor = useCallback((item: ActivityData) => item.id, []);
  const skeletonKeyExtractor = useCallback((_: unknown, i: number) => `sk-${i}`, []);

  const colWrapperStyle = useMemo(
    () => (numCols > 1 ? { gap: colGap } : undefined),
    [numCols, colGap],
  );
  const listContentStyle = useMemo(
    () => [s.list, { paddingHorizontal: hPad, gap: colGap, paddingBottom: bottomInset + 100 }],
    [hPad, colGap, bottomInset],
  );

  const listEmpty = useMemo(
    () => (
      <ListEmpty
        filtersActive={filtersActive}
        searchQuery={debouncedSearch}
        colors={colors}
        onClearFilters={clearFilters}
      />
    ),
    [filtersActive, debouncedSearch, colors, clearFilters],
  );

  const listFooter = useMemo(() => {
    if (!isLoading && filteredActivities.length > 0) {
      return (
        <View style={s.listFooter}>
          <View style={[s.endLine, { backgroundColor: colors.divider }]} />
          <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
            {filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'} shown
          </Text>
          <View style={[s.endLine, { backgroundColor: colors.divider }]} />
        </View>
      );
    }
    return null;
  }, [isLoading, filteredActivities.length, colors]);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>

        {/* ── Header ── */}
        <Animated.View
          entering={FadeInUp.duration(320).springify()}
          style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}
        >
          <View style={s.headerRow}>
            <BackButton
              fallback="/(tabs)"
              style={[s.backBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.headerTitle, { color: colors.text }]}>Activities</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location" size={11} color={CultureTokens.indigo} />
                <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {state.city
                    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
                    : state.country || 'All locations'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Search ── */}
          <View style={[s.searchRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search activities…"
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel="Search activities"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ── Centred content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>

          {/* ── Category filter chips ── */}
          <FlatList
            horizontal
            data={ACTIVITY_CATEGORIES}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.chipRow, { paddingHorizontal: hPad }]}
            renderItem={({ item }) => {
              const active = selectedCategory === item.id;
              return (
                <Pressable
                  onPress={() => setSelectedCategory(item.id)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: active ? CultureTokens.indigo : colors.surfaceElevated,
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${item.label}`}
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={item.icon}
                    size={14}
                    color={active ? '#fff' : colors.textSecondary}
                  />
                  <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />

          {/* ── Activity grid ── */}
          {isLoading ? (
            <FlatList
              key={`skeleton-${numCols}`}
              data={skeletonData}
              renderItem={renderSkeletonItem}
              keyExtractor={skeletonKeyExtractor}
              numColumns={numCols}
              columnWrapperStyle={colWrapperStyle}
              contentContainerStyle={listContentStyle}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              key={`activities-${numCols}`}
              data={filteredActivities}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              numColumns={numCols}
              columnWrapperStyle={colWrapperStyle}
              contentContainerStyle={listContentStyle}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={CultureTokens.indigo}
                />
              }
              showsVerticalScrollIndicator={false}
              initialNumToRender={8}
              maxToRenderPerBatch={6}
              windowSize={5}
              removeClippedSubviews={!isWeb}
              ListFooterComponent={listFooter}
              ListEmptyComponent={listEmpty}
            />
          )}
        </View>

        {/* ── Creator FAB ── */}
        <CreatorFAB
          label="Add Activity"
          onPress={() => router.push(createLabCategoryHref('activity') as never)}
          icon="add"
        />
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  flexOne: { flex: 1 },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
  },

  // Shell
  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Chips
  chipRow: { paddingVertical: 10, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Card
  card: {
    borderRadius: CardTokens.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    ...TextStyles.eventCardTitle,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewsText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  promotedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  promotedText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    color: '#fff',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ownerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  list: { paddingTop: 16, gap: 16 },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  listFooterText: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 20,
  },
  endLine: { flex: 1, height: 1, opacity: 0.5 },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: { ...TextStyles.title3, lineHeight: 24 },
  emptyDesc: { ...TextStyles.callout, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  resetBtnText: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 19,
  },
});
