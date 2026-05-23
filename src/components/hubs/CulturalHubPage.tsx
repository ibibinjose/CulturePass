import React, { useMemo, useState } from 'react';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/design-system/ui/Button';
import { Input } from '@/design-system/ui/Input';
import { useSaved } from '@/contexts/SavedContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import type { AppUpdate, Community, EventData } from '@/shared/schema';
import { CultureTokens, Radius, Spacing } from '@/design-system/tokens/theme';
import { GLOBAL_REGIONS, getStateForCity } from '@/constants/locations';
import { COMMON_LANGUAGES, getLanguage } from '@/constants/languages';
import { getCommunityProfilePathId } from '@/lib/community';
import { fetchHubCommunities, fetchHubEvents, fetchHubUpdates } from '@/components/hubs/services/culturalHubService';

type HubSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  domainUrl?: string;
  defaultState: string;
  defaultLanguage: string;
  matchTerms: string[];
};

type Props = {
  seed: HubSeed;
  showBuilder?: boolean;
};

const HUB_STATES = GLOBAL_REGIONS.filter((item) => item.country === 'Australia');
const HUB_LANGUAGES = COMMON_LANGUAGES.slice(0, 14);

function normalize(value?: string | null): string {
  return (value ?? '').toLowerCase().trim();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function eventBelongsToState(event: EventData, stateCode: string): boolean {
  const byState = normalize(event.state) === normalize(stateCode);
  if (byState) return true;
  const mapped = event.city ? getStateForCity(event.city) : undefined;
  return normalize(mapped) === normalize(stateCode);
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Stable deep-link path for reopening this hub from Saved. */
function buildHubBookmarkHref(seed: HubSeed, stateCode: string, languageId: string): string {
  if (seed.slug === 'culturekerala') {
    return '/kerala';
  }
  return `/hub/australia/${stateCode.toLowerCase()}?lang=${languageId.toLowerCase()}`;
}

function matchesListSearch(haystack: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  return normalize(haystack).includes(q);
}

export function CulturalHubPage({ seed, showBuilder = true }: Props) {
  const colors = useColors();
  const { isDesktop, hPad } = useLayout();
  const { toggleSaveHub, isHubSaved } = useSaved();
  const [selectedState, setSelectedState] = useState(seed.defaultState.toUpperCase());
  const [selectedLanguage, setSelectedLanguage] = useState(seed.defaultLanguage.toLowerCase());
  const [listSearch, setListSearch] = useState('');
  const languageInfo = getLanguage(selectedLanguage);
  const stateInfo = HUB_STATES.find((item) => item.value === selectedState);
  const hubHref = buildHubBookmarkHref(seed, selectedState, selectedLanguage);
  const hubSaved = isHubSaved(seed.slug, selectedState, selectedLanguage);

  const discoveryTerms = useMemo(() => {
    const lang = getLanguage(selectedLanguage);
    return [
      ...seed.matchTerms.map((term) => normalize(term)),
      normalize(lang?.id),
      normalize(lang?.name),
      normalize(lang?.nativeName),
      normalize(stateInfo?.label),
      normalize(selectedState),
    ].filter(Boolean);
  }, [seed.matchTerms, selectedLanguage, stateInfo?.label, selectedState]);

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['hub-events', selectedState, selectedLanguage, seed.slug],
    queryFn: fetchHubEvents,
    staleTime: 60_000,
  });

  const { data: communitiesData, isLoading: communitiesLoading } = useQuery({
    queryKey: ['hub-communities', selectedState, selectedLanguage, seed.slug],
    queryFn: fetchHubCommunities,
    staleTime: 60_000,
  });

  const { data: updatesData, isLoading: updatesLoading } = useQuery({
    queryKey: ['hub-updates', selectedState, selectedLanguage, seed.slug],
    queryFn: fetchHubUpdates,
    staleTime: 60_000,
  });

  const filteredEvents = useMemo(() => {
    const events = eventsData?.events ?? [];
    return events
      .filter((event) => eventBelongsToState(event, selectedState))
      .filter((event) => {
        const haystack = normalize(
          [
            event.title,
            event.description,
            event.category,
            event.city,
            event.state,
            ...(event.tags ?? []),
            ...(event.cultureTag ?? []),
            ...(event.cultureTags ?? []),
            ...(event.languageTags ?? []),
          ].join(' '),
        );
        return includesAny(haystack, discoveryTerms);
      });
  }, [eventsData?.events, selectedState, discoveryTerms]);

  const filteredCommunities = useMemo(() => {
    const communities = (communitiesData ?? []) as Community[];
    return communities.filter((community) => {
      const c = community as Community & {
        state?: string;
        lgaCode?: string;
        cultureTags?: string[];
        cultures?: string[];
        languageIds?: string[];
        languages?: string[];
      };
      const mappedState = c.city ? getStateForCity(c.city) : undefined;
      const locationMatches =
        normalize(c.state) === normalize(selectedState) ||
        normalize(mappedState) === normalize(selectedState) ||
        normalize(c.lgaCode) === normalize(selectedState);
      if (!locationMatches) return false;
      const haystack = normalize(
        [
          c.name,
          c.description,
          c.state,
          ...(c.cultureIds ?? []),
          ...(c.cultureTags ?? []),
          ...(c.cultures ?? []),
          ...(c.languageIds ?? []),
          ...(c.languages ?? []),
          c.city,
          c.country,
        ].join(' '),
      );
      return includesAny(haystack, discoveryTerms);
    });
  }, [communitiesData, discoveryTerms, selectedState]);

  const filteredAnnouncements = useMemo(() => {
    const updates = (updatesData?.updates ?? []) as AppUpdate[];
    const scoped = updates.filter((update) => {
      if (update.category !== 'announcement' && update.category !== 'feature') return false;
      const haystack = normalize([update.title, update.body].join(' '));
      return includesAny(haystack, discoveryTerms);
    });
    if (scoped.length > 0) return scoped;
    // Fallback so the section never appears empty due to limited metadata.
    return updates
      .filter((update) => update.category === 'announcement' || update.category === 'feature')
      .slice(0, 8);
  }, [updatesData?.updates, discoveryTerms]);

  const displayAnnouncements = useMemo(
    () =>
      filteredAnnouncements.filter((u) => matchesListSearch([u.title, u.body ?? ''].join(' '), listSearch)).slice(0, 12),
    [filteredAnnouncements, listSearch],
  );

  const displayEvents = useMemo(
    () =>
      filteredEvents
        .filter((e) =>
          matchesListSearch(
            [e.title, e.description ?? '', e.city ?? '', e.venue ?? '', ...(e.tags ?? []), ...(e.cultureTag ?? [])].join(
              ' ',
            ),
            listSearch,
          ),
        )
        .slice(0, 12),
    [filteredEvents, listSearch],
  );

  const displayCommunities = useMemo(
    () =>
      filteredCommunities
        .filter((c) => matchesListSearch([c.name, c.description ?? '', c.city ?? ''].join(' '), listSearch))
        .slice(0, 12),
    [filteredCommunities, listSearch],
  );

  const platformSearchQuery = useMemo(() => {
    const t = listSearch.trim();
    if (t.length >= 2) return t;
    return [languageInfo?.name, stateInfo?.label, seed.title].filter(Boolean).join(' ').slice(0, 120);
  }, [listSearch, languageInfo?.name, stateInfo?.label, seed.title]);

  const canonical = seed.domainUrl
    ? seed.domainUrl
    : `https://culturepass.app/hubs/${selectedState.toLowerCase()}/${selectedLanguage}`;

  const onToggleSaveHub = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSaveHub({
      href: hubHref,
      slug: seed.slug,
      state: selectedState,
      language: selectedLanguage,
      title: seed.title,
      subtitle: `${stateInfo?.label ?? selectedState} · ${languageInfo?.name ?? selectedLanguage}`,
    });
  };

  const openPlatformSearch = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push({
      pathname: '/search',
      params: { q: encodeURIComponent(platformSearchQuery) },
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Head>
        <title>{`${seed.title} - ${stateInfo?.label ?? selectedState}`}</title>
        <meta name="description" content={seed.description} />
        <meta
          name="keywords"
          content={`${seed.title}, ${stateInfo?.label ?? selectedState}, ${languageInfo?.name ?? selectedLanguage}, community, events, announcements`}
        />
        <meta property="og:title" content={`${seed.title} - ${stateInfo?.label ?? selectedState}`} />
        <meta property="og:description" content={seed.subtitle} />
        <meta property="og:url" content={canonical} />
        <link rel="canonical" href={canonical} />
      </Head>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            backgroundColor: colors.background,
            paddingHorizontal: isDesktop ? Math.max(hPad, Spacing.xl) : Spacing.md,
          },
        ]}
      >
        <View style={[styles.maxWidthWrap, isDesktop && styles.maxWidthDesktop]}>
          <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.eyebrow, { color: CultureTokens.gold }]}>{seed.slug.toUpperCase()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{seed.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{seed.subtitle}</Text>
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{filteredCommunities.length}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>communities</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{filteredEvents.length}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>events</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{filteredAnnouncements.length}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>announcements</Text>
              </View>
            </View>
            <View style={styles.ctaRow}>
              <Button variant="gradient" size="sm" style={styles.ctaButton} onPress={() => router.push('/(tabs)')}>
                Open Discovery
              </Button>
              <Button variant="outline" size="sm" style={styles.ctaButton} onPress={() => router.push('/events')}>
                View Events
              </Button>
              <Button
                variant={hubSaved ? 'secondary' : 'outline'}
                size="sm"
                style={styles.ctaButton}
                onPress={onToggleSaveHub}
                leftIcon={hubSaved ? 'bookmark' : 'bookmark-outline'}
                accessibilityLabel={hubSaved ? 'Remove this culture hub from My Saved' : 'Save this culture hub to My Saved'}
              >
                {hubSaved ? 'Saved' : 'Save hub'}
              </Button>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <View style={styles.searchSectionHeader}>
              <Ionicons name="search-outline" size={22} color={CultureTokens.indigo} accessible={false} />
              <View style={styles.searchSectionTitles}>
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  Quick search
                </Text>
                <Text style={[styles.searchHint, { color: colors.textSecondary }]}>
                  Filter lists below or open a full CulturePass search.
                </Text>
              </View>
            </View>
            <Input
              placeholder="Filter by title, city, description…"
              value={listSearch}
              onChangeText={setListSearch}
              accessibilityLabel="Filter hub lists"
              accessibilityHint="Narrow announcements, events, and communities on this page"
              returnKeyType="search"
              rightIcon={listSearch.length > 0 ? 'close-circle' : undefined}
              onRightIconPress={listSearch.length > 0 ? () => setListSearch('') : undefined}
            />
            <View style={styles.searchActions}>
              <Button variant="outline" size="sm" style={styles.ctaButton} onPress={openPlatformSearch} leftIcon="globe-outline">
                Search CulturePass
              </Button>
              <Button variant="ghost" size="sm" style={styles.ctaButton} onPress={() => router.push('/saved')} leftIcon="bookmark-outline">
                My Saved
              </Button>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Main Links
            </Text>
            <View style={styles.actionRow}>
              <Button variant="secondary" size="sm" style={styles.ctaButton} onPress={() => router.push('/communities')}>
                Communities
              </Button>
              <Button variant="ghost" size="sm" style={styles.ctaButton} onPress={() => router.push('/updates')}>
                Announcements
              </Button>
              <Button variant="outline" size="sm" style={styles.ctaButton} onPress={() => router.push('/events')}>
                Events
              </Button>
            </View>
          </View>

          {showBuilder ? (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                Auto-Create Similar Hub Pages
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Choose a state and language tag. We auto-open a similar page with matching communities, events, and
                announcements.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {HUB_STATES.map((state) => {
                  const active = selectedState === state.value;
                  return (
                    <Pressable
                      key={state.value}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                        },
                      ]}
                      onPress={() => setSelectedState(state.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Choose state ${state.label}`}
                    >
                      <Text style={[styles.chipText, { color: colors.text }]}>
                        {state.emoji} {state.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {HUB_LANGUAGES.map((language) => {
                  const active = selectedLanguage === language.id;
                  return (
                    <Pressable
                      key={language.id}
                      style={[
                        styles.chip,
                        {
                          borderColor: active ? CultureTokens.indigo : colors.borderLight,
                          backgroundColor: active ? colors.primaryGlow : colors.surfaceElevated,
                        },
                      ]}
                      onPress={() => setSelectedLanguage(language.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Choose language ${language.name}`}
                    >
                      <Text style={[styles.chipText, { color: colors.text }]}>{language.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Button
                variant="gradient"
                size="sm"
                onPress={() => router.push(`/hubs/${selectedState.toLowerCase()}/${selectedLanguage}`)}
              >
                Open Auto Page
              </Button>
            </View>
          ) : null}

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Related Announcements
            </Text>
            {updatesLoading ? <Text style={[styles.body, { color: colors.textSecondary }]}>Loading announcements...</Text> : null}
            {!updatesLoading && displayAnnouncements.length === 0 ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {listSearch.trim() ? 'No announcements match this filter.' : 'No announcements in this hub scope yet.'}
              </Text>
            ) : null}
            {displayAnnouncements.map((item) => (
              <Pressable
                key={item.id}
                style={styles.listItem}
                onPress={() => router.push(`/updates/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open announcement ${item.title}`}
              >
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{formatDate(item.publishedAt)}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Related Events
            </Text>
            {eventsLoading ? <Text style={[styles.body, { color: colors.textSecondary }]}>Loading events...</Text> : null}
            {!eventsLoading && displayEvents.length === 0 ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {listSearch.trim() ? 'No events match this filter.' : 'No events in this hub scope yet.'}
              </Text>
            ) : null}
            {displayEvents.map((event) => (
              <Pressable
                key={event.id}
                style={styles.listItem}
                onPress={() => router.push(`/event/${event.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open event ${event.title}`}
              >
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                  {event.title}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  {event.city} {event.date ? `· ${formatDate(event.date)}` : ''}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
              Related Communities
            </Text>
            {communitiesLoading ? <Text style={[styles.body, { color: colors.textSecondary }]}>Loading communities...</Text> : null}
            {!communitiesLoading && displayCommunities.length === 0 ? (
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                {listSearch.trim() ? 'No communities match this filter.' : 'No communities in this hub scope yet.'}
              </Text>
            ) : null}
            {displayCommunities.map((community) => (
              <Pressable
                key={community.id}
                style={styles.listItem}
                onPress={() => router.push(`/c/${getCommunityProfilePathId(community)}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open community ${community.name}`}
              >
                <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                  {community.name}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                  {community.city ?? 'Global'} · {community.country ?? 'Community'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  maxWidthWrap: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  maxWidthDesktop: {
    maxWidth: 1080,
  },
  hero: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Poppins_700Bold',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Poppins_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  metricValue: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins_700Bold',
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Poppins_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ctaRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  ctaButton: {
    flexGrow: 1,
  },
  section: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  searchSectionTitles: {
    flex: 1,
    gap: 4,
  },
  searchHint: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  searchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_500Medium',
  },
  listItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
    paddingTop: Spacing.sm,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_700Bold',
  },
  itemMeta: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
});
