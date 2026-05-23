import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSaved } from '@/contexts/SavedContext';
import { modulesApi } from '@/modules/api';
import { useEventsList } from '@/modules/events/hooks/useEvents';
import { ticketKeys } from '@/hooks/queries/keys';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { M3TopAppBar, M3Button, M3Card, M3FilterChip, M3SectionHeader } from '@/design-system/ui';
import { EventRow } from '@/components/calendar/EventRow';
import { M3EventCard } from '@/modules/events/components/M3EventCard';
import { CalendarEmptyState } from '@/components/calendar/CalendarEmptyState';
import { CultureTokens, FontFamily, M3Typography } from '@/design-system/tokens/theme';
import { DAY_LETTERS, MONTHS, formatDateKey, getDaysInMonth, getFirstDayOfMonth, toSafeDateKey } from '@/components/calendar/utils';
import type { EventData, Ticket } from '@/shared/schema';
import { GlassView } from '@/design-system/ui/GlassView';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { shouldShowDiscoverThisWeek, generateWebcalUrl, buildCityCalendarHttpsUrl } from '@/lib/calendar-utils';
import { downloadICS } from '@/lib/ical';

const IS_WEB = Platform.OS === 'web';

const CALENDAR_HEAD_TITLE = `Calendar · events & tickets · ${APP_NAME}`;
const CALENDAR_HEAD_DESC =
  'See what’s on near you: browse dates, saved events, tickets, and free listings.';
const CALENDAR_HEAD_URL = `${SITE_ORIGIN}/calendar`;

type CalendarFilter = 'All' | 'Today' | 'This Week' | 'My Tickets' | 'Interested' | 'Free' | 'Council';

function toDateFromKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const m3Colors = useM3Colors();
  const isDark = useIsDark();
  const { isDesktop, hPad } = useLayout();
  const { user, userId, isAuthenticated } = useAuth();
  const { savedEvents } = useSaved();
  const { state: onboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const bottomInset = IS_WEB ? 0 : insets.bottom;


  const city = user?.city ?? onboarding?.city;
  const country = user?.country ?? onboarding?.country;

  const today = useMemo(() => new Date(), []);

  const showDiscoverThisWeek = useMemo(() => {
    const savedEventObjects: EventData[] = savedEvents
      .map((id) => ({ id, date: '', title: '', description: '' } as EventData))
      .filter((e) => e.id);
    return shouldShowDiscoverThisWeek(savedEventObjects, today);
  }, [savedEvents, today]);

  const handleWebcalSubscribe = useCallback(async () => {
    const targetCity    = city    || 'Sydney';
    const targetCountry = country || 'Australia';

    // webcal:// opens the system calendar subscription dialog on iOS / macOS
    const webcalUrl = generateWebcalUrl(targetCity, targetCountry);
    const httpsUrl  = buildCityCalendarHttpsUrl(targetCity, targetCountry);

    const supported = await Linking.canOpenURL(webcalUrl).catch(() => false);

    if (supported) {
      await Linking.openURL(webcalUrl).catch(() => offerIcsDownload(httpsUrl));
    } else {
      // Web or devices without webcal support: offer HTTPS .ics download
      offerIcsDownload(httpsUrl);
    }
  }, [city, country]);

  const offerIcsDownload = useCallback((httpsUrl: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // On web, navigate to the HTTPS endpoint — browser handles .ics download
      window.open(httpsUrl, '_blank', 'noopener');
    } else {
      Alert.alert(
        'Subscribe to City Calendar',
        `Your device doesn’t support direct calendar subscriptions. Copy the link below to add it manually in your calendar app:\n\n${httpsUrl}`,
        [{ text: 'OK' }],
      );
    }
  }, []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [addingEventId, setAddingEventId] = useState<string | null>(null);

  const {
    prefs: calPrefs,
    personalEvents,
    fetchPersonalEvents,
    exportEventToCalendar,
  } = useCalendarSync();

  useEffect(() => {
    if (!calPrefs.deviceConnected || !calPrefs.showPersonalEvents) return;
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    fetchPersonalEvents(start, end);
  }, [calPrefs.deviceConnected, calPrefs.showPersonalEvents, currentMonth, currentYear, fetchPersonalEvents]);

  const { data: eventsPage, isLoading, refetch: refetchEvents } = useEventsList({
    city,
    country,
    pageSize: 300,
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ticketKeys.forUser(userId ?? ''),
    queryFn: () => modulesApi.tickets.forUser(userId!),
    enabled: !!userId,
  });

  const allEvents = useMemo(() => eventsPage?.events ?? [], [eventsPage?.events]);

  const ticketedEventIds = useMemo(() => new Set(tickets.map((t) => t.eventId)), [tickets]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return allEvents.filter((event) => {
      const key = toSafeDateKey(event.date);
      if (!key) return false;
      const dateObj = toDateFromKey(key);
      switch (activeFilter) {
        case 'All':
          return true;
        case 'Today':
          return key === todayKey;
        case 'This Week':
          return dateObj >= toDateFromKey(todayKey) && dateObj <= weekEnd;
        case 'My Tickets':
          return isAuthenticated && ticketedEventIds.has(event.id);
        case 'Free':
          return (event.priceCents ?? 0) === 0;
        case 'Interested':
          return savedEvents.includes(event.id);
        case 'Council':
          return Boolean(event.councilId) || event.category?.toLowerCase() === 'civic' || event.category?.toLowerCase() === 'council';
        default:
          return true;
      }
    });
  }, [allEvents, activeFilter, isAuthenticated, ticketedEventIds, savedEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventData[]>();
    for (const event of filteredEvents) {
      const key = toSafeDateKey(event.date);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(event);
      map.set(key, arr);
    }
    return map;
  }, [filteredEvents]);

  const personalBusyDates = useMemo(() => {
    const set = new Set<string>();
    for (const event of personalEvents) {
      set.add(formatDateKey(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate()));
    }
    return set;
  }, [personalEvents]);

  const ticketDates = useMemo(() => {
    const set = new Set<string>();
    for (const event of allEvents) {
      const key = toSafeDateKey(event.date);
      if (!key) continue;
      if (ticketedEventIds.has(event.id)) set.add(key);
    }
    return set;
  }, [allEvents, ticketedEventIds]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate) ?? [];
  }, [eventsByDate, selectedDate]);

  const selectedPersonalEvents = useMemo(() => {
    if (!selectedDate || !calPrefs.showPersonalEvents) return [];
    return personalEvents.filter((ev) => {
      const key = formatDateKey(ev.startDate.getFullYear(), ev.startDate.getMonth(), ev.startDate.getDate());
      return key === selectedDate;
    });
  }, [selectedDate, personalEvents, calPrefs.showPersonalEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return filteredEvents
      .filter((event) => {
        const key = toSafeDateKey(event.date);
        if (!key) return false;
        return toDateFromKey(key).getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const aKey = toSafeDateKey(a.date);
        const bKey = toSafeDateKey(b.date);
        if (!aKey || !bKey) return 0;
        return toDateFromKey(aKey).getTime() - toDateFromKey(bKey).getTime();
      })
      .slice(0, 10);
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const first = getFirstDayOfMonth(currentYear, currentMonth);
    const grid: (number | null)[] = [];
    for (let i = 0; i < first; i += 1) grid.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) grid.push(d);
    return grid;
  }, [currentYear, currentMonth]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchEvents();
    } finally {
      setRefreshing(false);
    }
  }, [refetchEvents]);

  const prevMonth = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedDate(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
      return;
    }
    setCurrentMonth((m) => m - 1);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    setSelectedDate(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
      return;
    }
    setCurrentMonth((m) => m + 1);
  }, [currentMonth]);

  const goToday = useCallback(() => {
    if (!IS_WEB) Haptics.selectionAsync().catch(() => {});
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(formatDateKey(now.getFullYear(), now.getMonth(), now.getDate()));
    setActiveFilter('Today');
  }, []);

  const handleAddToDevice = useCallback(async (event: EventData) => {
    setAddingEventId(event.id);
    try {
      await exportEventToCalendar(event);
    } finally {
      setAddingEventId((current) => (current === event.id ? null : current));
    }
  }, [exportEventToCalendar]);

  const monthTitle = `${MONTHS[currentMonth]} ${currentYear}`;
  const calendarFilterItems = useMemo(
    () =>
      [
        { id: 'All', label: 'All', icon: 'grid' },
        { id: 'Today', label: 'Today', icon: 'calendar' },
        { id: 'This Week', label: 'Week', icon: 'time' },
        ...(isAuthenticated ? [{ id: 'My Tickets', label: 'Tickets', icon: 'ticket' }] : []),
        { id: 'Interested', label: 'Saves', icon: 'bookmark' },
        { id: 'Free', label: 'Free', icon: 'gift' },
        { id: 'Council', label: 'Council', icon: 'business' },
      ] as { id: CalendarFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[],
    [isAuthenticated],
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <Head>
          <title>{CALENDAR_HEAD_TITLE}</title>
          <meta name="description" content={CALENDAR_HEAD_DESC} />
          <meta property="og:title" content={CALENDAR_HEAD_TITLE} />
          <meta property="og:description" content={CALENDAR_HEAD_DESC} />
          <meta property="og:url" content={CALENDAR_HEAD_URL} />
          <meta name="twitter:card" content="summary_large_image" />
          <link rel="canonical" href={CALENDAR_HEAD_URL} />
        </Head>
        <GlassView contentStyle={{ padding: 40, alignItems: 'center', gap: 20 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 18, fontFamily: FontFamily.bold, color: colors.text }}>Building your calendar…</Text>
        </GlassView>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Head>
        <title>{CALENDAR_HEAD_TITLE}</title>
        <meta name="description" content={CALENDAR_HEAD_DESC} />
        <meta property="og:title" content={CALENDAR_HEAD_TITLE} />
        <meta property="og:description" content={CALENDAR_HEAD_DESC} />
        <meta property="og:url" content={CALENDAR_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={CALENDAR_HEAD_URL} />
      </Head>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FFFBF7', '#F5F5F4']}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[`${colors.primary}08`, 'transparent']}
          style={[StyleSheet.absoluteFillObject, { height: 600 }]}
        />

        <M3TopAppBar
          title="Calendar"
          variant="small"
          denseWeb={IS_WEB}
          titleLeading={
            <Image
              source={require('@/assets/images/culturepass-logo.png')}
              style={{ width: IS_WEB ? 28 : 40, height: IS_WEB ? 28 : 40, borderRadius: 20, marginLeft: 8 }}
              contentFit="contain"
            />
          }
          actions={[
            {
                icon: 'radio-outline',
                onPress: handleWebcalSubscribe,
            },
            {
                icon: calPrefs.deviceConnected ? 'calendar' : 'calendar-outline',
                onPress: () => router.push('/settings/calendar-sync')
            }
          ]}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{
            maxWidth: isDesktop ? 800 : undefined,
            width: '100%',
            alignSelf: 'center',
            paddingTop: 0,
            paddingBottom: bottomInset + 100,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: hPad, paddingVertical: 12 }}
          >
            {calendarFilterItems.map((item) => (
              <M3FilterChip
                key={item.id}
                label={item.label}
                icon={item.icon}
                selected={activeFilter === item.id}
                onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveFilter(item.id); }}
              />
            ))}
          </ScrollView>

          {/* Discover This Week prompt — shown when user has no saved events this week (Req 5.3) */}
          {showDiscoverThisWeek && (
            <Pressable
              onPress={() => router.push('/(tabs)')}
              style={[
                {
                  marginHorizontal: hPad,
                  marginBottom: 12,
                  padding: 14,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: m3Colors.secondaryContainer,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Discover events this week"
            >
              <Ionicons name="sparkles" size={20} color={m3Colors.onSecondaryContainer} />
              <View style={{ flex: 1 }}>
                <Text style={[{ fontFamily: FontFamily.semibold, color: m3Colors.onSecondaryContainer, fontSize: 14 }]}>
                  Discover This Week
                </Text>
                <Text style={[{ fontFamily: FontFamily.regular, color: m3Colors.onSecondaryContainer, fontSize: 12, opacity: 0.8 }]}>
                  No saved events yet — explore what&apos;s on near you
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={m3Colors.onSecondaryContainer} />
            </Pressable>
          )}

          <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(400)} style={{ paddingHorizontal: hPad, marginTop: 16 }}>
            <M3Card variant="filled" style={{ padding: 18 }}>
                <View style={styles.calendarTopBar}>
                  <Text style={[styles.monthYearHeading, M3Typography.titleLarge, { color: m3Colors.onSurface }]}>{monthTitle}</Text>
                  <View style={styles.calendarTopActions}>
                    <M3Button
                      variant="tonal"
                      leftIcon="chevron-back"
                      onPress={prevMonth}
                      style={{ width: 44, height: 44, borderRadius: 12, paddingHorizontal: 0 }}
                    />
                    <M3Button
                      variant="tonal"
                      onPress={goToday}
                      style={{ height: 44, borderRadius: 12 }}
                    >
                      Today
                    </M3Button>
                    <M3Button
                      variant="tonal"
                      leftIcon="chevron-forward"
                      onPress={nextMonth}
                      style={{ width: 44, height: 44, borderRadius: 12, paddingHorizontal: 0 }}
                    />
                  </View>
                </View>

                <View style={styles.dayHeaderRow}>
                  {DAY_LETTERS.map((label, index) => (
                    <Text key={`${label}-${index}`} style={[styles.dayHeaderText, M3Typography.labelSmall, { color: m3Colors.onSurfaceVariant }]}>
                      {label}
                    </Text>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {monthDays.map((day, idx) => {
                    if (day == null) return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const isTodayCell =
                      day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                    const isSelected = selectedDate === dateKey;
                    const hasEvents = (eventsByDate.get(dateKey)?.length ?? 0) > 0;
                    const hasTickets = ticketDates.has(dateKey);
                    const hasPersonal = personalBusyDates.has(dateKey) && calPrefs.showPersonalEvents;

                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setSelectedDate((prev) => (prev === dateKey ? null : dateKey)); }}
                        style={({ pressed }) => [
                          styles.dayCell,
                          isSelected
                            ? { backgroundColor: m3Colors.primary }
                            : isTodayCell
                              ? { backgroundColor: m3Colors.primaryContainer, borderColor: m3Colors.primary, borderWidth: 1 }
                              : { backgroundColor: 'transparent' },
                          pressed && { opacity: 0.75 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            M3Typography.bodyLarge,
                            isSelected
                              ? { color: m3Colors.onPrimary, fontFamily: FontFamily.bold }
                              : isTodayCell
                                ? { color: m3Colors.onPrimaryContainer, fontFamily: FontFamily.bold }
                                : { color: m3Colors.onSurface },
                          ]}
                        >
                          {day}
                        </Text>
                        {(hasEvents || hasTickets || hasPersonal) ? (
                          <View style={styles.dotRow}>
                            {/* Solid dot = ticketed event (Req 5.1) */}
                            {hasTickets ? <View style={[styles.dot, { backgroundColor: isSelected ? m3Colors.onPrimary : CultureTokens.teal }]} /> : null}
                            {/* Solid dot = general event */}
                            {hasEvents ? <View style={[styles.dot, { backgroundColor: isSelected ? m3Colors.onPrimary : m3Colors.primary }]} /> : null}
                            {/* Outlined dot = personal calendar event */}
                            {hasPersonal ? (
                              <View style={[styles.dot, styles.dotOutlined, {
                                borderColor: isSelected ? m3Colors.onPrimary : m3Colors.onSurfaceVariant,
                              }]} />
                            ) : null}
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
            </M3Card>
          </Animated.View>

          <View style={{ paddingHorizontal: hPad, marginTop: isDesktop ? 20 : 24 }}>
            <M3SectionHeader
                title={selectedDate
                    ? `Agenda · ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`
                    : 'Agenda'}
                subtitle={!selectedDate ? 'Select a day to view agenda' : undefined}
            />

            {selectedDate ? (
                <>
                {selectedPersonalEvents.map((pev) => (
                    <M3Card key={pev.id} variant="filled" style={{ marginBottom: 12, padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            <View style={[styles.personalIcon, { backgroundColor: m3Colors.secondaryContainer }]}>
                                <Ionicons name="calendar" size={20} color={m3Colors.onSecondaryContainer} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={[M3Typography.titleSmall, { color: m3Colors.onSurface }]}>{pev.calendarName || 'Personal busy time'}</Text>
                                <Text style={[M3Typography.bodySmall, { color: m3Colors.onSurfaceVariant }]}>
                                    {pev.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {pev.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    </M3Card>
                ))}

                {selectedEvents.length === 0 && selectedPersonalEvents.length === 0 ? (
                    <CalendarEmptyState
                    colors={colors}
                    title="No events scheduled"
                    subtitle="Explore culture in your city"
                    onSubtitlePress={() => router.push('/(tabs)')}
                    />
                ) : (
                    selectedEvents.map((event) => (
                    <EventRow
                        key={event.id}
                        event={event}
                        colors={colors}
                        isAuthenticated={isAuthenticated}
                        isWeb={IS_WEB}
                        onAddToDevice={handleAddToDevice}
                        isAddingToDevice={addingEventId === event.id}
                    />
                    ))
                )}
                </>
            ) : (
                <CalendarEmptyState
                colors={colors}
                title="Agenda"
                subtitle="Tap a day above to view planned activities"
                />
            )}
          </View>

          <View style={{ paddingHorizontal: hPad, marginTop: isDesktop ? 24 : 32 }}>
            <M3SectionHeader
                title="Featured Upcoming"
                onAction={() => router.push('/events')}
            />
            <View style={{ gap: 16 }}>
                {upcomingEvents.slice(0, 4).map((event) => (
                    <M3EventCard
                        key={event.id}
                        event={event}
                        variant="elevated"
                    />
                ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  calendarTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  calendarTopActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monthYearHeading: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.5 },

  dayHeaderRow: { flexDirection: 'row', marginBottom: 12 },
  dayHeaderText: { flex: 1, textAlign: 'center', fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: '14.28%', minHeight: 48 },
  dayCell: { width: '14.28%', height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginVertical: 2 },
  dayText: { fontSize: 16 },
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 4, position: 'absolute', bottom: 6 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotOutlined: { backgroundColor: 'transparent', borderWidth: 1 },

  personalIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
