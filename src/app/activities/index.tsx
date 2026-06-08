import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform,
  ScrollView, Alert, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
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
import { navigateToCreateById } from '@/lib/creationRouting';
import type { ActivityData } from '@/shared/schema';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';

const CATEGORY_FROM_QUERY: Record<string, string> = {
  classes: 'Classes',
  class: 'Classes',
  tours: 'Tours',
  outdoor: 'Outdoor',
  wellness: 'Wellness',
  cultural: 'Cultural',
  sports: 'Sports',
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ActivityCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Skeleton width="100%" height={155} borderRadius={CardTokens.radius} />
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.985, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 250 });
  };

  return (
    <AnimatedPressable
      onPress={() => router.push(`/activities/${activity.id}`)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View ${activity.name}`}
    >
      <View style={s.imageContainer}>
        <Image
          source={{ uri: activity.imageUrl || PLACEHOLDER_IMAGE }}
          style={s.cardImage}
          contentFit="cover"
          transition={200}
        />
        {/* Subtle depth gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)']}
          locations={[0.5, 0.75, 1]}
          style={s.imageOverlay}
        />
        {(!activity.priceLabel || activity.priceLabel.toLowerCase() === 'free') && (
          <View style={[s.freeBadge, { backgroundColor: '#059669', left: 10, right: undefined }]}>
            <Text style={s.freeBadgeText}>FREE</Text>
          </View>
        )}
        {activity.isPromoted && (
          <View style={[s.promotedBadge, { backgroundColor: CultureTokens.gold }]}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={s.promotedText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={s.cardBody}>
        {/* Category badge + optional culture tag */}
        <View style={s.badgeRow}>
          <View style={[s.categoryBadge, { backgroundColor: CultureTokens.teal + '18', borderColor: CultureTokens.teal + '40' }]}>
            <Text style={[s.categoryText, { color: CultureTokens.teal }]}>{activity.category}</Text>
          </View>
          {activity.primaryCulture ? (
            <View style={[s.cultureTag, { backgroundColor: CultureTokens.indigo + '12', borderColor: CultureTokens.indigo + '33' }]}>
              <Text style={[s.cultureTagText, { color: CultureTokens.indigo }]} numberOfLines={1}>{activity.primaryCulture}</Text>
            </View>
          ) : null}
        </View>

        {/* Name */}
        <Text numberOfLines={2} style={[s.cardName, { color: colors.text }]}>
          {activity.name}
        </Text>

        {/* Rich meta: location / schedule / duration / price */}
        <View style={s.metaRow}>
          {activity.location ? (
            <View style={s.metaItem}>
              <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{activity.location}</Text>
            </View>
          ) : null}
          {activity.scheduleText || activity.recurrence ? (
            <View style={s.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{activity.scheduleText || activity.recurrence}</Text>
            </View>
          ) : activity.duration ? (
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]}>{activity.duration}</Text>
            </View>
          ) : null}
          <View style={s.metaItem}>
            <Ionicons name="pricetag-outline" size={12} color={colors.textTertiary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>{activity.priceLabel || 'Free'}</Text>
          </View>
        </View>

        {/* Secondary info row: difficulty, age, participants */}
        {(activity.difficulty || activity.ageGroup || activity.maxParticipants) && (
          <View style={s.metaRow}>
            {activity.difficulty && (
              <View style={[s.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Text style={[s.tagText, { color: colors.textSecondary }]}>{activity.difficulty}</Text>
              </View>
            )}
            {activity.ageGroup && (
              <View style={[s.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Text style={[s.tagText, { color: colors.textSecondary }]}>{activity.ageGroup}</Text>
              </View>
            )}
            {activity.maxParticipants && (
              <View style={s.metaItem}>
                <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                <Text style={[s.metaText, { color: colors.textSecondary }]}>Up to {activity.maxParticipants}</Text>
              </View>
            )}
          </View>
        )}

        {/* Rating + instructor if present */}
        <View style={s.bottomMeta}>
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
          {activity.instructorName ? (
            <Text style={[s.instructorText, { color: colors.textTertiary }]} numberOfLines={1}>
              with {activity.instructorName}
            </Text>
          ) : null}
        </View>

        {/* Owner actions (subtle on web) */}
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
    </AnimatedPressable>
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
  onCreate,
  locationLabel,
}: {
  filtersActive: boolean;
  searchQuery: string;
  colors: ReturnType<typeof useColors>;
  onClearFilters: () => void;
  onCreate: () => void;
  locationLabel: string;
}) {
  const showReset = filtersActive || searchQuery.trim().length > 0;
  const description = emptyStateMessage(searchQuery, filtersActive);

  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name="compass-outline" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No activities found</Text>
      <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
        {showReset ? description : `No activities listed in ${locationLabel} yet. Be the first to host a workshop, tour, or class.`}
      </Text>
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
      ) : (
        <Pressable
          style={[s.createBtn, { backgroundColor: CultureTokens.teal }]}
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Create an activity"
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.createBtnText}>Create an activity</Text>
        </Pressable>
      )}
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const colors = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();
  const { user, hasRole } = useAuth();
  const searchParams = useLocalSearchParams<{ category?: string | string[] }>();

  const numCols = isDesktop ? 3 : 2;
  const colGap = isDesktop ? 20 : 12;

  const initialCategory = useMemo(() => {
    const raw = Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category;
    if (!raw) return 'All';
    const mapped = CATEGORY_FROM_QUERY[raw.toLowerCase()];
    if (mapped) return mapped;
    const match = ACTIVITY_CATEGORIES.find(
      (c) => c.id.toLowerCase() === raw.toLowerCase() || c.label.toLowerCase() === raw.toLowerCase(),
    );
    return match?.id ?? 'All';
  }, [searchParams.category]);

  // ── Filter state ──
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'newest'>('relevance');

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

  // ── Client-side sort ──
  const sortedActivities = useMemo(() => {
    let result = [...filteredActivities];
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    // relevance is original order from API (e.g. promoted first?)
    return result;
  }, [filteredActivities, sortBy]);

  const filtersActive = selectedCategory !== 'All';

  // ── Delete mutation ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) => modulesApi.activities.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const handleCreate = useCallback(() => {
    navigateToCreateById('activity', { source: 'activities_index_cta' });
  }, []);

  const handleEdit = useCallback((activity: ActivityData) => {
    router.push(`/activities/${activity.id}`);
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
    if (searchParams.category) {
      router.replace('/activities');
    }
  }, [searchParams.category]);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'your area';

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
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={2}>
                Workshops, tours, classes, and cultural experiences near you
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Ionicons name="location" size={11} color={CultureTokens.indigo} />
                <Text style={[s.headerLocation, { color: colors.textTertiary }]} numberOfLines={1}>
                  {locationLabel}
                  {!isLoading && sortedActivities.length > 0 ? ` · ${sortedActivities.length} found` : ''}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => refetch()}
              style={[s.iconBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh activities"
            >
              {isRefetching
                ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
                : <Ionicons name="refresh" size={18} color={colors.text} />}
            </Pressable>
          </View>

          <View style={[s.quickLinks, { paddingHorizontal: 0 }]}>
            {[
              { label: 'Discover', route: '/(tabs)', icon: 'compass-outline' as const },
              { label: 'Events', route: '/events', icon: 'calendar-outline' as const },
              { label: 'Map', route: '/map', icon: 'map-outline' as const },
            ].map((link) => (
              <Pressable
                key={link.route}
                onPress={() => router.push(link.route as never)}
                style={[s.quickLink, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                accessibilityRole="link"
                accessibilityLabel={link.label}
              >
                <Ionicons name={link.icon} size={14} color={CultureTokens.indigo} />
                <Text style={[s.quickLinkText, { color: colors.textSecondary }]}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={[s.shell, isDesktop && s.shellDesktop]}>
          <View style={[s.searchWrap, { paddingHorizontal: hPad }]}>
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
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipScroll}
            contentContainerStyle={[s.chipRow, { paddingHorizontal: hPad }]}
          >
            {ACTIVITY_CATEGORIES.map((item) => {
              const active = selectedCategory === item.id;
              return (
                <Pressable
                  key={item.id}
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
                  <Ionicons name={item.icon} size={14} color={active ? '#fff' : colors.textSecondary} />
                  <Text style={[s.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[s.sortRow, { paddingHorizontal: hPad }]}>
            <Text style={[s.sortLabel, { color: colors.textSecondary }]}>Sort by</Text>
            {[
              { key: 'relevance', label: 'Relevance' },
              { key: 'rating', label: 'Top rated' },
              { key: 'newest', label: 'Newest' },
            ].map((opt) => {
              const active = sortBy === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortBy(opt.key as typeof sortBy)}
                  style={[
                    s.sortChip,
                    {
                      backgroundColor: active ? colors.text : colors.surfaceElevated,
                      borderColor: active ? colors.text : colors.borderLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[s.sortChipText, { color: active ? colors.background : colors.textSecondary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            style={s.listScroll}
            contentContainerStyle={[
              s.list,
              { paddingHorizontal: hPad, paddingBottom: bottomInset + 100, gap: colGap },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={CultureTokens.indigo} />
            }
          >
            {isLoading ? (
              <View style={[s.grid, { gap: colGap }, numCols === 3 && s.gridDesktop3, numCols === 2 && s.gridMobile2]}>
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <View
                    key={`sk-${i}`}
                    style={[s.gridItem, { width: numCols === 3 ? '31.5%' : '48%' }]}
                  >
                    <ActivityCardSkeleton />
                  </View>
                ))}
              </View>
            ) : sortedActivities.length === 0 ? (
              <ListEmpty
                filtersActive={filtersActive}
                searchQuery={debouncedSearch}
                colors={colors}
                onClearFilters={clearFilters}
                onCreate={handleCreate}
                locationLabel={locationLabel}
              />
            ) : (
              <>
                <Text style={[s.sectionTitle, { color: colors.text }]}>
                  {selectedCategory === 'All' ? 'Discover activities' : selectedCategory}
                  {sortBy !== 'relevance' ? ` · ${sortBy === 'rating' ? 'top rated' : 'newest'}` : ''}
                </Text>
                <View style={[s.grid, { gap: colGap }, numCols === 3 && s.gridDesktop3, numCols === 2 && s.gridMobile2]}>
                  {sortedActivities.map((item) => {
                    const canEdit =
                      !!user &&
                      (user.id === item.ownerId || hasRole('admin', 'platformAdmin', 'moderator'));
                    return (
                      <View
                        key={item.id}
                        style={[s.gridItem, { width: numCols === 3 ? '31.5%' : '48%' }]}
                      >
                        <ActivityCard
                          activity={item}
                          canEdit={canEdit}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={s.listFooter}>
                  <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                  <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                    {sortedActivities.length} activit{sortedActivities.length !== 1 ? 'ies' : 'y'}
                  </Text>
                  <View style={[s.endLine, { backgroundColor: colors.divider }]} />
                </View>
              </>
            )}
          </ScrollView>
        </View>

        <CreatorFAB label="Add Activity" onPress={handleCreate} icon="add" />
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
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
  headerLocation: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },

  searchWrap: { paddingTop: 12, paddingBottom: 4 },
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
    ...(isWeb ? { outlineStyle: 'none' as any } : {}),
  },

  // Shell
  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  chipScroll: { flexGrow: 0 },
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
    // subtle web lift
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as any : {}),
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 155,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  freeBadge: {
    position: 'absolute',
    top: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  freeBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 14,
    gap: 8,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cultureTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  cultureTagText: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  cardName: {
    ...TextStyles.eventCardTitle,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
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
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  instructorText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    fontStyle: 'italic',
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
    top: 10,
    right: 10,
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

  listScroll: { flex: 1 },
  list: { paddingTop: 12, gap: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  gridDesktop3: {},
  gridMobile2: {},
  gridItem: {
    flexGrow: 1,
    minWidth: 150,
  },
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  createBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  sortLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    marginRight: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },

  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
});
