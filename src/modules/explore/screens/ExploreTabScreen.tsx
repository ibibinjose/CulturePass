import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Keyboard,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { FlashList, type FlashListRef, type ListRenderItem } from '@shopify/flash-list';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useLocation } from '@/contexts/LocationContext';
import { useCouncil } from '@/hooks/useCouncil';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { api, ApiError } from '@/lib/api';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { M3CommunityCard } from '@/modules/communities/components/M3CommunityCard';
import { M3TopAppBar, M3Button, M3Card, M3FilterChip, M3SectionHeader } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/theme';
import {
  CULTURE_EXPLORE_PRESETS,
  interestToCultureSearchTag,
  type CultureExplorePreset,
} from '@/constants/cultureExplorePresets';
import { getPostcodesByPlace } from '@shared/location/australian-postcodes';
import { MAIN_TAB_UI } from '@/modules/core/layout/tabs/mainTabTokens';
import { type Community, type EventData, CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';
import { CulturePassportPanel } from '@/modules/explore/components/CulturePassportPanel';
import { QuestRail } from '@/modules/explore/components/QuestRail';
import { NavigationMetadata } from '@/components/NavigationMetadata';

const EXPLORE_SELECTED_TAGS_KEY = '@culturepass_explore_culture_tags_v1';
const EXPLORE_INVITE_SUBMITTED_EMAIL_KEY = '@culturepass_explore_invite_submitted_email_v1';

function normalizeInviteEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Desktop CultureX: left control column width (matches My City–style split). */
const CX_SIDEBAR_W = 280;
const CX_SIDEBAR_GAP = 16;
const CX_DESKTOP_MAX_W = 1180;

/** Primary quick filters — max 7 visible; “More” reveals full preset list. */
const QUICK_VIBE_IDS: readonly string[] = [
  'australian',
  'multicultural',
  'indigenous-heritage',
  'diwali',
  'lunar-new-year',
  'eid',
  'south-asian',
];

type AreaScope = 'city' | 'council' | 'state';

function dedupeEvents(events: EventData[]): EventData[] {
  const m = new Map<string, EventData>();
  for (const e of events) m.set(e.id, e);
  return [...m.values()].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function communityCultureValues(community: Community): string[] {
  const raw = community as unknown as Record<string, unknown>;
  const fields = [raw.cultureTag, raw.cultureTags, raw.tags, raw.cultureIds, raw.diasporaGroupIds];
  return fields
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function DiscoverySection({
  title,
  subtitle,
  trailing,
  children,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={discoverySectionStyles.wrap}>
      <M3SectionHeader
        title={title}
        subtitle={subtitle}
      />
      {children}
    </View>
  );
}

const discoverySectionStyles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 12,
  },
});

function ExploreTabScreenInner() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { isDesktop, hPad } = useLayout();
  const isWeb = Platform.OS === 'web';
  const { user, isAuthenticated } = useAuth();
  const { state: onboarding } = useOnboarding();
  const { lgaCode, councilId, council } = useCouncil();
  const queryClient = useQueryClient();

  const appLocation = useLocation();
  const city = (appLocation.city || user?.city || onboarding.city || '').trim();
  const country = (appLocation.country || user?.country || onboarding.country || 'Australia').trim();

  const userState = useMemo(() => {
    const fromUser = (user?.state ?? '').trim().toUpperCase();
    if (fromUser) return fromUser;
    if (!city) return '';
    const pc = getPostcodesByPlace(city)[0];
    return (pc?.state_code ?? '').trim().toUpperCase();
  }, [city, user?.state]);

  const [area, setArea] = useState<AreaScope>('city');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDone, setInviteDone] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [showAllVibes, setShowAllVibes] = useState(false);
  const scrollRef = useRef<FlashListRef<EventData>>(null);
  const [happeningSectionY, setHappeningSectionY] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  /** When true, a prior invite submit is remembered — do not overwrite the field from profile email. */
  const skipProfileInvitePrefillRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(EXPLORE_INVITE_SUBMITTED_EMAIL_KEY);
        if (cancelled) return;
        if (raw) {
          const e = normalizeInviteEmail(raw);
          if (e) {
            skipProfileInvitePrefillRef.current = true;
            setInviteEmail(e);
            setInviteDone(true);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (skipProfileInvitePrefillRef.current) return;
    const fromProfile = (user?.email ?? '').trim();
    if (fromProfile) setInviteEmail(fromProfile);
  }, [user?.email]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(EXPLORE_SELECTED_TAGS_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setSelectedTags(new Set(parsed.filter((x) => typeof x === 'string')));
          }
        } else if (user?.culturalIdentity?.exploringCultureTags?.length) {
          // Cultural Passport: prefer the user's declared "exploring" cultures
          // so the very first /explore session reflects their intent.
          setSelectedTags(
            new Set(user.culturalIdentity.exploringCultureTags.map((t) => t.toLowerCase())),
          );
        } else if (user?.interests?.length) {
          setSelectedTags(new Set(user.interests.map(interestToCultureSearchTag)));
        } else {
          setSelectedTags(new Set(['multicultural', 'lunar new year']));
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.interests, user?.culturalIdentity?.exploringCultureTags]);

  const persistTags = useCallback(async (next: Set<string>) => {
    try {
      await AsyncStorage.setItem(EXPLORE_SELECTED_TAGS_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTag = useCallback(
    (tag: string) => {
      const t = tag.trim().toLowerCase();
      if (!t) return;
      setSelectedTags((prev) => {
        const next = new Set(prev);
        if (next.has(t)) next.delete(t);
        else next.add(t);
        void persistTags(next);
        return next;
      });
    },
    [persistTags],
  );

  const selectedList = useMemo(() => [...selectedTags], [selectedTags]);
  const debouncedSelectedList = useDebouncedValue(selectedList, 300);

  const quickVibePresets = useMemo(
    () =>
      QUICK_VIBE_IDS.map((id) => CULTURE_EXPLORE_PRESETS.find((p) => p.id === id)).filter(
        (p): p is CultureExplorePreset => Boolean(p),
      ),
    [],
  );

  const searchCity = area === 'state' ? undefined : city || undefined;
  const searchCountry = country || undefined;

  const applyAreaFilter = useCallback(
    (events: EventData[]) => {
      let next = events;
      if (area === 'council') {
        const matchLga = council?.lgaCode ?? lgaCode;
        const matchCouncil = councilId ?? council?.id;
        if (matchLga || matchCouncil) {
          next = next.filter(
            (e) =>
              (matchLga && e.lgaCode === matchLga) || (matchCouncil && e.councilId === matchCouncil),
          );
        } else {
          next = [];
        }
      }
      if (area === 'state' && userState) {
        next = next.filter((e) => String(e.state ?? '').trim().toUpperCase() === userState);
      }
      return next;
    },
    [area, council?.lgaCode, council?.id, councilId, lgaCode, userState],
  );

  const welcomeQuery = useQuery({
    queryKey: [
      'culturex-welcome-events',
      searchCity,
      searchCountry,
      area,
      lgaCode,
      councilId,
      userState,
      hydrated,
    ],
    queryFn: async () => {
      const res = await api.search.query({
        q: '',
        cultureTag: CULTUREX_EXPLORES_CULTURE_TAG,
        city: searchCity,
        country: searchCountry,
        pageSize: 40,
      });
      const raw = res.events ?? [];
      return dedupeEvents(applyAreaFilter(raw));
    },
    enabled: hydrated && Boolean(searchCountry),
  });

  const communitiesQuery = useQuery({
    queryKey: ['culturex-communities', searchCity, searchCountry, debouncedSelectedList],
    queryFn: async () => {
      const communities = await api.communities.list({ city: searchCity, country: searchCountry });
      const selected = new Set(debouncedSelectedList.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
      if (selected.size === 0) return communities.slice(0, 12);
      return communities
        .filter((community) => {
          const values = communityCultureValues(community);
          return values.length === 0 || values.some((value) => selected.has(value));
        })
        .slice(0, 12);
    },
    enabled: hydrated && Boolean(searchCountry),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim();
      if (!email) throw new Error('Add your email first.');
      await api.cultureX.subscribe({
        email,
        ...(city ? { city } : {}),
        ...(country ? { country } : {}),
      });
    },
    onSuccess: async () => {
      const normalized = normalizeInviteEmail(inviteEmail);
      skipProfileInvitePrefillRef.current = true;
      try {
        await AsyncStorage.setItem(EXPLORE_INVITE_SUBMITTED_EMAIL_KEY, normalized);
      } catch {
        /* ignore */
      }
      setInviteErr(null);
      setInviteDone(true);
      setInviteModalVisible(false);
      Keyboard.dismiss();
      setSelectedTags((prev) => {
        const next = new Set(prev);
        next.add(CULTUREX_EXPLORES_CULTURE_TAG);
        void persistTags(next);
        return next;
      });
      setTimeout(scrollToHappening, 120);
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save. Try again.';
      setInviteErr(msg);
    },
  });

  const queries = useQueries({
    queries: debouncedSelectedList.map((cultureTag) => ({
      queryKey: ['explore-culture-search', cultureTag, searchCity, searchCountry, area, lgaCode, councilId, userState],
      queryFn: async () => {
        const res = await api.search.query({
          q: '',
          cultureTag,
          city: searchCity,
          country: searchCountry,
          pageSize: 40,
        });
        let events = res.events ?? [];
        events = applyAreaFilter(events);
        return events;
      },
      enabled: hydrated && debouncedSelectedList.length > 0 && Boolean(searchCountry),
    })),
  });

  const mergedEvents = useMemo(() => {
    const all: EventData[] = [];
    for (const q of queries) {
      if (q.data?.length) all.push(...q.data);
    }
    return dedupeEvents(all);
  }, [queries]);

  const isFetching = queries.some((q) => q.isFetching);
  const isWelcomeFetching = welcomeQuery.isFetching;

  const onRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['explore-culture-search'] });
    void queryClient.invalidateQueries({ queryKey: ['culturex-welcome-events'] });
    void queryClient.invalidateQueries({ queryKey: ['culturex-communities'] });
  }, [queryClient]);

  const scopeUiLabel = area === 'city' ? 'City' : area === 'council' ? 'Local area' : 'State';

  const horizontalCardW = Math.min(320, Math.max(260, windowWidth - 56));

  const welcomeEvents = welcomeQuery.data ?? [];
  const recommendedCommunities = communitiesQuery.data ?? [];
  const selectedCount = selectedTags.size;

  const refreshControlEl = (
    <RefreshControl refreshing={isFetching || isWelcomeFetching} onRefresh={onRefresh} />
  );

  const vibePresetsForUi = showAllVibes ? CULTURE_EXPLORE_PRESETS : quickVibePresets;

  const scrollToHappening = useCallback(() => {
    scrollRef.current?.scrollToOffset({ offset: Math.max(0, happeningSectionY - 8), animated: true });
  }, [happeningSectionY]);


  const renderRecommendItem = useCallback<ListRenderItem<EventData>>(
    ({ item }) => (
      <View style={[styles.gridCell, !isDesktop && styles.recommendRow]}>
        <M3EventCard
          event={item}
          variant="elevated"
        />
      </View>
    ),
    [isDesktop],
  );

  const listPadding = useMemo(
    () => ({
      paddingHorizontal: isDesktop ? 0 : hPad,
      paddingBottom: MAIN_TAB_UI.scrollBottomPad,
      paddingTop: isDesktop ? 0 : 12,
      maxWidth: isDesktop ? 920 : undefined,
      width: '100%' as const,
      alignSelf: 'center' as const,
    }),
    [hPad, isDesktop],
  );

  const culturexHeroBlock = (
    <M3Card
      variant="filled"
      style={styles.heroPanel}
    >
      <View style={{ padding: 20 }}>
          <View style={styles.heroKickerRow}>
            <View style={[styles.heroMark, { backgroundColor: m3Colors.primaryContainer }]}>
              <Ionicons name="earth-outline" size={19} color={m3Colors.onPrimaryContainer} />
            </View>
            <Text style={[styles.heroKicker, { color: m3Colors.primary }]}>Culture Explores</Text>
          </View>
          <Text style={[styles.heroTitle, M3Typography.headlineMedium, { color: m3Colors.onSurface }]}>Find the next culture to step into.</Text>
          <Text style={[styles.heroBody, M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant }]}>
            Pick a vibe and CultureX brings forward festivals, food, and music that welcome curious guests.
          </Text>
          <View style={styles.heroActionRow}>
            <M3Button
              onPress={scrollToHappening}
              variant="filled"
              leftIcon="navigate-outline"
            >
              Near you
            </M3Button>
            <M3Button
              onPress={() => setInviteModalVisible(true)}
              variant="tonal"
              leftIcon={inviteDone ? 'checkmark-circle-outline' : 'mail-unread-outline'}
            >
              {inviteDone ? 'Subscribed' : 'Invites'}
            </M3Button>
          </View>
          <View style={[styles.heroSignalRow, { borderTopColor: m3Colors.outlineVariant }]}>
            <View style={styles.heroSignal}>
              <Text style={[styles.heroSignalValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>
                {welcomeEvents.length || (isWelcomeFetching ? '...' : '0')}
              </Text>
              <Text style={[styles.heroSignalLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>Hosts</Text>
            </View>
            <View style={styles.heroSignal}>
              <Text style={[styles.heroSignalValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{selectedCount}</Text>
              <Text style={[styles.heroSignalLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>Vibes</Text>
            </View>
            <View style={styles.heroSignal}>
              <Text style={[styles.heroSignalValue, M3Typography.titleMedium, { color: m3Colors.onSurface }]}>{scopeUiLabel}</Text>
              <Text style={[styles.heroSignalLabel, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>Lens</Text>
            </View>
          </View>
      </View>
    </M3Card>
  );

  const inviteBlock = (
    <M3Card variant="filled" style={styles.inviteSimple}>
      <View style={{ padding: 18 }}>
          <View style={styles.inviteTitleRow}>
            <View style={[styles.inviteIcon, { backgroundColor: m3Colors.secondaryContainer }]}>
              <Ionicons name="mail-unread-outline" size={18} color={m3Colors.onSecondaryContainer} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.inviteTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>Get cultural invites</Text>
              <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>Occasional picks, no noise.</Text>
            </View>
          </View>
          {inviteDone ? (
            <View style={[styles.successRow, { backgroundColor: m3Colors.primaryContainer, marginTop: 12 }]}>
              <Ionicons name="checkmark-circle" size={20} color={m3Colors.onPrimaryContainer} />
              <Text style={[styles.successTxt, M3Typography.bodyMedium, { color: m3Colors.onPrimaryContainer }]}>You’re subscribed.</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12, gap: 12 }}>
              <TextInput
                value={inviteEmail}
                onChangeText={(t) => {
                  setInviteEmail(t);
                  setInviteErr(null);
                }}
                placeholder="your@email.com"
                placeholderTextColor={m3Colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!inviteMutation.isPending}
                accessibilityLabel="Email for cultural invites"
                style={[
                  styles.emailField,
                  {
                    color: m3Colors.onSurface,
                    borderColor: inviteErr ? m3Colors.error : m3Colors.outlineVariant,
                    backgroundColor: m3Colors.surfaceContainerLow,
                  },
                ]}
              />
              {inviteErr ? (
                <Text style={[M3Typography.labelSmall, { color: m3Colors.error }]} accessibilityLiveRegion="polite">
                  {inviteErr}
                </Text>
              ) : null}
              <M3Button
                variant="filled"
                loading={inviteMutation.isPending}
                onPress={() => inviteMutation.mutate()}
                leftIcon="send-outline"
                fullWidth
              >
                Join
              </M3Button>
            </View>
          )}
          <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant, marginTop: 12 }]}>
            CulturePass creates a recommendation notification when you are signed in.
          </Text>
      </View>
    </M3Card>
  );

  const toolbarBlock = (
    <M3Card variant="filled" style={styles.toolbarCard}>
      <View style={{ padding: isWeb ? 10 : 14 }}>
        <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant, marginBottom: 10 }]}>
            {isAuthenticated ? 'Signed-in mode keeps your CultureX lens synced across devices.' : 'Guest mode shows picks from your selected city.'}
        </Text>
        <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant, marginTop: 0 }]}>
          {city || '—'} · {country}
          {area === 'council' && council?.name ? ` · ${council.name}` : null}
          {area === 'state' && userState ? ` · ${userState}` : null}
          {' · '}
          {scopeUiLabel}
        </Text>
        <View style={[styles.toolbarDivider, { backgroundColor: m3Colors.outlineVariant }]} />
        <View style={styles.toolbarMicroRow}>
          <Ionicons name="options-outline" size={15} color={m3Colors.primary} />
          <Text style={[M3Typography.labelSmall, { color: m3Colors.onSurface }]}>
            {selectedCount ? `${selectedCount} vibe${selectedCount === 1 ? '' : 's'} active` : 'Choose a vibe to start'}
          </Text>
        </View>
      </View>
    </M3Card>
  );

  const vibesBlock = (
    <View style={styles.sectionContainer}>
      <DiscoverySection
        title="Explore by vibe"
        subtitle="Signal the feed with cultural themes."
      >
        <View style={styles.chipWrap}>
          {vibePresetsForUi.map((p: CultureExplorePreset) => (
            <M3FilterChip
                key={p.id}
                label={p.label}
                compact={isWeb}
                selected={selectedTags.has(p.cultureTag.toLowerCase())}
                onPress={() => toggleTag(p.cultureTag)}
                icon={p.cultureTag === CULTUREX_EXPLORES_CULTURE_TAG ? 'ribbon-outline' : undefined}
            />
          ))}
        </View>
        <M3Button
          onPress={() => setShowAllVibes((v) => !v)}
          variant="text"
          rightIcon={showAllVibes ? 'chevron-up' : 'chevron-down'}
          style={{ marginTop: 12, paddingHorizontal: 0 }}
        >
            {showAllVibes ? 'Show fewer' : 'More vibes'}
        </M3Button>
      </DiscoverySection>
    </View>
  );

  const happeningBlock = (
    <View onLayout={(e) => setHappeningSectionY(e.nativeEvent.layout.y)} style={styles.happeningAnchor}>
      <DiscoverySection
        title="Happening near you"
        subtitle="Hosts welcoming Culture Explores."
      >
        {isWelcomeFetching && welcomeEvents.length === 0 ? (
          <ActivityIndicator color={m3Colors.primary} style={{ marginVertical: 28 }} />
        ) : welcomeEvents.length === 0 ? (
          <M3Card variant="outlined" style={styles.emptyPanel}>
            <View style={{ padding: 18, flexDirection: 'row', gap: 12 }}>
                <Ionicons name="compass-outline" size={22} color={m3Colors.primary} />
                <View style={{ flex: 1 }}>
                <Text style={[styles.emptyStateTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>No events yet</Text>
                <Text style={[styles.emptyStateSub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                    Try State or browse all events while hosts catch up.
                </Text>
                </View>
            </View>
          </M3Card>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hRailContent}
            nestedScrollEnabled
          >
            {welcomeEvents.slice(0, 24).map((event) => (
              <View key={event.id} style={{ width: horizontalCardW }}>
                <M3EventCard
                  event={event}
                  variant="elevated"
                />
              </View>
            ))}
          </ScrollView>
        )}
      </DiscoverySection>
    </View>
  );

  const communityBlock = (
    <DiscoverySection
      title="Communities to explore"
      subtitle={recommendedCommunities.length > 0 ? `${recommendedCommunities.length} communit${recommendedCommunities.length === 1 ? 'y' : 'ies'}` : undefined}
    >
      {communitiesQuery.isFetching && recommendedCommunities.length === 0 ? (
        <ActivityIndicator color={m3Colors.primary} style={{ marginVertical: 20 }} />
      ) : recommendedCommunities.length === 0 ? (
        <M3Card variant="outlined" style={styles.emptyPanel}>
            <View style={{ padding: 18, flexDirection: 'row', gap: 12 }}>
                <Ionicons name="people-outline" size={22} color={m3Colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.emptyStateTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>No hubs yet</Text>
                    <Text style={[styles.emptyStateSub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                        Try another vibe or browse the directory.
                    </Text>
                </View>
            </View>
        </M3Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hRailContent}
          nestedScrollEnabled
        >
          {recommendedCommunities.map((community) => (
            <View key={community.id} style={{ width: horizontalCardW }}>
              <M3CommunityCard community={community} />
            </View>
          ))}
        </ScrollView>
      )}
    </DiscoverySection>
  );

  const recommendedIntroBlock = (
    <DiscoverySection
      title="Recommended for you"
      subtitle={
        mergedEvents.length > 0 ? `${mergedEvents.length} event${mergedEvents.length === 1 ? '' : 's'}` : undefined
      }
    >
      {debouncedSelectedList.length === 0 ? (
        <M3Card variant="filled" style={[styles.emptyPanel, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
          <View style={{ padding: 18, flexDirection: 'row', gap: 12 }}>
            <Ionicons name="color-palette-outline" size={22} color={m3Colors.primary} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.emptyStateTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>Choose a vibe</Text>
                <Text style={[styles.emptyStateSub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                    Select themes to build your personalized grid.
                </Text>
            </View>
          </View>
        </M3Card>
      ) : isFetching && mergedEvents.length === 0 ? (
        <ActivityIndicator color={m3Colors.primary} style={{ marginVertical: 24 }} />
      ) : mergedEvents.length === 0 ? (
        <M3Card variant="outlined" style={styles.emptyPanel}>
          <View style={{ padding: 18, flexDirection: 'row', gap: 12 }}>
            <Ionicons name="search-outline" size={22} color={m3Colors.primary} />
            <View style={{ flex: 1 }}>
                <Text style={[styles.emptyStateTitle, M3Typography.titleSmall, { color: m3Colors.onSurface }]}>No matches in this lens</Text>
                <Text style={[styles.emptyStateSub, M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                    Try widening your area or adding another vibe.
                </Text>
            </View>
          </View>
        </M3Card>
      ) : null}
    </DiscoverySection>
  );

  const passportBlock = (
    <View style={[styles.sectionContainer, { paddingHorizontal: hPad }]}>
      <CulturePassportPanel />
    </View>
  );

  const questRailBlock = (
    <View style={styles.sectionContainer}>
      <QuestRail city={city} country={country} hPad={hPad} />
    </View>
  );

  const exploreSidebarColumn = (
    <>
      {culturexHeroBlock}
      {passportBlock}
      {toolbarBlock}
      {vibesBlock}
    </>
  );

  const mobileExploreListHeader = (
    <>
      {culturexHeroBlock}
      {passportBlock}
      {questRailBlock}
      {toolbarBlock}
      {vibesBlock}
      {happeningBlock}
      {communityBlock}
      {recommendedIntroBlock}
    </>
  );

  const desktopExploreListHeader = (
    <>
      {questRailBlock}
      {happeningBlock}
      {communityBlock}
      {recommendedIntroBlock}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: m3Colors.background }]}>
      <NavigationMetadata />
      <M3TopAppBar
        title="CultureX"
        variant="small"
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={styles.topBarLogo}
            contentFit="cover"
          />
        }
        actions={[
            { icon: 'notifications-outline', onPress: () => router.push('/notifications') }
        ]}
      />
      <View style={[styles.header, { borderBottomColor: m3Colors.outlineVariant }]}>
        <View style={[styles.topMenuWrap, { maxWidth: isDesktop ? CX_DESKTOP_MAX_W : undefined, alignSelf: 'center', width: '100%' }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.topMenuRow,
              {
                paddingHorizontal: hPad,
                paddingVertical: Platform.OS === 'web' ? 4 : 12,
                gap: Platform.OS === 'web' ? 4 : 8,
              },
            ]}
          >
            {(['city', 'council', 'state'] as const).map((s) => (
              <M3FilterChip
                key={s}
                label={s === 'city' ? 'City' : s === 'council' ? 'Local area' : 'State'}
                compact={isWeb}
                selected={area === s}
                onPress={() => setArea(s)}
              />
            ))}
            <View style={{ width: 1, height: 24, backgroundColor: m3Colors.outlineVariant, marginHorizontal: 4, alignSelf: 'center' }} />
            <M3Button
              variant="text"
              onPress={() => router.push('/events')}
              leftIcon="calendar-outline"
              style={isWeb ? styles.topMenuLinkBtnWeb : undefined}
              labelStyle={isWeb ? styles.topMenuLinkLabelWeb : undefined}
            >
              Events
            </M3Button>
            <M3Button
              variant="text"
              onPress={() => router.push('/map')}
              leftIcon="map-outline"
              style={isWeb ? styles.topMenuLinkBtnWeb : undefined}
              labelStyle={isWeb ? styles.topMenuLinkLabelWeb : undefined}
            >
              Map
            </M3Button>
            <M3Button
              variant="text"
              onPress={() => router.push('/(tabs)/directory')}
              leftIcon="business-outline"
              style={isWeb ? styles.topMenuLinkBtnWeb : undefined}
              labelStyle={isWeb ? styles.topMenuLinkLabelWeb : undefined}
            >
              Directory
            </M3Button>
          </ScrollView>
        </View>
      </View>

      <View style={styles.tabBody}>
        {isDesktop ? (
          <View style={[styles.desktopExploreShell, { paddingHorizontal: hPad, gap: CX_SIDEBAR_GAP }]}>
            <ScrollView
              style={styles.culturexSidebar}
              contentContainerStyle={{
                paddingBottom: MAIN_TAB_UI.scrollBottomPad,
                gap: 16,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {exploreSidebarColumn}
            </ScrollView>
            <View style={styles.desktopExploreMain}>
              <FlashList<EventData>
                ref={scrollRef}
                style={styles.tabBodyScroll}
                data={mergedEvents}
                keyExtractor={(item) => item.id}
                renderItem={renderRecommendItem}
                numColumns={2}
                keyboardShouldPersistTaps="handled"
                refreshControl={refreshControlEl}
                contentContainerStyle={{
                  paddingBottom: MAIN_TAB_UI.scrollBottomPad,
                  paddingTop: 12,
                }}
                removeClippedSubviews={Platform.OS !== 'web'}
                ListHeaderComponent={desktopExploreListHeader}
              />
            </View>
          </View>
        ) : (
          <FlashList<EventData>
            ref={scrollRef}
            style={styles.tabBodyScroll}
            data={mergedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderRecommendItem}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControlEl}
            contentContainerStyle={listPadding}
            removeClippedSubviews={Platform.OS !== 'web'}
            ListHeaderComponent={mobileExploreListHeader}
          />
        )}
      </View>
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setInviteModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close cultural invites popup"
          />
          <View style={styles.inviteModalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Cultural invites</Text>
              <Pressable
                onPress={() => setInviteModalVisible(false)}
                hitSlop={12}
                style={[styles.modalClose, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Close cultural invites popup"
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>
            {inviteBlock}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function ExploreTabScreen() {
  return (
    <ErrorBoundary>
      <ExploreTabScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBody: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  tabBodyScroll: {
    flex: 1,
  },
  recommendRow: {
    marginBottom: 16,
  },
  toolbarCard: {
    marginBottom: 10,
  },
  sectionContainer: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  toolbarDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 12,
    marginBottom: 10,
  },
  toolbarMicroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toolbarMicro: {
    flex: 1,
    minWidth: 0,
  },
  happeningAnchor: {},
  hRailContent: { gap: 16, paddingVertical: 12, paddingRight: 8 },
  hRailCard: {},
  communityRailCard: { minWidth: 0 },
  emptyPanel: {
    borderRadius: 24,
    marginBottom: 8,
  },
  emptyPanelTitle: {},
  emptyPanelBody: {},
  emptyStateTitle: {},
  emptyStateSub: {
    marginTop: 2,
  },
  countPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countPillText: {},
  moreVibesBtn: {},
  moreVibesTxt: {},
  inviteSimple: {
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  inviteModalCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  modalTitle: {},
  modalClose: {},
  inviteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {},
  header: {
    paddingHorizontal: 0,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slimHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  slimHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nearYouBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  nearYouTxt: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  desktopExploreShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    maxWidth: CX_DESKTOP_MAX_W,
    alignSelf: 'center',
    paddingTop: 10,
  },
  culturexSidebar: {
    width: CX_SIDEBAR_W,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  desktopExploreMain: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  topMenuWrap: {},
  topMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
  },
  topMenuLinkBtnWeb: {
    minHeight: 32,
    paddingHorizontal: 8,
  },
  topMenuLinkLabelWeb: {
    fontSize: 13,
  },
  topBarLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  segmentBtn: {},
  segmentLabel: {},
  heroPanel: {
    marginBottom: 12,
  },
  heroKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    letterSpacing: -0.5,
  },
  heroBody: {
    marginTop: 8,
  },
  heroActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  heroPrimaryAction: {},
  heroPrimaryActionText: {},
  heroSecondaryAction: {},
  heroSecondaryActionText: {},
  heroSignalRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 10,
  },
  heroSignal: {
    flex: 1,
    minWidth: 0,
  },
  heroSignalValue: {},
  heroSignalLabel: {
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emailField: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inviteErr: {},
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  successTxt: { flex: 1 },
  legalMicro: {},
  banner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  bannerTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  bannerBody: { fontSize: 13, marginTop: 4, marginBottom: 10, lineHeight: 18 },
  hint: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  scopeChip: {},
  scopeChipTxt: {},
  meta: {},
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {},
  chipTxt: {},
  empty: { textAlign: 'center', marginVertical: 16, fontSize: 14, lineHeight: 21 },
});
