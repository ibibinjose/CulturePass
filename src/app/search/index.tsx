import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Button, M3Card, M3FilterChip } from '@/design-system/ui';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCouncil } from '@/hooks/useCouncil';
import { fetchTrendingSearchSources, searchDirectory } from '@/services/searchService';
import { CultureTokens, FontFamily, Radius, ChipTokens, M3Typography } from '@/design-system/tokens/theme';
import { useSafeBack } from '@/lib/navigation';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { captureEvent } from '@/lib/analytics';
import { NavigationMetadata } from '@/components/NavigationMetadata';

type ResultType = 'event' | 'movie' | 'restaurant' | 'activity' | 'shopping' | 'community' | 'person';

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  imageUrl?: string;
};

const FALLBACK_TRENDS = ['Diwali', 'Comedy Night', 'Bollywood', 'Food Festival', 'Art Exhibition', 'Cricket'];
const IS_WEB = Platform.OS === 'web';

const SEARCH_HEAD_TITLE = `Search · ${APP_NAME}`;
const SEARCH_HEAD_DESC =
  'Find events, movies, dining, shopping, communities, and people across CulturePass.';
const SEARCH_HEAD_URL = `${SITE_ORIGIN}/search`;

const TYPE_META: Record<ResultType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string | ((colors: any) => string) }> = {
  event: { label: 'Events', icon: 'calendar', color: CultureTokens.gold },
  movie: { label: 'Movies', icon: 'film', color: CultureTokens.gold },
  restaurant: { label: 'Dining', icon: 'restaurant', color: CultureTokens.coral },
  activity: { label: 'Activities', icon: 'football', color: CultureTokens.teal },
  shopping: { label: 'Shopping', icon: 'bag-handle', color: (colors: any) => colors.primary },
  community: { label: 'Communities', icon: 'people', color: (colors: any) => colors.primary },
  person: { label: 'People', icon: 'person', color: CultureTokens.coral },
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'near', 'your', 'this', 'that', 'into', 'over', 'under',
  'city', 'community', 'group', 'event', 'events', 'movie', 'movies', 'festival', 'festivals',
  'culture', 'cultural', 'club', 'society', 'association', 'australia',
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));
}

function titleCase(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function buildTrendingTerms(payload: {
  events: any[];
  communities: any[];
  movies: any[];
  profiles: any[];
}): string[] {
  const scored = new Map<string, number>();
  const bump = (token: string, weight: number) => scored.set(token, (scored.get(token) || 0) + weight);

  for (const e of payload.events) {
    normalizeTokens(`${e.title || ''} ${e.category || ''} ${(e.tags || []).join(' ')}`).forEach((t) => bump(t, 3));
  }
  for (const c of payload.communities) {
    normalizeTokens(`${c.name || ''} ${c.communityCategory || ''} ${c.countryOfOrigin || ''}`).forEach((t) => bump(t, 2));
  }
  for (const m of payload.movies) {
    normalizeTokens(`${m.title || ''} ${(m.genre || []).join(' ')} ${m.language || ''}`).forEach((t) => bump(t, 2));
  }
  for (const p of payload.profiles) {
    normalizeTokens(`${p.name || ''} ${p.category || ''} ${p.entityType || ''}`).forEach((t) => bump(t, 1));
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token]) => titleCase(token));
}

function buildTrendIndex(payload: {
  events: any[];
  communities: any[];
  movies: any[];
  profiles: any[];
}): Map<string, number> {
  const index = new Map<string, number>();
  const bump = (term: string, weight: number) => index.set(term, (index.get(term) || 0) + weight);
  const add = (text: string, weight: number) => normalizeTokens(text).forEach((token) => bump(token, weight));

  payload.events.forEach((e) => add(`${e.title || ''} ${e.category || ''} ${(e.tags || []).join(' ')}`, 3));
  payload.communities.forEach((c) => add(`${c.name || ''} ${c.communityCategory || ''} ${c.countryOfOrigin || ''}`, 2));
  payload.movies.forEach((m) => add(`${m.title || ''} ${(m.genre || []).join(' ')} ${m.language || ''}`, 2));
  payload.profiles.forEach((p) => add(`${p.name || ''} ${p.category || ''} ${p.entityType || ''}`, 1));

  return index;
}

function mapResults(raw: any, colors: any): SearchResult[] {
  const out: SearchResult[] = [];
  const events = Array.isArray(raw?.events) ? raw.events : [];
  const movies = Array.isArray(raw?.movies) ? raw.movies : [];
  const profiles = Array.isArray(raw?.profiles) ? raw.profiles : [];
  const users = Array.isArray(raw?.users) ? raw.users : [];

  for (const e of events) {
    out.push({
      id: e.id,
      type: 'event',
      title: e.title ?? 'Event',
      subtitle: [e.venue, e.city].filter(Boolean).join(' · ') || 'Event',
      imageUrl: e.imageUrl,
    });
  }
  for (const m of movies) {
    out.push({
      id: m.id,
      type: 'movie',
      title: m.title ?? 'Movie',
      subtitle: Array.isArray(m.genre) ? m.genre.join(', ') : m.description || 'Movie',
      imageUrl: m.posterUrl || m.imageUrl,
    });
  }
  for (const p of profiles) {
    let type: ResultType = 'community';
    if (p.entityType === 'business') {
      const cat = String(p.category || '').toLowerCase();
      if (cat.includes('food') || cat.includes('restaurant')) type = 'restaurant';
      else if (cat.includes('shop') || cat.includes('retail')) type = 'shopping';
    }
    out.push({
      id: p.id,
      type,
      title: p.name ?? 'Profile',
      subtitle: [p.category || p.entityType, p.city || 'Australia'].filter(Boolean).join(' · '),
      imageUrl: p.imageUrl || p.avatarUrl,
    });
  }
  for (const u of users) {
    out.push({
      id: u.id,
      type: 'person',
      title: u.displayName || u.username || 'User',
      subtitle: `@${u.username || 'user'} · ${u.city || 'CulturePass'}`,
      imageUrl: u.avatarUrl,
    });
  }
  return out;
}

export default function SearchScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
  const { hPad, isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const goBack = useSafeBack();
  const { state } = useOnboarding();
  const appLocation = useLocation();
  const { lgaCode } = useCouncil();
  const params = useLocalSearchParams<{
    q?: string;
    publisherProfileId?: string;
    venueProfileId?: string;
  }>();

  const bottomInset = IS_WEB ? 26 : insets.bottom;
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ResultType | 'all'>('all');
  const [focused, setFocused] = useState(false);

  const publisherProfileId = useMemo(() => {
    const raw = Array.isArray(params.publisherProfileId)
      ? params.publisherProfileId[0]
      : params.publisherProfileId;
    return raw?.trim() || undefined;
  }, [params.publisherProfileId]);

  const venueProfileId = useMemo(() => {
    const raw = Array.isArray(params.venueProfileId) ? params.venueProfileId[0] : params.venueProfileId;
    return raw?.trim() || undefined;
  }, [params.venueProfileId]);

  useEffect(() => {
    const raw = Array.isArray(params.q) ? params.q[0] : params.q;
    if (!raw) return;
    try {
      setQuery(decodeURIComponent(raw));
    } catch {
      setQuery(raw);
    }
  }, [params.q]);

  const structuredSearch = Boolean(publisherProfileId) || Boolean(venueProfileId);
  const isStructuredOrText = structuredSearch || query.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['search', query, appLocation.city, appLocation.country, lgaCode, publisherProfileId, venueProfileId],
    queryFn: () =>
      searchDirectory({
        q: query.trim(),
        city: appLocation.city || undefined,
        country: appLocation.country || undefined,
        lgaCode: lgaCode || undefined,
        publisherProfileId,
        venueProfileId,
      }),
    enabled: query.trim().length >= 2 || structuredSearch,
    staleTime: 60_000,
  });

  const allResults = useMemo(() => mapResults(data, colors), [data, colors]);

  useEffect(() => {
    if (!data || query.trim().length < 2) return;
    captureEvent('search_performed', {
      query: query.trim(),
      result_count: allResults.length,
      city: state.city ?? null,
      country: state.country ?? null,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const { data: liveTrends = FALLBACK_TRENDS } = useQuery({
    queryKey: ['search-trending', appLocation.city, appLocation.country, lgaCode],
    queryFn: async () => {
      const { events, communities, movies, profiles } = await fetchTrendingSearchSources({
        city: appLocation.city || undefined,
        country: appLocation.country || undefined,
        lgaCode: lgaCode || undefined,
      });
      const computed = buildTrendingTerms({
        events: events ?? [],
        communities: communities ?? [],
        movies: movies ?? [],
        profiles: profiles ?? [],
      });
      return computed.length > 0 ? computed : FALLBACK_TRENDS;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const autoIndexedTrends = useMemo(() => {
    const events = Array.isArray(data?.events) ? data.events : [];
    const profiles = Array.isArray(data?.profiles) ? data.profiles : [];
    const movies = Array.isArray(data?.movies) ? data.movies : [];
    const communities = profiles.filter((p: any) => p.entityType === 'community');

    const index = buildTrendIndex({ events, communities, movies, profiles });
    if (index.size === 0) return liveTrends;

    const ranked = [...index.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([token]) => titleCase(token));

    return ranked.length > 0 ? ranked : liveTrends;
  }, [data, liveTrends]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allResults.length };
    for (const r of allResults) c[r.type] = (c[r.type] || 0) + 1;
    return c;
  }, [allResults]);

  const filtered = useMemo(
    () => (selectedType === 'all' ? allResults : allResults.filter((r) => r.type === selectedType)),
    [allResults, selectedType],
  );

  const onTypePress = (type: ResultType | 'all') => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedType(type);
  };

  const onResultPress = (r: SearchResult) => {
    if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    captureEvent('search_result_tapped', {
      result_id: r.id,
      result_type: r.type,
      result_title: r.title,
      query: query.trim(),
    });
    const path: Record<ResultType, string> = {
      event: '/e/[id]',
      movie: '/m/[id]',
      restaurant: '/r/[id]',
      activity: '/a/[id]',
      shopping: '/s/[id]',
      community: '/profile/[id]',
      person: '/profile/[id]',
    };
    router.push({ pathname: path[r.type], params: { id: r.id } });
  };

  return (
    <ErrorBoundary>
      <NavigationMetadata />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient
          colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FFFBF7', '#F5F5F4']}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[`${colors.primary}12`, 'transparent']}
          style={[StyleSheet.absoluteFill, { height: 600 }]}
        />

        <M3TopAppBar
            title="Search"
            onBack={goBack}
            variant="small"
            titleLeading={
              <Image
                source={require('@/assets/images/culturepass-logo.png')}
                style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
                contentFit="contain"
              />
            }
        />

        <View style={[styles.shell, isDesktop ? styles.desktopShell : null]}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(220)}>
            <View
                style={[
                    styles.searchRow,
                    {
                        marginHorizontal: hPad,
                        backgroundColor: m3Colors.surfaceContainerHigh,
                        height: 56,
                        borderRadius: 28,
                    }
                ]}
            >
              <Ionicons name="search" size={24} color={focused ? m3Colors.primary : m3Colors.onSurfaceVariant} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Events, communities, venues..."
                placeholderTextColor={m3Colors.onSurfaceVariant}
                style={[styles.searchInput, { color: m3Colors.onSurface, fontSize: 16, marginLeft: 12 }]}
                returnKeyType="search"
                accessibilityLabel="Search"
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery('')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear search">
                  <Ionicons name="close" size={24} color={m3Colors.onSurfaceVariant} />
                </Pressable>
              ) : null}
            </View>
          </Animated.View>

          <M3Card
            variant="filled"
            onPress={() => {
              if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push('/explore');
            }}
            style={[
              styles.hubEntry,
              {
                marginHorizontal: hPad,
                marginTop: 16,
                backgroundColor: m3Colors.primaryContainer,
              },
            ]}
          >
            <View style={[styles.hubIcon, { backgroundColor: m3Colors.onPrimaryContainer + '15' }]}>
                <Ionicons name="earth" size={22} color={m3Colors.onPrimaryContainer} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.hubEntryTitle, M3Typography.titleSmall, { color: m3Colors.onPrimaryContainer }]}>Explore CultureX Hubs</Text>
              <Text style={[styles.hubEntrySub, M3Typography.bodySmall, { color: m3Colors.onPrimaryContainer }]} numberOfLines={1}>
                Global diaspora circles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={m3Colors.onPrimaryContainer} />
          </M3Card>

          {isStructuredOrText ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterRow, { paddingHorizontal: hPad, paddingVertical: 12 }]}
            >
              <M3FilterChip
                label={`All (${counts.all || 0})`}
                selected={selectedType === 'all'}
                onPress={() => onTypePress('all')}
              />
              {(Object.keys(TYPE_META) as ResultType[]).map((t) => {
                const meta = TYPE_META[t];
                return counts[t] ? (
                  <M3FilterChip
                    key={t}
                    label={`${meta.label} (${counts[t] || 0})`}
                    icon={meta.icon}
                    selected={selectedType === t}
                    onPress={() => onTypePress(t)}
                  />
                ) : null;
              })}
            </ScrollView>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomInset + 100, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {!structuredSearch && query.trim().length === 0 ? (
              <View style={[styles.section, { paddingHorizontal: hPad }]}>
                <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 16, marginLeft: 4 }]}>TRENDING SEARCHES</Text>
                <View style={styles.trendingGrid}>
                  {autoIndexedTrends.map((term) => (
                    <M3Card
                      key={term}
                      variant="outlined"
                      onPress={() => setQuery(term)}
                      style={styles.trendingChip}
                    >
                      <Ionicons name="trending-up" size={16} color={m3Colors.primary} />
                      <Text style={[M3Typography.labelLarge, { color: m3Colors.onSurface }]}>{term}</Text>
                    </M3Card>
                  ))}
                </View>
              </View>
            ) : isFetching ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={m3Colors.primary} />
              </View>
            ) : filtered.length === 0 ? (
              <View style={[styles.centerState, { paddingHorizontal: hPad + 20, paddingTop: 80 }]}>
                <Ionicons name="search-outline" size={48} color={m3Colors.onSurfaceVariant} />
                <Text style={[M3Typography.titleLarge, { color: m3Colors.onSurface, marginTop: 12 }]}>No results found</Text>
                <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }]}>Try another keyword or remove filters.</Text>
                <M3Button
                    variant="filled"
                    style={{ marginTop: 24 }}
                    onPress={() => { setQuery(''); setSelectedType('all'); }}
                >
                    Clear All
                </M3Button>
              </View>
            ) : (
              <View style={[styles.resultsWrap, { paddingHorizontal: hPad }]}>
                <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant, letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 }]}>
                  {filtered.length} {filtered.length === 1 ? 'RESULT' : 'RESULTS'}
                </Text>
                {filtered.map((r, idx) => {
                  const meta = TYPE_META[r.type];
                  return (
                    <Animated.View key={`${r.type}-${r.id}`} entering={FadeInDown.delay(Math.min(idx * 30, 300))}>
                        <M3Card
                            variant="filled"
                            onPress={() => onResultPress(r)}
                            style={styles.resultCard}
                        >
                            <View style={[styles.iconBox, { backgroundColor: m3Colors.primaryContainer }]}>
                                <Ionicons name={meta.icon as any} size={20} color={m3Colors.onPrimaryContainer} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]} numberOfLines={1}>{r.title}</Text>
                                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]} numberOfLines={1}>{r.subtitle}</Text>
                            </View>
                            <View style={[styles.resultTypePill, { backgroundColor: m3Colors.secondaryContainer }]}>
                                <Text style={[styles.resultTypeText, { color: m3Colors.onSecondaryContainer }]}>{meta.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={m3Colors.onSurfaceVariant} />
                        </M3Card>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shell: { flex: 1 },
  desktopShell: { maxWidth: 800, width: '100%', alignSelf: 'center' },

  searchRow: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    height: '100%',
  },

  filterRow: { gap: 10, paddingTop: 4, paddingBottom: 2, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: ChipTokens.height,
  },
  filterText: { fontSize: 13 },

  section: { paddingTop: 8 },
  sectionLabel: {},
  trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trendingText: {},

  centerState: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: {},
  emptySub: {},

  resultsWrap: { paddingTop: 4, gap: 10 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {},
  resultSub: {},
  resultTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultTypeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
  },

  hubEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  hubIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubEntryTitle: {},
  hubEntrySub: {},
});
