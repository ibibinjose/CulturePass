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
import {
  Vitrine,
  FontFamily,
  Spacing,
  CultureTokens,
  gradients,
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
  indigenous: '#2E7D32', // earthy green, respectful
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
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
              backgroundColor: CultureTokens.terracottaGlow + (isDark ? '14' : '0f'),
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

          {/* Quick intent pills — one-tap access to high-frequency journeys (major UX improvement) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: pageSidePad, gap: 8, paddingBottom: 4 }}
            style={{ marginBottom: Spacing.sm }}
          >
            <IntentPill
              label="Today"
              icon="today"
              accentColor={CultureTokens.terracottaGlow}
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
              {
                marginHorizontal: pageSidePad,
                marginBottom: Spacing.md,
                borderRadius: Radius.lg,
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 215, 0, 0.12)' : 'rgba(218, 165, 32, 0.18)',
                backgroundColor: isDark ? 'rgba(30, 30, 35, 0.65)' : 'rgba(255, 255, 255, 0.75)',
                overflow: 'hidden',
                transform: [{ scale: pressed ? 0.98 : (hovered ? 1.01 : 1) }],
                ...Platform.select({
                  web: {
                    boxShadow: hovered 
                      ? '0 12px 32px rgba(126, 87, 194, 0.12)' 
                      : '0 4px 12px rgba(0,0,0,0.02)',
                    backdropFilter: 'blur(16px)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'pointer',
                  },
                }),
              },
            ]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(126, 87, 194, 0.15)', 'rgba(255, 112, 67, 0.12)']
                  : ['rgba(126, 87, 194, 0.06)', 'rgba(255, 112, 67, 0.05)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View 
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 22, 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  alignItems: 'center', 
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 24 }}>🎡</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14.5, fontFamily: FontFamily.bold, color: colors.text }}>
                    Spin the CultureWheel
                  </Text>
                  <View 
                    style={{ 
                      paddingHorizontal: 6, 
                      paddingVertical: 1.5, 
                      borderRadius: 4, 
                      backgroundColor: m3Colors.primaryContainer,
                    }}
                  >
                    <Text style={{ fontSize: 8.5, fontFamily: FontFamily.bold, color: m3Colors.onPrimaryContainer, letterSpacing: 0.5 }}>
                      NEW
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11.5, fontFamily: FontFamily.medium, color: colors.textSecondary, lineHeight: 15 }}>
                  Unsure what to do? Let the wheel decide! Explore events, food, and classes around you.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={m3Colors.primary} />
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
                const accent = categoryAccent[f.id] || m3Colors.primary;
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
              style={{ alignSelf: 'flex-start', marginLeft: pageSidePad, marginBottom: Spacing.sm, marginTop: 4 }}
              hitSlop={8}
              accessibilityLabel="Clear filter"
            >
              <Text 
                style={{ 
                  fontSize: 12, 
                  color: m3Colors.primary, 
                  fontFamily: FontFamily.medium 
                }}
              >
                Clear filter · Show everything
              </Text>
            </Pressable>
          )}

          {activeFilter === 'search' && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View
                style={[ds.searchBar, {
                  marginHorizontal: pageSidePad,
                  backgroundColor: m3Colors.surface,
                  height: 56,
                  borderRadius: 28,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: m3Colors.outlineVariant,
                }]}
              >
                <Ionicons name="search" size={24} color={m3Colors.primary} />
                <TextInput
                  ref={searchInputRef as any}
                  style={[ds.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                  placeholder="Search events, places, movies..."
                  placeholderTextColor={m3Colors.onSurfaceVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  accessibilityLabel="Search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                    <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
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

        {/* CultureWheel Modal */}
        <CultureWheelModal
          visible={wheelVisible}
          onClose={() => setWheelVisible(false)}
          events={s.nearby.filter((i) => typeof i !== 'string')}
          dining={d.restaurantPreviewItems}
          perks={d.perksPreviewItems}
          classes={classEvents}
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
  
  const bg = accentColor 
    ? (isDark ? `${accentColor}1C` : `${accentColor}12`)
    : (isDark ? 'rgba(30, 30, 35, 0.5)' : 'rgba(255, 255, 255, 0.7)');
    
  const border = accentColor 
    ? `${accentColor}4A` 
    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
    
  const iconColor = accentColor || colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: 1.2,
          borderColor: border,
          transform: [{ scale: pressed ? 0.96 : (hovered ? 1.04 : 1) }],
          ...Platform.select({
            web: {
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: hovered 
                ? `0 6px 20px ${iconColor}28` 
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
      <Ionicons name={icon} size={15} color={iconColor} />
      <Text
        style={{
          fontSize: 13,
          fontFamily: FontFamily.semibold,
          color: colors.onSurface,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
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