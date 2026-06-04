import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, Spacing, FontFamily } from '@/design-system/tokens/theme';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { GlassView, LuxeText, LuxeButton, Skeleton } from '@/design-system/ui';
import { hostApi } from '@/modules/host/api';
import { formatCurrency } from '@/lib/currency';
import { formatCompactDate } from '@/lib/format';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { AnalyticsDashboard } from '@/modules/host/components/AnalyticsDashboard';
import type { EventData, Profile } from '@/shared/schema';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const HOSTSPACE_DASHBOARD_HEAD_TITLE = `Host dashboard · ${APP_NAME}`;
const HOSTSPACE_DASHBOARD_HEAD_DESC =
  'Track reach, attendance, revenue, and event performance in your CulturePass host dashboard.';
const HOSTSPACE_DASHBOARD_HEAD_URL = `${SITE_ORIGIN}/hostspace/dashboard`;

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
  trend
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: string;
}) {
  const colors = useColors();
  return (
    <GlassView intensity={10} style={[styles.statCard, { borderColor: colors.borderLight, borderWidth: 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <LuxeText variant="title3" style={{ color: colors.text }} numberOfLines={1}>
          {value}
        </LuxeText>
        <View style={styles.statLabelRow}>
          <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, fontSize: 9 }}>{label}</LuxeText>
          {trend && (
            <LuxeText variant="caption" style={{ color: Luxe.colors.emerald, fontFamily: FontFamily.bold, fontSize: 9, marginLeft: 4 }}>{trend}</LuxeText>
          )}
        </View>
      </View>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Event Display Card
// ---------------------------------------------------------------------------

function EventDisplayCard({ event }: { event: EventData }) {
  const colors = useColors();
  const isPublished = event.status === 'published';

  return (
    <GlassView
      intensity={8}
      onPress={() => router.push({ pathname: '/(domain)/event/[id]', params: { id: event.id } })}
      style={[styles.displayCard, { borderColor: colors.borderLight, borderWidth: 1 }]}
      contentStyle={{ padding: 0 }}
    >
      <View style={styles.displayCardImage}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Luxe.colors.indigo + '10', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="calendar" size={24} color={Luxe.colors.indigo} />
          </View>
        )}
        <GlassView intensity={30} style={[styles.statusBadge, { backgroundColor: (isPublished ? Luxe.colors.emerald : Luxe.colors.gold) + 'CC' }]}>
          <LuxeText variant="badgeCaps" style={{ color: '#fff', fontSize: 8 }}>{isPublished ? 'LIVE' : 'DRAFT'}</LuxeText>
        </GlassView>
      </View>

      <View style={styles.displayCardBody}>
        <LuxeText variant="bodyMedium" style={{ color: colors.text }} numberOfLines={1}>{event.title}</LuxeText>
        <LuxeText variant="caption" style={{ color: colors.textSecondary }}>
          {event.date ? formatCompactDate(event.date) : 'Unscheduled'}
        </LuxeText>

        <View style={styles.displayCardFooter}>
          <View style={styles.miniMetric}>
            <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
            <LuxeText variant="caption" style={{ color: colors.textTertiary }}>{event.attending ?? 0}</LuxeText>
          </View>
          <View style={styles.cardActions}>
            <LuxeButton
              variant="ghost"
              size="sm"
              style={styles.smallIconBtn}
              onPress={() => router.push({ pathname: '/dashboard/event-analytics/[eventId]', params: { eventId: event.id } })}
            >
              <Ionicons name="analytics-outline" size={16} color={colors.textSecondary} />
            </LuxeButton>
            <LuxeButton variant="ghost" size="sm" style={styles.smallIconBtn} onPress={() => router.push({ pathname: '/event/create', params: { editId: event.id } })}>
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </LuxeButton>
          </View>
        </View>
      </View>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

function HostDashboard() {
  const colors = useColors();
  const isDark = useIsDark();
  const { hPad, isDesktop } = useLayout();
  const { userId } = useAuth();

  const { data: eventsRes, isLoading: eventsLoading, refetch: refetchEvents, isRefetching } = useQuery({
    queryKey: ['host', 'events', userId],
    queryFn: () => hostApi.events.list(userId!),
    enabled: !!userId,
  });

  const { data: profilesRes, refetch: refetchProfiles } = useQuery({
    queryKey: ['host', 'profiles', 'my'],
    queryFn: () => hostApi.profiles.my(),
    enabled: !!userId,
  });

  const events = useMemo(() => eventsRes?.events ?? [], [eventsRes?.events]);
  const myProfiles = useMemo(() => (profilesRes ?? []) as Profile[], [profilesRes]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProfileId && myProfiles.length > 0) {
      setSelectedProfileId(myProfiles[0].id);
    }
  }, [myProfiles, selectedProfileId]);

  const stats = useMemo(() => ({
    totalEvents: events.length,
    totalAttendance: events.reduce((sum, e) => sum + (e.attending ?? 0), 0),
    estimatedRevenue: events.reduce((sum, e) => sum + (e.priceCents ?? 0) * (e.attending ?? 0), 0),
    activeReach: events.reduce((sum, e) => sum + (e.attending ?? 0), 0) * 3.4,
  }), [events]);

  const handleRefresh = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    refetchEvents();
    refetchProfiles();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Head>
        <title>{HOSTSPACE_DASHBOARD_HEAD_TITLE}</title>
        <meta name="description" content={HOSTSPACE_DASHBOARD_HEAD_DESC} />
        <meta property="og:title" content={HOSTSPACE_DASHBOARD_HEAD_TITLE} />
        <meta property="og:description" content={HOSTSPACE_DASHBOARD_HEAD_DESC} />
        <meta property="og:url" content={HOSTSPACE_DASHBOARD_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={HOSTSPACE_DASHBOARD_HEAD_URL} />
      </Head>
      <Stack.Screen options={{ title: 'Host Dashboard | CulturePass', headerShown: false }} />

      <LinearGradient
        colors={isDark ? ['#0C0A09', '#1C1917'] : ['#FAF9F6', '#F5F1EE']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: hPad, maxWidth: 1200, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={Luxe.colors.terracotta} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary, letterSpacing: 2 }}>COMMAND CENTER</LuxeText>
            <LuxeText variant="display" style={{ color: colors.text }}>Dashboard</LuxeText>
          </View>
          <View style={styles.headerRight}>
            <LuxeButton
              variant="tonal"
              size="sm"
              leftIcon="scan-outline"
              onPress={() => router.push('/scanner')}
            >
              Scan
            </LuxeButton>
            <LuxeButton
              variant="filled"
              size="sm"
              leftIcon="add"
              onPress={() => router.push('/hostspace/create')}
            >
              Create
            </LuxeButton>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Reach" value={Math.floor(stats.activeReach).toLocaleString()} icon="eye-outline" color={Luxe.colors.indigo} trend="+12%" />
          <StatCard label="Attendees" value={stats.totalAttendance.toLocaleString()} icon="people-outline" color={Luxe.colors.emerald} />
          <StatCard label="Events" value={stats.totalEvents} icon="calendar-outline" color={Luxe.colors.saffron} />
          <StatCard label="Revenue" value={formatCurrency(stats.estimatedRevenue)} icon="cash-outline" color={Luxe.colors.terracotta} />
        </View>

        {/* Quick Access Bar */}
        <View style={styles.section}>
          <GlassView intensity={5} style={styles.quickAccessBar} contentStyle={{ padding: 12, flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'flex-start', gap: 16 }}>
            <LuxeText variant="badgeCaps" style={{ color: colors.textTertiary }}>QUICK TOOLS</LuxeText>
            <View style={styles.quickAccessButtons}>
              <LuxeButton variant="ghost" size="sm" leftIcon="wallet-outline" onPress={() => router.push('/payment/wallet')}>Payouts</LuxeButton>
              <LuxeButton variant="ghost" size="sm" leftIcon="help-circle-outline" onPress={() => router.push('/help')}>Support</LuxeButton>
              <LuxeButton variant="ghost" size="sm" leftIcon="settings-outline" onPress={() => router.push('/settings')}>Settings</LuxeButton>
            </View>
          </GlassView>
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LuxeText variant="title3" style={{ color: colors.text }}>Recent Events</LuxeText>
            <LuxeButton variant="ghost" size="sm" onPress={() => router.push('/(domain)/events')}>
              View All
            </LuxeButton>
          </View>

          {eventsLoading ? (
            <View style={styles.displayCardGrid}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} width={isDesktop ? '23%' : '48%'} height={180} borderRadius={20} />)}
            </View>
          ) : events.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
              <LuxeText variant="body" style={{ color: colors.textSecondary }}>Ready to launch your first event?</LuxeText>
              <LuxeButton variant="filled" size="sm" style={{ marginTop: 8 }} onPress={() => router.push('/hostspace/create/event')}>
                Create Event
              </LuxeButton>
            </View>
          ) : (
            <View style={styles.displayCardGrid}>
              {events.slice(0, 8).map((event, idx) => (
                <Animated.View
                  key={event.id}
                  entering={FadeInDown.delay(idx * 50)}
                  style={isDesktop ? { width: '23.5%' } : { width: '48.5%' }}
                >
                  <EventDisplayCard event={event} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Profile Analytics */}
        {myProfiles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LuxeText variant="title3" style={{ color: colors.text }}>Profile Analytics</LuxeText>
            </View>

            {myProfiles.length > 1 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {myProfiles.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setSelectedProfileId(p.id)}
                    style={[
                      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.borderLight },
                      selectedProfileId === p.id && { backgroundColor: Luxe.colors.plum, borderColor: Luxe.colors.plum },
                    ]}
                  >
                    <LuxeText variant="caption" style={{ color: selectedProfileId === p.id ? '#fff' : colors.text }} numberOfLines={1}>
                      {p.name || p.handle || p.entityType}
                    </LuxeText>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedProfileId ? (
              <AnalyticsDashboard
                profileId={selectedProfileId}
                onEditProfile={() => router.push(`/hostspace/create?profileId=${selectedProfileId}`)}
              />
            ) : (
              <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
                <Ionicons name="bar-chart-outline" size={28} color={colors.textTertiary} />
                <LuxeText variant="body" style={{ color: colors.textSecondary }}>No profile selected</LuxeText>
              </View>
            )}
          </View>
        )}

        {/* Tips */}
        <GlassView intensity={10} style={[styles.compactTip, { borderColor: colors.borderLight, borderWidth: 1 }]}>
          <View style={[styles.tipIcon, { backgroundColor: Luxe.colors.gold + '18' }]}>
            <Ionicons name="bulb" size={16} color={Luxe.colors.gold} />
          </View>
          <LuxeText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
            High-quality cover images increase profile engagement by up to 40%.
          </LuxeText>
          <LuxeButton variant="ghost" size="sm" onPress={() => {}}>Update</LuxeButton>
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
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 12,
    width: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: { flex: 1 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: -2 },
  section: { gap: 16 },
  quickAccessBar: { borderRadius: 20, overflow: 'hidden' },
  quickAccessButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  displayCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  displayCard: { borderRadius: 20, overflow: 'hidden', minHeight: 180 },
  displayCardImage: { height: 90, backgroundColor: 'rgba(0,0,0,0.03)' },
  statusBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  displayCardBody: { padding: 12, gap: 4 },
  displayCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  miniMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardActions: { flexDirection: 'row', gap: 4 },
  smallIconBtn: { minWidth: 32, minHeight: 32, padding: 0 },
  emptyBox: { borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 8 },
  compactTip: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  tipIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
