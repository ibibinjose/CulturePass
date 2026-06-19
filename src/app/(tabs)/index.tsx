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
  Easing,
  Animated as RNAnimated,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useLayout } from '@/hooks/useLayout';
import { useTabScrollBottomPadding } from '@/hooks/useTabScrollBottomPadding';
import { useDiscoverData } from '@/modules/discover/hooks/useDiscoverData';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { discoverFeature } from '@/features';
import { DISCOVER_HOME } from '@/design-system/tokens/discoverHomeTokens';
import {
  Vitrine,
  FontFamily,
  Spacing,
  CultureTokens,
  Radius,
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
  PageContainer,
  CulturePassWordmark,
} from '@/design-system/ui';
import { CommunityHomeBanner } from '@/components/CommunityHomeBanner';

import {
  DiscoverScrollShell,
  DiscoverVitrineProvider,
  DiscoverHeader,
  DiscoverContent,
  CultureWheelModal,
} from '@/modules/discover/components';
import { isClassEvent } from '@/modules/discover/components/DiscoverContent';
import {
  type DiscoverFilter,
  ALL_FILTERS,
} from '@/components/Discover/DiscoverFilterModal';
import { useKeralaScoping } from '@/modules/discover/hooks/useKeralaScoping';
import { useReminderPopup } from '@/hooks/useReminderPopup';
import { ReminderPopupModal } from '@/components/ReminderPopupModal';
import { NationBuildersPromo } from '@/components/NationBuilders/NationBuildersPromo';

// ─── All categories in one horizontal scrolling tap menu ────────────────────────

const allCategoryFilters = ALL_FILTERS;

// Vibrant cultural accent colors for categories and intents (tasteful, heritage-inspired)
const categoryAccent: Record<string, string> = {
  events: CultureTokens.deepSaffron,
  art: CultureTokens.heritageGold,
  movies: CultureTokens.violet,
  dining: CultureTokens.coral,
  shopping: CultureTokens.emerald,
  hubs: CultureTokens.indigo,
  activities: CultureTokens.teal,
  classes: CultureTokens.coral,
  travel: CultureTokens.richIndigo,
  offers: CultureTokens.gold,
  directory: CultureTokens.emeraldHarmony,
  indigenous: DISCOVER_HOME.categoryIndigenousAccent,
  search: CultureTokens.indigo,
  all: CultureTokens.indigo,
};

const _DISCOVER_HEAD_TITLE = `Discover · ${APP_NAME}`;
const _DISCOVER_HEAD_DESC =
  'Browse cultural events, hubs, dining, movies, and communities tailored to diaspora cities.';
const _DISCOVER_HEAD_URL = SITE_ORIGIN;

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const { isDesktop, contentWidth, hPad } = useLayout();
  const scrollBottomPad = useTabScrollBottomPadding(28);
  const [keralaDomain, setKeralaDomain] = useState(false);

  // Slow continuous background spin animation for the CultureWheel promo card decoration
  const bgWheelAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    const anim = RNAnimated.loop(
      RNAnimated.timing(bgWheelAnim, {
        toValue: 360,
        duration: 40000, // 40 seconds per rotation for a premium slow motion feel
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    anim.start();
    return () => anim.stop();
  }, [bgWheelAnim]);

  const bgRotateInterpolate = bgWheelAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

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

  // Refs for the Explore categories scrolling tap experience
  const filtersScrollRef = useRef<ScrollView>(null);
  const chipLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});

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
  const [wheelVisible, setWheelVisible] = useState(false);
  const classEvents = useMemo(() => {
    const combined = [...s.nearby, ...s.popular, ...s.soon, ...s.forYou];
    const seen = new Set<string>();
    const out: any[] = [];
    for (const item of combined) {
      if (typeof item === 'string') continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      if (isClassEvent(item)) {
        out.push(item);
      }
    }
    return out;
  }, [s.nearby, s.popular, s.soon, s.forYou]);
  const topBarTitle = useMemo(() => {
    if (activeFilter === 'all') return 'Discover';
    if (activeFilter === 'search') return 'Search';
    const chip = ALL_FILTERS.find((f) => f.id === activeFilter);
    return chip ? `Discover ${chip.label}` : 'Discover';
  }, [activeFilter]);

  const scrollActiveChipIntoView = useCallback((filterId: DiscoverFilter) => {
    const layout = chipLayoutsRef.current[filterId];
    if (layout && filtersScrollRef.current) {
      // Bias toward the left so the selected chip + following content stays visible
      const targetX = Math.max(0, layout.x - 72);
      filtersScrollRef.current.scrollTo({ x: targetX, animated: true });
    }
  }, []);

  const handleFilterPress = useCallback((id: DiscoverFilter) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter((prev) => prev === id ? 'all' : id);
    if (id !== 'search') setSearchQuery('');

    // Premium horizontal scrolling tap: scroll the selected category chip into view
    requestAnimationFrame(() => scrollActiveChipIntoView(id));
  }, [scrollActiveChipIntoView]);

  // Ensure the active chip is nicely visible in the single horizontal scrolling menu
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollActiveChipIntoView(activeFilter);
    }, 80);
    return () => clearTimeout(timer);
  }, [activeFilter, scrollActiveChipIntoView]);

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
      {Platform.OS === 'web' && (
        <Head>
          <title>{_DISCOVER_HEAD_TITLE}</title>
          <meta name="description" content={_DISCOVER_HEAD_DESC} />
          <link rel="canonical" href={_DISCOVER_HEAD_URL} />
        </Head>
      )}
      <View style={[ds.screen, { backgroundColor: colors.background }]}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.background },
          ]}
          pointerEvents="none"
        />
        {/* Modern Glass & Glowing Blob Background (Web) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Platform.OS === 'web' && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: 0.9,
                  ...Platform.select({
                    web: {
                      backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)'} 1px, transparent 1px)`,
                      backgroundSize: '36px 36px',
                    } as any,
                    default: {},
                  }),
                },
              ]}
            />
          )}
          {/* Glowing heritage-inspired blobs */}
          <View
            style={{
              position: 'absolute',
              top: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: 200,
              backgroundColor: CultureTokens.appBlue + (isDark ? '14' : '0f'),
              ...Platform.select({
                web: { filter: 'blur(100px)' },
              }),
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 100,
              right: -150,
              width: 350,
              height: 350,
              borderRadius: 175,
              backgroundColor: CultureTokens.richIndigo + (isDark ? '0d' : '0a'),
              ...Platform.select({
                web: { filter: 'blur(90px)' },
              }),
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 360,
              left: -180,
              width: 480,
              height: 480,
              borderRadius: 240,
              backgroundColor: CultureTokens.deepSaffron + (isDark ? '0a' : '08'),
              ...Platform.select({
                web: { filter: 'blur(120px)' },
              }),
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 80,
              right: -120,
              width: 400,
              height: 400,
              borderRadius: 200,
              backgroundColor: CultureTokens.emeraldHarmony + (isDark ? '0b' : '08'),
              ...Platform.select({
                web: { filter: 'blur(110px)' },
              }),
            }}
          />
        </View>
        <View style={ds.topAppBarLayer}>
          <CulturalTopAppBar
            title={activeFilter === 'all' ? <CulturePassWordmark size="sm" showSuffix={true} /> : topBarTitle}
            variant="small"
            titleLeading={
              activeFilter === 'all' ? (
                <Image
                  source={require('@/assets/images/culturepass-logo.png')}
                  style={ds.logoThumb}
                  contentFit="contain"
                />
              ) : undefined
            }
            onBack={
              activeFilter !== 'all'
                ? () => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }
                : undefined
            }
            denseWeb={Platform.OS === 'web'}
            webChromeless={Platform.OS === 'web'}
            trailingStart={<AppearanceModeToggle compact />}
            actions={[
              {
                icon: activeFilter === 'search' ? 'close' : 'search',
                onPress: () => {
                  if (activeFilter === 'search') {
                    setActiveFilter('all');
                    setSearchQuery('');
                  } else {
                    setActiveFilter('search');
                  }
                },
                accessibilityLabel: activeFilter === 'search' ? 'Close search' : 'Search',
              },
              {
                icon: 'notifications-outline',
                onPress: () => router.push('/notifications'),
                accessibilityLabel: 'Notifications',
              },
            ]}
          />
        </View>
        <DiscoverScrollShell
          scrollBottomPad={scrollBottomPad}
          contentContainerStyle={
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
          <PageContainer compact noTopPadding>
            <CommunityHomeBanner />

            <DiscoverHeader
              currentTime={d.currentTime}
              dateLabel={d.dateLabel}
              weatherSummary={d.weatherSummary}
              city={d.effectiveCity || d.state.city || 'Sydney'}
              locationLabel={d.locationDisplayLabel}
              country={d.effectiveCountry || d.state.country || 'Australia'}
              isAuthenticated={d.isAuthenticated}
              onRefresh={d.handleRefresh}
            />

          {/* Quick intent pills — one-tap access to high-frequency journeys (major UX improvement) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[ds.intentScrollContent, { paddingHorizontal: pageSidePad }]}
            style={ds.intentScroll}
          >
            <IntentPill
              label="Today"
              icon="today"
              accentColor={CultureTokens.appBlue}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('events');
              }}
            />
            <IntentPill
              label="Tonight"
              icon="moon"
              accentColor={CultureTokens.richIndigo}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('events');
              }}
            />
            <IntentPill
              label="Weekend"
              icon="calendar"
              accentColor={CultureTokens.deepSaffron}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('events');
              }}
            />
            {d.council ? (
              <IntentPill
                label={d.council.name.split(' ')[0] || 'Council'}
                icon="business"
                accentColor={CultureTokens.teal}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/events',
                    params: {
                      councilId: d.council!.id,
                      lgaCode: d.council!.lgaCode || undefined,
                    },
                  });
                }}
              />
            ) : null}
            <IntentPill
              label="Free"
              icon="pricetag"
              accentColor={CultureTokens.emeraldHarmony}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('offers');
              }}
            />
            <IntentPill
              label="Near me"
              icon="location"
              accentColor={CultureTokens.teal}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('events');
              }}
            />
            <IntentPill
              label="Starting soon"
              icon="time"
              accentColor={CultureTokens.gold}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('events');
              }}
            />
          </ScrollView>

          {/* CultureWheel Promo Banner */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWheelVisible(true);
            }}
            style={({ pressed, hovered }: any) => [
              ds.wheelPromoPressable,
              {
                marginHorizontal: pageSidePad,
                borderColor: isDark ? DISCOVER_HOME.wheelPromoBorderDark : DISCOVER_HOME.wheelPromoBorderLight,
                transform: [{ scale: pressed ? 0.985 : (hovered ? 1.015 : 1) }],
                ...Platform.select({
                  web: {
                    boxShadow: hovered
                      ? '0 16px 36px rgba(126, 87, 194, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)'
                      : '0 4px 16px rgba(0, 0, 0, 0.06)',
                    backdropFilter: 'blur(20px)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                  },
                }),
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? [...DISCOVER_HOME.wheelPromoGradientDark]
                  : [...DISCOVER_HOME.wheelPromoGradientLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={ds.wheelPromoGradient}
            >
              {/* Spinning/glowing wheel blueprint vector in background */}
              <RNAnimated.View
                style={[
                  ds.wheelBlueprint,
                  {
                    opacity: isDark ? 0.16 : 0.26,
                    transform: [{ rotate: bgRotateInterpolate }],
                  },
                ]}
              >
                <Svg width="170" height="170" viewBox="0 0 100 100">
                  <Circle cx="50" cy="50" r="45" stroke={DISCOVER_HOME.wheelBlueprintStroke} strokeWidth="0.8" strokeDasharray="3,3" fill="none" />
                  <Circle cx="50" cy="50" r="35" stroke={DISCOVER_HOME.wheelBlueprintStroke} strokeWidth="0.5" fill="none" />
                  <Circle cx="50" cy="50" r="26" stroke={DISCOVER_HOME.wheelBlueprintStroke} strokeWidth="0.8" strokeDasharray="1,2" fill="none" />
                  <Circle cx="50" cy="50" r="14" stroke={DISCOVER_HOME.wheelBlueprintStroke} strokeWidth="0.6" fill="none" />
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const angle = (idx * 30 * Math.PI) / 180;
                    const x2 = 50 + 45 * Math.cos(angle);
                    const y2 = 50 + 45 * Math.sin(angle);
                    return (
                      <Line
                        key={idx}
                        x1="50"
                        y1="50"
                        x2={x2}
                        y2={y2}
                        stroke={DISCOVER_HOME.wheelBlueprintStroke}
                        strokeWidth="0.4"
                        strokeDasharray="1,4"
                      />
                    );
                  })}
                </Svg>
              </RNAnimated.View>

              {/* Glowing emoji circle with double border */}
              <View style={ds.wheelEmojiCircle}>
                <Text style={ds.wheelEmoji} numberOfLines={1}>
                  🎡
                </Text>
              </View>

              <View style={ds.wheelPromoCopy}>
                <View style={ds.wheelPromoTitleRow}>
                  <Text style={ds.wheelPromoTitle} numberOfLines={1}>
                    Spin the CultureWheel
                  </Text>

                  <LinearGradient
                    colors={[...DISCOVER_HOME.newBadgeGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={ds.newBadge}
                  >
                    <Text style={ds.newBadgeText} numberOfLines={1}>
                      NEW
                    </Text>
                  </LinearGradient>
                </View>
                <Text style={ds.wheelPromoDesc} numberOfLines={2}>
                  Stuck on what to do next? Let the wheel decide! Explore events, hubs, dining & cultural activities.
                </Text>
              </View>

              <View style={ds.wheelArrowOrb}>
                <Ionicons name="arrow-forward" size={16} color={DISCOVER_HOME.promoInk} />
              </View>
            </LinearGradient>
          </Pressable>

          {/* All categories in one horizontal scrolling tap menu (web + mobile) — vibrant & unified */}
          <View 
            style={{ 
              position: 'relative', 
              marginBottom: Spacing.md,
              backgroundColor: isDark ? 'rgba(26, 26, 29, 0.72)' : 'rgba(255, 255, 255, 0.85)',
              borderRadius: 24,
              paddingVertical: 8,
              paddingHorizontal: 4,
              marginHorizontal: pageSidePad - 4,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              ...Platform.select({
                web: {
                  backdropFilter: 'blur(24px)',
                  boxShadow: isDark 
                    ? '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
                    : '0 8px 32px rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                },
              }),
            }}
          >
            <ScrollView
              ref={filtersScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[ds.filterScroll, { paddingHorizontal: 12, paddingRight: 24 }]}
              style={[
                isDesktop && Platform.OS === 'web' && { marginTop: 4 },
              ]}
            >
              {allCategoryFilters.map((f) => {
                const accent = categoryAccent[f.id] || colors.primary;
                const isActive = activeFilter === f.id;
                return (
                  <View
                    key={f.id}
                    onLayout={(e) => {
                      chipLayoutsRef.current[f.id] = {
                        x: e.nativeEvent.layout.x,
                        width: e.nativeEvent.layout.width,
                      };
                    }}
                    style={{ marginHorizontal: 4 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Vibrant left accent dot for active category */}
                      {isActive && (
                        <View 
                          style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: 3, 
                            backgroundColor: accent, 
                            marginRight: 6,
                            marginLeft: 2,
                            shadowColor: accent,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 4,
                          }} 
                        />
                      )}
                      <LuxeFilterChip
                        label={f.label}
                        icon={f.icon}
                        selected={isActive}
                        onPress={() => handleFilterPress(f.id)}
                        compact
                        activeBgColor={isDark ? `${accent}22` : `${accent}14`}
                        activeTextColor={accent}
                        style={
                          isActive 
                            ? { borderColor: accent, borderWidth: 1.5 } 
                            : { 
                                backgroundColor: isDark ? 'rgba(30, 30, 34, 0.3)' : 'rgba(255, 255, 255, 0.4)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'
                              }
                        }
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Subtle edge gradients */}
            <LinearGradient
              colors={[isDark ? 'rgba(26, 26, 29, 0.9)' : 'rgba(255, 255, 255, 0.9)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[ds.filterEdgeFade, { left: 4, width: 20 }]}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', isDark ? 'rgba(26, 26, 29, 0.9)' : 'rgba(255, 255, 255, 0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[ds.filterEdgeFade, { right: 4, width: 28 }]}
              pointerEvents="none"
            />
          </View>

          {/* Clear active filter affordance (visible when narrowed) */}
          {activeFilter !== 'all' && activeFilter !== 'search' && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('all');
              }}
              style={[ds.clearFilterBtn, { marginLeft: pageSidePad }]}
              hitSlop={8}
              accessibilityLabel="Clear filter"
            >
              <Text style={[ds.clearFilterText, { color: colors.primary }]} numberOfLines={1}>
                Clear filter · Show everything
              </Text>
            </Pressable>
          )}

          {activeFilter === 'search' && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View
                style={[ds.searchBar, {
                  marginHorizontal: pageSidePad,
                  backgroundColor: colors.surface,
                  height: 56,
                  borderRadius: 28,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                }]}
              >
                <Ionicons name="search" size={24} color={colors.primary} />
                <TextInput
                  ref={searchInputRef as any}
                  style={[ds.searchInput, { color: colors.text, fontSize: 16, marginLeft: 12 }]}
                  placeholder="Search events, places, movies..."
                  placeholderTextColor={colors.textSecondary || DISCOVER_HOME.mutedTextFallback}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  accessibilityLabel="Search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                    <Ionicons name="close" size={24} color={colors.textSecondary || DISCOVER_HOME.mutedTextFallback} />
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

          <View style={[ds.footer, { marginHorizontal: pageSidePad, borderTopColor: colors.borderLight }]}>
            <View style={ds.footerLinks}>
              {FOOTER_LINKS.map((link) => (
                <Pressable key={link.id} onPress={() => router.push(link.href)}>
                  <Text
                    style={[ds.footerLinkText, { color: colors.textSecondary || DISCOVER_HOME.mutedTextFallback }]}
                    numberOfLines={1}
                  >
                    {link.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text
              style={[ds.footerMeta, { color: colors.textSecondary || DISCOVER_HOME.mutedTextFallback }]}
              numberOfLines={1}
            >
              {`${APP_NAME} · ${MADE_IN}`}
            </Text>
          </View>
          </PageContainer>

        </DiscoverScrollShell>
        
        {/* Reminder Popup Modal */}
        <ReminderPopupModal
          visible={shouldShowPopup}
          onClose={handleClosePopup}
          onJoinReminders={handleJoinReminders}
        />

        {/* CultureWheel Modal */}
        <CultureWheelModal
          visible={wheelVisible}
          onClose={() => setWheelVisible(false)}
          events={s.nearby.filter((i) => typeof i !== 'string')}
          dining={d.restaurantPreviewItems}
          perks={d.perksPreviewItems}
          classes={classEvents}
          hubs={d.allCommunities}
          activities={d.allActivities}
          shopping={d.shoppingPreviewItems}
          indigenousOrganisations={d.indigenousOrganisations}
          land={d.land}
        />

      </View>
    </DiscoverVitrineProvider>
  );
}

// ─── Small intent pill (local, high-signal quick actions) ──────────────────────

function IntentPill({
  label,
  icon,
  onPress,
  accentColor,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accentColor?: string;
}) {
  const colors = useM3Colors();
  const isDark = useIsDark();
  
  const gradColors: [string, string] = accentColor 
    ? [isDark ? `${accentColor}24` : `${accentColor}18`, isDark ? `${accentColor}0A` : `${accentColor}06`]
    : (isDark ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(0, 0, 0, 0.04)', 'rgba(0, 0, 0, 0.01)']);
    
  const border = accentColor 
    ? `${accentColor}5A` 
    : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)');
    
  const iconColor = accentColor || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        {
          borderRadius: 999,
          borderWidth: 1.2,
          borderColor: border,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.96 : (hovered ? 1.04 : 1) }],
          ...Platform.select({
            web: {
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: hovered 
                ? `0 6px 20px ${iconColor}3D, inset 0 1px 0 rgba(255,255,255,0.1)` 
                : (isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)'),
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
            },
          }),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ds.intentPillGradient}
      >
        <Ionicons name={icon} size={15} color={iconColor} />
        <Text style={[ds.intentPillLabel, { color: colors.onSurface }]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Discover filter styles ────────────────────────────────────────────────────

const ds = StyleSheet.create({
  screen: { flex: 1 },
  logoThumb: { width: 40, height: 40, borderRadius: 20, marginLeft: 8 },
  intentScroll: { marginBottom: Spacing.md },
  intentScrollContent: { gap: 8, paddingBottom: 4 },
  wheelPromoPressable: {
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wheelPromoGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  wheelBlueprint: {
    position: 'absolute',
    right: -35,
    top: -30,
    width: 170,
    height: 170,
    pointerEvents: 'none',
  },
  wheelEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DISCOVER_HOME.wheelEmojiCircleBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: DISCOVER_HOME.wheelEmojiCircleBorder,
    ...Platform.select({
      ios: {
        shadowColor: DISCOVER_HOME.shadow,
        shadowOpacity: 0.2,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  wheelEmoji: { fontSize: 28 },
  wheelPromoCopy: { flex: 1, gap: 4, zIndex: 2 },
  wheelPromoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wheelPromoTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: DISCOVER_HOME.promoInk,
    letterSpacing: -0.2,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DISCOVER_HOME.newBadgeBorder,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(255, 179, 0, 0.4)',
      },
    }),
  },
  newBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: DISCOVER_HOME.newBadgeInk,
    letterSpacing: 0.8,
  },
  wheelPromoDesc: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: DISCOVER_HOME.promoDescInk,
    lineHeight: 16,
  },
  wheelArrowOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DISCOVER_HOME.wheelArrowOrbBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: DISCOVER_HOME.wheelArrowOrbBorder,
    zIndex: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  clearFilterBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  clearFilterText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  intentPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  intentPillLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.2,
  },
  topAppBarLayer: {
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 4 },
    }),
  },
  filterScroll: { gap: 8, paddingVertical: 8 },
  filterEdgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 2,
  },
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