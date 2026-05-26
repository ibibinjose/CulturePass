/**
 * Desktop-web Community hub — warm cultural aesthetic, two-column layout
 * (feed + compact right rail). Global app nav lives in the web shell sidebar;
 * this header only shows Community sub-navigation (Feed, My Groups, …).
 */
import React, { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
  type LayoutChangeEvent,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import EventCard from '@/components/Discover/EventCard';
import { getCommunityProfilePathId } from '@/lib/community';
import type { Community, EventData } from '@/shared/schema';
import { listingCreateNavigateParams } from '@/constants/navigation/experienceNav';
import { GlassView } from '@/design-system/ui/GlassView';
import { useColors, useIsDark } from '@/hooks/useColors';

function normCityToken(v: string | undefined) {
  return String(v ?? '').trim().toLowerCase();
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cultural: 'color-palette-outline',
  local_community: 'home-outline',
  arts_sports_club: 'trophy-outline',
  business: 'briefcase-outline',
  brand: 'pricetag-outline',
  council: 'business-outline',
  charity: 'heart-outline',
  club: 'people-outline',
  professional: 'ribbon-outline',
};

const FALLBACK_CATEGORY_CHIPS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  q: string;
}[] = [
  { key: 'cultural', label: 'Cultural hubs', icon: 'color-palette-outline', q: 'cultural community' },
  { key: 'food', label: 'Food & culture', icon: 'restaurant-outline', q: 'food culture' },
  { key: 'music', label: 'Music & dance', icon: 'musical-notes-outline', q: 'music dance' },
  { key: 'festival', label: 'Festivals', icon: 'sparkles-outline', q: 'festival' },
  { key: 'heritage', label: 'Heritage', icon: 'library-outline', q: 'heritage' },
  { key: 'language', label: 'Language exchange', icon: 'chatbubbles-outline', q: 'language exchange' },
];

function labelForCommunityCategoryKey(key: string): string {
  const k = key.toLowerCase();
  if (k === 'cultural') return 'Cultural hubs';
  if (k === 'local_community') return 'Local communities';
  if (k === 'arts_sports_club') return 'Art & sports clubs';
  if (k === 'business') return 'Business networks';
  if (k === 'brand') return 'Brands';
  if (k === 'council') return 'Civic & council';
  if (k === 'charity') return 'Charities';
  if (k === 'club') return 'Clubs & societies';
  if (k === 'professional') return 'Professional networks';
  return `${key.charAt(0).toUpperCase()}${key.slice(1)} hubs`;
}

function deriveCategoryChipsFromCommunities(communities: Community[], max: number) {
  const counts = new Map<string, number>();
  for (const c of communities) {
    const raw = (c.communityCategory ?? c.category ?? 'cultural') as string;
    const key = String(raw).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([key]) => ({
      key,
      label: labelForCommunityCategoryKey(key),
      icon: CATEGORY_ICONS[key] ?? 'apps-outline',
      q: `${labelForCommunityCategoryKey(key)} ${key}`,
    }));
}

function formatEventDay(iso: string | undefined) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function eventThumbUrl(e: EventData) {
  return e.heroImageUrl || e.imageUrl || '';
}

function eventHostLine(e: EventData) {
  return e.hostName || e.hostInfo?.name || e.venue || e.city || 'Event';
}

/** Compact right column — suggested hubs + stats */
const RIGHT_W = 248;
/** Deep ink for text on light “card” surfaces — aligned with brand navy, not one-off teal */
const INK_ON_LIGHT = '#0B1530';
/** Primary CTA rail — CulturePass coral (replaces ad-hoc terracotta) */
const HUB_CTA = CultureTokens.coral;

export type CommunityDesktopJumpKey =
  | 'feed'
  | 'composer'
  | 'trending'
  | 'categories'
  | 'members'
  | 'upcoming'
  | 'joined'
  | 'following'
  | 'saved'
  | 'explore'
  | 'orbitEvents';

type JumpKey = CommunityDesktopJumpKey;

/** React Native web adds `hovered` to pressable state; widen for style callbacks. */
type PressableStateWeb = PressableStateCallbackType & { hovered?: boolean };

export interface CommunityWebDesktopLayoutProps {
  cityName: string;
  cityCountry: string;
  contentWidth: number;
  shellPad: number;
  joinedCommunities: Community[];
  followingNotMember: Community[];
  savedCommunities: Community[];
  exploreNearby: Community[];
  allCommunities: Community[];
  cityEvents: EventData[];
  orbitEvents: EventData[];
  /** From `api.discover.trending()`, optionally filtered to the user’s city in the parent. */
  trendingEvents: EventData[];
  trendingLoading?: boolean;
  joinedCount: number;
  followingOnlyCount: number;
  savedCount: number;
  exploreCount: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Optional rails below the main feed; each block scrolls from the sub-nav when `anchor` matches. */
  anchoredSections?: { anchor: JumpKey; children: ReactNode }[];
  childrenRails?: ReactNode;
}

export function CommunityWebDesktopLayout({
  cityName,
  cityCountry,
  contentWidth,
  shellPad,
  joinedCommunities,
  followingNotMember,
  savedCommunities,
  exploreNearby,
  allCommunities,
  cityEvents,
  orbitEvents,
  trendingEvents,
  trendingLoading = false,
  joinedCount,
  followingOnlyCount,
  savedCount,
  exploreCount,
  refreshing,
  onRefresh,
  anchoredSections,
  childrenRails,
}: CommunityWebDesktopLayoutProps) {
  const colors = useColors();
  const isDark = useIsDark();

  /** Section / body copy on the main column sits on the page gradient — white type is illegible in light mode. */
  const sectionTitleOnPage = useMemo((): StyleProp<TextStyle> => {
    return [
      styles.sectionTitleLight,
      !isDark &&
        (Platform.OS === 'web'
          ? ({ color: colors.text, textShadow: 'none' } as TextStyle)
          : {
              color: colors.text,
              textShadowRadius: 0,
              textShadowOffset: { width: 0, height: 0 },
              textShadowColor: 'transparent',
            }),
    ];
  }, [isDark, colors.text]);

  const bodyMutedOnPage = useMemo((): StyleProp<TextStyle> => {
    return [styles.mutedLight, !isDark && { color: colors.textSecondary }];
  }, [isDark, colors.textSecondary]);

  const captionMutedOnPage = useMemo((): StyleProp<TextStyle> => {
    return [styles.mutedLightSmall, !isDark && { color: colors.textTertiary }];
  }, [isDark, colors.textTertiary]);

  const railSideHeading = useMemo((): StyleProp<TextStyle> => {
    return [styles.sideHeading, !isDark && { color: colors.textSecondary }];
  }, [isDark, colors.textSecondary]);

  const railSuggestName = useMemo((): StyleProp<TextStyle> => {
    return [styles.suggestName, !isDark && { color: colors.text }];
  }, [isDark, colors.text]);

  const railSuggestMeta = useMemo((): StyleProp<TextStyle> => {
    return [styles.suggestMeta, !isDark && { color: colors.textTertiary }];
  }, [isDark, colors.textTertiary]);

  const railThumbLetter = useMemo((): StyleProp<TextStyle> => {
    return [styles.suggestThumbTxt, !isDark && { color: colors.text }];
  }, [isDark, colors.text]);

  const railStatsBody = useMemo((): StyleProp<TextStyle> => {
    return [styles.statsBody, !isDark && { color: colors.textSecondary }];
  }, [isDark, colors.textSecondary]);

  const railStatsBox = useMemo((): StyleProp<ViewStyle> => {
    return [styles.statsBox, !isDark && { backgroundColor: colors.surface, borderColor: colors.borderLight }];
  }, [isDark, colors.surface, colors.borderLight]);

  const railTagPill = useMemo((): StyleProp<ViewStyle> => {
    return [
      styles.tagPill,
      !isDark && { backgroundColor: colors.backgroundSecondary, borderColor: colors.borderLight },
    ];
  }, [isDark, colors.backgroundSecondary, colors.borderLight]);

  const railTagText = useMemo((): StyleProp<TextStyle> => {
    return [styles.tagText, !isDark && { color: colors.text }];
  }, [isDark, colors.text]);

  const scrollRef = useRef<ScrollView>(null);
  const yRef = useRef<Partial<Record<JumpKey, number>>>({});
  const [navHighlight, setNavHighlight] = useState<JumpKey>('feed');

  const onLay = useCallback((k: JumpKey) => (e: LayoutChangeEvent) => {
    yRef.current[k] = e.nativeEvent.layout.y;
  }, []);

  const jump = useCallback((k: JumpKey) => {
    setNavHighlight(k);
    const y = yRef.current[k];
    requestAnimationFrame(() => {
      const yy = yRef.current[k] ?? y;
      if (yy == null) return;
      scrollRef.current?.scrollTo({ y: Math.max(0, yy - 8), animated: true });
    });
  }, []);

  const displayEvents = useMemo(() => {
    const merged = [...cityEvents, ...orbitEvents];
    const seen = new Set<string>();
    const out: EventData[] = [];
    for (const e of merged) {
      if (!e?.id || seen.has(e.id)) continue;
      seen.add(e.id);
      out.push(e);
      if (out.length >= 12) break;
    }
    return out;
  }, [cityEvents, orbitEvents]);

  const memberShowcase = useMemo(() => {
    const pool = [...joinedCommunities, ...exploreNearby, ...allCommunities];
    const seen = new Set<string>();
    const out: Community[] = [];
    for (const c of pool) {
      if (!c?.id || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      if (out.length >= 10) break;
    }
    return out;
  }, [joinedCommunities, exploreNearby, allCommunities]);

  const suggestedHubs = exploreNearby.slice(0, 4);

  const cityScopedCommunities = useMemo(() => {
    const cn = normCityToken(cityName);
    const countryN = normCityToken(cityCountry);
    return allCommunities.filter((c) => normCityToken(c.city) === cn && normCityToken(c.country) === countryN);
  }, [allCommunities, cityName, cityCountry]);

  const categoryChips = useMemo(() => {
    const derived = deriveCategoryChipsFromCommunities(cityScopedCommunities, 8);
    if (derived.length > 0) return derived;
    return FALLBACK_CATEGORY_CHIPS;
  }, [cityScopedCommunities]);

  const cultureTopicTags = useMemo(() => {
    const s = new Set<string>();
    for (const c of cityScopedCommunities) {
      for (const x of c.cultures ?? []) {
        const t = String(x).trim();
        if (t.length > 1 && t.length < 40) s.add(t);
      }
    }
    for (const e of displayEvents) {
      for (const x of e.tags ?? []) {
        const t = String(x).trim();
        if (t.length > 1 && t.length < 40) s.add(t);
      }
      const ct = e.cultureTag ?? e.cultureTags ?? [];
      for (const x of ct) {
        const t = String(x).trim();
        if (t.length > 1 && t.length < 40) s.add(t);
      }
    }
    return [...s].slice(0, 12);
  }, [cityScopedCommunities, displayEvents]);

  const hubCount = cityScopedCommunities.length;
  const memberCount = useMemo(
    () => cityScopedCommunities.reduce((n, c) => n + (c.memberCount ?? c.membersCount ?? 0), 0),
    [cityScopedCommunities],
  );
  const upcomingCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return displayEvents.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return !Number.isNaN(d.getTime()) && d >= startOfToday;
    }).length;
  }, [displayEvents]);

  const statsLine = useMemo(() => {
    const parts = [`${hubCount} hub${hubCount === 1 ? '' : 's'} in ${cityName}`];
    if (memberCount > 0) parts.push(`${memberCount.toLocaleString()} members (listed on hubs)`);
    parts.push(`${upcomingCount} upcoming event${upcomingCount === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }, [hubCount, memberCount, upcomingCount, cityName]);

  const heroStats = useMemo(
    () => [
      { label: 'Hubs', value: hubCount },
      { label: 'Members', value: memberCount },
      { label: 'Events', value: upcomingCount },
    ],
    [hubCount, memberCount, upcomingCount],
  );

  const openSearch = useCallback((q: string) => {
    router.push({ pathname: '/search', params: { q: q.trim() } });
  }, []);

  const subnavItems = useMemo(
    () =>
      [
        { kind: 'jump' as const, key: 'feed' as const, label: 'Feed', icon: 'home-outline' as const },
        { kind: 'jump' as const, key: 'joined' as const, label: 'My Groups', icon: 'people-outline' as const },
        { kind: 'jump' as const, key: 'following' as const, label: 'Following', icon: 'heart-outline' as const },
        { kind: 'jump' as const, key: 'saved' as const, label: 'Saved', icon: 'bookmark-outline' as const },
        { kind: 'jump' as const, key: 'explore' as const, label: 'Explore', icon: 'compass-outline' as const },
        { kind: 'hub' as const, key: 'startHub' as const, label: 'Start a Hub', icon: 'add-circle-outline' as const },
        {
          kind: 'city' as const,
          key: 'myCity' as const,
          label: `My City (${cityName})`,
          icon: 'location-outline' as const,
        },
      ] as const,
    [cityName],
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? ['#030711', '#0c1a32', CultureTokens.indigo + '33'] : ['#FFFBF7', '#F5F5F4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Flex wrapper: LinearGradient on web may not shrink; minHeight:0 enables nested ScrollView scroll */}
      <View style={styles.pageInner}>
      {/* App chrome (logo, global nav, profile) lives in WebSidebar — only Community tools here. */}
      <GlassView
        intensity={15}
        style={[
          styles.topChrome,
          {
            borderBottomColor: 'rgba(255,255,255,0.12)',
            paddingHorizontal: shellPad,
            backgroundColor: isDark ? 'rgba(8,12,28,0.52)' : colors.background + '88',
          },
        ]}
      >
        <View style={styles.chromeRow}>
          <View style={styles.chromeTitleCol} accessibilityRole="header">
            <Text style={[styles.chromePageTitle, { color: isDark ? 'rgba(255,255,255,0.96)' : colors.text }]}>
              Community
            </Text>
            <Text style={[styles.chromePageHint, { color: isDark ? 'rgba(255,255,255,0.5)' : colors.textTertiary }]} numberOfLines={1}>
              Feed · groups · discovery
            </Text>
          </View>

          <View
            style={[
              styles.chromeNavIsland,
              !isDark && {
                backgroundColor: colors.surface + 'F0',
                borderColor: colors.borderLight,
              },
              isDark && {
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(255,255,255,0.14)',
              },
            ]}
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.chromeSubnavTrack}
              contentContainerStyle={styles.chromeSubnavScrollContent}
            >
              {subnavItems.map((item) => {
                if (item.kind !== 'jump') return null;
                const active = navHighlight === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => jump(item.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.label}
                  >
                    {({ pressed, hovered }: PressableStateWeb) => (
                      <View
                        style={[
                          styles.subnavTab,
                          active && styles.subnavTabActive,
                          !active &&
                            !isDark &&
                            (hovered ? styles.subnavTabHoverLight : styles.subnavTabIdleLight),
                          !active && isDark && (hovered ? styles.subnavTabHoverDark : styles.subnavTabIdleDark),
                          pressed && styles.subnavPressed,
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={14}
                          color={active ? '#fff' : isDark ? 'rgba(255,255,255,0.82)' : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.subnavTabLabel,
                            active && styles.subnavTabLabelActive,
                            !active && !isDark && { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View
              style={[
                styles.chromeNavDivider,
                { borderLeftColor: isDark ? 'rgba(255,255,255,0.16)' : colors.borderLight },
              ]}
            />

            <View style={styles.chromeNavTrailing}>
              {subnavItems.map((item) => {
                if (item.kind === 'hub') {
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => router.push(listingCreateNavigateParams('community') as never)}
                      accessibilityRole="button"
                      accessibilityLabel="Start a hub"
                    >
                      {({ pressed, hovered }: PressableStateWeb) => (
                        <View
                          style={[
                            styles.subnavCta,
                            hovered && styles.subnavCtaHover,
                            pressed && styles.subnavPressed,
                          ]}
                        >
                          <Ionicons name={item.icon} size={14} color="#fff" />
                          <Text style={styles.subnavCtaLabel}>{item.label}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }
                if (item.kind === 'city') {
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => router.push('/(tabs)/city')}
                      accessibilityRole="button"
                      accessibilityLabel={`My city ${cityName}`}
                    >
                      {({ pressed, hovered }: PressableStateWeb) => (
                        <View
                          style={[
                            styles.subnavCity,
                            !isDark && {
                              backgroundColor: colors.primarySoft,
                              borderColor: colors.borderLight,
                            },
                            hovered && (isDark ? styles.subnavCityHover : styles.subnavCityHoverLight),
                            pressed && styles.subnavPressed,
                          ]}
                        >
                          <Ionicons
                            name={item.icon}
                            size={14}
                            color={isDark ? CultureTokens.gold : CultureTokens.indigo}
                          />
                          <Text
                            style={[styles.subnavCityLabel, !isDark && { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }
                return null;
              })}
            </View>
          </View>
        </View>
        <View style={styles.chromeSearchRow}>
          <Pressable
            onPress={() => router.push('/search')}
            accessibilityRole="button"
            accessibilityLabel="Search communities, discussions, or people"
          >
            {({ pressed, hovered }: PressableStateWeb) => (
              <GlassView
                intensity={10}
                style={[
                  styles.chromeSearchShell,
                  hovered && styles.chromeSearchHover,
                  pressed && styles.subnavPressed,
                  !isDark && { backgroundColor: colors.surface + '80', borderColor: colors.borderLight },
                ]}
              >
                <Ionicons name="search-outline" size={18} color={isDark ? "rgba(255,255,255,0.55)" : colors.textTertiary} />
                <Text style={[styles.chromeSearchPlaceholder, !isDark && { color: colors.textTertiary }]} numberOfLines={1}>
                  Search communities, discussions, or people…
                </Text>
              </GlassView>
            )}
          </Pressable>
        </View>
      </GlassView>

      <View
        style={[
          styles.columns,
          {
            paddingHorizontal: shellPad,
            maxWidth: contentWidth + 32,
            alignSelf: 'center',
            ...(Platform.OS === 'web' ? { width: '100%' as unknown as number } : {}),
          },
        ]}
      >
        {/* Main feed column — flex fills space; right rail stays fixed width at row end */}
        <ScrollView
          ref={scrollRef}
          style={styles.centerCol}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? '#fff' : colors.primary}
              />
            ) : undefined
          }
        >
          <View style={styles.heroCard} onLayout={onLay('feed')}>
            <View style={styles.patternOverlay} pointerEvents="none" />
            <LinearGradient
              colors={['rgba(0,51,102,0.88)', 'rgba(46,196,182,0.28)', 'rgba(124,58,237,0.2)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroInner}>
              <View style={styles.heroMetaRow}>
                <GlassView intensity={12} style={styles.heroMetaPill}>
                  <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.92)" />
                  <Text style={styles.heroMetaText}>Community hub</Text>
                </GlassView>
                <GlassView intensity={12} style={styles.heroMetaPill}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.92)" />
                  <Text style={styles.heroMetaText} numberOfLines={1}>
                    {cityName}, {cityCountry}
                  </Text>
                </GlassView>
              </View>
              <Text style={styles.heroTitle}>Community</Text>
              <Text style={styles.heroSub}>
                Connect with culture lovers • Share your stories • Discover new traditions together
              </Text>
              <View style={styles.heroStatsRow}>
                {heroStats.map((stat) => (
                  <GlassView key={stat.label} intensity={10} style={styles.heroStatPill}>
                    <Text style={styles.heroStatValue}>{stat.value.toLocaleString()}</Text>
                    <Text style={styles.heroStatLabel}>{stat.label}</Text>
                  </GlassView>
                ))}
              </View>
              <Pressable onPress={() => openSearch(`community ${cityName}`)} accessibilityRole="button">
                {({ pressed, hovered }: PressableStateWeb) => (
                  <View
                    style={[
                      styles.heroCta,
                      hovered && styles.heroCtaHover,
                      pressed && styles.heroCtaPressed,
                    ]}
                  >
                    <Text style={styles.heroCtaText}>Join the conversation</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                )}
              </Pressable>
              <Text style={styles.heroCityLine}>
                Celebrating heritage in {cityName}, {cityCountry}
              </Text>
            </View>
          </View>

          <GlassView
            intensity={12}
            style={[
              styles.creamCard,
              !isDark && { backgroundColor: colors.surface, borderColor: colors.borderLight },
              isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
            ]}
            onLayout={onLay('composer')}
          >
            <View style={styles.composerHeader}>
              <View style={[styles.composerAvatar, !isDark && { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="sparkles" size={16} color={isDark ? '#fff' : CultureTokens.indigo} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.composerLabel, !isDark && { color: INK_ON_LIGHT }]}>
                  Share your cultural moment…
                </Text>
                <Text style={[styles.composerSub, !isDark && { color: colors.textSecondary }]}>
                  Post a story, event, or memory to inspire your community.
                </Text>
              </View>
            </View>
            <View style={styles.composerActions}>
              {[
                { label: 'Post', icon: 'create-outline', action: () => router.push(listingCreateNavigateParams('community') as never) },
                { label: 'Photo', icon: 'image-outline', action: () => router.push(listingCreateNavigateParams('community') as never) },
                { label: 'Event', icon: 'calendar-outline', action: () => router.push('/event/create') },
                { label: 'Explore', icon: 'bar-chart-outline', action: () => openSearch(`${cityName} community`) },
              ].map((item) => (
                <Pressable key={item.label} onPress={item.action} accessibilityRole="button">
                  {({ pressed, hovered }: PressableStateWeb) => (
                    <View
                      style={[
                        styles.composerChip,
                        !isDark && { backgroundColor: colors.primarySoft, borderColor: colors.borderLight },
                        isDark && { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.18)' },
                        hovered && styles.composerChipHover,
                        pressed && styles.subnavPressed,
                      ]}
                    >
                      <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={16} color={isDark ? '#fff' : INK_ON_LIGHT} />
                      <Text style={[styles.composerChipText, isDark && { color: '#fff' }]}>{item.label}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </GlassView>

          <View style={styles.sectionBlock} onLayout={onLay('trending')}>
            <Text style={sectionTitleOnPage}>Trending events</Text>
            {trendingLoading && trendingEvents.length === 0 ? (
              <View style={styles.trendLoading}>
                <ActivityIndicator color={isDark ? '#fff' : colors.primary} />
                <Text style={[bodyMutedOnPage, { marginTop: 10 }]}>Loading trending…</Text>
              </View>
            ) : trendingEvents.length === 0 ? (
              <Text style={bodyMutedOnPage}>
                No trending events from the API yet — open search or the calendar to discover what&apos;s on in {cityName}.
              </Text>
            ) : (
              <View style={styles.trendGrid}>
                {trendingEvents.map((ev) => {
                  const thumb = eventThumbUrl(ev);
                  const day = formatEventDay(ev.date);
                  const host = eventHostLine(ev);
                  const going = ev.attending ?? ev.rsvpGoing;
                  return (
                    <Pressable
                      key={ev.id}
                      onPress={() => router.push({ pathname: '/e/[id]', params: { id: ev.id } })}
                      style={styles.trendCard}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.trendThumb} contentFit="cover" />
                      ) : (
                        <View style={[styles.trendThumb, { backgroundColor: ev.imageColor || 'rgba(255,255,255,0.12)' }]} />
                      )}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.trendGrad} />
                      <View style={styles.trendBody}>
                        <Text style={styles.trendTitle} numberOfLines={2}>
                          {ev.title}
                        </Text>
                        <View style={styles.trendMeta}>
                          <View style={styles.trendAuthor}>
                            <View style={styles.trendAvatar}>
                              <Text style={styles.trendAvatarText}>{host.charAt(0).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.trendAuthorName} numberOfLines={1}>
                              {host}
                            </Text>
                          </View>
                          <Text style={styles.trendCounts} numberOfLines={1}>
                            {day ? `${day}` : ''}
                            {day && going != null && going > 0 ? ' · ' : ''}
                            {going != null && going > 0 ? `${going} going` : ''}
                            {!day && (going == null || going <= 0) ? (ev.city ? ev.city : '') : ''}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.sectionBlock} onLayout={onLay('categories')}>
            <Text style={sectionTitleOnPage}>Explore communities</Text>
            <View style={styles.catGrid}>
              {categoryChips.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => openSearch(`${c.q} ${cityName}`)}
                  accessibilityRole="button"
                >
                  {({ pressed, hovered }: PressableStateWeb) => (
                    <GlassView
                      intensity={10}
                      style={[
                        styles.catCell,
                        !isDark && { backgroundColor: colors.surface, borderColor: colors.borderLight },
                        isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' },
                        hovered && styles.catCellHover,
                        pressed && styles.subnavPressed,
                      ]}
                    >
                      <LinearGradient colors={[CultureTokens.indigo, CultureTokens.teal]} style={styles.catIcon}>
                        <Ionicons name={c.icon} size={22} color={CultureTokens.gold} />
                      </LinearGradient>
                      <Text style={[styles.catLabel, isDark && { color: colors.text }]}>{c.label}</Text>
                    </GlassView>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock} onLayout={onLay('members')}>
            <Text style={sectionTitleOnPage}>Active community members</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {memberShowcase.length === 0 ? (
                <Text style={bodyMutedOnPage}>Join communities to see hosts and members here.</Text>
              ) : (
                memberShowcase.map((c) => (
                  <GlassView
                    key={c.id}
                    intensity={10}
                    style={[
                      styles.memberCard,
                      !isDark && { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      isDark && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' },
                    ]}
                  >
                    {c.imageUrl ? (
                      <Image source={{ uri: c.imageUrl }} style={styles.memberAvatarImg} contentFit="cover" />
                    ) : (
                      <View style={[styles.memberAvatarImg, styles.memberAvatarPh]}>
                        <Text style={styles.memberAvatarLetter}>{c.name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={[styles.memberName, isDark && { color: colors.text }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={[styles.memberBio, isDark && { color: colors.textSecondary }]} numberOfLines={2}>
                      {(c.cultures ?? []).slice(0, 2).join(' · ') || c.communityCategory || c.headline || 'Cultural hub'}
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/c/[id]', params: { id: getCommunityProfilePathId(c) } })
                      }
                      style={styles.memberFollow}
                    >
                      <Text style={styles.memberFollowText}>View hub</Text>
                    </Pressable>
                  </GlassView>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.sectionBlock} onLayout={onLay('upcoming')}>
            <Text style={sectionTitleOnPage}>Upcoming community events</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {displayEvents.length === 0 ? (
                <Text style={bodyMutedOnPage}>No events listed for {cityName} yet — check the calendar.</Text>
              ) : (
                displayEvents.map((event, i) => (
                  <View key={event.id} style={{ width: 260 }}>
                    <EventCard
                      event={event}
                      index={i}
                      layout="stacked"
                      schedulingMode="live_and_countdown"
                      containerWidth={260}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {anchoredSections?.map(({ anchor, children: block }) => (
            <View key={anchor} onLayout={onLay(anchor)} style={{ marginBottom: 24 }}>
              {block}
            </View>
          ))}

          {childrenRails}
        </ScrollView>

        {/* Right rail — compact, pinned to trailing edge of row */}
        <View style={[styles.rightCol, { width: RIGHT_W }]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.05)']
                : [colors.surface + 'F2', colors.surface + 'CC']
            }
            style={styles.glassPanel}
          >
            <Text style={railSideHeading}>Suggested hubs</Text>
            {suggestedHubs.length === 0 ? (
              <Text style={captionMutedOnPage}>Explore search to find hubs near you.</Text>
            ) : (
              suggestedHubs.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    router.push({ pathname: '/c/[id]', params: { id: getCommunityProfilePathId(c) } })
                  }
                  style={styles.suggestRow}
                >
                  {c.imageUrl ? (
                    <Image source={{ uri: c.imageUrl }} style={styles.suggestThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.suggestThumb, styles.suggestThumbPh]}>
                      <Text style={railThumbLetter}>{c.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={railSuggestName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={railSuggestMeta} numberOfLines={1}>
                      {c.city ?? cityName}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}

            <View style={railStatsBox}>
              <Text style={styles.statsTitle}>Community pulse</Text>
              <Text style={railStatsBody}>{statsLine}</Text>
            </View>

            <Text style={[railSideHeading, { marginTop: 16 }]}>Topics near {cityName}</Text>
            {cultureTopicTags.length === 0 ? (
              <Text style={captionMutedOnPage}>Topics appear from hub cultures and local event tags.</Text>
            ) : (
              <View style={styles.tagWrap}>
                {cultureTopicTags.map((tag) => (
                  <Pressable key={tag} onPress={() => openSearch(`${tag} ${cityName}`)} style={railTagPill}>
                    <Text style={railTagText}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageGradient: {
    flex: 1,
    minHeight: '100%' as unknown as number,
    ...(Platform.OS === 'web' ? { minHeight: 0 as unknown as number, height: '100%' as unknown as number } : {}),
  },
  pageInner: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web' ? { minHeight: 0 as unknown as number, overflow: 'hidden' as const } : {}),
  },
  topChrome: {
    backgroundColor: 'rgba(8,12,28,0.52)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' as unknown as undefined } : {}),
  },
  chromeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'nowrap',
    ...(Platform.OS === 'web' ? { maxWidth: '100%' as unknown as number } : {}),
  },
  chromeTitleCol: {
    flexShrink: 0,
    maxWidth: 128,
    ...(Platform.OS === 'web' ? { maxWidth: 140 as unknown as number } : {}),
  },
  chromePageTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.96)',
    letterSpacing: -0.35,
  },
  chromePageHint: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.15,
  },
  /** Single surface: scrollable segment tabs + fixed Hub / My City */
  chromeNavIsland: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 3,
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 0 rgba(0,0,0,0.04)' } : {}),
  },
  chromeSubnavTrack: {
    flex: 1,
    minWidth: 72,
  },
  chromeSubnavScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 4,
    paddingRight: 2,
    paddingVertical: 2,
  },
  chromeNavDivider: {
    width: 0,
    alignSelf: 'stretch',
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  chromeNavTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    paddingRight: 4,
  },
  subnavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subnavTabIdleLight: {
    backgroundColor: 'transparent',
  },
  subnavTabIdleDark: {
    backgroundColor: 'transparent',
  },
  subnavTabHoverLight: {
    backgroundColor: CultureTokens.indigo + '12',
    borderColor: CultureTokens.indigo + '22',
  },
  subnavTabHoverDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  subnavTabActive: {
    backgroundColor: CultureTokens.indigo,
    borderColor: CultureTokens.indigo,
  },
  subnavTabLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  subnavTabLabelActive: {
    color: '#fff',
  },
  subnavPressed: { opacity: 0.88 },
  subnavCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: HUB_CTA,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  subnavCtaLabel: { fontFamily: FontFamily.bold, fontSize: 11, color: '#fff', letterSpacing: 0.2 },
  subnavCtaHover: {
    backgroundColor: '#ff7a77',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  subnavCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: CultureTokens.gold + '99',
    maxWidth: 200,
  },
  subnavCityLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    flexShrink: 1,
  },
  subnavCityHover: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: CultureTokens.gold,
  },
  subnavCityHoverLight: {
    backgroundColor: CultureTokens.indigo + '10',
    borderColor: CultureTokens.indigo + '35',
  },
  chromeSearchRow: {
    marginTop: 12,
    width: '100%' as unknown as number,
  },
  chromeSearchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%' as unknown as number,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  chromeSearchHover: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.32)',
  },
  chromeSearchPlaceholder: {
    flex: 1,
    color: 'rgba(255,255,255,0.48)',
    fontFamily: FontFamily.regular,
    fontSize: 14,
  },
  columns: {
    flexDirection: 'row',
    /** stretch so the main ScrollView gets a bounded viewport height and scrolls; flex-start was sizing it to full content */
    alignItems: 'stretch',
    gap: 28,
    flex: 1,
    minHeight: 0,
    paddingTop: 16,
  },
  centerCol: { flex: 1, minWidth: 0, minHeight: 0 },
  rightCol: { flexShrink: 0, alignSelf: 'flex-start' },
  glassPanel: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sideHeading: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 220,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
    backgroundColor: 'transparent',
    // subtle dots
    ...(Platform.OS === 'web'
      ? {
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0px, transparent 2px), radial-gradient(circle at 80% 70%, rgba(255,200,120,0.35) 0px, transparent 2px)',
        }
      : {}),
  },
  heroInner: { padding: 28, zIndex: 2 },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroMetaText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  heroTitle: {
    fontSize: 40,
    fontFamily: FontFamily.bold,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    maxWidth: 560,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  heroStatPill: {
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'flex-start',
  },
  heroStatValue: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#fff',
  },
  heroStatLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroCta: {
    marginTop: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: HUB_CTA,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  heroCtaHover: {
    backgroundColor: '#ff7a77',
  },
  heroCtaPressed: {
    opacity: 0.9,
  },
  heroCtaText: { fontFamily: FontFamily.bold, fontSize: 15, color: '#fff' },
  heroCityLine: { marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: FontFamily.medium },
  creamCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  composerLabel: { fontFamily: FontFamily.semibold, fontSize: 15, color: 'rgba(255,255,255,0.92)' },
  composerSub: { marginTop: 4, fontFamily: FontFamily.regular, fontSize: 12, color: 'rgba(255,255,255,0.68)' },
  composerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  composerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  composerChipHover: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  composerChipText: { fontFamily: FontFamily.semibold, fontSize: 13, color: INK_ON_LIGHT },
  sectionBlock: { marginBottom: 24 },
  sectionTitleLight:
    Platform.OS === 'web'
      ? ({
          fontFamily: FontFamily.bold,
          fontSize: 20,
          color: '#fff',
          marginBottom: 14,
          textShadow: '0 1px 4px rgba(0,0,0,0.25)',
        } as TextStyle)
      : ({
          fontFamily: FontFamily.bold,
          fontSize: 20,
          color: '#fff',
          marginBottom: 14,
          textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        } as TextStyle),
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  trendLoading: { paddingVertical: 24, alignItems: 'center' },
  trendCard: {
    width: '31%' as unknown as number,
    minWidth: 200,
    flexGrow: 1,
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  trendThumb: { ...StyleSheet.absoluteFill },
  trendGrad: { ...StyleSheet.absoluteFill },
  trendBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14 },
  trendTitle: { color: '#fff', fontFamily: FontFamily.bold, fontSize: 15, lineHeight: 20 },
  trendMeta: { marginTop: 8 },
  trendAuthor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trendAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: HUB_CTA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendAvatarText: { color: '#fff', fontSize: 11, fontFamily: FontFamily.bold },
  trendAuthorName: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: FontFamily.semibold },
  trendCounts: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4, fontFamily: FontFamily.regular },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCell: {
    width: '23%' as unknown as number,
    minWidth: 120,
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  catCellHover: {
    borderColor: CultureTokens.indigo + '55',
    transform: [{ translateY: -1 }],
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catLabel: { fontFamily: FontFamily.semibold, fontSize: 12, color: INK_ON_LIGHT, textAlign: 'center' },
  memberCard: {
    width: 168,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  memberAvatarImg: { width: '100%', height: 100, borderRadius: 12, backgroundColor: '#e8e8e8' },
  memberAvatarPh: { alignItems: 'center', justifyContent: 'center', backgroundColor: CultureTokens.indigo },
  memberAvatarLetter: { color: '#fff', fontSize: 32, fontFamily: FontFamily.bold },
  memberName: { marginTop: 10, fontFamily: FontFamily.bold, fontSize: 14, color: INK_ON_LIGHT },
  memberBio: { marginTop: 4, fontSize: 12, color: INK_ON_LIGHT, opacity: 0.72, fontFamily: FontFamily.regular, minHeight: 32 },
  memberFollow: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: CultureTokens.indigo,
    alignItems: 'center',
  },
  memberFollowText: { color: '#fff', fontFamily: FontFamily.bold, fontSize: 12 },
  mutedLight: { color: 'rgba(255,255,255,0.75)', fontFamily: FontFamily.regular, fontSize: 14 },
  mutedLightSmall: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: FontFamily.regular },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  suggestThumb: { width: 36, height: 36, borderRadius: 8 },
  suggestThumbPh: { backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  suggestThumbTxt: { color: '#fff', fontFamily: FontFamily.bold, fontSize: 13 },
  suggestName: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 13 },
  suggestMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  statsBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsTitle: { color: CultureTokens.gold, fontFamily: FontFamily.bold, fontSize: 11, marginBottom: 4 },
  statsBody: { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 16, fontFamily: FontFamily.regular },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tagText: { color: '#fff', fontSize: 10, fontFamily: FontFamily.semibold },
});
