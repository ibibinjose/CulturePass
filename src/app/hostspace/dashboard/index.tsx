import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useAuth } from '@/lib/auth';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { GlassView, LuxeText, LuxeButton, Skeleton } from '@/design-system/ui';
import { BackButton } from '@/design-system/ui/BackButton';
import { hostApi } from '@/modules/host/api';
import { formatCompactDate } from '@/lib/format';
import { routeEvent } from '@/lib/publicPaths';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { AnalyticsDashboard } from '@/modules/host/components/AnalyticsDashboard';
import type { EventData, Profile } from '@/shared/schema';
import type { HostPage } from '@/shared/schema/hostPage';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import {
  navigateToCreationLab,
  navigateToCreateById,
  navigateToEditEvent,
  navigateToEditHostPage,
  navigateToEditListing,
} from '@/lib/creationRouting';

const HEAD_TITLE = `Host dashboard · ${APP_NAME}`;
const HEAD_DESC =
  'Manage events, pages, ticket scanning, and profile performance from your CulturePass host dashboard.';
const HEAD_URL = `${SITE_ORIGIN}/hostspace/dashboard`;

const PLACEHOLDER_EVENT =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600';

const PAGE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  community: 'people-outline',
  business: 'storefront-outline',
  venue: 'location-outline',
  artist: 'mic-outline',
  organizer: 'briefcase-outline',
  organiser: 'briefcase-outline',
  professional: 'person-circle-outline',
  restaurant: 'restaurant-outline',
  brand: 'sparkles-outline',
  creator: 'person-circle-outline',
};

function getHostGreeting(displayName?: string | null) {
  const hour = new Date().getHours();
  const name = displayName?.split(' ')[0] ?? 'Host';
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function dedupeEvents(events: EventData[]): EventData[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

type QuickAction = {
  id: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

function StatCard({
  label,
  value,
  icon,
  color,
  isDesktop,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isDesktop?: boolean;
}) {
  const colors = useColors();
  return (
    <GlassView
      intensity={10}
      style={[
        styles.statCard,
        isDesktop ? styles.statCardDesktop : styles.statCardMobile,
        { borderColor: colors.borderLight, borderWidth: 1 },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.statContent}>
        <LuxeText variant="title3" style={{ color: colors.text }} numberOfLines={1}>
          {value}
        </LuxeText>
        <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, fontSize: 9, marginTop: 2 }}>
          {label}
        </LuxeText>
      </View>
    </GlassView>
  );
}

function QuickActionCard({ action, compact }: { action: QuickAction; compact?: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        action.onPress();
      }}
      style={({ pressed }) => [
        styles.quickAction,
        compact && styles.quickActionCompact,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '16' }]}>
        <Ionicons name={action.icon} size={20} color={action.color} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.quickActionLabel, { color: colors.text }]} numberOfLines={1}>
          {action.label}
        </Text>
        {!compact ? (
          <Text style={[styles.quickActionSub, { color: colors.textSecondary }]} numberOfLines={2}>
            {action.sub}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function EventDisplayCard({ event }: { event: EventData }) {
  const colors = useColors();
  const isPublished = event.status === 'published';
  const isDraft = !event.status || event.status === 'draft';
  const imageUri = event.heroImageUrl || event.imageUrl || PLACEHOLDER_EVENT;

  const statusColor = isPublished ? Luxe.colors.emerald : isDraft ? Luxe.colors.gold : Luxe.colors.appBlue;
  const statusLabel = isPublished ? 'LIVE' : isDraft ? 'DRAFT' : (event.status ?? 'DRAFT').toUpperCase();

  return (
    <GlassView
      intensity={8}
      onPress={() => router.push(routeEvent(event))}
      style={[styles.displayCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
      contentStyle={{ padding: 0 }}
    >
      <View style={styles.displayCardImage}>
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.displayCardBody}>
        <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={2}>
          {event.title}
        </LuxeText>
        <LuxeText variant="caption" style={{ color: colors.textSecondary }}>
          {event.date ? formatCompactDate(event.date) : 'Unscheduled'}
          {event.city ? ` · ${event.city}` : ''}
        </LuxeText>

        <View style={styles.displayCardFooter}>
          <View style={styles.miniMetric}>
            <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
            <LuxeText variant="caption" style={{ color: colors.textTertiary }}>
              {event.attending ?? 0}
            </LuxeText>
          </View>
          <View style={styles.cardActions}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                router.push({
                  pathname: '/dashboard/event-analytics/[eventId]',
                  params: { eventId: event.id },
                });
              }}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Event analytics"
            >
              <Ionicons name="analytics-outline" size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                navigateToEditEvent(event.id, 'hostspace_dashboard_event_card', event.publisherProfileId);
              }}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit event"
            >
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>
    </GlassView>
  );
}

function PageDisplayCard({ page }: { page: HostPage }) {
  const colors = useColors();
  const name = page.formData?.name || `${page.entityType} page`;
  const isLive = page.status === 'published';
  const statusColor = isLive ? Luxe.colors.emerald : Luxe.colors.saffron;
  const statusLabel = isLive ? 'LIVE' : page.status === 'pending_verification' ? 'REVIEW' : 'DRAFT';
  const pageIcon = PAGE_ICON[page.entityType] ?? 'document-text-outline';

  return (
    <GlassView
      intensity={8}
      onPress={() => navigateToEditHostPage(page.entityType, page.id, 'hostspace_dashboard_page_card')}
      style={[styles.displayCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
      contentStyle={{ padding: 0 }}
    >
      <View style={[styles.pageCardHeader, { backgroundColor: CultureTokens.indigo + '12' }]}>
        <Ionicons name={pageIcon} size={22} color={CultureTokens.indigo} />
        <View style={[styles.statusBadge, { backgroundColor: statusColor, position: 'relative', top: 0, left: 0 }]}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.displayCardBody}>
        <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={2}>
          {name}
        </LuxeText>
        <LuxeText variant="caption" style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>
          {page.entityType.replace(/_/g, ' ')}
        </LuxeText>
      </View>
    </GlassView>
  );
}

function HostDashboard() {
  const colors = useColors();
  const isDark = useIsDark();
  const { hPad, isDesktop, isCompact } = useLayout();
  const safeInsets = useSafeAreaInsetsWeb();
  const { userId, user } = useAuth();
  const params = useLocalSearchParams<{ profileId?: string | string[] }>();

  const profileIdFromUrl = Array.isArray(params.profileId) ? params.profileId[0] : params.profileId;

  const {
    data: eventsRes,
    isLoading: eventsLoading,
    refetch: refetchEvents,
    isRefetching,
    isError: eventsError,
  } = useQuery({
    queryKey: ['host', 'events', userId],
    queryFn: () => hostApi.events.list(userId!),
    enabled: !!userId,
  });

  const { data: profilesRes, refetch: refetchProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['host', 'profiles', 'my'],
    queryFn: () => hostApi.profiles.my(),
    enabled: !!userId,
  });

  const {
    data: hostPages = [],
    refetch: refetchPages,
    isLoading: pagesLoading,
    isError: pagesError,
  } = useQuery({
    queryKey: ['host-pages-my'],
    queryFn: () => hostApi.hostPages.my(),
    enabled: !!userId,
  });

  const myProfiles = useMemo(() => (profilesRes ?? []) as Profile[], [profilesRes]);

  const profileIdsKey = useMemo(() => myProfiles.map((p) => p.id).join(','), [myProfiles]);

  const { data: publisherEvents = [] } = useQuery({
    queryKey: ['host', 'publisher-events', profileIdsKey],
    queryFn: async () => {
      const responses = await Promise.all(myProfiles.map((p) => hostApi.events.listForPublisher(p.id)));
      return responses.flatMap((r) => r.events ?? []);
    },
    enabled: myProfiles.length > 0,
  });

  const events = useMemo(
    () => dedupeEvents([...(eventsRes?.events ?? []), ...publisherEvents]),
    [eventsRes?.events, publisherEvents],
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profileIdFromUrl ?? null);

  useEffect(() => {
    if (profileIdFromUrl) {
      setSelectedProfileId(profileIdFromUrl);
      return;
    }
    if (!selectedProfileId && myProfiles.length > 0) {
      setSelectedProfileId(myProfiles[0].id);
    }
  }, [myProfiles, selectedProfileId, profileIdFromUrl]);

  const stats = useMemo(() => {
    const published = events.filter((e) => e.status === 'published').length;
    const drafts = events.filter((e) => !e.status || e.status === 'draft').length;
    const totalAttendance = events.reduce((sum, e) => sum + (e.attending ?? 0), 0);
    const upcoming = events.filter((e) => e.date && new Date(e.date) > new Date()).length;
    return {
      totalEvents: events.length,
      published,
      drafts,
      totalAttendance,
      upcoming,
      livePages: hostPages.filter((p) => p.status === 'published').length,
    };
  }, [events, hostPages]);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'event',
        label: 'New event',
        sub: 'Launch a ticketed or free event',
        icon: 'calendar-outline',
        color: CultureTokens.gold,
        onPress: () => navigateToCreateById('event', { source: 'hostspace_dashboard_quick' }),
      },
      {
        id: 'page',
        label: 'Create a Page',
        sub: 'Venue, business, community, or artist profile',
        icon: 'layers-outline',
        color: CultureTokens.indigo,
        onPress: () => navigateToCreationLab('hostspace_dashboard_quick_page'),
      },
      {
        id: 'activity',
        label: 'New activity',
        sub: 'Workshops, tours, and classes',
        icon: 'compass-outline',
        color: CultureTokens.teal,
        onPress: () => navigateToCreateById('activity', { source: 'hostspace_dashboard_quick' }),
      },
      {
        id: 'scan',
        label: 'Ticket scanner',
        sub: 'Check in guests at the door',
        icon: 'scan-outline',
        color: Luxe.colors.plum,
        onPress: () => router.push('/scanner'),
      },
      {
        id: 'wallet',
        label: 'Payouts & wallet',
        sub: 'Stripe Connect and earnings',
        icon: 'wallet-outline',
        color: Luxe.colors.emerald,
        onPress: () => router.push('/payment/wallet'),
      },
      {
        id: 'calendar',
        label: 'My calendar',
        sub: 'See upcoming hosted dates',
        icon: 'calendar-number-outline',
        color: CultureTokens.coral,
        onPress: () => router.push('/(tabs)/calendar'),
      },
    ],
    [],
  );

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    refetchEvents();
    refetchProfiles();
    refetchPages();
  }, [refetchEvents, refetchProfiles, refetchPages]);

  const displayName = user?.displayName ?? user?.username ?? 'Host';
  const greeting = getHostGreeting(displayName);

  const selectProfile = useCallback((id: string) => {
    setSelectedProfileId(id);
    router.setParams({ profileId: id });
  }, []);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: safeInsets.top,
          paddingBottom: safeInsets.bottom,
        },
      ]}
    >
      <Head>
        <title>{HEAD_TITLE}</title>
        <meta name="description" content={HEAD_DESC} />
        <meta property="og:title" content={HEAD_TITLE} />
        <meta property="og:description" content={HEAD_DESC} />
        <meta property="og:url" content={HEAD_URL} />
        <link rel="canonical" href={HEAD_URL} />
      </Head>
      <Stack.Screen options={{ title: 'Host Dashboard', headerShown: false }} />

      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: hPad, maxWidth: 1200, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={Luxe.colors.appBlue} />
        }
      >
        <View style={[styles.topBar, isCompact && styles.topBarCompact]}>
          <View style={styles.topBarLeft}>
            <BackButton
              fallback="/hostspace"
              style={[styles.backBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
            />
            <Pressable
              onPress={() => router.push('/hostspace' as never)}
              style={styles.hubLink}
              accessibilityRole="link"
              accessibilityLabel="Open HostSpace hub"
            >
              <LuxeText variant="badgeCaps" style={{ color: colors.textSecondary, fontSize: 10 }}>
                HOSTSPACE
              </LuxeText>
              <Ionicons name="chevron-forward" size={12} color={colors.textTertiary} />
            </Pressable>
          </View>
          <Pressable
            onPress={handleRefresh}
            style={[styles.backBtn, { backgroundColor: colors.surface + 'CC', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh dashboard"
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={CultureTokens.indigo} />
            ) : (
              <Ionicons name="refresh" size={18} color={colors.text} />
            )}
          </Pressable>
        </View>

        <View style={[styles.header, isCompact && styles.headerCompact]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, letterSpacing: 1.5 }}>
              HOST STUDIO
            </LuxeText>
            <LuxeText variant="display" style={{ color: colors.text }}>
              Dashboard
            </LuxeText>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]} numberOfLines={2}>
              {greeting}. Track performance, manage drafts, and launch what&apos;s next.
            </Text>
          </View>
          <View style={[styles.headerActions, isCompact && styles.headerActionsCompact]}>
            <LuxeButton variant="tonal" size="sm" leftIcon="scan-outline" onPress={() => router.push('/scanner')}>
              Scan
            </LuxeButton>
            <LuxeButton
              variant="filled"
              size="sm"
              leftIcon="add"
              onPress={() => navigateToCreationLab('hostspace_dashboard_create')}
            >
              Create
            </LuxeButton>
          </View>
        </View>

        <View style={[styles.statsRow, { gap: isDesktop ? 12 : 8 }]}>
          <StatCard label="Live events" value={stats.published} icon="radio-outline" color={Luxe.colors.emerald} isDesktop={isDesktop} />
          <StatCard label="Drafts" value={stats.drafts} icon="document-outline" color={Luxe.colors.gold} isDesktop={isDesktop} />
          <StatCard label="Live pages" value={stats.livePages} icon="layers-outline" color={CultureTokens.indigo} isDesktop={isDesktop} />
          <StatCard label="Upcoming" value={stats.upcoming} icon="calendar-outline" color={Luxe.colors.appBlue} isDesktop={isDesktop} />
        </View>

        <View style={styles.section}>
          <LuxeText variant="title3" style={{ color: colors.text }}>
            Quick actions
          </LuxeText>
          <View style={[styles.quickGrid, isDesktop && styles.quickGridDesktop]}>
            {quickActions.map((action) => (
              <View key={action.id} style={[styles.quickGridItem, isDesktop && styles.quickGridItemDesktop]}>
                <QuickActionCard action={action} compact={!isDesktop} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LuxeText variant="title3" style={{ color: colors.text }}>
              Your pages
            </LuxeText>
            <LuxeButton variant="ghost" size="sm" onPress={() => router.push('/pages/create' as never)}>
              Manage
            </LuxeButton>
          </View>

          {pagesLoading ? (
            <View style={styles.displayCardGrid}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={isDesktop ? '31%' : '48%'} height={140} borderRadius={20} />
              ))}
            </View>
          ) : pagesError ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                Could not load pages. Pull to refresh.
              </LuxeText>
            </View>
          ) : hostPages.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="layers-outline" size={32} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Create a Page for your venue, business, or community.
              </LuxeText>
              <LuxeButton
                variant="filled"
                size="sm"
                style={{ marginTop: 8 }}
                onPress={() => router.push('/pages/create' as never)}
              >
                Create a Page
              </LuxeButton>
            </View>
          ) : (
            <>
              <View style={styles.displayCardGrid}>
                {hostPages.slice(0, 6).map((page, idx) => (
                  <Animated.View
                    key={page.id}
                    entering={FadeInDown.delay(idx * 40)}
                    style={{ width: isDesktop ? '31.5%' : '48.5%' }}
                  >
                    <PageDisplayCard page={page} />
                  </Animated.View>
                ))}
              </View>
              {hostPages.length > 6 ? (
                <LuxeButton
                  variant="ghost"
                  size="sm"
                  style={{ alignSelf: 'flex-start' }}
                  onPress={() => router.push('/hostspace' as never)}
                >
                  View all {hostPages.length} pages in HostSpace
                </LuxeButton>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LuxeText variant="title3" style={{ color: colors.text }}>
              Recent events
            </LuxeText>
            <LuxeButton variant="ghost" size="sm" onPress={() => router.push('/hostspace' as never)}>
              Manage all
            </LuxeButton>
          </View>

          {eventsLoading ? (
            <View style={styles.displayCardGrid}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={isDesktop ? '31%' : '48%'} height={180} borderRadius={20} />
              ))}
            </View>
          ) : eventsError ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                Could not load events. Pull to refresh.
              </LuxeText>
            </View>
          ) : events.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Ready to launch your first event?
              </LuxeText>
              <LuxeButton
                variant="filled"
                size="sm"
                style={{ marginTop: 8 }}
                onPress={() => navigateToCreateById('event', { source: 'hostspace_dashboard_empty_events' })}
              >
                Create event
              </LuxeButton>
            </View>
          ) : (
            <View style={styles.displayCardGrid}>
              {events.slice(0, 8).map((event, idx) => (
                <Animated.View
                  key={event.id}
                  entering={FadeInDown.delay(idx * 40)}
                  style={{ width: isDesktop ? '31.5%' : '48.5%' }}
                >
                  <EventDisplayCard event={event} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LuxeText variant="title3" style={{ color: colors.text }}>
              Profile analytics
            </LuxeText>
            {selectedProfileId ? (
              <LuxeButton
                variant="ghost"
                size="sm"
                onPress={() => {
                  const profile = myProfiles.find((p) => p.id === selectedProfileId);
                  if (profile) {
                    navigateToEditListing(profile.id, profile.entityType, 'hostspace_dashboard_edit_profile', {
                      subCategory: profile.subCategory ?? profile.category,
                    });
                  }
                }}
              >
                Edit profile
              </LuxeButton>
            ) : null}
          </View>

          {profilesLoading ? (
            <Skeleton width="100%" height={220} borderRadius={20} />
          ) : myProfiles.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="bar-chart-outline" size={28} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                Publish a host profile to unlock reach and engagement analytics.
              </LuxeText>
              <LuxeButton
                variant="tonal"
                size="sm"
                style={{ marginTop: 8 }}
                onPress={() => router.push('/pages/create' as never)}
              >
                Start a profile
              </LuxeButton>
            </View>
          ) : (
            <>
              {myProfiles.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.profileChips}
                >
                  {myProfiles.map((p) => {
                    const active = selectedProfileId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => selectProfile(p.id)}
                        style={[
                          styles.profileChip,
                          { borderColor: colors.borderLight, backgroundColor: colors.surface },
                          active && { backgroundColor: Luxe.colors.plum, borderColor: Luxe.colors.plum },
                        ]}
                      >
                        <Text
                          style={[
                            styles.profileChipText,
                            { color: active ? '#fff' : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {p.name || p.handle || p.entityType}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              {selectedProfileId ? (
                <AnalyticsDashboard
                  profileId={selectedProfileId}
                  onEditProfile={() => {
                    const profile = myProfiles.find((p) => p.id === selectedProfileId);
                    if (profile) {
                      navigateToEditListing(profile.id, profile.entityType, 'hostspace_dashboard_edit_profile', {
                        subCategory: profile.subCategory ?? profile.category,
                      });
                    }
                  }}
                />
              ) : null}
            </>
          )}
        </View>

        <GlassView intensity={10} style={[styles.compactTip, { borderColor: colors.borderLight, borderWidth: 1 }]}>
          <View style={[styles.tipIcon, { backgroundColor: Luxe.colors.gold + '18' }]}>
            <Ionicons name="bulb" size={16} color={Luxe.colors.gold} />
          </View>
          <LuxeText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
            High-quality cover images increase profile engagement. Update your page branding in Create a Page.
          </LuxeText>
          <LuxeButton variant="ghost" size="sm" onPress={() => router.push('/pages/create' as never)}>
            Update
          </LuxeButton>
        </GlassView>
      </ScrollView>
    </View>
  );
}

export default function HostDashboardScreen() {
  return (
    <ErrorBoundary>
      <HostspaceAccessGate intent="hub">
        <HostDashboard />
      </HostspaceAccessGate>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingTop: 12,
    paddingBottom: 120,
    gap: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  hubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 8,
  },
  topBarCompact: { marginBottom: 0 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  headerActionsCompact: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  statCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  statCardMobile: {
    width: '48%',
  },
  statCardDesktop: {
    width: '23.5%',
    minWidth: 140,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: { flex: 1, minWidth: 0 },
  section: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickGrid: { gap: 10 },
  quickGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickGridItem: { width: '100%' },
  quickGridItemDesktop: { width: '48.5%' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionCompact: { paddingVertical: 12 },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  quickActionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  displayCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  displayCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 168,
  },
  displayCardImage: {
    height: 96,
    backgroundColor: 'rgba(0,0,0,0.04)',
    position: 'relative',
  },
  pageCardHeader: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.6,
  },
  displayCardBody: { padding: 12, gap: 4 },
  displayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  profileChips: { gap: 8, paddingBottom: 4 },
  profileChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 200,
  },
  profileChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  compactTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});