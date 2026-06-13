import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens, FontFamily, gradients } from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import EventCard from '@/components/Discover/EventCard';
import { GLOBAL_REGIONS, getStateForCity } from '@/constants/locations';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { CultureDestinationDefinition } from '@/constants/cultureDestinations';
import { useCultureDestinationData } from '@/hooks/useCultureDestinationData';
import { useLocations } from '@/hooks/useLocations';
import type { CultureHubScope } from '@/lib/cultureDestinationScope';
import { eventMatchesViewerRegion } from '@/lib/cultureDestinationScope';
import { getMarketingWebOrigin } from '@/lib/domainHost';
import {
  buildCultureHubShareUrl,
  cultureHubHasUrlOverrides,
  cultureHubRouteKey,
  parseCultureHubUrlApply,
} from '@/lib/cultureHubDeepLink';
import { goBackOrReplace } from '@/lib/navigation';
import { CultureHubLocationModal } from '@/components/culture/CultureHubLocationModal';
import { APP_NAME } from '@/lib/app-meta';
import { M3FilterChip } from '@/design-system/ui';
import {
  cityAmbient,
  getCityDestinationStyles,
  StatPill,
} from '@/components/city/CityDestinationStyles';
import { DestinationBrowseByType } from '@/components/city/DestinationBrowseByType';
import { DestinationExploreChips } from '@/components/city/DestinationExploreChips';
import { DestinationMapFab } from '@/components/city/DestinationMapFab';
import { DestinationStickyBar } from '@/components/city/DestinationStickyBar';
import {
  buildDestinationListingHref,
  destinationFabBottom,
  destinationHeroHeight,
  destinationHubScrollBottom,
  DESTINATION_HERO_GRADIENT,
  filterEventsByExploreCategory,
  filterVenuesByExploreCategory,
  isVenuePrimaryExploreCategory,
} from '@/components/city/destinationLayout';
import {
  type ExploreCategoryKey,
  type ListingTypeKey,
} from '@/hooks/useCityPage';
import {
  FilterRail,
  type FilterChipItem,
  type FilterRailMode,
} from '@/components/browse/FilterRail';

type FilterMode = 'category' | 'culture' | 'language';

const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

function getRegionLabel(
  stateCode: string | undefined,
  auStates: { code: string; name: string }[],
): string | undefined {
  if (!stateCode) return undefined;
  const au = auStates.find((s) => s.code === stateCode);
  if (au) return au.name;
  return GLOBAL_REGIONS.find((r) => r.value === stateCode)?.label;
}

type Props = {
  definition: CultureDestinationDefinition;
  /** Query string from the route (?country=&scope=&state=) — web deep links & shares. */
  routeSearchParams?: Record<string, string | string[] | undefined>;
};

export function CultureDestinationScreen({ definition: def, routeSearchParams }: Props) {
  const colors = useColors();
  const { isDesktop, contentWidth, width, hPad, isExpanded, safeAreaBottom } = useLayout();
  const insets = useSafeAreaInsetsWeb();
  const heroHeight = destinationHeroHeight({ isExpanded, isDesktop, variant: 'hub' });
  const fabBottom = destinationFabBottom(0, safeAreaBottom);
  const scrollRef = useRef<ScrollView>(null);
  const { state: onboarding, isLoading: onboardingLoading } = useOnboarding();
  const { states: auStates } = useLocations();
  const onboardingSeeded = useRef(false);

  const [focusCountry, setFocusCountry] = useState('Australia');
  const [focusStateCode, setFocusStateCode] = useState<string | undefined>(undefined);
  const [hubScope, setHubScope] = useState<CultureHubScope>('singleCountry');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const hubRouteKey = useMemo(() => cultureHubRouteKey(routeSearchParams), [routeSearchParams]);

  useEffect(() => {
    if (onboardingLoading) return;

    if (cultureHubHasUrlOverrides(routeSearchParams)) {
      const url = parseCultureHubUrlApply(routeSearchParams);
      if (url.country) {
        setFocusCountry(url.country);
        if (!url.applyState) setFocusStateCode(undefined);
      } else {
        const c = onboarding.country?.trim();
        if (c) setFocusCountry(c);
      }
      if (url.scope) setHubScope(url.scope);
      if (url.applyState) setFocusStateCode(url.stateCode);
      onboardingSeeded.current = true;
      return;
    }

    if (!onboardingSeeded.current) {
      onboardingSeeded.current = true;
      const c = onboarding.country?.trim();
      if (c) setFocusCountry(c);
      const city = onboarding.city?.trim();
      if (city) {
        const st = getStateForCity(city);
        const row = st ? GLOBAL_REGIONS.find((r) => r.value === st) : undefined;
        const oc = c || 'Australia';
        if (row?.country === oc) setFocusStateCode(st);
      }
    }
  }, [onboardingLoading, hubRouteKey, onboarding.country, onboarding.city, routeSearchParams]);

  const focusStateLabel = useMemo(
    () => getRegionLabel(focusStateCode, auStates),
    [focusStateCode, auStates],
  );

  const cityMeta = useMemo(
    () => ({
      tagline: def.tagline,
      emoji: '🌴',
      cultureCommunities: def.cultureCommunities,
      languages: def.languages,
    }),
    [def],
  );

  const [filterMode, setFilterMode] = useState<FilterMode>('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [activeExploreCategory, setActiveExploreCategory] = useState<ExploreCategoryKey>('events');
  const [refreshing, setRefreshing] = useState(false);

  const { allEvents, venues, isLoading, refetch } = useCultureDestinationData(def, {
    focusCountry,
    focusStateCode,
    scope: hubScope,
  });

  const regionFilteredEvents = useMemo(() => {
    if (hubScope !== 'singleCountry' || !focusStateCode) return allEvents;
    return allEvents.filter((e) => eventMatchesViewerRegion(e, focusStateCode));
  }, [allEvents, hubScope, focusStateCode]);

  const uniqueCultureTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    regionFilteredEvents.forEach((e) => {
      (e.cultureTag ?? e.cultureTags ?? []).forEach((t: string) => set.add(t));
    });
    cityMeta.cultureCommunities.forEach((c) => set.add(c));
    return Array.from(set).slice(0, 20);
  }, [regionFilteredEvents, cityMeta.cultureCommunities]);

  const uniqueLanguageTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    regionFilteredEvents.forEach((e) => {
      (e.languageTags ?? []).forEach((t: string) => set.add(t));
    });
    cityMeta.languages.forEach((l) => set.add(l));
    return Array.from(set).slice(0, 16);
  }, [regionFilteredEvents, cityMeta.languages]);

  const events = useMemo(() => {
    let list = regionFilteredEvents;
    if (selectedCategories.length > 0) {
      const lower = selectedCategories.map((c) => c.toLowerCase());
      list = list.filter((e) => lower.includes((e.category ?? '').toLowerCase()));
    }
    if (selectedCultures.length > 0) {
      list = list.filter((e) => {
        const tags: string[] = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
        return selectedCultures.some((sel) =>
          tags.some((t) => t.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }
    if (selectedLanguages.length > 0) {
      list = list.filter((e) => {
        const langs: string[] = e.languageTags ?? [];
        return selectedLanguages.some((sel) =>
          langs.some((l) => l.toLowerCase().includes(sel.toLowerCase())),
        );
      });
    }
    return list;
  }, [regionFilteredEvents, selectedCategories, selectedCultures, selectedLanguages]);

  const listingResultCounts = useMemo(() => {
    const countByEvent = (matcher: (text: string) => boolean): number =>
      events.filter((e) => {
        const haystack = `${e.category ?? ''} ${(e.tags ?? []).join(' ')} ${(e.cultureTag ?? []).join(' ')}`.toLowerCase();
        return matcher(haystack);
      }).length;
    const countByVenue = (matcher: (text: string) => boolean): number =>
      venues.filter((v) => matcher(`${v.category ?? ''} ${v.name ?? ''}`.toLowerCase())).length;

    return {
      event: events.length,
      festival: countByEvent((t) => /festival|celebration|carnival|mela/.test(t)),
      concert: countByEvent((t) => /concert|music|show|theatre|theater|performance|live/.test(t)),
      workshop: countByEvent((t) => /workshop|class|talk|masterclass|session/.test(t)),
      movie: countByEvent((t) => /movie|film|cinema|screening/.test(t)),
      dining: countByVenue((t) => /dining|restaurant|cafe|café|food/.test(t)),
      shopping: countByVenue((t) => /shop|shopping|retail|store|boutique/.test(t)),
      activity: countByEvent((t) => /activity|tour|experience|sport|outdoor/.test(t)),
      professional: countByVenue((t) => /professional|practice|consult|service/.test(t)),
      organisation: countByVenue((t) => /organisation|organization|community|group|association/.test(t)),
      business: venues.length,
      artist: countByEvent((t) => /artist|music|dance|creative|performer/.test(t)),
      perk: 0,
    } satisfies Record<ListingTypeKey, number>;
  }, [events, venues]);

  const haptic = useCallback(() => {
    // Disabled for this page to avoid repeated vibration on filter/menu taps.
  }, []);

  const shareUrl = useMemo(
    () =>
      buildCultureHubShareUrl(getMarketingWebOrigin(), def.publicPath, {
        country: focusCountry,
        scope: hubScope,
        stateCode: focusStateCode,
      }),
    [def.publicPath, focusCountry, hubScope, focusStateCode],
  );

  const handleShare = useCallback(async () => {
    haptic();
    const message = `${def.heroTitle} on ${APP_NAME} — ${def.tagline}\n${shareUrl}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: `${def.heroTitle} · ${APP_NAME}`, text: message, url: shareUrl });
      } else {
        await Share.share({ title: `${def.heroTitle} · ${APP_NAME}`, message, url: shareUrl });
      }
    } catch {
      /* user cancelled */
    }
  }, [haptic, def.heroTitle, def.tagline, shareUrl]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const clearAllFilters = useCallback(() => {
    haptic();
    setSelectedCategories([]);
    setSelectedCultures([]);
    setSelectedLanguages([]);
  }, [haptic]);

  const totalActiveFilters = selectedCategories.length + selectedCultures.length + selectedLanguages.length;

  const gridGap = isDesktop ? 24 : 16;
  const gridWidth = isDesktop ? contentWidth : width - hPad * 2;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2);

  const goToMap = useCallback(() => {
    haptic();
    router.push('/map');
  }, [haptic]);

  const styles = getCityDestinationStyles(colors, insets, isDesktop, gridGap);

  const activeFilters =
    filterMode === 'category'
      ? selectedCategories
      : filterMode === 'culture'
        ? selectedCultures
        : selectedLanguages;

  const filterOptions =
    filterMode === 'category'
      ? CATEGORY_FILTERS
      : filterMode === 'culture'
        ? uniqueCultureTags
        : uniqueLanguageTags;

  const onToggleFilter = useCallback(
    (f: string) => {
      haptic();
      const setter =
        filterMode === 'category'
          ? setSelectedCategories
          : filterMode === 'culture'
            ? setSelectedCultures
            : setSelectedLanguages;
      setter((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
    },
    [filterMode, haptic],
  );

  const onClearMode = useCallback(() => {
    haptic();
    if (filterMode === 'category') setSelectedCategories([]);
    else if (filterMode === 'culture') setSelectedCultures([]);
    else setSelectedLanguages([]);
  }, [filterMode, haptic]);

  const railModes: FilterRailMode[] = useMemo(
    () => [
      {
        id: 'category',
        icon: 'apps-outline',
        accessibilityLabel: 'Filter by category',
        active: filterMode === 'category',
        onPress: () => setFilterMode('category'),
      },
      {
        id: 'culture',
        icon: 'globe-outline',
        accessibilityLabel: 'Filter by culture',
        active: filterMode === 'culture',
        onPress: () => setFilterMode('culture'),
      },
      {
        id: 'language',
        icon: 'chatbubble-outline',
        accessibilityLabel: 'Filter by language',
        active: filterMode === 'language',
        onPress: () => setFilterMode('language'),
      },
    ],
    [filterMode],
  );

  const railChips: FilterChipItem[] = useMemo(
    () =>
      filterOptions.map((opt) => ({
        id: opt,
        label: opt,
        active: activeFilters.includes(opt),
        onPress: () => onToggleFilter(opt),
      })),
    [filterOptions, activeFilters, onToggleFilter],
  );

  const openListingTypeResults = useCallback(
    (listingType: ListingTypeKey) => {
      haptic();
      router.push(buildDestinationListingHref(listingType, def.heroTitle) as never);
    },
    [def.heroTitle, haptic],
  );

  const eventResults = useMemo(
    () => filterEventsByExploreCategory(events, activeExploreCategory),
    [activeExploreCategory, events],
  );

  const venueResults = useMemo(
    () => filterVenuesByExploreCategory(venues, activeExploreCategory),
    [activeExploreCategory, venues],
  );

  const showVenueResults = isVenuePrimaryExploreCategory(activeExploreCategory);

  const sectionTitle = useMemo(() => {
    const parts: string[] = [];
    if (selectedCategories.length) parts.push(selectedCategories.join(', '));
    if (selectedCultures.length) parts.push(selectedCultures.join(', '));
    if (selectedLanguages.length) parts.push(selectedLanguages.join(', '));
    return parts.length ? `${parts.join(' · ')} Events` : `${def.heroTitle} highlights`;
  }, [selectedCategories, selectedCultures, selectedLanguages, def.heroTitle]);

  const webTitle = `${def.heroTitle} · ${APP_NAME}`;

  return (
    <ErrorBoundary>
      {Platform.OS === 'web' && (
        <Head>
          <title>{webTitle}</title>
          <meta name="description" content={def.metaDescription} />
        </Head>
      )}
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={gradients.culturepassBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={cityAmbient.mesh}
          pointerEvents="none"
        />
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: destinationHubScrollBottom(safeAreaBottom) },
            isDesktop && { width: contentWidth, alignSelf: 'center' },
          ]}
          stickyHeaderIndices={[1]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image
              source={{ uri: def.heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={600}
            />
            <LinearGradient
              colors={DESTINATION_HERO_GRADIENT}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroTopBar, {
              paddingTop: insets.top + 12,
              left: hPad,
              right: hPad,
            }]}>
              <View style={[localStyles.topIconButtonShell, { borderColor: CultureTokens.indigo + 'CC' }]}>
                <Pressable
                  onPress={() => {
                    haptic();
                    goBackOrReplace('/(tabs)');
                  }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Go back"
                  accessibilityRole="button"
                >
                  <Ionicons name="chevron-back" size={24} color={CultureTokens.indigo} />
                </Pressable>
              </View>

              <View style={localStyles.topScopeSurface}>
                <View style={localStyles.topScopeRow}>
                  <M3FilterChip
                    label={focusCountry}
                    compact
                    selected={hubScope === 'singleCountry'}
                    onPress={() => {
                      haptic();
                      setHubScope('singleCountry');
                    }}
                    style={[
                      localStyles.topScopeM3Chip,
                      hubScope === 'singleCountry' ? localStyles.topScopeM3ChipActive : null,
                    ]}
                  />
                  <M3FilterChip
                    label="Global"
                    compact
                    selected={hubScope === 'diaspora'}
                    onPress={() => {
                      haptic();
                      setHubScope('diaspora');
                    }}
                    style={[
                      localStyles.topScopeM3Chip,
                      hubScope === 'diaspora' ? localStyles.topScopeM3ChipActive : null,
                    ]}
                  />
                  <M3FilterChip
                    label="Change"
                    compact
                    icon="location-outline"
                    onPress={() => {
                      haptic();
                      setLocationModalOpen(true);
                    }}
                    style={localStyles.topScopeM3Chip}
                  />
                </View>
              </View>

              <View style={[localStyles.topIconButtonShell, { borderColor: CultureTokens.coral + 'CC' }]}>
                <Pressable
                  onPress={() => {
                    void handleShare();
                  }}
                  style={styles.heroIconHit}
                  accessibilityLabel="Share this hub"
                  accessibilityRole="button"
                >
                  <Ionicons name="share-social-outline" size={22} color={CultureTokens.coral} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroContent, { paddingHorizontal: hPad }]}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{def.heroBadge}</Text>
              </View>
              <Text style={[styles.heroCity, { fontSize: isDesktop ? 64 : 52, lineHeight: isDesktop ? 72 : 58 }]}>
                {def.heroTitle}
              </Text>
              <View style={styles.stateRow}>
                <Ionicons name="location-sharp" size={14} color={CultureTokens.coral} style={{ opacity: 0.95 }} />
                <Text style={styles.stateText}>
                  {hubScope === 'diaspora'
                    ? `Diaspora hub · ${focusCountry} ranked first`
                    : focusStateLabel
                      ? `${focusStateLabel}, ${focusCountry}`
                      : `All of ${focusCountry}`}
                </Text>
              </View>
              <Text style={styles.heroSubtitle}>{cityMeta.tagline}</Text>
              <View style={localStyles.heroMetrics}>
                <StatPill
                  icon="calendar"
                  value={regionFilteredEvents.length}
                  label="events"
                  color={CultureTokens.teal}
                  compact
                />
                <StatPill
                  icon="business"
                  value={venues.length || '—'}
                  label="places"
                  color={CultureTokens.coral}
                  compact
                />
                <StatPill
                  icon="globe-outline"
                  value={uniqueCultureTags.length}
                  label="cultures"
                  color={CultureTokens.indigo}
                  compact
                />
              </View>
            </View>
          </View>

          <DestinationStickyBar tone="legacy">
            <DestinationExploreChips
              active={activeExploreCategory}
              onSelect={(key) => {
                haptic();
                setActiveExploreCategory(key);
              }}
              hPad={hPad}
              variant="gradient"
            />
            <FilterRail
              modes={railModes}
              groups={[{ items: railChips }]}
              activeCount={activeFilters.length}
              onClearAll={onClearMode}
            />
          </DestinationStickyBar>

          {regionFilteredEvents.length > 5 && totalActiveFilters === 0 && (
            <View style={[styles.section, { paddingHorizontal: 0 }]}>
              <Text
                style={[
                  TextStyles.title3,
                  { color: colors.text, marginBottom: 12, paddingHorizontal: hPad },
                ]}
              >
                Highlights · {hubScope === 'diaspora' ? `${focusCountry} first` : focusCountry}
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: hPad }}
              >
                {regionFilteredEvents.slice(0, 6).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => router.push(`/event/${e.id}`)}
                    style={styles.trendingCard}
                  >
                    <Image
                      source={{ uri: e.heroImageUrl || e.imageUrl }}
                      style={styles.trendingImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.96)']}
                      locations={[0, 0.48, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.trendingInfo}>
                      {e.category && (
                        <View style={styles.trendingCategoryPill}>
                          <Text style={styles.trendingCategoryText}>{e.category}</Text>
                        </View>
                      )}
                      <Text style={styles.trendingTitle} numberOfLines={2}>
                        {e.title}
                      </Text>
                      {e.date && (
                        <Text style={styles.trendingDate} numberOfLines={1}>
                          {new Date(e.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

        <View
          style={
            isDesktop
              ? { flexDirection: 'row', gap: gridGap * 2, paddingHorizontal: hPad }
              : undefined
          }
        >
            <View style={{ flex: isDesktop ? 2.8 : 1 }}>
              <View style={[styles.section, { paddingHorizontal: isDesktop ? 0 : hPad }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[TextStyles.title3, { color: colors.text }]}>
                      {showVenueResults ? 'Places & partners' : sectionTitle}
                    </Text>
                    <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                      {showVenueResults
                        ? `${venueResults.length} place${venueResults.length === 1 ? '' : 's'}`
                        : `${eventResults.length} event result${eventResults.length === 1 ? '' : 's'} · ${venueResults.length} places`}
                    </Text>
                  </View>
                  {totalActiveFilters > 0 && (
                    <Pressable onPress={clearAllFilters} style={styles.clearBtn}>
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </Pressable>
                  )}
                </View>

                {isLoading ? (
                  <View style={styles.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View key={i} style={[styles.skeletonCard, { width: cardWidth, height: showVenueResults ? 72 : 240 }]} />
                    ))}
                  </View>
                ) : showVenueResults ? (
                  venueResults.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
                      <Text style={styles.emptyTitle}>No places match yet</Text>
                      <Text style={styles.emptySubtitle}>
                        Try another category or browse the directory for this community.
                      </Text>
                      <Pressable style={styles.retryButton} onPress={() => router.push('/directory')}>
                        <Text style={styles.retryText}>Browse directory</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {venueResults.map((v) => (
                        <Pressable
                          key={v.id}
                          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: v.id } })}
                          style={[styles.venueCard, isDesktop && { width: '100%' }]}
                          accessibilityLabel={`View ${v.name} profile`}
                          accessibilityRole="link"
                        >
                          <View style={styles.venueIcon}>
                            <Ionicons name="business" size={22} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.venueName} numberOfLines={1}>
                              {v.name}
                            </Text>
                            <Text style={styles.venueCategory}>{v.category || 'Culture host'}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                        </Pressable>
                      ))}
                    </View>
                  )
                ) : eventResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No events match yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {hubScope === 'singleCountry'
                        ? `No matches in ${focusStateLabel ? `${focusStateLabel}, ` : ''}${focusCountry}. Try Worldwide hub or adjust filters.`
                        : 'Try filters or check back — we scan many countries for this community.'}
                    </Text>
                    <Pressable style={styles.retryButton} onPress={clearAllFilters}>
                      <Text style={styles.retryText}>Clear filters</Text>
                    </Pressable>
                    {hubScope === 'singleCountry' && (
                      <Pressable
                        style={[styles.retryButton, { marginTop: 8, backgroundColor: colors.backgroundSecondary }]}
                        onPress={() => {
                          haptic();
                          setHubScope('diaspora');
                        }}
                      >
                        <Text style={[styles.retryText, { color: colors.text }]}>Open worldwide hub</Text>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={[styles.grid, { gap: gridGap }]}>
                    {eventResults.map((event) => {
                      const firstColWidth = (gridWidth - gridGap * 2) * (2.8 / 3.8);
                      const w = isDesktop ? (firstColWidth - gridGap) / 2 : cardWidth;
                      return (
                        <View key={event.id} style={{ width: w, marginBottom: gridGap }}>
                          <EventCard event={event} containerWidth={w} containerHeight={260} />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            <View style={{ flex: 1, paddingTop: isDesktop ? 28 : 0 }}>
              {def.slug === 'tamil' && (
                <View
                  style={[
                    styles.section,
                    {
                      backgroundColor: CultureTokens.gold + '0A',
                      borderRadius: Radius.lg,
                      marginHorizontal: isDesktop ? 0 : hPad,
                      padding: 20,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: CultureTokens.gold + '33',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: CultureTokens.gold + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="sparkles" size={18} color={CultureTokens.gold} />
                    </View>
                    <Text style={[TextStyles.title3, { color: colors.text, fontFamily: FontFamily.bold }]}>
                      Tamil Heritage Spotlight
                    </Text>
                  </View>
                  <Text style={[TextStyles.callout, { color: colors.textSecondary, lineHeight: 22 }]}>
                    Connecting the global Tamil diaspora through language, arts, and community. From
                    Pongal celebrations to contemporary film screenings, explore the heartbeat of Tamil
                    culture wherever you are.
                  </Text>
                </View>
              )}

              {venueResults.length > 0 && (
                <View style={[styles.section, { paddingHorizontal: isDesktop ? 0 : hPad, paddingTop: isDesktop ? 0 : 28 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 16 }]}>
                    Places & partners
                  </Text>
                  <View style={isDesktop ? { gap: 12 } : styles.venueGrid}>
                    {venueResults.map((v) => (
                      <Pressable
                        key={v.id}
                        onPress={() => router.push({ pathname: '/profile/[id]', params: { id: v.id } })}
                        style={[styles.venueCard, isDesktop && { width: '100%' }]}
                        accessibilityLabel={`View ${v.name} profile`}
                        accessibilityRole="link"
                      >
                        <View style={styles.venueIcon}>
                          <Ionicons name="business" size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.venueName} numberOfLines={1}>
                            {v.name}
                          </Text>
                          <Text style={styles.venueCategory}>{v.category || 'Culture host'}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </Pressable>
                    ))}
                  </View>
                  {isDesktop && (
                    <Pressable
                      style={[styles.mapCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                      onPress={goToMap}
                    >
                      <Ionicons name="map-outline" size={22} color={CultureTokens.indigo} />
                      <Text style={[styles.mapCardText, { color: colors.text }]}>Explore map</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <DestinationBrowseByType
                counts={listingResultCounts}
                onSelect={openListingTypeResults}
                hPad={isDesktop ? 0 : hPad}
                contextName={def.heroTitle}
                layout="auto"
                inSidebar
                isDesktop={isDesktop}
                tone="legacy"
              />

              {uniqueCultureTags.length > 0 && (
                <View style={[styles.section, { paddingHorizontal: isDesktop ? 0 : hPad }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Cultural tags
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueCultureTags.map((tag) => {
                      const active = selectedCultures.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => {
                            haptic();
                            setFilterMode('culture');
                            setSelectedCultures((prev) =>
                              prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.indigo : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.indigo : colors.borderLight,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.tagPillText, { color: active ? colors.textOnBrandGradient : colors.text }]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {uniqueLanguageTags.length > 0 && (
                <View style={[styles.section, { paddingHorizontal: isDesktop ? 0 : hPad }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                    Languages
                  </Text>
                  <View style={styles.tagCloud}>
                    {uniqueLanguageTags.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <Pressable
                          key={lang}
                          onPress={() => {
                            haptic();
                            setFilterMode('language');
                            setSelectedLanguages((prev) =>
                              prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang],
                            );
                          }}
                          style={[
                            styles.tagPill,
                            {
                              backgroundColor: active ? CultureTokens.gold + 'EE' : colors.backgroundSecondary,
                              borderColor: active ? CultureTokens.gold : colors.borderLight,
                            },
                          ]}
                        >
                          <Text style={[styles.tagPillText, { color: colors.text }]}>{lang}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>

        </ScrollView>

        {!isDesktop ? (
          <DestinationMapFab bottom={fabBottom} onPress={goToMap} />
        ) : null}

        <CultureHubLocationModal
          visible={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          initialCountry={focusCountry}
          initialStateCode={focusStateCode}
          onApply={(country, state) => {
            setFocusCountry(country);
            setFocusStateCode(state);
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const localStyles = StyleSheet.create({
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    maxWidth: '96%',
  },
  heroMetricNum: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    ...Platform.select({
      web: { textShadow: '0 1px 4px rgba(0,0,0,0.85)' } as object,
      default: {},
    }),
  },
  heroMetricSep: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginHorizontal: 4,
    fontFamily: FontFamily.medium,
  },
  topScopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topScopeM3Chip: {
    borderRadius: 999,
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(20,20,30,0.36)',
  },
  topScopeSurface: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.36)',
    backgroundColor: 'rgba(16,18,26,0.74)',
  },
  topIconButtonShell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(16,18,26,0.78)',
  },
  topScopeM3ChipActive: {
    borderColor: 'rgba(226,219,255,0.94)',
    backgroundColor: 'rgba(176,158,255,0.9)',
    shadowColor: '#6B5BFF',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
