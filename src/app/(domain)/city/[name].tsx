import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { CultureTokens, gradients, FontFamily } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { GlassView } from '@/design-system/ui/GlassView';
import EventCard from '@/components/Discover/EventCard';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/lib/auth';
import { useCityPage, LISTING_TYPE_ROWS, type ListingTypeKey, type ExploreCategoryKey } from '@/hooks/useCityPage';
import {
  cityAmbient,
  StatPill,
  CITY_HERO_FG,
} from '@/components/city/CityDestinationStyles';
import { FilterRail, type FilterRailAction, type FilterChipItem, type FilterRailMode } from '@/components/browse/FilterRail';
import { downloadICS } from '@/lib/ical';
import { useSafeBack } from '@/lib/navigation';
import { useSaved } from '@/contexts/SavedContext';
import type { EventData, Profile } from '@/shared/schema';
import { CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { Footer } from '@/components/Footer';
import { M3Typography, Radius } from '@/design-system/tokens/theme';
import { M3Card } from '@/design-system/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPLORE_CATEGORY_LINKS: readonly {
  key: ExploreCategoryKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'movies', label: 'Movies', icon: 'film-outline' },
  { key: 'dining', label: 'Dining', icon: 'restaurant-outline' },
  { key: 'activities', label: 'Activities', icon: 'compass-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { key: 'offers', label: 'Offers', icon: 'pricetag-outline' },
  { key: 'artists', label: 'Artists', icon: 'color-palette-outline' },
  { key: 'directory', label: 'Directory', icon: 'grid-outline' },
  { key: 'indigenous', label: 'Indigenous', icon: 'leaf-outline' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventsGrid({
  events,
  isLoading,
  width,
  isDesktop,
  desktopCardWidth,
  gridGap,
  onClear,
}: {
  events: EventData[];
  isLoading: boolean;
  width: number;
  isDesktop: boolean;
  desktopCardWidth: number;
  gridGap: number;
  onClear: () => void;
}) {
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={[
        eg.grid,
        !isDesktop && { flexDirection: 'column', flexWrap: 'nowrap', marginHorizontal: -20 },
      ]}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              eg.skeleton,
              { backgroundColor: colors.backgroundSecondary },
              isDesktop ? { width: desktopCardWidth, height: 280 } : { width: '100%', height: 220 },
            ]}
          />
        ))}
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={eg.empty}>
        <Ionicons name="calendar-clear-outline" size={52} color={colors.textTertiary} />
        <Text style={[eg.emptyTitle, { color: colors.text }]}>No events found</Text>
        <Text style={[eg.emptySub, { color: colors.textSecondary }]}>Try adjusting the filters or check back soon</Text>
        <Pressable style={[eg.clearBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]} onPress={onClear}>
          <Text style={[eg.clearText, { color: colors.primary }]}>Show all events</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[
      eg.grid,
      { gap: isDesktop ? gridGap : 0 },
      !isDesktop && { flexDirection: 'column', flexWrap: 'nowrap', marginHorizontal: -20 },
    ]}>
      {events.map((event) => {
        const w = isDesktop ? desktopCardWidth : width;
        return (
          <View
            key={event.id}
            style={isDesktop ? { width: w, marginBottom: gridGap } : { width: '100%', marginBottom: 1 }}
          >
            <EventCard
              event={event}
              containerWidth={w}
              containerHeight={isDesktop ? 300 : 220}
              layout="stacked"
              schedulingMode={isDesktop ? 'live_and_countdown' : 'default'}
            />
          </View>
        );
      })}
    </View>
  );
}

function VenueCard({ venue, colors }: { venue: Profile; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: venue.id } })}
      style={[vc.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
      accessibilityRole="link"
    >
      <View style={[vc.icon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="business" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[vc.name, { color: colors.text }]} numberOfLines={1}>{venue.name}</Text>
        <Text style={[vc.cat, { color: colors.textSecondary }]}>{venue.category || 'Culture Host'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.textTertiary} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CityScreen() {
  const { name, country } = useLocalSearchParams<{ name: string; country?: string }>();
  const colors = useColors();
  const { isDesktop, contentWidth, width, hPad } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const { state: onboarding } = useOnboarding();
  const { isAuthenticated } = useAuth();
  const scrollRef   = useRef<ScrollView>(null);
  const venueAnchor = useRef<number>(0);
  const { exportEventToCalendar } = useCalendarSync();
  const goBackSafe = useSafeBack();

  const scrollToContent = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 560, animated: true });
  }, []);

  const scrollToVenues = useCallback(() => {
    scrollRef.current?.scrollTo({ y: venueAnchor.current || 700, animated: true });
  }, []);

  const cityName    = Array.isArray(name)    ? name[0]    : name    ?? onboarding?.city    ?? 'Sydney';
  const cityCountry = Array.isArray(country) ? country[0] : country ?? onboarding?.country ?? 'Australia';

  const page = useCityPage(cityName, cityCountry);

  const [activeExploreCategory, setActiveExploreCategory] = useState<ExploreCategoryKey>('events');

  const cultureXEventCount = useMemo(() => {
    const cx = CULTUREX_EXPLORES_CULTURE_TAG.toLowerCase();
    return page.allEvents.filter((e) => {
      const tags = [...(e.cultureTag ?? []), ...(e.cultureTags ?? [])];
      return tags.some((t) => String(t).toLowerCase() === cx);
    }).length;
  }, [page.allEvents]);

  const { isCitySubscribed, toggleSubscribeCity, citySubscriptionSync } = useSaved();
  const subscribed = isCitySubscribed(cityName, cityCountry);
  const handleSubscribe = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        `Sign in to sync ${cityName} subscriptions across your devices.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Sign in', onPress: () => router.push('/(onboarding)/login') },
        ],
      );
      return;
    }
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    toggleSubscribeCity(cityName, cityCountry);
  }, [cityName, cityCountry, isAuthenticated, toggleSubscribeCity]);

  // ── Filter rail ────────────────────────────────────────────────────────────
  const railModes: FilterRailMode[] = [
    { id: 'category', icon: 'apps-outline',        accessibilityLabel: 'Filter by category', active: page.filterMode === 'category', onPress: () => page.setFilterMode('category') },
    { id: 'culture',  icon: 'globe-outline',        accessibilityLabel: 'Filter by culture',  active: page.filterMode === 'culture',  onPress: () => page.setFilterMode('culture')  },
    { id: 'language', icon: 'chatbubble-outline',   accessibilityLabel: 'Filter by language', active: page.filterMode === 'language', onPress: () => page.setFilterMode('language') },
  ];

  const railChips: FilterChipItem[] = page.filterOptions.map((opt) => ({
    id: opt,
    label: opt,
    active: page.activeFilters.includes(opt),
    onPress: () => page.onToggleFilter(opt),
  }));

  const handleCalExport = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    const events = page.filteredEvents;
    if (events.length === 0) { Alert.alert('No events', 'No events to export.'); return; }
    if (Platform.OS === 'web') {
      downloadICS(events, `${cityName}-events`);
    } else {
      for (const ev of events.slice(0, 10)) await exportEventToCalendar(ev);
      Alert.alert('Added to Calendar', `${Math.min(events.length, 10)} event${events.length !== 1 ? 's' : ''} added.`);
    }
  }, [page.filteredEvents, cityName, exportEventToCalendar]);

  const railActions: FilterRailAction[] = [
    {
      icon: 'calendar-outline',
      onPress: handleCalExport,
      accessibilityLabel: Platform.OS === 'web' ? 'Download .ics' : 'Add to device calendar',
    },
  ];

  const goToMap = useCallback(() => {
    router.push({ pathname: '/map', params: { city: cityName } });
  }, [cityName]);

  const openListingTypeResults = useCallback(
    (listingType: ListingTypeKey) => {
      const hubQuery = encodeURIComponent(cityName);
      const routes: Record<ListingTypeKey, string> = {
        event: `/events`,
        festival: `/search?q=${encodeURIComponent(`${cityName} festival`)}`,
        concert: `/search?q=${encodeURIComponent(`${cityName} concert`)}`,
        workshop: `/search?q=${encodeURIComponent(`${cityName} workshop`)}`,
        movie: `/movies`,
        dining: `/restaurants`,
        shopping: `/shopping`,
        activity: `/a`,
        professional: `/search?q=${encodeURIComponent(`${cityName} professional`)}`,
        organisation: `/search?q=${encodeURIComponent(`${cityName} organisation`)}`,
        business: `/directory`,
        artist: `/search?q=${encodeURIComponent(`${cityName} artist`)}`,
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
    [cityName],
  );

  const filteredEventsByExplore = useMemo(() => {
    const includesAny = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n));
    return page.filteredEvents.filter((e) => {
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
  }, [activeExploreCategory, page.filteredEvents]);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
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
        contentContainerStyle={[s.scroll, isDesktop && { width: contentWidth, alignSelf: 'center' }]}
        stickyHeaderIndices={[2]}
        refreshControl={
          <RefreshControl
            refreshing={page.refreshing}
            onRefresh={page.onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={[s.hero, { paddingTop: topInset + 16 }]}>
          <Image source={{ uri: page.heroImage }} style={StyleSheet.absoluteFill} contentFit="cover" transition={600} />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.92)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Nav bar */}
          <View style={[s.heroNav, { paddingTop: 10 }]}>
            <GlassView borderRadius={20} bordered={false} style={[s.heroNavBtn, s.heroNavBtnBlue]} contentStyle={s.heroNavBtnInner}>
              <Pressable onPress={goBackSafe} style={s.heroIconHit} accessibilityLabel="Go back" accessibilityRole="button">
                <Ionicons name="chevron-back" size={22} color={CultureTokens.indigo} />
              </Pressable>
            </GlassView>

            <Pressable onPress={() => router.push('/cities')} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <M3Card variant="elevated" style={[s.locPill, { gap: 8, paddingRight: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="location" size={14} color={CultureTokens.indigo} />
                  <Text style={[M3Typography.labelLarge, { color: CultureTokens.indigo }]} numberOfLines={1}>
                    {cityName}
                  </Text>
                </View>
                <View style={{ width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                <Text style={[M3Typography.labelMedium, { color: CultureTokens.indigo, fontFamily: FontFamily.bold }]}>
                  Explore
                </Text>
              </M3Card>
            </Pressable>

            <GlassView borderRadius={20} bordered={false} style={[s.heroNavBtn, s.heroNavBtnOrange]} contentStyle={s.heroNavBtnInner}>
              <Pressable onPress={() => void page.handleShare()} style={s.heroIconHit} accessibilityLabel="Share" accessibilityRole="button">
                <Ionicons name="share-social-outline" size={20} color={CultureTokens.coral} />
              </Pressable>
            </GlassView>
          </View>

          {/* City identity */}
          <View style={[s.heroContent, { paddingHorizontal: hPad }]}>
            <View style={s.heroBadge}><Text style={s.heroBadgeText}>CITY HUB</Text></View>
            <Text style={s.heroCity}>{cityName}</Text>
            {page.stateName && (
              <View style={s.heroStateRow}>
                <Ionicons name="map-outline" size={13} color={CITY_HERO_FG} style={{ opacity: 0.85 }} />
                <Text style={s.heroStateText}>{page.stateName}</Text>
              </View>
            )}
            <Text style={s.heroTagline}>{page.meta.tagline}</Text>
            <Pressable
              onPress={handleSubscribe}
              style={[s.subscribeBtn, subscribed && s.subscribeBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={subscribed ? `Unsubscribe from ${cityName}` : `Subscribe to ${cityName}`}
            >
              <Ionicons
                name={subscribed ? 'notifications' : 'notifications-outline'}
                size={16}
                color={subscribed ? '#0F172A' : '#fff'}
              />
              <Text style={[s.subscribeBtnText, subscribed && s.subscribeBtnTextActive]}>
                {subscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </Pressable>
            {__DEV__ && (
              <Text style={s.debugSyncText}>
                Sync: {citySubscriptionSync.mode === 'account' ? 'Account' : 'Local'} · {citySubscriptionSync.status}
              </Text>
            )}
          </View>
        </View>

        {/* ── Stats strip ─────────────────────────────────────────────────── */}
        <View style={[s.statsStripContainer, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.statsStrip, { paddingHorizontal: hPad, paddingRight: hPad + 32 }]}>
            <StatPill icon="calendar"            value={page.allEvents.length}            label="Events"    colors={colors} onPress={() => { page.clearAllFilters(); scrollToContent(); }} />
            <View style={[s.statDiv, { backgroundColor: colors.borderLight }]} />
            {page.council && (
              <>
                <StatPill icon="business" value={page.council.name.split(' ')[0]} label="Council" colors={colors} color={CultureTokens.teal} onPress={() => router.push('/my-council')} />
                <View style={[s.statDiv, { backgroundColor: colors.borderLight }]} />
              </>
            )}
            <StatPill icon="business"            value={page.venues.length || '—'}        label="Venues"    colors={colors} onPress={scrollToVenues} />
            <View style={[s.statDiv, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="people"              value={page.uniqueCultureTags.length}    label="Cultures"  colors={colors} onPress={() => page.setFilterMode('culture')} />
            <View style={[s.statDiv, { backgroundColor: colors.borderLight }]} />
            <StatPill icon="chatbubble-ellipses" value={page.uniqueLanguageTags.length}   label="Languages" colors={colors} onPress={() => page.setFilterMode('language')} />
            <View style={[s.statDiv, { backgroundColor: colors.borderLight }]} />
            <StatPill
              icon="sparkles-outline"
              value={cultureXEventCount}
              label="CultureX"
              colors={colors}
              color={CultureTokens.coral}
              onPress={() => {
                page.clearAllFilters();
                page.setFilterMode('culture');
                page.setSelectedCultures([CULTUREX_EXPLORES_CULTURE_TAG]);
                scrollToContent();
              }}
            />
          </ScrollView>
        </View>

        {/* ── Sticky filter bar — single row ───────────────────────────────── */}
        <View style={[s.filterBar, { backgroundColor: colors.background }]}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              s.exploreRow,
              { paddingHorizontal: hPad, paddingVertical: 8, paddingRight: hPad + 32 },
            ]}
          >
            {EXPLORE_CATEGORY_LINKS.map((item) => {
              const active = activeExploreCategory === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
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
                      style={s.exploreChipGradient}
                    >
                      <Ionicons name={item.icon} size={14} color="#fff" />
                      <Text style={s.exploreChipOnGradient}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        s.exploreChipIdle,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={14} color={colors.textSecondary} />
                      <Text style={[s.exploreChipIdleText, { color: colors.textSecondary }]}>
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
            actions={railActions}
            activeCount={page.totalActiveFilters}
            onClearAll={page.clearAllFilters}
          />
        </View>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <View style={isDesktop ? s.desktopRow : undefined}>

          {/* Events column */}
          <View style={isDesktop ? s.desktopEvents : undefined}>
            <View style={[s.section, isDesktop && { paddingHorizontal: 0 }]}>
              <View style={s.sectionHeader}>
                <View>
                  <Text style={[TextStyles.title3, { color: colors.text }]}>{page.sectionTitle}</Text>
                  <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                    {filteredEventsByExplore.length} result{filteredEventsByExplore.length !== 1 ? 's' : ''} · {page.venues.length} places in {cityName}
                  </Text>
                </View>
                {page.totalActiveFilters > 0 && (
                  <Pressable
                    onPress={page.clearAllFilters}
                    style={[s.clearBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' }]}
                  >
                    <Text style={[s.clearBtnText, { color: colors.primary }]}>Clear</Text>
                  </Pressable>
                )}
              </View>

              <EventsGrid
                events={filteredEventsByExplore}
                isLoading={page.isLoading}
                width={width}
                isDesktop={isDesktop}
                desktopCardWidth={page.desktopCardWidth}
                gridGap={page.gridGap}
                onClear={page.clearAllFilters}
              />
            </View>
          </View>

          {/* Sidebar */}
          <View style={isDesktop ? s.desktopSidebar : undefined}>
            {page.venues.length > 0 && (
              <View
                style={[s.section, isDesktop && { paddingHorizontal: 0, paddingTop: 0 }]}
                onLayout={(e) => { venueAnchor.current = e.nativeEvent.layout.y; }}
              >
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 14 }]}>Local Places</Text>
                <View style={{ gap: 10 }}>
                  {page.venues.map((v) => <VenueCard key={v.id} venue={v} colors={colors} />)}
                </View>
                {isDesktop && (
                  <Pressable
                    onPress={goToMap}
                    style={[s.mapBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                  >
                    <Ionicons name="map-outline" size={20} color={colors.primary} />
                    <Text style={[s.mapBtnText, { color: colors.text }]}>View All on Map</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={[s.section, isDesktop && { paddingHorizontal: 0 }]}>
              <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 4 }]}>
                Browse by type
              </Text>
              <Text style={[TextStyles.caption, { color: colors.textSecondary, marginBottom: 16 }]}>
                Explore {cityName} across different categories.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {LISTING_TYPE_ROWS.map((row) => (
                  <Pressable
                    key={row.key}
                    onPress={() => openListingTypeResults(row.key)}
                    style={({ pressed }) => [
                      {
                        width: isDesktop ? '100%' : '48.2%',
                        borderWidth: 1.5,
                        borderColor: colors.borderLight,
                        borderRadius: Radius.lg,
                        padding: 12,
                        backgroundColor: colors.surfaceElevated,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${row.title} results`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[TextStyles.callout, { color: colors.text, fontFamily: FontFamily.bold, fontSize: 13 }]}>
                        {row.title}
                      </Text>
                      <View style={{ borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: colors.primarySoft }}>
                        <Text style={{ fontSize: 10, color: colors.primary, fontFamily: FontFamily.bold }}>
                          {page.listingResultCounts[row.key]}
                        </Text>
                      </View>
                    </View>
                    <Text style={[TextStyles.caption, { color: colors.textSecondary, lineHeight: 14, fontSize: 11 }]} numberOfLines={2}>
                      {row.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {page.uniqueCultureTags.length > 0 && (
              <View style={[s.section, isDesktop && { paddingHorizontal: 0 }]}>
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Cultural Communities</Text>
                <View style={s.tagCloud}>
                  {page.uniqueCultureTags.map((tag) => {
                    const active = page.selectedCultures.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => {
                          page.setFilterMode('culture');
                          page.setSelectedCultures((prev: string[]) =>
                            prev.includes(tag) ? prev.filter((x: string) => x !== tag) : [...prev, tag],
                          );
                        }}
                        style={[
                          s.tagPill,
                          {
                            backgroundColor: active ? CultureTokens.indigo : colors.backgroundSecondary,
                            borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          },
                        ]}
                      >
                        <Text style={[s.tagText, { color: active ? '#fff' : colors.text }]}>{tag}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {page.uniqueLanguageTags.length > 0 && (
              <View style={[s.section, isDesktop && { paddingHorizontal: 0 }]}>
                <Text style={[TextStyles.title3, { color: colors.text, marginBottom: 12 }]}>Languages</Text>
                <View style={s.tagCloud}>
                  {page.uniqueLanguageTags.map((lang) => {
                    const active = page.selectedLanguages.includes(lang);
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => {
                          page.setFilterMode('language');
                          page.setSelectedLanguages((prev: string[]) =>
                            prev.includes(lang) ? prev.filter((x: string) => x !== lang) : [...prev, lang],
                          );
                        }}
                        style={[
                          s.tagPill,
                          {
                            backgroundColor: active ? CultureTokens.gold + 'EE' : colors.backgroundSecondary,
                            borderColor: active ? CultureTokens.gold : colors.borderLight,
                          },
                        ]}
                      >
                        <Text style={[s.tagText, { color: colors.text }]}>{lang}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <Footer />
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB — map, mobile only */}
      {!isDesktop && (
        <Pressable
          style={s.fab}
          onPress={goToMap}
          accessibilityLabel="Open map"
          accessibilityRole="button"
        >
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={s.fabText}>Map</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero
  hero: { height: 400, overflow: 'hidden' },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  heroNavBtn: { width: 40, height: 40 },
  heroNavBtnBlue: { borderWidth: 1.5, borderColor: CultureTokens.indigo + 'CC' },
  heroNavBtnOrange: { borderWidth: 1.5, borderColor: CultureTokens.coral + 'CC' },
  heroNavBtnInner: { alignItems: 'center', justifyContent: 'center' },
  heroIconHit: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#fff',
  },

  heroContent: { position: 'absolute', bottom: 28, left: 0, right: 0 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: CultureTokens.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  heroBadgeText: { fontSize: 11, fontFamily: 'Poppins_800ExtraBold', color: '#0F172A', letterSpacing: 1.2 },
  heroCity: { fontSize: 40, fontFamily: 'Poppins_800ExtraBold', color: '#fff', lineHeight: 46, letterSpacing: -1 },
  heroStateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  heroStateText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: 'rgba(255,255,255,0.85)' },
  heroTagline: { marginTop: 8, fontSize: 15, fontFamily: 'Poppins_400Regular', color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  subscribeBtnActive: {
    backgroundColor: CultureTokens.gold,
    borderColor: CultureTokens.gold,
  },
  subscribeBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  subscribeBtnTextActive: { color: '#0F172A' },
  debugSyncText: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },

  // Stats strip
  statsStripContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  statDiv: { width: 1, height: 28, opacity: 0.6, marginHorizontal: 4 },

  // Filter bar
  filterBar: { zIndex: 10 },

  // Layout
  desktopRow: { flexDirection: 'row', gap: 32, paddingHorizontal: 20 },
  desktopEvents: { flex: 2.8 },
  desktopSidebar: { flex: 1, paddingTop: 28 },

  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
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
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Section
  section: { paddingHorizontal: 20, paddingTop: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearBtnText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },

  // Tag cloud
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontFamily: 'Poppins_500Medium' },

  // Map button (desktop)
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mapBtnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CultureTokens.indigo,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  fabText: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_700Bold' },
});

// ─── Events grid styles ───────────────────────────────────────────────────────

const eg = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  skeleton: { borderRadius: 16, opacity: 0.6, marginBottom: 1 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  emptySub: { fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 21 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  clearText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Venue card styles ────────────────────────────────────────────────────────

const vc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  cat: { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
});
