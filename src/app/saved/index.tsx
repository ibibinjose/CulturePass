import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaved } from '@/contexts/SavedContext';
import { useMemo, useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  getCommunityAccent,
  getCommunityHeadline,
  getCommunityMemberCount,
} from '@/lib/community';
import type { Community, EventData } from '@/shared/schema';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily, Radius, shadows } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { M3TopAppBar, M3Button, GlassView } from '@/design-system/ui';

const IS_WEB = Platform.OS === 'web';

type TabKey = 'events' | 'communities' | 'hubs';

const EVENTS_CATALOG_KEY = ['events', 'list', 'saved-catalog'] as const;
const COMMUNITIES_LIST_KEY = ['/api/communities'] as const;

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function eventStartMs(e: EventData): number {
  const d = e.date?.trim();
  if (!d) return NaN;
  const t = (e.time ?? '00:00').trim();
  return Date.parse(`${d}T${t || '00:00'}:00`);
}

function eventImageUri(e: EventData): string | undefined {
  const u = e.heroImageUrl ?? e.imageUrl;
  return u?.trim() || undefined;
}

function eventKindLabel(e: EventData): string {
  const cat = e.category?.trim();
  if (cat) return cat;
  if (e.eventType) return e.eventType.replace(/_/g, ' ');
  const tag = e.cultureTag?.[0] ?? e.cultureTags?.[0];
  if (tag) return tag;
  return 'Event';
}

function formatEventPrice(e: EventData): string {
  if (e.priceLabel?.trim()) return e.priceLabel.trim();
  if (e.isFree) return 'Free';
  if (e.priceCents != null && e.priceCents > 0) {
    return `$${(e.priceCents / 100).toFixed(0)}+`;
  }
  return '';
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const queryClient = useQueryClient();

  const bottomInset = IS_WEB ? 26 : insets.bottom;

  const [activeTab, setActiveTab] = useState<TabKey>('events');
  const [refreshing, setRefreshing] = useState(false);
  const {
    savedEvents,
    joinedCommunities,
    savedCommunityBookmarks,
    savedHubs,
    toggleSaveEvent,
    toggleJoinCommunity,
    toggleSaveCommunityBookmark,
    toggleSaveHub,
  } = useSaved();

  const savedCount = savedEvents.length;
  const joinedCount = joinedCommunities.length;
  const bookmarkCount = savedCommunityBookmarks.length;
  const communitiesTabTotal = useMemo(
    () => new Set([...joinedCommunities, ...savedCommunityBookmarks]).size,
    [joinedCommunities, savedCommunityBookmarks],
  );

  const eventsQuery = useQuery({
    queryKey: EVENTS_CATALOG_KEY,
    queryFn: async () => {
      const res = await api.events.list({ pageSize: 400, page: 1 });
      return Array.isArray(res.events) ? res.events : [];
    },
    enabled: savedCount > 0,
    staleTime: 60 * 1000,
  });

  const catalogEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const catalogFetched = eventsQuery.isFetched;

  const missingEventIds = useMemo(() => {
    if (savedCount === 0 || !catalogFetched) return [];
    const catIds = new Set(catalogEvents.map((e) => e.id));
    return savedEvents.filter((id) => !catIds.has(id)).slice(0, 40);
  }, [savedCount, catalogFetched, catalogEvents, savedEvents]);

  const eventDetailQueries = useQueries({
    queries: missingEventIds.map((id) => ({
      queryKey: ['events', 'detail', id] as const,
      queryFn: () => api.events.get(id),
      enabled: savedCount > 0 && catalogFetched && missingEventIds.includes(id),
      staleTime: 60_000,
    })),
  });

  const eventDetailsStillLoading =
    missingEventIds.length > 0 &&
    eventDetailQueries.length === missingEventIds.length &&
    eventDetailQueries.every((q) => q.isPending);

  const communitiesQuery = useQuery({
    queryKey: COMMUNITIES_LIST_KEY,
    queryFn: () => api.communities.list(),
    enabled: joinedCount > 0 || bookmarkCount > 0,
    staleTime: 60 * 1000,
  });

  const allCommunities = useMemo(() => communitiesQuery.data ?? [], [communitiesQuery.data]);

  const bookmarkOnlyIds = useMemo(
    () => savedCommunityBookmarks.filter((id) => !joinedCommunities.includes(id)),
    [savedCommunityBookmarks, joinedCommunities],
  );

  const missingCommunityIds = useMemo(() => {
    if (!communitiesQuery.isFetched || bookmarkOnlyIds.length === 0) return [];
    const have = new Set(allCommunities.map((c) => c.id));
    return bookmarkOnlyIds.filter((id) => !have.has(id)).slice(0, 30);
  }, [communitiesQuery.isFetched, bookmarkOnlyIds, allCommunities]);

  const communityDetailQueries = useQueries({
    queries: missingCommunityIds.map((id) => ({
      queryKey: ['communities', 'detail', id] as const,
      queryFn: () => api.communities.get(id),
      enabled:
        (joinedCount > 0 || bookmarkCount > 0) &&
        communitiesQuery.isFetched &&
        missingCommunityIds.includes(id),
      staleTime: 60_000,
    })),
  });

  const communityDetailsStillLoading =
    missingCommunityIds.length > 0 &&
    communityDetailQueries.length === missingCommunityIds.length &&
    communityDetailQueries.every((q) => q.isPending);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (savedCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: EVENTS_CATALOG_KEY }));
      }
      if (joinedCount > 0 || bookmarkCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: COMMUNITIES_LIST_KEY }));
      }
      if (savedCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: ['events', 'detail'] }));
      }
      if (bookmarkCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: ['communities', 'detail'] }));
      }
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, savedCount, joinedCount, bookmarkCount]);

  const savedEventItems = useMemo(() => {
    if (savedCount === 0) return [];
    const merged = new Map<string, EventData>();
    for (const e of catalogEvents) merged.set(e.id, e);
    for (const q of eventDetailQueries) {
      if (q.data) merged.set(q.data.id, q.data);
    }
    const now = Date.now();
    return savedEvents
      .map((id) => merged.get(id))
      .filter((e): e is EventData => e != null)
      .map((e) => ({ e, ms: eventStartMs(e) }))
      .sort((a, b) => {
        const aUp = !Number.isNaN(a.ms) && a.ms >= now - 12 * 3600000;
        const bUp = !Number.isNaN(b.ms) && b.ms >= now - 12 * 3600000;
        if (aUp !== bUp) return aUp ? -1 : 1;
        const am = Number.isNaN(a.ms) ? Infinity : a.ms;
        const bm = Number.isNaN(b.ms) ? Infinity : b.ms;
        return am - bm;
      })
      .map((x) => x.e);
  }, [catalogEvents, eventDetailQueries, savedEvents, savedCount]);

  const joinedCommunityItems = useMemo(() => {
    if (!allCommunities.length || joinedCount === 0) return [];
    const idSet = new Set(joinedCommunities);
    return allCommunities.filter((c) => idSet.has(c.id));
  }, [allCommunities, joinedCommunities, joinedCount]);

  const bookmarkCommunityItems = useMemo(() => {
    if (bookmarkOnlyIds.length === 0) return [];
    const byId = new Map<string, Community>();
    for (const c of allCommunities) byId.set(c.id, c);
    for (const q of communityDetailQueries) {
      if (q.data) byId.set(q.data.id, q.data);
    }
    return bookmarkOnlyIds.map((id) => byId.get(id)).filter((c): c is Community => c != null);
  }, [bookmarkOnlyIds, allCommunities, communityDetailQueries]);

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
    { key: 'events', label: 'Events', icon: 'bookmark', count: savedCount },
    { key: 'communities', label: 'Communities', icon: 'people', count: communitiesTabTotal },
    { key: 'hubs', label: 'Hubs', icon: 'earth', count: savedHubs.length },
  ];

  const loadingEvents =
    activeTab === 'events' && savedCount > 0 && (eventsQuery.isPending || eventDetailsStillLoading);
  const loadingCommunities =
    activeTab === 'communities' &&
    (joinedCount > 0 || bookmarkCount > 0) &&
    (communitiesQuery.isPending || communityDetailsStillLoading);
  const showListSkeleton = loadingEvents || loadingCommunities;

  const eventsError = activeTab === 'events' && savedCount > 0 && eventsQuery.isError;
  const communitiesError =
    activeTab === 'communities' &&
    (joinedCount > 0 || bookmarkCount > 0) &&
    communitiesQuery.isError;

  return (
    <AuthGuard
      icon="bookmark-outline"
      title="My Saved"
      message="Sign in to revisit your bookmarks, memberships and cultural hub shortcuts."
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
            colors={[`${colors.primary}08`, 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
        />

        <M3TopAppBar
          title="Saved"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-space'))}
          titleLeading={
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
              contentFit="contain"
            />
          }
        />

        <View style={[styles.shell, isDesktop && styles.desktopShell, { paddingHorizontal: hPad }]}>
          <GlassView intensity={15} style={[styles.tabRail, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.borderLight }]}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={({ pressed }) => [
                    styles.tabBtn,
                    isActive && [styles.tabBtnActive, { backgroundColor: colors.surface }],
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => {
                    if (!IS_WEB) Haptics.selectionAsync();
                    setActiveTab(tab.key);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[styles.tabLabel, { color: isActive ? colors.text : colors.textTertiary, fontFamily: isActive ? FontFamily.bold : FontFamily.medium }]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {tab.count > 0 ? (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: isActive ? colors.primary : colors.primarySoft },
                      ]}
                    >
                      <Text style={[styles.countText, { color: isActive ? '#FFFFFF' : colors.primary }]}>{tab.count}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </GlassView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: bottomInset + 100,
              flexGrow: 1,
            }}
          >
            {eventsError || communitiesError ? (
              <GlassView contentStyle={{ padding: 24, alignItems: 'center', gap: 16 }}>
                <Ionicons name="cloud-offline" size={32} color={colors.error} />
                <Text style={{ color: colors.textSecondary, textAlign: 'center', fontFamily: FontFamily.medium }}>
                  Could not load your saved list. Tap below to retry.
                </Text>
                <M3Button variant="tonal" onPress={() => void onRefresh()} style={{ height: 36 }}>
                  Retry
                </M3Button>
              </GlassView>
            ) : null}

            {showListSkeleton ? (
              <View style={{ gap: 16 }}>
                {[0, 1, 2].map((k) => (
                  <View key={k} style={[styles.skeletonCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                    <Skeleton width={120} height={140} borderRadius={0} />
                    <View style={{ flex: 1, padding: 18, gap: 12 }}>
                      <Skeleton width="40%" height={12} borderRadius={6} />
                      <Skeleton width="90%" height={20} borderRadius={8} />
                      <Skeleton width="60%" height={14} borderRadius={6} />
                      <Skeleton width="50%" height={14} borderRadius={6} />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {!showListSkeleton && activeTab === 'events' && (
              <>
                {savedCount === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="bookmark"
                    title="No saved events yet"
                    description="Save events you're interested in from the discovery feed and they'll appear here."
                    ctaLabel="Browse events"
                    onCta={() => router.push('/(tabs)')}
                  />
                ) : (
                  <>
                    <View style={styles.sectionHead}>
                      <View style={[styles.sectionAccent, { backgroundColor: CultureTokens.indigo }]} />
                      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>UPCOMING EVENTS</Text>
                    </View>
                    {savedEventItems.map((event) => {
                      const img = eventImageUri(event);
                      const price = formatEventPrice(event);
                      return (
                        <GlassView key={event.id} style={styles.itemOuter} contentStyle={{ padding: 0 }}>
                          <Pressable
                            style={({ pressed }) => [styles.itemPress, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                            onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
                          >
                            {img ? (
                              <Image source={{ uri: img }} style={styles.itemImage} contentFit="cover" transition={200} />
                            ) : (
                              <View style={[styles.itemImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
                                <Ionicons name="calendar" size={32} color={colors.primary} />
                              </View>
                            )}
                            <View style={styles.itemInfo}>
                              <View style={[styles.typeBadge, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                                <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                                  {eventKindLabel(event).toUpperCase()}
                                </Text>
                              </View>
                              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                                {event.title}
                              </Text>
                              <View style={{ gap: 4 }}>
                                <View style={styles.metaRow}>
                                  <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                    {formatDate(event.date)}
                                  </Text>
                                </View>
                                {event.venue && (
                                  <View style={styles.metaRow}>
                                    <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                      {event.venue}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              {price && (
                                <Text style={[styles.itemPrice, { color: CultureTokens.teal }]}>{price}</Text>
                              )}
                            </View>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.bookmarkBtn, { backgroundColor: colors.surface + 'B3', borderColor: colors.borderLight }, pressed && { opacity: 0.7 }]}
                            onPress={() => {
                              if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              toggleSaveEvent(event.id);
                            }}
                          >
                            <Ionicons name="bookmark" size={18} color={colors.primary} />
                          </Pressable>
                        </GlassView>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {!showListSkeleton && activeTab === 'communities' && (
              <>
                {communitiesTabTotal === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="people"
                    title="No communities yet"
                    description="Join communities or bookmark cultural hubs to keep track of your diaspora circles."
                    ctaLabel="Explore communities"
                    onCta={() => router.push('/(tabs)/community')}
                  />
                ) : (
                  <>
                    {[...joinedCommunityItems, ...bookmarkCommunityItems].map((community) => {
                      const accent = getCommunityAccent(community, colors.primary);
                      const isMember = joinedCommunities.includes(community.id);
                      return (
                        <GlassView key={community.id} style={styles.itemOuter} contentStyle={{ padding: 0 }}>
                          <Pressable
                            style={({ pressed }) => [styles.itemPress, pressed && { opacity: 0.94 }]}
                            onPress={() => router.push({ pathname: '/c/[id]', params: { id: community.id } })}
                          >
                            <View style={[styles.commAvatar, { backgroundColor: accent + '15', borderColor: accent + '25' }]}>
                                {community.iconEmoji ? (
                                    <Text style={{ fontSize: 24 }}>{community.iconEmoji}</Text>
                                ) : (
                                    <Ionicons name="people" size={24} color={accent} />
                                )}
                            </View>
                            <View style={styles.itemInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                                        {community.name}
                                    </Text>
                                    {isMember && (
                                        <View style={[styles.memberBadge, { backgroundColor: CultureTokens.teal + '15', borderColor: CultureTokens.teal + '30' }]}>
                                            <Text style={{ color: CultureTokens.teal, fontSize: 8, fontFamily: FontFamily.bold }}>MEMBER</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.commHeadline, { color: colors.textSecondary }]} numberOfLines={2}>
                                    {getCommunityHeadline(community)}
                                </Text>
                                <View style={styles.metaRow}>
                                    <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {getCommunityMemberCount(community)} members
                                    </Text>
                                </View>
                            </View>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.bookmarkBtn, { backgroundColor: colors.surface + 'B3', borderColor: colors.borderLight }, pressed && { opacity: 0.7 }]}
                            onPress={() => {
                              if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              if (isMember) toggleJoinCommunity(community.id);
                              else toggleSaveCommunityBookmark(community.id);
                            }}
                          >
                            <Ionicons name={isMember ? "exit-outline" : "bookmark"} size={18} color={isMember ? colors.textTertiary : colors.primary} />
                          </Pressable>
                        </GlassView>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {!showListSkeleton && activeTab === 'hubs' && (
              <>
                {savedHubs.length === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="earth"
                    title="No saved hubs"
                    description="Visit a cultural hub page and tap the save icon to add it to your shortcuts."
                    ctaLabel="CultureX Hubs"
                    onCta={() => router.push('/explore')}
                  />
                ) : (
                  savedHubs.map((hub) => (
                    <GlassView key={hub.id} style={styles.itemOuter} contentStyle={{ padding: 0 }}>
                      <Pressable
                        style={({ pressed }) => [styles.itemPress, pressed && { opacity: 0.92 }]}
                        onPress={() => router.push(hub.href as any)}
                      >
                        <View style={[styles.commAvatar, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
                          <Ionicons name="earth" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                            {hub.title}
                          </Text>
                          <Text style={[styles.commHeadline, { color: colors.textSecondary }]} numberOfLines={1}>
                            {hub.subtitle || 'Global Diaspora Hub'}
                          </Text>
                          <Text style={{ color: colors.primary, fontSize: 11, fontFamily: FontFamily.bold, marginTop: 4 }} numberOfLines={1}>
                            {hub.href.replace('https://', '')}
                          </Text>
                        </View>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.bookmarkBtn, { backgroundColor: colors.surface + 'B3', borderColor: colors.borderLight }, pressed && { opacity: 0.7 }]}
                        onPress={() => {
                          if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          toggleSaveHub(hub);
                        }}
                      >
                        <Ionicons name="bookmark" size={18} color={colors.primary} />
                      </Pressable>
                    </GlassView>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </AuthGuard>
  );
}

function EmptyBlock({
  colors,
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <GlassView style={{ width: '100%' }} contentStyle={{ padding: 40, alignItems: 'center', gap: 20 }}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon as any} size={40} color={colors.primary} />
        </View>
        <View style={{ gap: 8, alignItems: 'center' }}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <M3Button variant="filled" style={{ marginTop: 8, minWidth: 200 }} onPress={onCta}>
            {ctaLabel}
        </M3Button>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shell: { flex: 1, alignSelf: 'center', width: '100%' },
  desktopShell: { maxWidth: 800 },

  tabRail: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: Radius.lg,
    marginTop: 10,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabBtnActive: {
    ...Platform.select({
        ios: shadows.small,
        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
    })
  },
  tabLabel: { fontSize: 13 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, minWidth: 24, alignItems: 'center' },
  countText: { fontSize: 10, fontFamily: FontFamily.bold },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 8, marginLeft: 4 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1 },

  itemOuter: { marginBottom: 16 },
  itemPress: { flexDirection: 'row', alignItems: 'stretch' },
  itemImage: { width: 120, minHeight: 150 },
  itemInfo: { flex: 1, padding: 18, gap: 8, justifyContent: 'center', paddingRight: 56 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  typeBadgeText: { fontSize: 9, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  itemTitle: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: -0.2, lineHeight: 22 },
  itemPrice: { fontSize: 15, fontFamily: FontFamily.bold, marginTop: 4 },

  commAvatar: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', margin: 18, marginRight: 0, borderWidth: 1 },
  commHeadline: { fontSize: 13, fontFamily: FontFamily.medium, lineHeight: 18, opacity: 0.9 },
  memberBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontFamily: FontFamily.medium },

  bookmarkBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  emptyWrap: { paddingTop: 40, paddingHorizontal: 4 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 22, maxWidth: 300, opacity: 0.8 },

  skeletonCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
});
