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
import { useAuth } from '@/lib/auth';
import type { EventData, Ticket } from '@/shared/schema';
import { AuthGuard } from '@/modules/core/auth/AuthGuard';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily, Radius, shadows } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { M3TopAppBar, M3Button, GlassView } from '@/design-system/ui';
import Svg, { Rect, Circle, Ellipse, Path, Text as SvgText, G } from 'react-native-svg';

const IS_WEB = Platform.OS === 'web';
type TabKey = 'favorites' | 'stamps';

const EVENTS_CATALOG_KEY = ['events', 'list', 'saved-catalog'] as const;

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

// ── CUSTOM RETRO VINTAGE STAMP COMPONENT ───────────────────────────
interface RetroStampProps {
  hostName: string;
  date?: string;
  size?: number;
}

export function RetroStamp({ hostName, date = '2025', size = 130 }: RetroStampProps) {
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < hostName.length; i++) {
      h = hostName.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }, [hostName]);

  const shapeIndex = hash % 5;
  const colorIndex = (hash >> 2) % 6;

  const palettes = [
    { text: '#065F46', border: '#059669', bg: '#ECFDF5', fill: '#D1FAE5' }, // Green/Emerald
    { text: '#991B1B', border: '#DC2626', bg: '#FEF2F2', fill: '#FEE2E2' }, // Red/Coral
    { text: '#1E40AF', border: '#3B82F6', bg: '#EFF6FF', fill: '#DBEAFE' }, // Blue/Indigo
    { text: '#9D174D', border: '#EC4899', bg: '#FDF2F8', fill: '#FCE7F3' }, // Pink/Rose
    { text: '#115E59', border: '#0D9488', bg: '#F0FDFA', fill: '#CCFBF1' }, // Cyan/Teal
    { text: '#9A3412', border: '#F97316', bg: '#FFF7ED', fill: '#FFEDD5' }, // Orange/Amber
  ];

  const color = palettes[colorIndex];

  const nameParts = useMemo(() => {
    const cleaned = hostName.toUpperCase().replace(/AND/g, '&');
    const words = cleaned.split(' ');
    if (words.length <= 2) return [cleaned];
    if (words.length === 3) return [`${words[0]} ${words[1]}`, words[2]];
    const mid = Math.ceil(words.length / 2);
    return [
      words.slice(0, mid).join(' '),
      words.slice(mid).join(' ')
    ];
  }, [hostName]);

  const renderShape = () => {
    switch (shapeIndex) {
      case 0: // Oval
        return (
          <G>
            <Ellipse cx="75" cy="55" rx="70" ry="46" fill={color.bg} stroke={color.border} strokeWidth="3" />
            <Ellipse cx="75" cy="55" rx="64" ry="40" fill="none" stroke={color.border} strokeWidth="1" strokeDasharray="3,3" />
            <SvgText x="75" y="40" fontSize="9" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              CULTURAL PASS
            </SvgText>
            <SvgText x="75" y="55" fontSize="10.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              {nameParts[0]}
            </SvgText>
            {nameParts[1] ? (
              <SvgText x="75" y="68" fontSize="9.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
                {nameParts[1]}
              </SvgText>
            ) : null}
            <SvgText x="75" y="85" fontSize="9" fontFamily={FontFamily.medium} fill={color.border} textAnchor="middle">
              ★ {date} ★
            </SvgText>
          </G>
        );
      case 1: // Circle
        return (
          <G>
            <Circle cx="75" cy="75" r="68" fill={color.bg} stroke={color.border} strokeWidth="3" />
            <Circle cx="75" cy="75" r="62" fill="none" stroke={color.border} strokeWidth="1" strokeDasharray="4,3" />
            <Circle cx="75" cy="75" r="58" fill="none" stroke={color.border} strokeWidth="0.8" />
            <SvgText x="75" y="52" fontSize="9" fontFamily={FontFamily.bold} fill={color.border} textAnchor="middle" letterSpacing="1">
              CULTURAL PASS
            </SvgText>
            <SvgText x="75" y="72" fontSize="10.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              {nameParts[0]}
            </SvgText>
            {nameParts[1] ? (
              <SvgText x="75" y="85" fontSize="9.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
                {nameParts[1]}
              </SvgText>
            ) : null}
            <SvgText x="75" y="104" fontSize="10" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              ★ {date} ★
            </SvgText>
          </G>
        );
      case 2: // Ticket/Coupon Shape
        return (
          <G>
            <Path
              d="M 12 15 A 8 8 0 0 0 20 23 L 130 23 A 8 8 0 0 0 138 15 L 138 95 A 8 8 0 0 0 130 87 L 20 87 A 8 8 0 0 0 12 95 Z"
              fill={color.bg}
              stroke={color.border}
              strokeWidth="3"
            />
            <Path
              d="M 15 18 L 135 18 M 15 92 L 135 92"
              stroke={color.border}
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <SvgText x="75" y="42" fontSize="9" fontFamily={FontFamily.bold} fill={color.border} textAnchor="middle" letterSpacing="0.5">
              CULTURAL PASS {date}
            </SvgText>
            <SvgText x="75" y="60" fontSize="10.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              {nameParts[0]}
            </SvgText>
            {nameParts[1] ? (
              <SvgText x="75" y="74" fontSize="9.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
                {nameParts[1]}
              </SvgText>
            ) : null}
            <SvgText x="75" y="88" fontSize="8" fill={color.text} textAnchor="middle">
              ★★★★★
            </SvgText>
          </G>
        );
      case 3: // Octagon/Arch
        return (
          <G>
            <Path
              d="M 25 15 L 125 15 L 140 30 L 140 80 L 125 95 L 25 95 L 10 80 L 10 30 Z"
              fill={color.bg}
              stroke={color.border}
              strokeWidth="3"
            />
            <Path
              d="M 28 18 L 122 18 L 137 32 L 137 78 L 122 92 L 28 92 L 13 78 L 13 32 Z"
              fill="none"
              stroke={color.border}
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <SvgText x="75" y="40" fontSize="9" fontFamily={FontFamily.bold} fill={color.border} textAnchor="middle">
              OFFICIAL ENTRY
            </SvgText>
            <SvgText x="75" y="58" fontSize="10.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              {nameParts[0]}
            </SvgText>
            {nameParts[1] ? (
              <SvgText x="75" y="71" fontSize="9.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
                {nameParts[1]}
              </SvgText>
            ) : null}
            <SvgText x="75" y="85" fontSize="9" fontFamily={FontFamily.medium} fill={color.text} textAnchor="middle">
              PASSPORT · {date}
            </SvgText>
          </G>
        );
      default: // Double Border Rectangle
        return (
          <G>
            <Rect x="10" y="15" width="130" height="80" rx="6" fill={color.bg} stroke={color.border} strokeWidth="3" />
            <Rect x="15" y="20" width="120" height="70" rx="3" fill="none" stroke={color.border} strokeWidth="1" strokeDasharray="3,2" />
            <SvgText x="75" y="40" fontSize="10.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              {nameParts[0]}
            </SvgText>
            {nameParts[1] ? (
              <SvgText x="75" y="54" fontSize="9.5" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
                {nameParts[1]}
              </SvgText>
            ) : null}
            <SvgText x="75" y="70" fontSize="9" fontFamily={FontFamily.medium} fill={color.border} textAnchor="middle">
              CULTURAL PASS
            </SvgText>
            <SvgText x="75" y="84" fontSize="10" fontFamily={FontFamily.bold} fill={color.text} textAnchor="middle">
              ★ {date} ★
            </SvgText>
          </G>
        );
    }
  };

  const height = shapeIndex === 1 ? size : Math.round(size * 0.77);

  return (
    <View style={{ width: size, height, alignItems: 'center', justifyContent: 'center', margin: 10 }}>
      <Svg width={size} height={height} viewBox={shapeIndex === 1 ? "0 0 150 150" : "0 0 150 110"}>
        {renderShape()}
      </Svg>
    </View>
  );
}

// ── GROUP SAVED EVENTS BY CALENDAR DATE RANGE ─────────────────────
function groupEventsByDate(events: EventData[]) {
  const groups: { [key: string]: EventData[] } = {};
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  for (const e of events) {
    if (!e.date) continue;
    const eventDate = new Date(e.date);
    if (Number.isNaN(eventDate.getTime())) {
      if (!groups['Upcoming']) groups['Upcoming'] = [];
      groups['Upcoming'].push(e);
      continue;
    }

    if (e.date === todayStr) {
      if (!groups['Today']) groups['Today'] = [];
      groups['Today'].push(e);
    } else if (eventDate >= startOfWeek && eventDate <= endOfWeek) {
      if (!groups['This Week']) groups['This Week'] = [];
      groups['This Week'].push(e);
    } else {
      const monthYear = eventDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(e);
    }
  }

  return groups;
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const queryClient = useQueryClient();
  const { isAuthenticated, userId } = useAuth();

  const bottomInset = IS_WEB ? 26 : insets.bottom;

  const [activeTab, setActiveTab] = useState<TabKey>('favorites');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    savedEvents,
    toggleSaveEvent,
  } = useSaved();

  const savedCount = savedEvents.length;

  // 1. Fetch entire events catalog to look up saved event records
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

  // 2. Fetch specific missing events by ID if not in catalog cache
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

  // 3. Fetch User Tickets to calculate attendance / check-in stamps
  const ticketsQuery = useQuery({
    queryKey: ['tickets', 'user', userId],
    queryFn: () => api.tickets.forUser(userId || ''),
    enabled: !!userId && isAuthenticated,
    staleTime: 30 * 1000,
  });

  const myTickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);
  const attendedTickets = useMemo(() => {
    return myTickets.filter(t => t.checkedIn || t.status === 'used');
  }, [myTickets]);

  // Compute host statistics (attended out of total catalog)
  const hostStats = useMemo(() => {
    const statsMap = new Map<string, { total: number; attended: Set<string> }>();
    
    // Total events per host in catalog
    for (const e of catalogEvents) {
      const key = e.hostName || e.venue || e.organizerId || 'Unknown Host';
      if (!statsMap.has(key)) {
        statsMap.set(key, { total: 0, attended: new Set() });
      }
      statsMap.get(key)!.total += 1;
    }
    
    // Attended events per host from tickets
    for (const t of attendedTickets) {
      const matchingEvent = catalogEvents.find(e => e.id === t.eventId);
      const key = matchingEvent?.hostName || matchingEvent?.venue || matchingEvent?.organizerId || t.eventVenue || 'Unknown Host';
      if (!statsMap.has(key)) {
        statsMap.set(key, { total: 1, attended: new Set() });
      }
      statsMap.get(key)!.attended.add(t.eventId);
    }
    
    return statsMap;
  }, [catalogEvents, attendedTickets]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [];
      if (savedCount > 0) {
        tasks.push(queryClient.invalidateQueries({ queryKey: EVENTS_CATALOG_KEY }));
      }
      if (userId) {
        tasks.push(queryClient.invalidateQueries({ queryKey: ['tickets', 'user', userId] }));
      }
      await Promise.all(tasks);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, savedCount, userId]);

  // Filter and sort saved event models
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

  // Unique host list for Stamps Tab
  const attendedHosts = useMemo(() => {
    const hostsSet = new Set<string>();
    for (const t of attendedTickets) {
      const matchingEvent = catalogEvents.find(e => e.id === t.eventId);
      const hostName = matchingEvent?.hostName || matchingEvent?.venue || t.eventVenue || t.eventName || 'Host';
      if (hostName && hostName !== 'Host' && hostName.trim().length > 0) {
        hostsSet.add(hostName.trim());
      }
    }
    return Array.from(hostsSet);
  }, [attendedTickets, catalogEvents]);

  // Grouped favorites for UI Sections
  const groupedFavorites = useMemo(() => {
    return groupEventsByDate(savedEventItems);
  }, [savedEventItems]);

  const groupKeysOrdered = useMemo(() => {
    const keys = Object.keys(groupedFavorites);
    const order = ['Today', 'This Week'];
    const timeKeys = keys.filter(k => !order.includes(k)).sort((a, b) => {
      const da = Date.parse(a);
      const db = Date.parse(b);
      return da - db;
    });
    return [...order.filter(k => keys.includes(k)), ...timeKeys];
  }, [groupedFavorites]);

  const tabs = [
    { key: 'favorites' as const, label: 'Favorites', icon: 'heart-outline' as const },
    { key: 'stamps' as const, label: 'Stamps', icon: 'ribbon-outline' as const },
  ];

  const loadingEvents =
    activeTab === 'favorites' && savedCount > 0 && (eventsQuery.isPending || eventDetailsStillLoading);
  const showListSkeleton = loadingEvents;

  const headerActions = [
    {
      icon: 'close-outline' as const,
      onPress: () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-space')),
      label: 'Close',
    },
  ];

  return (
    <AuthGuard
      icon="heart-outline"
      title="Favorites & Stamps"
      message="Sign in to view your favorited events and collected check-in stamps."
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[`${colors.primary}05`, 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <M3TopAppBar
          title="Favorites & Stamps"
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/my-space'))}
          actions={headerActions}
          variant="center-aligned"
        />

        <View style={[styles.shell, isDesktop && styles.desktopShell, { paddingHorizontal: hPad }]}>
          {/* Unified segment tabs in center */}
          <GlassView intensity={15} style={[styles.tabRail, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.borderLight }]}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tab.key === 'favorites' ? savedCount : attendedHosts.length;
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
                    name={tab.icon}
                    size={16}
                    color={isActive ? colors.primary : colors.textTertiary}
                  />
                  <Text
                    style={[styles.tabLabel, { color: isActive ? colors.text : colors.textTertiary, fontFamily: isActive ? FontFamily.bold : FontFamily.medium }]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 ? (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: isActive ? colors.primary : colors.primarySoft },
                      ]}
                    >
                      <Text style={[styles.countText, { color: isActive ? '#FFFFFF' : colors.primary }]}>{count}</Text>
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

            {/* ── TAB CONTENT: FAVORITES ───────────────────────────────── */}
            {!showListSkeleton && activeTab === 'favorites' && (
              <>
                {savedCount === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="heart-outline"
                    title="No favorites yet"
                    description="Tap the heart icon on any event to build your personalized list."
                    ctaLabel="Browse events"
                    onCta={() => router.push('/(tabs)')}
                  />
                ) : (
                  groupKeysOrdered.map((key) => {
                    const groupEvents = groupedFavorites[key] ?? [];
                    if (groupEvents.length === 0) return null;
                    return (
                      <View key={key} style={{ marginBottom: 20 }}>
                        <View style={styles.sectionHead}>
                          <View style={[styles.sectionAccent, { backgroundColor: CultureTokens.indigo }]} />
                          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{key.toUpperCase()}</Text>
                        </View>
                        
                        {groupEvents.map((event) => {
                          const img = eventImageUri(event);
                          const hostKey = event.hostName || event.venue || event.organizerId || 'Unknown Host';
                          const stats = hostStats.get(hostKey);
                          const total = stats?.total ?? 1;
                          const attended = stats?.attended?.size ?? 0;
                          
                          return (
                            <GlassView key={event.id} style={styles.itemOuter} contentStyle={{ padding: 0 }}>
                              <Pressable
                                style={({ pressed }) => [styles.itemPress, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
                                onPress={() => router.push({ pathname: '/e/[id]', params: { id: event.id } })}
                              >
                                {/* Left image with heart icon absolute positioned */}
                                <View style={{ position: 'relative', width: 120, height: 150 }}>
                                  {img ? (
                                    <Image source={{ uri: img }} style={styles.itemImage} contentFit="cover" transition={200} />
                                  ) : (
                                    <View style={[styles.itemImage, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
                                      <Ionicons name="calendar" size={32} color={colors.primary} />
                                    </View>
                                  )}
                                  
                                  {/* Heart overlay */}
                                  <Pressable
                                    style={({ pressed }) => [
                                      styles.heartBadge,
                                      { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                                      pressed && { opacity: 0.7 }
                                    ]}
                                    onPress={() => {
                                      if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      toggleSaveEvent(event.id);
                                    }}
                                  >
                                    <Ionicons name="heart" size={17} color={CultureTokens.coral} />
                                  </Pressable>
                                </View>

                                {/* Right information block */}
                                <View style={styles.itemInfo}>
                                  <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                                    {event.title}
                                  </Text>
                                  
                                  <View style={{ gap: 4, marginTop: 4 }}>
                                    <View style={styles.metaRow}>
                                      <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
                                      <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {event.venue || event.address || 'Venue'}
                                      </Text>
                                    </View>
                                    
                                    <View style={styles.metaRow}>
                                      <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
                                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {formatDate(event.date)}
                                      </Text>
                                    </View>

                                    {event.time && (
                                      <View style={styles.metaRow}>
                                        <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                          {event.time}
                                        </Text>
                                      </View>
                                    )}
                                  </View>

                                  {/* Progress label: X of Y attended */}
                                  <View style={[styles.progressBadge, { backgroundColor: colors.backgroundSecondary }]}>
                                    <Ionicons name="square" size={8} color={colors.textTertiary} style={{ transform: [{ rotate: '45deg' }] }} />
                                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                      {attended} of {total} attended
                                    </Text>
                                  </View>
                                </View>
                              </Pressable>
                            </GlassView>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </>
            )}

            {/* ── TAB CONTENT: STAMPS ──────────────────────────────────── */}
            {!showListSkeleton && activeTab === 'stamps' && (
              <>
                {attendedHosts.length === 0 ? (
                  <EmptyBlock
                    colors={colors}
                    icon="ribbon-outline"
                    title="No stamps collected yet"
                    description="Collect a stamp for each cultural event you attend! Book a ticket and get checked in at the door."
                    ctaLabel="Browse events"
                    onCta={() => router.push('/(tabs)')}
                  />
                ) : (
                  <View style={styles.stampsContainer}>
                    <Text style={[styles.stampsSubtitle, { color: colors.textSecondary }]}>
                      Collect a stamp for each event you attend along the way.
                    </Text>
                    <View style={styles.stampsGrid}>
                      {attendedHosts.map((host, idx) => (
                        <View key={host + idx} style={styles.stampCard}>
                          <RetroStamp hostName={host} date="2025" size={135} />
                        </View>
                      ))}
                    </View>
                  </View>
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
          <Ionicons name={icon} size={40} color={colors.primary} />
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
  itemImage: { width: 120, height: 150 },
  itemInfo: { flex: 1, padding: 14, gap: 4, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontFamily: FontFamily.bold, letterSpacing: -0.2, lineHeight: 20 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontFamily: FontFamily.medium },

  heartBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.small,
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
    })
  },

  progressBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },

  emptyWrap: { paddingTop: 40, paddingHorizontal: 4 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, fontFamily: FontFamily.medium, textAlign: 'center', lineHeight: 22, maxWidth: 300, opacity: 0.8 },

  skeletonCard: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },

  stampsContainer: {
    padding: 10,
    gap: 16,
  },
  stampsSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 16,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: 12,
    paddingBottom: 20,
  },
  stampCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
