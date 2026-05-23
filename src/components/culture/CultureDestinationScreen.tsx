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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { TextStyles } from '@/design-system/tokens/typography';
import { CultureTokens, FontFamily, gradients } from '@/design-system/tokens/theme';
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
  CITY_HERO_FG,
  CITY_HERO_FG_MUTED,
} from '@/components/city/CityDestinationStyles';
import {
  FilterRail,
  type FilterChipItem,
  type FilterRailMode,
} from '@/components/browse/FilterRail';

type FilterMode = 'category' | 'culture' | 'language';

const CATEGORY_FILTERS = ['Music', 'Food', 'Arts', 'Nightlife', 'Indigenous', 'Sports', 'Workshop'];

type ExploreCategoryKey =
  | 'artists'
  | 'events'
  | 'movies'
  | 'dining'
  | 'activities'
  | 'shopping'
  | 'offers'
  | 'directory'
  | 'indigenous';

const EXPLORE_CATEGORY_LINKS: readonly {
  key: ExploreCategoryKey;
  label: 'Artists' | 'Events' | 'Movies' | 'Dining' | 'Activities' | 'Shopping' | 'Offers' | 'Directory' | 'Indigenous';
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'artists', label: 'Artists', icon: 'color-palette-outline' },
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'movies', label: 'Movies', icon: 'film-outline' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline' },
  { key: 'activities', label: 'Activities', icon: 'compass-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { key: 'offers', label: 'Offers', icon: 'pricetag-outline' },
  { key: 'directory', label: 'Directory', icon: 'grid-outline' },
  { key: 'indigenous', label: 'Indigenous', icon: 'leaf-outline' },
];

type ListingTypeKey =
  | 'event'
  | 'festival'
  | 'concert'
  | 'workshop'
  | 'movie'
  | 'dining'
  | 'shopping'
  | 'activity'
  | 'professional'
  | 'organisation'
  | 'business'
  | 'artist'
  | 'perk';

const LISTING_TYPE_ROWS: readonly {
  key: ListingTypeKey;
  title: string;
  description: string;
}[] = [
  { key: 'event', title: 'Event', description: 'Timed happenings & community gatherings' },
  { key: 'festival', title: 'Festival', description: 'Multi-day festivals & celebrations' },
  { key: 'concert', title: 'Concert / show', description: 'Live music, theatre & performances' },
  { key: 'workshop', title: 'Workshop / class', description: 'Classes, talks & skill sessions' },
  { key: 'movie', title: 'Movie', description: 'Cinema listings & screenings' },
  { key: 'dining', title: 'Dining', description: 'Restaurant & café listings' },
  { key: 'shopping', title: 'Shopping', description: 'Retail & boutique listings' },
  { key: 'activity', title: 'Activity', description: 'Tours, experiences & cultural sites' },
  { key: 'professional', title: 'Professional', description: 'Practice & professional profile page' },
  { key: 'organisation', title: 'Organisation', description: 'Cultural groups & communities' },
  { key: 'business', title: 'Business', description: 'General business profile' },
  { key: 'artist', title: 'Artist', description: 'Musicians, dancers & creatives' },
  { key: 'perk', title: 'Perk', description: 'Discounts & member benefits' },
];

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
  const { isDesktop, contentWidth, width } = useLayout();
  const insets = useSafeAreaInsets();
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

  const gridGap = 16;
  const gridWidth = isDesktop ? contentWidth : width - 40;
  const cardWidth = Math.floor((gridWidth - gridGap) / 2) - 1;

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
      const hubQuery = encodeURIComponent(def.heroTitle);
      const routes: Record<ListingTypeKey, string> = {
        event: `/events`,
        festival: `/search?q=${encodeURIComponent(`${def.heroTitle} festival`)}`,
        concert: `/search?q=${encodeURIComponent(`${def.heroTitle} concert`)}`,
        workshop: `/search?q=${encodeURIComponent(`${def.heroTitle} workshop`)}`,
        movie: `/movies`,
        dining: `/restaurants`,
        shopping: `/shopping`,
        activity: `/a`,
        professional: `/search?q=${encodeURIComponent(`${def.heroTitle} professional`)}`,
        organisation: `/search?q=${encodeURIComponent(`${def.heroTitle} organisation`)}`,
        business: `/directory`,
        artist: `/search?q=${encodeURIComponent(`${def.heroTitle} artist`)}`,
        perk: `/perks`,
      };
      const route = routes[listingType];
      if (route.includes('?q=')) {
        router.push(route as never);
        return;
      }
      const suffix = route.includes('?') ? '&' : '?';
      router.push(`${route}${suffix}q=${hubQuery}` as never);
    },
    [def.heroTitle, haptic],
  );

  const eventResults = useMemo(() => {
    const includesAny = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n));
    return events.filter((e) => {
      const blob = `${e.category ?? ''} ${(e.tags ?? []).join(' ')} ${(e.cultureTag ?? []).join(' ')} ${(e.cultureTags ?? []).join(' ')}`.toLowerCase();
      switch (activeExploreCategory) {
        case 'events':
          return true;
        case 'movies':
          return includesAny(blob, ['movie', 'film', 'cinema', 'screening']);
        case 'activities':
          return includesAny(blob, ['activity', 'tour', 'experience', 'workshop', 'class']);
        case 'offers':
          return includesAny(blob, ['offer', 'deal', 'discount', 'free', 'perk']);
        case 'indigenous':
          return includesAny(blob, ['indigenous', 'aboriginal', 'first nations', 'torres strait']);
        case 'artists':
          return includesAny(blob, ['artist', 'music', 'dance', 'creative', 'performance', 'concert']);
        default:
          return true;
      }
    });
  }, [activeExploreCategory, events]);

  const venueResults = useMemo(() => {
    const includesAny = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n));
    return venues.filter((v) => {
      const blob = `${v.category ?? ''} ${v.name ?? ''}`.toLowerCase();
      switch (activeExploreCategory) {
        case 'directory':
          return true;
        case 'dining':
          return includesAny(blob, ['dining', 'restaurant', 'cafe', 'café', 'food']);
        case 'shopping':
          return includesAny(blob, ['shop', 'shopping', 'retail', 'store', 'boutique']);
        case 'artists':
          return includesAny(blob, ['artist', 'music', 'creative', 'studio']);
        default:
          return true;
      }
    });
  }, [activeExploreCategory, venues]);

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
          <View style={styles.hero}>
            <Image
              source={{ uri: def.heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={600}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.14)', 'rgba(0,0,0,0.94)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroTopBar, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 16 }]}>
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

            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{def.heroBadge}</Text>
              </View>
              <Text style={styles.heroCity}>{def.heroTitle}</Text>
              <View style={styles.stateRow}>
                <Ionicons name="map-outline" size={13} color={CITY_HERO_FG} style={{ opacity: 0.85 }} />
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
                {(
                  [
                    { n: regionFilteredEvents.length, label: 'events', tint: CultureTokens.teal },
                    { n: venues.length ? venues.length : '—', label: 'places', tint: CultureTokens.coral },
                    { n: uniqueCultureTags.length, label: 'cultures', tint: '#E8E6FF' },
                    { n: uniqueLanguageTags.length, label: 'languages', tint: CultureTokens.indigo },
                  ] as const
                ).map((seg, i, arr) => (
                  <React.Fragment key={seg.label}>
                    <Text>
                      <Text style={[localStyles.heroMetricNum, { color: seg.tint }]}>{seg.n}</Text>
                      <Text style={{ color: CITY_HERO_FG_MUTED, fontFamily: FontFamily.medium, fontSize: 12 }}>
                        {' '}
                        {seg.label}
                      </Text>
                    </Text>
                    {i < arr.length - 1 ? (
                      <Text style={localStyles.heroMetricSep}>·</Text>
                    ) : null}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>

          <View
            style={[
              styles.filterBar,
              localStyles.stickyControls,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[localStyles.exploreRow, { paddingHorizontal: 12, paddingVertical: 8 }]}
            >
              {EXPLORE_CATEGORY_LINKS.map((item) => {
                const active = activeExploreCategory === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      haptic();
                      setActiveExploreCategory(item.key);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${item.label}`}
                    accessibilityState={{ selected: active }}
                  >
                    {active ? (
                      <LinearGradient
                        colors={gradients.culturepassBrand}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={localStyles.exploreChipGradient}
                      >
                        <Ionicons name={item.icon} size={13} color="#fff" />
                        <Text style={localStyles.exploreChipOnGradient}>{item.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          localStyles.exploreChipIdle,
                          {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <Ionicons name={item.icon} size={13} color={colors.textSecondary} />
                        <Text style={[localStyles.exploreChipIdleText, { color: colors.textSecondary }]}>
                          {item.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <FilterRail
              modes={railModes}
              groups={[{ items: railChips }]}
              activeCount={activeFilters.length}
              onClearAll={onClearMode}
            />
          </View>

          {regionFilteredEvents.length > 5 && totalActiveFilters === 0 && (
            <View style={styles.section}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>
                Highlights · {hubScope === 'diaspora' ? `${focusCountry} first` : focusCountry}
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
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
                ? { flexDirection: 'row', gap: gridGap * 2, paddingHorizontal: 20 }
                : undefined
            }
          >
            <View style={{ flex: isDesktop ? 2.8 : 1 }}>
              <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[TextStyles.title3, { color: colors.text }]}>{sectionTitle}</Text>
                    <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                      {eventResults.length} event result{eventResults.length === 1 ? '' : 's'} · {venueResults.length} places
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
                      <View key={i} style={[styles.skeletonCard, { width: cardWidth, height: 240 }]} />
                    ))}
                  </View>
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
                      const w = isDesktop ? (gridWidth * 0.72 - gridGap) / 2 : cardWidth;
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
              {venueResults.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0, paddingTop: 0 }]}>
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

              <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
                  <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 4 }]}>
                    Browse by type
                  </Text>
                  <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 12 }]}>
                    Explore listings across different categories.
                  </Text>
                  <View style={{ gap: 8 }}>
                    {LISTING_TYPE_ROWS.map((row) => (
                      <Pressable
                        key={row.key}
                        onPress={() => openListingTypeResults(row.key)}
                        style={({ pressed }) => [
                          {
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 9,
                            backgroundColor: colors.backgroundSecondary,
                            opacity: pressed ? 0.9 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${row.title} results`}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={[TextStyles.callout, { color: colors.text, fontFamily: 'Poppins_600SemiBold' }]}>
                            {row.title}
                          </Text>
                          <View
                            style={{
                              borderRadius: 999,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              backgroundColor: CultureTokens.indigo + '18',
                            }}
                          >
                            <Text style={[TextStyles.caption, { color: CultureTokens.indigo, fontFamily: 'Poppins_600SemiBold' }]}>
                              {listingResultCounts[row.key]} results
                            </Text>
                          </View>
                        </View>
                        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                          {row.description}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

              {uniqueCultureTags.length > 0 && (
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
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
                <View style={[styles.section, isDesktop && { paddingHorizontal: 0 }]}>
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

          <View style={{ height: 120 }} />
        </ScrollView>

        {!isDesktop && (
          <Pressable style={styles.fab} onPress={goToMap} accessibilityLabel="Open map" accessibilityRole="button">
            <Ionicons name="map" size={22} color={colors.textOnBrandGradient} />
            <Text style={[styles.fabText, { color: colors.textOnBrandGradient }]}>Map</Text>
          </Pressable>
        )}

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
  stickyControls: {
    overflow: 'hidden',
    zIndex: 5,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    paddingHorizontal: 8,
    maxWidth: '96%',
  },
  heroMetricNum: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    ...Platform.select({
      web: { textShadow: '0 1px 3px rgba(0,0,0,0.75)' } as object,
      default: {},
    }),
  },
  heroMetricSep: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginHorizontal: 2,
    fontFamily: FontFamily.medium,
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
  },
  exploreChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  exploreChipOnGradient: {
    ...TextStyles.captionSemibold,
    color: '#fff',
    fontSize: 12,
  },
  exploreChipIdle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exploreChipIdleText: {
    ...TextStyles.captionSemibold,
    fontSize: 12,
  },
  topScopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  topScopeM3Chip: {
    marginRight: 6,
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
