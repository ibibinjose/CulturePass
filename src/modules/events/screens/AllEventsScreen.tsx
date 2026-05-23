import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet, Text, View, Platform, ActivityIndicator,
  FlatList, ScrollView, type ListRenderItemInfo,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { EventCardSkeleton } from '@/modules/events/components/EventCardSkeleton';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import type { EventData, PaginatedEventsResponse } from '@/shared/schema';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { M3TopAppBar, M3Button, M3FilterChip, M3FAB } from '@/design-system/ui';
import {
  EVENT_CATEGORIES,
  type EventCategory,
  LEGACY_CHILDREN_FAMILY_CATEGORY,
} from '@/constants/eventCategories';
import { eventsApi } from '@/modules/events/api';
import { eventPaths } from '@/modules/events/services/navigation';
import { useSafeBack } from '@/lib/navigation';

const isWeb = Platform.OS === 'web';

// ─── Types & constants ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const SKELETON_DATA = Array.from({ length: 9 });
const INITIAL_NUM_TO_RENDER = 8;
const MAX_TO_RENDER_PER_BATCH = 6;
const WINDOW_SIZE = 5;

type DateFilter =
  | 'all'
  | 'today'
  | 'this_weekend'
  | 'this_week'
  | 'next_week'
  | 'next_30_days'
  | 'past';

type PriceFilter = 'all' | 'free' | 'paid';

const DATE_OPTIONS: { id: DateFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all',          label: 'Upcoming',     icon: 'calendar-outline'  },
  { id: 'today',        label: 'Today',        icon: 'today-outline'     },
  { id: 'this_weekend', label: 'This Weekend', icon: 'sunny-outline'     },
  { id: 'this_week',    label: 'This Week',    icon: 'calendar-number-outline' },
  { id: 'next_week',    label: 'Next Week',    icon: 'arrow-forward-outline'   },
  { id: 'next_30_days', label: 'Next 30 Days', icon: 'calendar-clear-outline'  },
  { id: 'past',         label: 'Past',         icon: 'time-outline'      },
];

// ─── Date range helpers ───────────────────────────────────────────────────────

function toYMD(d: Date): string {
  return d.toLocaleDateString('en-CA'); // returns YYYY-MM-DD
}

function getDateRange(filter: DateFilter): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = toYMD(now);

  if (filter === 'today') return { dateFrom: today, dateTo: today };

  if (filter === 'this_weekend') {
    // Sat–Sun of the current week
    const day = now.getDay(); // 0=Sun, 6=Sat
    const sat = new Date(now);
    sat.setHours(0, 0, 0, 0);
    sat.setDate(now.getDate() + ((6 - day + 7) % 7));
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    return { dateFrom: toYMD(sat), dateTo: toYMD(sun) };
  }

  if (filter === 'this_week') {
    // Mon–Sun of the current calendar week
    const day = now.getDay();
    const mon = new Date(now);
    mon.setHours(0, 0, 0, 0);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { dateFrom: toYMD(mon), dateTo: toYMD(sun) };
  }

  if (filter === 'next_week') {
    const day = now.getDay();
    const nextMon = new Date(now);
    nextMon.setHours(0, 0, 0, 0);
    nextMon.setDate(now.getDate() + (8 - ((day + 6) % 7)));
    const nextSun = new Date(nextMon);
    nextSun.setDate(nextMon.getDate() + 6);
    return { dateFrom: toYMD(nextMon), dateTo: toYMD(nextSun) };
  }

  if (filter === 'next_30_days') {
    const end = new Date(now);
    end.setDate(now.getDate() + 30);
    return { dateFrom: today, dateTo: toYMD(end) };
  }

  if (filter === 'past') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { dateTo: toYMD(yesterday) };
  }

  // 'all' / upcoming — from today onwards, no upper bound
  return { dateFrom: today };
}

// ─── Extracted list sub-components (stable references) ────────────────────────

function renderSkeletonItem() {
  return <View style={s.flexOne}><EventCardSkeleton /></View>;
}

function skeletonKeyExtractor(_: unknown, i: number) { return `sk-${i}`; }

const ListFooter = React.memo(function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  count,
  colors,
}: {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  count: number;
  colors: ReturnType<typeof useColors>;
}) {
  if (isFetchingNextPage) return (
    <View style={s.listFooter}>
      <ActivityIndicator size="small" color={CultureTokens.indigo} />
      <Text style={[s.listFooterText, { color: colors.textTertiary }]}>Loading more…</Text>
    </View>
  );
  if (!hasNextPage && count > 0) return (
    <View style={s.listFooter}>
      <View style={[s.endLine, { backgroundColor: colors.divider }]} />
      <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
        {count} event{count !== 1 ? 's' : ''} shown
      </Text>
      <View style={[s.endLine, { backgroundColor: colors.divider }]} />
    </View>
  );
  return null;
});

const ListEmpty = React.memo(function ListEmpty({
  filtersActive,
  locationLabel,
  colors,
  onClearFilters,
}: {
  filtersActive: boolean;
  locationLabel: string;
  colors: ReturnType<typeof useColors>;
  onClearFilters: () => void;
}) {
  return (
    <View style={s.emptyState}>
      <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
        <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No events found</Text>
      <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
        {filtersActive
          ? 'Try adjusting your filters or expanding the date range.'
          : `No events yet in ${locationLabel}.`}
      </Text>
      {filtersActive && (
        <M3Button
          variant="tonal"
          leftIcon="refresh-outline"
          onPress={onClearFilters}
        >
          Reset filters
        </M3Button>
      )}
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const EVENT_CATEGORY_IDS = new Set<EventCategory>(EVENT_CATEGORIES.map((c) => c.id));

function normalizeCategoryRouteParam(raw: string | undefined): string | undefined {
  if (raw == null || !String(raw).trim()) return undefined;
  const t = String(raw).trim();
  if (t === LEGACY_CHILDREN_FAMILY_CATEGORY) return 'Family';
  return t;
}

function paramStr(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = String(s).trim();
  return t.length ? t : undefined;
}

export default function AllEventsScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors  = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad, windowSizeClass } = useLayout();
  const handleBack = useSafeBack('/(tabs)');
  const routeParams = useLocalSearchParams<{ lgaCode?: string; councilId?: string; category?: string }>();

  const lgaCodeParam = paramStr(routeParams.lgaCode);
  const councilIdParam = paramStr(routeParams.councilId);
  const councilFilterActive = Boolean(lgaCodeParam || councilIdParam);
  const categoryParam = normalizeCategoryRouteParam(paramStr(routeParams.category));
  const initialCategory =
    categoryParam && EVENT_CATEGORY_IDS.has(categoryParam as EventCategory) ? categoryParam : 'All';

  const numCols = windowSizeClass === 'expanded' ? 3 : windowSizeClass === 'medium' ? 2 : 1;
  const colGap  = 16;

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [dateFilter, setDateFilter]             = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter]           = useState<PriceFilter>('all');

  useEffect(() => {
    if (categoryParam && EVENT_CATEGORY_IDS.has(categoryParam as EventCategory)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const queryKey = useMemo(
    () => [
      '/api/events/paginated',
      state.country,
      state.city,
      selectedCategory,
      dateFilter,
      priceFilter,
      today,
      lgaCodeParam,
      councilIdParam,
    ],
    [state.country, state.city, selectedCategory, dateFilter, priceFilter, today, lgaCodeParam, councilIdParam],
  );

  const {
    data, isLoading, isFetchingNextPage,
    fetchNextPage, hasNextPage, refetch, isRefetching,
  } = useInfiniteQuery<PaginatedEventsResponse>({
    queryKey,
    queryFn: ({ pageParam }) => {
      const { dateFrom, dateTo } = getDateRange(dateFilter);
      return eventsApi.events.list({
        country:  state.country || undefined,
        city:     state.city    || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        isFree:   priceFilter === 'free' ? true : priceFilter === 'paid' ? false : undefined,
        page:     (pageParam as number) ?? 1,
        pageSize: PAGE_SIZE,
        dateFrom,
        dateTo,
        lgaCode: lgaCodeParam,
        councilId: councilIdParam,
      });
    },
    initialPageParam: 1,
    getNextPageParam: last => last.hasNextPage ? last.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });

  const allEvents: EventData[] = useMemo(
    () => data?.pages.flatMap(p => Array.isArray(p?.events) ? p.events : []) ?? [],
    [data],
  );

  const filtersActive =
    selectedCategory !== 'All' ||
    dateFilter !== 'all' ||
    priceFilter !== 'all' ||
    councilFilterActive;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);



  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventData>) => {
    return (
      <View style={s.flexOne}>
        <M3EventCard event={item} variant="elevated" />
      </View>
    );
  }, []);

  const locationLabel = councilFilterActive
    ? 'Your council area'
    : state.city
      ? `${state.city}${state.country ? `, ${state.country}` : ''}`
      : state.country || 'your region';

  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setDateFilter('all');
    setPriceFilter('all');
  }, []);

  // ── Calendar export ────────────────────────────────────────────────────────
  const colWrapperStyle = useMemo(
    () => numCols > 1 ? { gap: colGap } : undefined,
    [numCols, colGap],
  );
  const skeletonContentStyle = useMemo(
    () => [s.list, { paddingHorizontal: hPad, gap: colGap }],
    [hPad, colGap],
  );
  const listContentStyle = useMemo(
    () => [s.list, { paddingHorizontal: hPad, gap: colGap, paddingBottom: bottomInset + 80 }],
    [hPad, colGap, bottomInset],
  );

  const eventKeyExtractor = useCallback((item: EventData) => item.id, []);

  const listFooter = useMemo(
    () => (
      <ListFooter
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        count={allEvents.length}
        colors={colors}
      />
    ),
    [isFetchingNextPage, hasNextPage, allEvents.length, colors],
  );
  const listEmpty = useMemo(
    () => (
      <ListEmpty
        filtersActive={filtersActive}
        locationLabel={locationLabel}
        colors={colors}
        onClearFilters={clearFilters}
      />
    ),
    [filtersActive, locationLabel, colors, clearFilters],
  );

  const fabRight = isDesktop ? hPad + 32 : 24;
  const fabBottom = isDesktop ? 48 : 24;
  const handleFabPress = useCallback(() => router.push(eventPaths.create), []);

  return (
    <ErrorBoundary>
      <View style={[s.container, { backgroundColor: colors.background }]}>

        <M3TopAppBar
          title="Events"
          onBack={handleBack}
          variant={isWeb ? 'small' : windowSizeClass === 'expanded' ? 'large' : 'medium'}
          denseWeb={isWeb}
          actions={
            filtersActive
              ? [{ icon: 'close-circle-outline', onPress: clearFilters }]
              : undefined
          }
        />

        {/* ── Centred content shell ── */}
        <View style={[s.shell, isDesktop && s.shellDesktop]}>

          {/* ── Filter row — single line ── */}
          {isDesktop ? (
            <View style={[s.filterWrapDesktop, { paddingHorizontal: hPad }]}>
              <M3FilterChip
                label="All"
                icon="apps"
                compact
                selected={selectedCategory === 'All' && priceFilter === 'all'}
                onPress={() => { setSelectedCategory('All'); setPriceFilter('all'); }}
              />
              <M3FilterChip
                label="Free"
                icon="gift-outline"
                compact
                selected={priceFilter === 'free'}
                onPress={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
              />
              {EVENT_CATEGORIES.map(c => (
                <M3FilterChip
                  key={c.id}
                  label={c.id}
                  icon={c.icon as keyof typeof Ionicons.glyphMap}
                  compact
                  selected={selectedCategory === c.id}
                  onPress={() => { setSelectedCategory(selectedCategory === c.id ? 'All' : c.id); setPriceFilter('all'); }}
                />
              ))}
              <View style={{ width: 1, height: 24, backgroundColor: colors.divider, marginHorizontal: 8, alignSelf: 'center' }} />
              {DATE_OPTIONS.map(o => (
                <M3FilterChip
                  key={o.id}
                  label={o.label}
                  icon={o.icon}
                  compact
                  selected={dateFilter === o.id}
                  onPress={() => setDateFilter(o.id)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                s.filterScrollContent,
                { paddingHorizontal: hPad },
              ]}
            >
              <M3FilterChip
                label="All"
                icon="apps"
                selected={selectedCategory === 'All' && priceFilter === 'all'}
                onPress={() => { setSelectedCategory('All'); setPriceFilter('all'); }}
              />
              <M3FilterChip
                label="Free"
                icon="gift-outline"
                selected={priceFilter === 'free'}
                onPress={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
              />
              {EVENT_CATEGORIES.map(c => (
                <M3FilterChip
                  key={c.id}
                  label={c.id}
                  icon={c.icon as keyof typeof Ionicons.glyphMap}
                  selected={selectedCategory === c.id}
                  onPress={() => { setSelectedCategory(selectedCategory === c.id ? 'All' : c.id); setPriceFilter('all'); }}
                />
              ))}
              <View style={{ width: 1, height: 24, backgroundColor: colors.divider, marginHorizontal: 8, alignSelf: 'center' }} />
              {DATE_OPTIONS.map(o => (
                <M3FilterChip
                  key={o.id}
                  label={o.label}
                  icon={o.icon}
                  selected={dateFilter === o.id}
                  onPress={() => setDateFilter(o.id)}
                />
              ))}
            </ScrollView>
          )}

          {/* ── Event grid ── */}
          {isLoading ? (
            <FlatList
              key={`skeleton-${numCols}`}
              data={SKELETON_DATA}
              renderItem={renderSkeletonItem}
              keyExtractor={skeletonKeyExtractor}
              numColumns={numCols}
              columnWrapperStyle={colWrapperStyle}
              contentContainerStyle={skeletonContentStyle}
              scrollEnabled={false}
            />
          ) : (
            <FlatList
              key={`events-${numCols}`}
              data={allEvents}
              renderItem={renderItem}
              keyExtractor={eventKeyExtractor}
              numColumns={numCols}
              columnWrapperStyle={colWrapperStyle}
              contentContainerStyle={listContentStyle}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              refreshing={isRefetching}
              onRefresh={refetch}
              showsVerticalScrollIndicator={false}
              initialNumToRender={INITIAL_NUM_TO_RENDER}
              maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
              windowSize={WINDOW_SIZE}
              removeClippedSubviews={!isWeb}
              ListFooterComponent={listFooter}
              ListEmptyComponent={listEmpty}
            />
          )}
        </View>
      {/* ── Floating Action Button (FAB) for Create Event ── */}
      <M3FAB
        icon="add"
        onPress={handleFabPress}
        style={{ position: 'absolute', right: fabRight, bottom: fabBottom }}
      />
      </View>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const fabStyle =
  Platform.OS === 'web'
    ? ({
        position: 'absolute',
        zIndex: 100,
        backgroundColor: CultureTokens.indigo,
        borderRadius: 32,
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.18)',
      } as const)
    : ({
        position: 'absolute',
        zIndex: 100,
        backgroundColor: CultureTokens.indigo,
        borderRadius: 32,
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      } as const);

const s = StyleSheet.create({
  container:     { flex: 1 },
  flexOne:       { flex: 1 },
  fab:           fabStyle,

  header:        { paddingTop: 8, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, position: 'relative' },
  headerContent:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden', zIndex: 10 },
  iconBtn:       { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden', zIndex: 10 },
  headerTitle:   { fontFamily: 'Poppins_700Bold', fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  headerSub:     { fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 18, opacity: 0.7 },

  shell:         { flex: 1 },
  // Slightly wider desktop shell (~1cm) to improve readability.
  shellDesktop:  { maxWidth: 1240, width: '100%', alignSelf: 'center' as const },
  filterScrollContent: {
    paddingVertical: 14,
    minHeight: 60,
    alignItems: 'center',
    gap: 8,
  },
  filterWrapDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    minHeight: 44,
  },

  // Filter block — two rows
  filterBlock:   { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 8, paddingBottom: 4, gap: 6 },
  filterRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterRowDate: { paddingBottom: 4 },
  clearBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  clearBtnText:  { ...TextStyles.captionSemibold, lineHeight: 17 },

  list:          { paddingTop: 20, gap: 20 },
  listFooter:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center' },
  listFooterText:{ ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 20 },
  endLine:       { flex: 1, height: 1, opacity: 0.5 },

  emptyState:    { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40, gap: 14 },
  emptyIcon:     { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  emptyTitle:    { ...TextStyles.title3, lineHeight: 24 },
  emptyDesc:     { ...TextStyles.callout, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  resetBtnText:  { ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 19 },
});
