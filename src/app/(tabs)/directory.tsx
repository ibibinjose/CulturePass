import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CultureTokens,
  FontFamily,
  Radius,
  Spacing,
} from '@/design-system/tokens/theme';
import * as Haptics from 'expo-haptics';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { profileKeys, eventKeys, councilKeys } from '@/hooks/queries/keys';
import { communityKeys } from '@/modules/communities/hooks/useCommunities';
import { queryClient } from '@/lib/query-client';
import type { Profile, EventData } from '@/shared/schema';
import { modulesApi,  type CouncilData } from '@/modules/api';
import type { FilterItem } from '@/modules/core/components';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Button, M3FilterChip, M3FAB } from '@/design-system/ui';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { isIndigenousProfile } from '@/lib/indigenous';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { EventCardSkeleton } from '@/modules/events/components/EventCardSkeleton';
import { useLocations } from '@/hooks/useLocations';
import {
  DirectoryCard,
  DirectoryEmptyState,
  FeaturedRail,
  CommunityRail,
  ENTITY_FILTERS,
  getDirectoryListingType,
  isWeb,
  s,
  getTags,
} from '@/components/directory/DirectoryComponents';
import { useIsCreator } from '@/hooks/useCanEdit';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { listingCreateNavigateParams } from '@/constants/navigation/experienceNav';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const DIRECTORY_HEAD_TITLE = `Directory · venues & organisers · ${APP_NAME}`;
const DIRECTORY_HEAD_DESC =
  'Browse cultural profiles, venues, artists, and organisers — filter by community and city.';
const DIRECTORY_HEAD_URL = `${SITE_ORIGIN}/directory`;

// ─── DirectoryScreen ──────────────────────────────────────────────────────────

type DirectoryItem =
  | { _type: 'profile'; data: Profile }
  | { _type: 'event'; data: EventData };

export default function DirectoryScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
  const { width, isDesktop, isTablet, hPad } = useLayout();
  const { state: onboardingState } = useOnboarding();
  const { acknowledgement } = useLocations();
  const reducedMotion = useReducedMotion();
  const isCreator = useIsCreator();


  const showAcknowledgement = ['Australia', 'New Zealand', 'Canada', 'AU', 'NZ', 'CA'].includes(onboardingState.country || 'Australia');

  const isDesktopWeb = isWeb && isDesktop;
  const shellMaxWidth = isDesktopWeb ? 1120 : isTablet ? 840 : width;

  const useWebThreeColumnResults = isWeb && shellMaxWidth >= 1050;
  const useWebTwoColumnResults = isWeb && shellMaxWidth >= 768 && shellMaxWidth < 1050;

  const [selectedType, setSelectedType] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: allProfilesRaw, isLoading } = useQuery<Profile[] | { profiles?: Profile[] }>({
    queryKey: profileKeys.list({ city: onboardingState.city ?? undefined, country: onboardingState.country ?? undefined }),
    queryFn: () => modulesApi.profiles.list({
      city: onboardingState.city ?? undefined,
      country: onboardingState.country ?? undefined,
    }),
  });

  const { data: eventsData } = useQuery({
    queryKey: eventKeys.list({ city: onboardingState.city ?? undefined, country: onboardingState.country ?? undefined, pageSize: 50 }),
    queryFn: () => modulesApi.events.list({ city: onboardingState.city ?? undefined, country: onboardingState.country ?? undefined, pageSize: 50 }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const allEvents = useMemo<EventData[]>(
    () => (eventsData && 'events' in eventsData ? eventsData.events : []),
    [eventsData],
  );

  const allProfiles = useMemo<Profile[]>(
    () => (Array.isArray(allProfilesRaw)
      ? allProfilesRaw
      : (allProfilesRaw?.profiles ?? [])),
    [allProfilesRaw],
  );

  const { data: communitiesData } = useQuery({
    queryKey: communityKeys.list({ city: onboardingState.city ?? undefined, limit: 10 }),
    queryFn: () => modulesApi.communities.list({ city: onboardingState.city ?? undefined }),
  });

  const featuredCommunities = useMemo(() => {
    return (Array.isArray(communitiesData) ? communitiesData : (communitiesData as any)?.communities ?? []).slice(0, 10);
  }, [communitiesData]);

  const { data: councilListData } = useQuery({
    queryKey: councilKeys.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
    queryFn: () => modulesApi.council.list({ pageSize: 2000, sortBy: 'name', sortDir: 'asc' }),
  });

  // Merge council source-of-truth entries into directory profiles.
  const nonCommunityProfiles = useMemo(() => {
    const base = allProfiles.filter(
      p => p.entityType !== 'community' && (p.category ?? '').toLowerCase() !== 'council'
    );
    const councils = (councilListData?.councils ?? []).map((council: CouncilData) => ({
      id: council.id,
      name: council.name,
      description: council.description ?? `${council.suburb}, ${council.state}`,
      entityType: 'organizer',
      category: 'Council',
      city: council.suburb || '',
      country: council.country || 'Australia',
      ownerId: 'system-council',
      isVerified: council.verificationStatus === 'verified',
      followersCount: 0,
      tags: [council.state, 'Council'].filter(Boolean),
      website: council.websiteUrl,
      phone: council.phone,
      address: council.addressLine1,
      culturePassId: council.id.toUpperCase(),
    })) as unknown as Profile[];
    return [...base, ...councils];
  }, [allProfiles, councilListData?.councils]);

  const allItems = useMemo<DirectoryItem[]>(() => {
    const profileItems: DirectoryItem[] = nonCommunityProfiles.map((p) => ({ _type: 'profile', data: p }));
    const eventItems: DirectoryItem[] = allEvents.map((e) => ({ _type: 'event', data: e }));
    return [...eventItems, ...profileItems];
  }, [nonCommunityProfiles, allEvents]);

  const filtered = useMemo<DirectoryItem[]>(() => {
    let results = allItems;

    if (selectedType !== 'All') {
      if (selectedType === 'event') {
        results = results.filter((item) => item._type === 'event');
      } else if (selectedType === 'indigenous') {
        results = results.filter((item) => item._type === 'profile' && isIndigenousProfile(item.data));
      } else {
        results = results.filter((item) => item._type === 'profile' && getDirectoryListingType(item.data) === selectedType);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((item) => {
        if (item._type === 'event') {
          const e = item.data;
          return (
            e.title.toLowerCase().includes(q) ||
            (e.description ?? '').toLowerCase().includes(q) ||
            (e.city ?? '').toLowerCase().includes(q) ||
            (e.category ?? '').toLowerCase().includes(q)
          );
        }
        const p = item.data;
        const tags = getTags(p);
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q) ||
          tags.some(t => t.toLowerCase().includes(q))
        );
      });
    }

    return results;
  }, [selectedType, search, allItems]);

  const featuredProfiles = useMemo(
    () => nonCommunityProfiles.filter(p => p.isVerified).slice(0, 8),
    [nonCommunityProfiles],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allItems.length, event: allEvents.length };
    counts.indigenous = nonCommunityProfiles.filter((p) => isIndigenousProfile(p)).length;
    for (const p of nonCommunityProfiles) {
      const listingType = getDirectoryListingType(p);
      counts[listingType] = (counts[listingType] ?? 0) + 1;
    }
    return counts;
  }, [allItems, allEvents, nonCommunityProfiles]);


  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    setTimeout(() => {
      if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleFilterSelect = useCallback((id: string) => {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(id);
  }, []);

  const filterItems = useMemo<FilterItem[]>(() => {
    return ENTITY_FILTERS.map(filter => ({
      id: filter.label,
      label: filter.display,
      icon: filter.icon,
      color: filter.color,
      count: typeCounts[filter.label],
    }));
  }, [typeCounts]);

  const hasActiveFilters = selectedType !== 'All' || search.trim().length > 0;

  const hasRenderedRef = useRef(false);
  useEffect(() => { if (filtered.length > 0) hasRenderedRef.current = true; }, [filtered.length]);

  const renderItem = useCallback(({ item, index }: { item: DirectoryItem; index: number }) => {
    const entering =
      !hasRenderedRef.current && !reducedMotion && Platform.OS !== 'web'
        ? FadeInDown.delay(Math.min(index * 40, 400)).springify().damping(18)
        : undefined;
    const isMultiColumn = useWebThreeColumnResults || useWebTwoColumnResults;
    return (
      <Animated.View
        entering={entering}
        style={isMultiColumn ? s.resultsCardWrapperWeb : s.resultsCardWrapperMobile}
      >
        {item._type === 'event' ? (
          <M3EventCard event={item.data} variant="elevated" />
        ) : (
          <DirectoryCard profile={item.data} colors={colors} />
        )}
      </Animated.View>
    );
  }, [reducedMotion, useWebThreeColumnResults, useWebTwoColumnResults, colors]);

  const flashListKeyExtractor = useCallback(
    (item: DirectoryItem) => (item._type === 'event' ? `event-${item.data.id}` : `profile-${item.data.id}`),
    [],
  );

  const listContentStyle = useMemo(
    () => [
      s.list,
      {
        paddingHorizontal: (useWebThreeColumnResults || useWebTwoColumnResults) ? Math.max(10, hPad - 10) : hPad,
        paddingBottom: isWeb ? 40 : 100,
      }
    ],
    [hPad, useWebThreeColumnResults, useWebTwoColumnResults],
  );

  const listHeader = useMemo(
    () => (
      <View style={{ gap: 20, paddingBottom: 16 }}>
        {featuredProfiles.length > 0 && <FeaturedRail profiles={featuredProfiles} colors={colors} />}
        {featuredCommunities.length > 0 && selectedType === 'All' && !search && (
            <CommunityRail communities={featuredCommunities} colors={colors} />
        )}
      </View>
    ),
    [featuredProfiles, featuredCommunities, colors, selectedType, search],
  );

  const listEmpty = useMemo(
    () => (
      <DirectoryEmptyState
        selectedType={selectedType}
        city={onboardingState.city}
        hasActiveFilters={hasActiveFilters}
        colors={colors}
        onReset={() => { setSelectedType('All'); setSearch(''); }}
      />
    ),
    [selectedType, onboardingState.city, hasActiveFilters, colors],
  );

  const listFooter = useMemo(
    () => showAcknowledgement && !isLoading && filtered.length > 0 ? (
      <View style={[s.acknowledgementWrap, { borderTopColor: colors.borderLight }]}>
        <Ionicons name="leaf-outline" size={24} color={CultureTokens.gold} />
        <Text style={[s.acknowledgementText, { color: colors.textSecondary }]}>
          {acknowledgement}
        </Text>
      </View>
    ) : null,
    [showAcknowledgement, isLoading, filtered.length, colors, acknowledgement],
  );

  return (
    <ErrorBoundary>
      <Head>
        <title>{DIRECTORY_HEAD_TITLE}</title>
        <meta name="description" content={DIRECTORY_HEAD_DESC} />
        <meta property="og:title" content={DIRECTORY_HEAD_TITLE} />
        <meta property="og:description" content={DIRECTORY_HEAD_DESC} />
        <meta property="og:url" content={DIRECTORY_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={DIRECTORY_HEAD_URL} />
      </Head>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient
          colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FFFBF7', '#F5F5F4']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[`${colors.primary}12`, 'transparent']}
          style={[StyleSheet.absoluteFill, { height: 600 }]}
        />

        {/* ── Header ── */}
        <M3TopAppBar
            title="Directory"
            onBack={() => router.push('/(tabs)')}
            variant={isDesktop ? 'small' : 'medium'}
            denseWeb={isWeb}
            titleLeading={
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
                contentFit="contain"
              />
            }
            actions={[
                { icon: 'map-outline', onPress: () => router.push('/map') },
                { icon: 'refresh', onPress: handleRefresh }
            ]}
        />

        <View style={{ paddingHorizontal: hPad, paddingTop: 16 }}>
            <View style={dirStyles.headerInfoRow}>
              <View style={[dirStyles.locationBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }]}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[dirStyles.locationText, { color: colors.primary }]}>
                  {onboardingState.city || 'Global'} • {onboardingState.country || 'All Regions'}
                </Text>
              </View>
              {allItems.length > 0 && (
                <View style={[dirStyles.countBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                  <Text style={[dirStyles.countText, { color: colors.textTertiary }]}>
                    {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                  </Text>
                </View>
              )}
            </View>
            <View
              style={[
                dirStyles.searchBar,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: searchFocused ? colors.primary : colors.borderLight,
                  borderWidth: 1,
                  height: 54,
                  borderRadius: 27,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: searchFocused ? 0.12 : 0.02,
                  shadowRadius: 10,
                  elevation: searchFocused ? 4 : 1,
                },
              ]}
            >
              <Ionicons name="search" size={24} color={searchFocused ? colors.primary : colors.textTertiary} />
              <TextInput
                style={[dirStyles.searchInput, { color: colors.text, fontSize: 16, marginLeft: 12 }]}
                placeholder="Businesses, venues, artists…"
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                returnKeyType="search"
                accessibilityLabel="Search directory"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={14} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </Pressable>
              ) : null}
            </View>
        </View>

        {/* ── Filter rail ── */}
        <View
          style={[
            dirStyles.filterSurface,
            {
              backgroundColor: m3Colors.surface,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: m3Colors.outlineVariant,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.filterRow, { paddingHorizontal: hPad, gap: 8, paddingRight: hPad + 32 }]}
            accessibilityRole="tablist"
            accessibilityLabel="Entity type filters"
          >
            {filterItems.map(filter => (
              <M3FilterChip
                key={filter.id}
                label={typeof filter.label === 'string' ? filter.label : filter.id}
                selected={selectedType === filter.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleFilterSelect(filter.id); }}
                icon={typeof filter.icon === 'string' ? filter.icon as any : undefined}
              />
            ))}
            {hasActiveFilters && (
              <M3Button
                variant="text"
                onPress={() => { setSelectedType('All'); setSearch(''); }}
              >
                Clear
              </M3Button>
            )}
          </ScrollView>
        </View>

        {/* ── Content ── */}
        {isLoading ? (
          <View style={[s.list, { paddingHorizontal: (useWebThreeColumnResults || useWebTwoColumnResults) ? Math.max(10, hPad - 10) : hPad, paddingBottom: isWeb ? 40 : 100 }]}>
            {useWebThreeColumnResults ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -10 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[s.resultsCardWrapperWeb, { width: '33.33%' }]}>
                    <EventCardSkeleton />
                  </View>
                ))}
              </View>
            ) : useWebTwoColumnResults ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -10 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[s.resultsCardWrapperWeb, { width: '50%' }]}>
                    <EventCardSkeleton />
                  </View>
                ))}
              </View>
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={s.resultsCardWrapperMobile}>
                  <EventCardSkeleton />
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%', maxWidth: shellMaxWidth, alignSelf: 'center' }}>
            <FlashList<DirectoryItem>
              data={filtered}
              keyExtractor={flashListKeyExtractor}
              renderItem={renderItem}
              ListHeaderComponent={listHeader}
              ListEmptyComponent={listEmpty}
              ListFooterComponent={listFooter}
              numColumns={useWebThreeColumnResults ? 3 : useWebTwoColumnResults ? 2 : 1}
              contentContainerStyle={listContentStyle}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
            />
          </View>
        )}

        {isCreator && (
          <M3FAB
            icon="add"
            onPress={() => router.push(listingCreateNavigateParams() as never)}
            style={{ position: 'absolute', right: 24, bottom: 24 }}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const dirStyles = StyleSheet.create({
  headerSurface: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  headerTitle: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    letterSpacing: -1.2,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    opacity: 0.8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    height: '100%',
    padding: 0,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  countText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterSurface: {
    paddingVertical: 12,
    zIndex: 10,
  },
});
