/**
 * Home — Discover Screen
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/modules/discover/hooks/useDiscoverData';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { discoverFeature } from '@/features';
import {
  Vitrine,
  FontFamily,
  Spacing,
  luxeDark,
} from '@/design-system/tokens/theme';
import { isCultureKeralaHost } from '@/lib/domainHost';
import { FOOTER_LINKS } from '@/lib/site-footer-links';
import { APP_NAME, MADE_IN, SITE_ORIGIN } from '@/lib/app-meta';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import {
  AppearanceModeToggle,
  CulturalTopAppBar,
  LuxeFilterChip,
} from '@/design-system/ui';
import { CommunityHomeBanner } from '@/components/CommunityHomeBanner';

import {
  DiscoverScrollShell,
  DiscoverVitrineProvider,
  DiscoverHeader,
  DiscoverContent,
} from '@/modules/discover/components';
import { useKeralaScoping } from '@/modules/discover/hooks/useKeralaScoping';
import { useReminderPopup } from '@/hooks/useReminderPopup';
import { ReminderPopupModal } from '@/components/ReminderPopupModal';
import { NationBuildersPromo } from '@/components/NationBuilders/NationBuildersPromo';

// ─── Filter chip definitions ───────────────────────────────────────────────────

type DiscoverFilter =
  | 'all'
  | 'hubs'
  | 'events'
  | 'art'
  | 'movies'
  | 'dining'
  | 'activities'
  | 'travel'
  | 'shopping'
  | 'offers'
  | 'directory'
  | 'indigenous'
  | 'search';

const DISCOVER_FILTERS: { id: DiscoverFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all',        label: 'All',        icon: 'apps' },
  { id: 'hubs',       label: 'Hubs',       icon: 'people' },
  { id: 'events',     label: 'Events',     icon: 'calendar' },
  { id: 'art',        label: 'Art',        icon: 'color-palette-outline' },
  { id: 'movies',     label: 'Movies',     icon: 'film' },
  { id: 'dining',     label: 'Dining',     icon: 'restaurant' },
  { id: 'activities', label: 'Activities', icon: 'bicycle' },
  { id: 'travel',     label: 'Travel',     icon: 'airplane' },
  { id: 'shopping',   label: 'Shopping',   icon: 'bag-handle' },
  { id: 'offers',     label: 'Offers',     icon: 'pricetag' },
  { id: 'directory',  label: 'Directory',  icon: 'business' },
  { id: 'indigenous', label: 'Indigenous', icon: 'leaf' },
  { id: 'search',     label: 'Search',     icon: 'search' },
];

const _DISCOVER_HEAD_TITLE = `Discover · ${APP_NAME}`;
const _DISCOVER_HEAD_DESC =
  'Browse cultural events, hubs, dining, movies, and communities tailored to diaspora cities.';
const _DISCOVER_HEAD_URL = SITE_ORIGIN;

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(28);
  const [keralaDomain, setKeralaDomain] = useState(false);

  // On web desktop the sticky sidebar + root maxWidth already constrain the area.
  // Use a modest internal side padding (matches the new rail insets) so nothing
  // feels "covered" at the edges while keeping the layout balanced.
  const pageSidePad = isDesktop && Platform.OS === 'web' ? 16 : hPad;
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { state: onboardingState } = useOnboarding();
  // Ref for the search TextInput — wired to "/" keyboard shortcut on web (Req 11.5)
  const searchInputRef = useRef<import('react-native').TextInput>(null);
  useSearchShortcut(searchInputRef as React.RefObject<HTMLInputElement | null>);

  // Reminder popup logic
  const { shouldShowPopup, markAsSeen } = useReminderPopup();
  
  useEffect(() => {
    setKeralaDomain(isCultureKeralaHost());
  }, []);

  const d = useDiscoverData();
  const s = useKeralaScoping(keralaDomain, d);
  const { data: discoverFeatureFeed } = useQuery({
    queryKey: ['feature-discover-feed', d.userId ?? 'guest', d.state.city, d.state.country],
    queryFn: () =>
      discoverFeature.getDiscoverFeatureFeed({
        userId: d.userId ?? 'guest',
        city: d.state.city || undefined,
        country: d.state.country || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });
  const recommendedFromFeature = useMemo(
    () => discoverFeatureFeed?.rankedEvents.map((entry: any) => entry.event).slice(0, 8) ?? [],
    [discoverFeatureFeed],
  );
  const topBarTitle = useMemo(() => {
    if (activeFilter === 'all') return 'Discover';
    if (activeFilter === 'search') return 'Search';
    const chip = DISCOVER_FILTERS.find((f) => f.id === activeFilter);
    return chip ? `Discover ${chip.label}` : 'Discover';
  }, [activeFilter]);

  const handleFilterPress = useCallback((id: DiscoverFilter) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter((prev) => prev === id ? 'all' : id);
    if (id !== 'search') setSearchQuery('');
  }, []);

  const handleJoinReminders = () => {
    markAsSeen();
    // Navigate to notifications settings or perform the join action
    router.push('/settings/notifications');
  };

  const handleClosePopup = () => {
    markAsSeen();
  };

  return (
    <DiscoverVitrineProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.background },
          ]}
          pointerEvents="none"
        />
        <View style={ds.topAppBarLayer}>
          <CulturalTopAppBar
            title={topBarTitle}
            variant="small"
            titleLeading={
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
                contentFit="contain"
              />
            }
            denseWeb={Platform.OS === 'web'}
            webChromeless={Platform.OS === 'web'}
            trailingStart={<AppearanceModeToggle compact />}
            actions={[
              { icon: 'search', onPress: () => setActiveFilter('search') },
              { icon: 'notifications-outline', onPress: () => router.push('/notifications') },
            ]}
          />
        </View>
        <DiscoverScrollShell
          scrollBottomPad={scrollBottomPad}
          contentContainerStyle={
            // On web desktop the root layout (WebSidebar + mainFlex maxWidth:1200) already
            // provides the sidebar gutter + centered container. Avoid double-constraining
            // the inner ScrollView width here — it causes sides to clip or feel covered.
            isDesktop && Platform.OS !== 'web'
              ? { width: contentWidth, alignSelf: 'center' }
              : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={d.refreshing}
              onRefresh={d.handleRefresh}
              tintColor={Vitrine.primary}
            />
          }
        >
          <CommunityHomeBanner />

          <DiscoverHeader
            currentTime={d.currentTime}
            weatherSummary={d.weatherSummary}
            city={d.state.city || 'Sydney'}
            country={d.state.country || 'Australia'}
            isAuthenticated={d.isAuthenticated}
            onRefresh={d.handleRefresh}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[ds.filterScroll, { paddingHorizontal: pageSidePad, paddingRight: pageSidePad + 32 }]}
            style={[
              { marginBottom: Spacing.sm },
              // Give a little breathing room between the subtitle
              // ("Explore festivals...") and the CulturalFilterChip row on desktop web
              isDesktop && Platform.OS === 'web' && { marginTop: 4 },
            ]}
          >
            {DISCOVER_FILTERS.map((f) => (
              <LuxeFilterChip
                key={f.id}
                label={f.label}
                icon={f.icon}
                selected={activeFilter === f.id}
                onPress={() => handleFilterPress(f.id)}
                compact
              />
            ))}
          </ScrollView>

          {activeFilter === 'search' && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View
                style={[ds.searchBar, {
                  marginHorizontal: pageSidePad,
                  backgroundColor: luxeDark.surfaceElevated,
                  height: 56,
                  borderRadius: 28,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: luxeDark.border,
                }]}
              >
                <Ionicons name="search" size={24} color={luxeDark.textSecondary} />
                <TextInput
                  ref={searchInputRef as any}
                  style={[ds.searchInput, { color: luxeDark.text, fontSize: 16, marginLeft: 12 }]}
                  placeholder="Search events, places, movies..."
                  placeholderTextColor={luxeDark.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  accessibilityLabel="Search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                    <Ionicons name="close" size={24} color={luxeDark.textSecondary} />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          <DiscoverContent
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            onboardingState={onboardingState}
            d={d}
            s={s}
            recommendedFromFeature={recommendedFromFeature}
            keralaDomain={keralaDomain}
            skippedOnboardingSteps={(onboardingState as any).skippedSteps ?? []}
          />

          {/* Nation Builders Promo — moved to bottom, smaller + improved UI */}
          <NationBuildersPromo variant="full" />

          <View style={[ds.footer, { marginHorizontal: pageSidePad, borderTopColor: m3Colors.outlineVariant }]}>
            <View style={ds.footerLinks}>
              {FOOTER_LINKS.map((link) => (
                <Pressable key={link.href} onPress={() => router.push(link.href)}>
                  <Text style={[ds.footerLinkText, { color: m3Colors.onSurfaceVariant }]}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[ds.footerMeta, { color: m3Colors.onSurfaceVariant }]}>
              {`${APP_NAME} · ${MADE_IN}`}
            </Text>
          </View>

        </DiscoverScrollShell>
        
        {/* Reminder Popup Modal */}
        <ReminderPopupModal
          visible={shouldShowPopup}
          onClose={handleClosePopup}
          onJoinReminders={handleJoinReminders}
        />
      </View>
    </DiscoverVitrineProvider>
  );
}

// ─── Discover filter styles ────────────────────────────────────────────────────

const ds = StyleSheet.create({
  topAppBarLayer: {
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  filterScroll: { gap: 8, paddingVertical: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: { transition: 'all 0.2s ease' },
    }),
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.medium,
    height: '100%',
    padding: 0,
  },
  footer: {
    marginTop: 8,
    marginBottom: 18,
    borderTopWidth: 1,
    paddingTop: 14,
    gap: 8,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 16,
    rowGap: 8,
  },
  footerLinkText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  footerMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
});