import React, { useEffect, useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/design-system/ui/Button';
import { useColors, useIsDark } from '@/hooks/useColors';
import { CultureTokens } from '@/design-system/tokens/colors';
import { Radius, FontFamily, InputTokens, gradients } from '@/design-system/tokens/theme';
import { goBackOrReplace } from '@/lib/navigation';
import { GLOBAL_REGIONS } from '@/constants/locations';
import { COMMON_LANGUAGES, getLanguage } from '@/constants/languages';
import { modulesApi } from '@/modules/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { EventData, MovieData, PerkData, Profile, User } from '@/shared/schema';
import { LocationPicker } from '@/modules/core/components';
import { GlassView } from '@/design-system/ui/GlassView';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { NavigationMetadata } from '@/components/NavigationMetadata';

const isWeb = Platform.OS === 'web';

const AU_STATES = GLOBAL_REGIONS.filter((item) => item.country === 'Australia');
const QUICK_LANGUAGES = COMMON_LANGUAGES.slice(0, 20);


const POPULAR_FINDER = ['Diwali', 'Bollywood', 'Sydney food', 'Perks', 'Tamil', 'Comedy'];

type FinderMode = 'search' | 'hub';

type FilterKey = 'all' | 'events' | 'perks' | 'movies' | 'places' | 'people';

type FinderHit =
  | { kind: 'event'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: EventData }
  | { kind: 'movie'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: MovieData }
  | { kind: 'place'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: Profile }
  | { kind: 'person'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: User }
  | { kind: 'perk'; id: string; title: string; subtitle: string; imageUrl?: string; accent: string; raw: PerkData };

function placeLabel(entityType: Profile['entityType']): string {
  switch (entityType) {
    case 'community': return 'Community';
    case 'venue': return 'Venue';
    case 'business':
    case 'brand': return 'Business';
    case 'restaurant': return 'Dining';
    case 'artist':
    case 'creator': return 'Artist';
    default: return 'Profile';
  }
}

function perkSubtitle(p: PerkData): string {
  const parts: string[] = [];
  if (p.partnerName) parts.push(p.partnerName);
  if (p.discountPercent != null && p.discountPercent > 0) parts.push(`${p.discountPercent}% off`);
  if (parts.length === 0 && p.description) return p.description.length > 80 ? `${p.description.slice(0, 77)}…` : p.description;
  return parts.join(' · ') || 'Member offer';
}

export default function FinderScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { state } = useOnboarding();
  const [mode, setMode] = useState<FinderMode>('search');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [focused, setFocused] = useState(false);

  const [stateCode, setStateCode] = useState('NSW');
  const [languageId, setLanguageId] = useState('mal');

  const topInset = isWeb ? 0 : insets.top;
  const bottomInset = isWeb ? 26 : insets.bottom;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  const selectedState = useMemo(() => AU_STATES.find((s) => s.value === stateCode), [stateCode]);
  const selectedLanguage = useMemo(() => getLanguage(languageId), [languageId]);
  const previewUrl = `/hub/australia/${stateCode.toLowerCase()}?lang=${languageId}`;

  const QUICK_DESTINATIONS = useMemo(() => [
    { label: 'Discover', icon: 'compass', href: '/(tabs)', color: CultureTokens.indigo },
    { label: 'Events', icon: 'calendar', href: '/events', color: CultureTokens.gold },
    { label: 'Perks', icon: 'gift', href: '/perks', color: CultureTokens.coral },
    { label: 'Movies', icon: 'film', href: '/movies', color: CultureTokens.teal },
    { label: 'Community', icon: 'people', href: '/(tabs)/community', color: CultureTokens.indigo },
    { label: 'Saved', icon: 'bookmark', href: '/saved', color: CultureTokens.gold },
  ], []);

  const { data: searchData, isFetching: searchFetching, isError: searchError } = useQuery({
    queryKey: ['finder', 'search', debounced, state.city, state.country],
    queryFn: () => modulesApi.search.query({ q: debounced, city: state.city || undefined, country: state.country || undefined, pageSize: 40 }),
    enabled: mode === 'search' && debounced.length >= 2,
    staleTime: 60_000,
  });

  const { data: perksList = [] } = useQuery({
    queryKey: ['perks', 'list', 'finder'],
    queryFn: () => modulesApi.perks.list(),
    enabled: mode === 'search' && debounced.length >= 2,
    staleTime: 300_000,
  });

  const allHits = useMemo((): FinderHit[] => {
    if (debounced.length < 2) return [];
    const out: FinderHit[] = [];

    (searchData?.events ?? []).forEach((e: EventData) => {
      out.push({ kind: 'event', id: e.id, title: e.title, subtitle: [e.venue, e.city].filter(Boolean).join(' · ') || 'Event', imageUrl: e.heroImageUrl ?? e.imageUrl, accent: CultureTokens.indigo, raw: e });
    });
    (searchData?.movies ?? []).forEach((m: MovieData) => {
      out.push({ kind: 'movie', id: m.id, title: m.title, subtitle: (m.genre?.length ? m.genre.join(', ') : m.description) || 'Movie', imageUrl: m.posterUrl, accent: CultureTokens.teal, raw: m });
    });
    (searchData?.profiles ?? []).forEach((p: Profile) => {
      out.push({ kind: 'place', id: p.id, title: p.name, subtitle: `${placeLabel(p.entityType)} · ${p.city || p.country || 'Australia'}`, imageUrl: p.avatarUrl ?? p.imageUrl, accent: CultureTokens.indigo, raw: p });
    });
    (searchData?.users ?? []).forEach((u: User) => {
      out.push({ kind: 'person', id: u.id, title: u.displayName || u.username || 'Member', subtitle: u.username ? `@${u.username}` : u.city || 'CulturePass', imageUrl: u.avatarUrl, accent: CultureTokens.coral, raw: u });
    });
    perksList.forEach((p: PerkData) => {
        const s = debounced.toLowerCase();
        const blob = [p.title, p.description, p.partnerName, ...(p.cultureTags ?? [])].join(' ').toLowerCase();
        if (!blob.includes(s)) return;
        out.push({ kind: 'perk', id: p.id, title: p.title, subtitle: perkSubtitle(p), imageUrl: p.coverUrl, accent: CultureTokens.gold, raw: p });
    });
    return out;
  }, [debounced, searchData, perksList]);

  const filteredHits = useMemo(() => filter === 'all' ? allHits : allHits.filter((h) => h.kind.startsWith(filter.slice(0, -1))), [allHits, filter]);

  const filterChips = [
    { key: 'all', label: 'All', icon: 'grid' },
    { key: 'events', label: 'Events', icon: 'calendar' },
    { key: 'perks', label: 'Perks', icon: 'gift' },
    { key: 'movies', label: 'Movies', icon: 'film' },
    { key: 'places', label: 'Places', icon: 'business' },
    { key: 'people', label: 'People', icon: 'person' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationMetadata />
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FFFBF7', '#F5F5F4']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${colors.primary}08`, 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 600 }]}
      />

      <GlassView
        intensity={20}
        style={[
            styles.header,
            {
                paddingTop: topInset + 16,
                backgroundColor: colors.background + 'B3',
                borderBottomColor: colors.borderLight,
                borderBottomWidth: 1,
            }
        ]}
      >
        <View style={[styles.headerContent, { paddingHorizontal: 16 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
            <Pressable
                onPress={() => goBackOrReplace('/(tabs)')}
                style={({ pressed }) => [styles.backBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '20' }, pressed && { opacity: 0.7 }]}
            >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.headerTitleBlock}>
                <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>PLATFORM</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Finder</Text>
            </View>
            <LocationPicker
                variant="icon"
                iconColor={colors.primary}
                buttonStyle={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}
            />
        </View>

        <View style={[styles.segmentContainer, { paddingHorizontal: 16 }, { maxWidth: 800, alignSelf: 'center', width: '100%' }]}>
            <GlassView intensity={10} style={[styles.segmentRow, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.borderLight, borderWidth: 1 }]}>
               {(['search', 'hub'] as const).map((id) => {
                 const active = mode === id;
                 return (
                   <Pressable
                     key={id}
                     onPress={() => { setMode(id); if (Platform.OS !== 'web') Haptics.selectionAsync(); }}
                     style={[styles.segmentPill, active && { backgroundColor: colors.surface, borderColor: colors.borderLight, borderWidth: 1 }]}
                   >
                     <Ionicons name={id === 'search' ? 'search' : 'compass'} size={15} color={active ? colors.primary : colors.textTertiary} />
                     <Text style={[styles.segmentLabel, { color: active ? colors.text : colors.textTertiary, fontFamily: active ? FontFamily.bold : FontFamily.medium }]}>
                        {id === 'search' ? 'Global Search' : 'Culture Hub'}
                     </Text>
                   </Pressable>
                 );
               })}
            </GlassView>
        </View>
      </GlassView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + bottomInset, paddingTop: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contentShell, { paddingHorizontal: 16 }]}>
          {mode === 'search' ? (
            <>
              <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)}>
                <GlassView
                    intensity={20}
                    style={[
                        styles.searchField,
                        {
                            borderColor: focused ? colors.primary : colors.borderLight,
                            backgroundColor: colors.surface + 'B3',
                            height: InputTokens.height,
                            borderRadius: Radius.md,
                            marginBottom: 16,
                        }
                    ]}
                >
                    <Ionicons name="search" size={20} color={focused ? colors.primary : colors.textTertiary} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Events, perks, movies, communities..."
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.searchInput, { color: colors.text, fontSize: 16, fontFamily: FontFamily.medium }]}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <Pressable onPress={() => setQuery('')} hitSlop={12}>
                            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                        </Pressable>
                    )}
                </GlassView>
              </Animated.View>

              {debounced.length < 2 ? (
                <>
                  <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>QUICK JUMP</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
                    {QUICK_DESTINATIONS.map((d) => (
                      <Pressable key={d.href} onPress={() => router.push(d.href as any)}>
                        <GlassView contentStyle={{ padding: 16, alignItems: 'center', gap: 10, minWidth: 110 }}>
                            <View style={[styles.quickIcon, { backgroundColor: d.color + '15' }]}>
                                <Ionicons name={d.icon as any} size={22} color={d.color} />
                            </View>
                            <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: colors.text }}>{d.label}</Text>
                        </GlassView>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>POPULAR NOW</Text>
                  <View style={styles.trendGrid}>
                    {POPULAR_FINDER.map((term) => (
                      <Pressable key={term} onPress={() => setQuery(term)} style={({ pressed }) => [styles.trendPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }, pressed && { opacity: 0.8 }]}>
                        <Ionicons name="flash" size={14} color={CultureTokens.gold} />
                        <Text style={{ fontSize: 13, fontFamily: FontFamily.medium, color: colors.text }}>{term}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
                    {filterChips.map((chip) => {
                      const active = filter === chip.key;
                      return (
                        <Pressable key={chip.key} onPress={() => setFilter(chip.key as any)}>
                          <GlassView intensity={active ? 30 : 10} style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.surface + '80', borderColor: active ? colors.primary : colors.borderLight }]}>
                            <Ionicons name={chip.icon as any} size={14} color={active ? '#FFFFFF' : colors.textTertiary} />
                            <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: active ? '#FFFFFF' : colors.text }}>{chip.label}</Text>
                          </GlassView>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {searchFetching && allHits.length === 0 ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                  ) : searchError ? (
                    <View style={{ alignItems: 'center', paddingTop: 60, gap: 16 }}>
                        <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
                        <Text style={{ fontSize: 16, fontFamily: FontFamily.medium, color: colors.textSecondary, textAlign: 'center' }}>Search unavailable. Check your connection.</Text>
                    </View>
                  ) : filteredHits.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingTop: 60, gap: 16 }}>
                        <Ionicons name="search" size={48} color={colors.textTertiary} />
                        <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text }}>No matches found</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                        {filteredHits.map((hit, idx) => (
                            <Animated.View key={`${hit.kind}-${hit.id}`} entering={FadeInDown.delay(Math.min(idx * 30, 300))}>
                                <GlassView style={styles.hitOuter} contentStyle={{ padding: 0 }}>
                                    <Pressable
                                        onPress={() => navigateHit(hit)}
                                        style={({ pressed }) => [styles.hitRow, pressed && { backgroundColor: colors.primarySoft }]}
                                    >
                                        <View style={[styles.hitIconBox, { backgroundColor: hit.accent + '12' }]}>
                                            {hit.imageUrl ? <Image source={{ uri: hit.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name={hit.kind === 'event' ? 'calendar' : 'business'} size={24} color={hit.accent} />}
                                        </View>
                                        <View style={{ flex: 1, gap: 3 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <View style={[styles.hitDot, { backgroundColor: hit.accent }]} />
                                                <Text style={{ fontSize: 10, fontFamily: FontFamily.bold, color: colors.textTertiary, textTransform: 'uppercase' }}>{hit.kind}</Text>
                                            </View>
                                            <Text style={{ fontSize: 16, fontFamily: FontFamily.bold, color: colors.text }} numberOfLines={1}>{hit.title}</Text>
                                            <Text style={{ fontSize: 13, fontFamily: FontFamily.medium, color: colors.textSecondary }} numberOfLines={1}>{hit.subtitle}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                                    </Pressable>
                                </GlassView>
                            </Animated.View>
                        ))}
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            <View style={{ gap: 32 }}>
                <Animated.View entering={FadeInDown.duration(400)}>
                    <GlassView style={{ overflow: 'hidden' }} contentStyle={{ padding: 0 }}>
                        <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 28, gap: 16 }}>
                            <GlassView intensity={30} colorScheme="dark" style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>HUB BUILDER</Text>
                            </GlassView>
                            <Text style={{ fontSize: 28, fontFamily: FontFamily.bold, color: '#FFFFFF', letterSpacing: -0.8 }}>Create a focused hub</Text>
                            <Text style={{ fontSize: 15, fontFamily: FontFamily.medium, color: 'rgba(255,255,255,0.9)', lineHeight: 22 }}>
                                Filter CulturePass by state and language to create a custom entry point for your community.
                            </Text>
                        </LinearGradient>
                    </GlassView>
                </Animated.View>

                <View style={{ gap: 16 }}>
                    <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>1. SELECT REGION</Text>
                    <View style={styles.grid}>
                        {AU_STATES.map((st) => {
                            const active = st.value === stateCode;
                            return (
                                <Pressable key={st.value} onPress={() => setStateCode(st.value)} style={{ width: '48%' }}>
                                    <GlassView style={[active && { borderColor: colors.primary, borderWidth: 2 }]} contentStyle={{ padding: 16, gap: 4, alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: active ? colors.primary : colors.text }}>{st.value}</Text>
                                        <Text style={{ fontSize: 12, fontFamily: FontFamily.medium, color: colors.textTertiary }}>{st.label}</Text>
                                    </GlassView>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={{ gap: 16 }}>
                    <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>2. SELECT CULTURE</Text>
                    <View style={styles.trendGrid}>
                        {QUICK_LANGUAGES.map((lang) => {
                            const active = lang.id === languageId;
                            return (
                                <Pressable key={lang.id} onPress={() => setLanguageId(lang.id)}>
                                    <GlassView intensity={active ? 30 : 10} style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.surface + '80', borderColor: active ? colors.primary : colors.borderLight }]}>
                                        <Text style={{ fontSize: 14, fontFamily: FontFamily.bold, color: active ? '#FFFFFF' : colors.text }}>{lang.name}</Text>
                                    </GlassView>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={{ gap: 16 }}>
                    <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>3. LAUNCH HUB</Text>
                    <GlassView contentStyle={{ padding: 24, gap: 20 }}>
                        <View style={{ gap: 6 }}>
                            <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text }}>{selectedState?.label} · {selectedLanguage?.name}</Text>
                            <Text style={{ fontSize: 13, fontFamily: FontFamily.medium, color: colors.primary }}>culturepass.co{previewUrl}</Text>
                        </View>
                        <Button variant="primary" size="lg" fullWidth onPress={() => router.push(previewUrl)} leftIcon="rocket-outline">
                            Open Hub Page
                        </Button>
                    </GlassView>
                </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function navigateHit(hit: FinderHit) {
    if (!isWeb) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const path: Record<string, string> = { event: '/e/[id]', movie: '/m/[id]', perk: '/p/[id]', place: '/c/[id]', person: '/u/[id]' };
    router.push({ pathname: path[hit.kind] as any, params: { id: hit.id } });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16, zIndex: 10, gap: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleBlock: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 1.5, opacity: 0.8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  segmentContainer: {},
  segmentRow: { flexDirection: 'row', padding: 4, borderRadius: 16, gap: 4, borderWidth: 1 },
  segmentPill: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  segmentLabel: { fontSize: 13 },

  contentShell: { width: '100%', maxWidth: 800, alignSelf: 'center' },
  groupLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 12, marginBottom: 12 },

  searchField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1.5, gap: 12 },
  searchInput: { flex: 1, height: '100%' },

  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },

  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, minHeight: 40 },

  hitOuter: { marginBottom: 12 },
  hitRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  hitIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hitDot: { width: 6, height: 6, borderRadius: 3 },
  hitTitle: { fontSize: 16, fontFamily: FontFamily.bold, letterSpacing: -0.2 },
  hitSub: { fontSize: 13, fontFamily: FontFamily.medium, opacity: 0.8 },

  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  heroBadgeText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#FFFFFF', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
