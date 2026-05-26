import React, { useMemo } from 'react';
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

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { CultureTokens, TextStyles } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { Button } from '@/design-system/ui/Button';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { hostApi } from '@/modules/host/api';
import { formatCurrency } from '@/lib/currency';
import { formatCompactDate } from '@/lib/format';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import type { EventData } from '@/shared/schema';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const HOSTSPACE_DASHBOARD_HEAD_TITLE = `Host dashboard · ${APP_NAME}`;
const HOSTSPACE_DASHBOARD_HEAD_DESC =
  'Track reach, attendance, revenue, and event performance in your CulturePass host dashboard.';
const HOSTSPACE_DASHBOARD_HEAD_URL = `${SITE_ORIGIN}/hostspace/dashboard`;

// ---------------------------------------------------------------------------
// Stat Card — Compact "Display Card"
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
    <GlassView intensity={12} style={[styles.statCard, { borderColor: colors.borderLight }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
        <View style={styles.statLabelRow}>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
          {trend && (
            <Text style={[styles.trendMini, { color: CultureTokens.teal }]}>{trend}</Text>
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
    <Pressable
      onPress={() => router.push({ pathname: '/(domain)/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [
        styles.displayCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <View style={styles.displayCardImage}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: CultureTokens.indigo + '10', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="calendar" size={20} color={CultureTokens.indigo} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: isPublished ? CultureTokens.teal : CultureTokens.gold }]}>
          <Text style={styles.statusBadgeText}>{isPublished ? 'LIVE' : 'DRAFT'}</Text>
        </View>
      </View>

      <View style={styles.displayCardBody}>
        <Text style={[styles.displayCardTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
        <Text style={[styles.displayCardMeta, { color: colors.textSecondary }]}>
          {event.date ? formatCompactDate(event.date) : 'Unscheduled'}
        </Text>

        <View style={styles.displayCardFooter}>
          <View style={styles.miniMetric}>
            <Ionicons name="people-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.miniMetricText, { color: colors.textTertiary }]}>{event.attending ?? 0}</Text>
          </View>
          <View style={styles.cardActions}>
            <Button variant="ghost" size="sm" style={styles.smallIconBtn} onPress={() => router.push({ pathname: '/event/create', params: { editId: event.id } })}>
              <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
            </Button>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

function HostDashboard() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const { userId } = useAuth();

  const { data: eventsRes, isLoading: eventsLoading, refetch: refetchEvents, isRefetching } = useQuery({
    queryKey: ['host', 'events', userId],
    queryFn: () => hostApi.events.list(userId!),
    enabled: !!userId,
  });

  const events = useMemo(() => eventsRes?.events ?? [], [eventsRes?.events]);

  const stats = useMemo(() => ({
    totalEvents: events.length,
    totalAttendance: events.reduce((sum, e) => sum + (e.attending ?? 0), 0),
    estimatedRevenue: events.reduce((sum, e) => sum + (e.priceCents ?? 0) * (e.attending ?? 0), 0),
    activeReach: events.reduce((sum, e) => sum + (e.attending ?? 0), 0) * 3.4,
  }), [events]);

  const haptic = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  };

  const handleRefresh = () => {
    haptic();
    refetchEvents();
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
        colors={[CultureTokens.indigo + '08', 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: hPad, maxWidth: isDesktop ? 1200 : undefined, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={CultureTokens.indigo} />
        }
      >
        {/* Header — Improved UX with small buttons */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textTertiary }]}>COMMAND CENTER</Text>
            <Text style={[styles.title, { color: colors.text }]}>Host Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <Button
              variant="outline"
              size="sm"
              leftIcon="scan-outline"
              onPress={() => router.push('/scanner')}
              style={styles.smallHeadBtn}
            >
              Scan
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon="add"
              onPress={() => router.push('/hostspace/create')}
              style={styles.smallHeadBtn}
            >
              Create
            </Button>
          </View>
        </View>

        {/* Stats — single horizontal row (equal flex columns) */}
        <View style={styles.statsRow}>
          <StatCard label="Reach" value={Math.floor(stats.activeReach).toLocaleString()} icon="eye-outline" color={CultureTokens.indigo} trend="+12%" />
          <StatCard label="Attendees" value={stats.totalAttendance.toLocaleString()} icon="people-outline" color={CultureTokens.teal} />
          <StatCard label="Events" value={stats.totalEvents} icon="calendar-outline" color={CultureTokens.gold} />
          <StatCard label="Revenue" value={formatCurrency(stats.estimatedRevenue)} icon="cash-outline" color={CultureTokens.coral} />
        </View>

        {/* Quick Access Bar — Small Buttons */}
        <View style={styles.section}>
          <View style={styles.quickAccessBar}>
            <Text style={[styles.miniSectionTitle, { color: colors.textTertiary }]}>QUICK TOOLS</Text>
            <View style={styles.quickAccessButtons}>
              <Button variant="ghost" size="sm" leftIcon="wallet-outline" onPress={() => router.push('/payment/wallet')}>Payouts</Button>
              <Button variant="ghost" size="sm" leftIcon="help-circle-outline" onPress={() => router.push('/help')}>Support</Button>
              <Button variant="ghost" size="sm" leftIcon="settings-outline" onPress={() => router.push('/settings')}>Settings</Button>
            </View>
          </View>
        </View>

        {/* Events Section — High-Visual Display Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Events</Text>
            <Button variant="ghost" size="sm" onPress={() => router.push('/(domain)/events')}>
              View All
            </Button>
          </View>

          {eventsLoading ? (
            <View style={styles.displayCardGrid}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} width={isDesktop ? '23%' : '47%'} height={180} borderRadius={24} />)}
            </View>
          ) : events.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderLight }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Ready to launch?</Text>
              <Button variant="primary" size="sm" style={{ marginTop: 8 }} onPress={() => router.push('/hostspace/create/event')}>
                Create Event
              </Button>
            </View>
          ) : (
            <View style={styles.displayCardGrid}>
              {events.slice(0, 8).map((event, idx) => (
                <Animated.View
                  key={event.id}
                  entering={FadeInDown.delay(idx * 50)}
                  style={isDesktop ? { width: '23.5%' } : { width: '48%' }}
                >
                  <EventDisplayCard event={event} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>

        {/* Insights — Small Compact Card */}
        <GlassView intensity={10} style={[styles.compactTip, { borderColor: colors.borderLight }]}>
          <View style={[styles.tipIcon, { backgroundColor: CultureTokens.gold + '15' }]}>
            <Ionicons name="bulb" size={16} color={CultureTokens.gold} />
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Mode-C visual assets see 40% higher engagement.
          </Text>
          <Button variant="ghost" size="sm" onPress={() => {}}>Update</Button>
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
    paddingTop: 32,
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  smallHeadBtn: {
    paddingHorizontal: 12,
    minHeight: 36,
  },
  greeting: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.5,
  },
  title: {
    ...TextStyles.title,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  trendMini: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },
  section: {
    gap: 12,
  },
  miniSectionTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quickAccessBar: {
    paddingHorizontal: 4,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: -8, // Offset button padding
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    ...TextStyles.title3,
    fontSize: 18,
  },
  displayCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  displayCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 180,
  },
  displayCardImage: {
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 8,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  displayCardBody: {
    padding: 12,
    gap: 4,
  },
  displayCardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  displayCardMeta: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  displayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  miniMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniMetricText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardActions: {
    flexDirection: 'row',
  },
  smallIconBtn: {
    padding: 4,
    minHeight: 24,
    minWidth: 24,
  },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  compactTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
