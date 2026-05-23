import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  CultureTokens,
  FontFamily,
  M3Typography,
  Radius,
  Spacing,
} from '@/design-system/tokens/theme';

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

type StatCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
};

function StatCard({ label, value, icon, color, index }: StatCardProps) {
  const colors = useColors();
  const m3 = useM3Colors();
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: m3.onSurface }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: m3.onSurfaceVariant }]}>{label}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Quick action button
// ---------------------------------------------------------------------------

type QuickActionProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  index: number;
};

function QuickAction({ label, icon, color, onPress, index }: QuickActionProps) {
  const colors = useColors();
  const m3 = useM3Colors();
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).springify()} style={{ flex: 1 }}>
      <TouchableOpacity
        style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.qaIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.qaLabel, { color: m3.onSurface }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Upcoming event row
// ---------------------------------------------------------------------------

function EventRow({ event, index }: { event: any; index: number }) {
  const colors = useColors();
  const m3 = useM3Colors();
  const date = event.date ? new Date(event.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—';
  return (
    <Animated.View entering={FadeInDown.delay(400 + index * 60).springify()}>
      <TouchableOpacity
        style={[styles.eventRow, { borderBottomColor: colors.divider }]}
        onPress={() => router.push(`/(domain)/event/${event.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.eventDateBadge, { backgroundColor: CultureTokens.indigo + '14' }]}>
          <Text style={[styles.eventDateText, { color: CultureTokens.indigo }]}>{date}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.eventTitle, { color: m3.onSurface }]} numberOfLines={1}>{event.title ?? 'Untitled'}</Text>
          <Text style={[styles.eventMeta, { color: m3.onSurfaceVariant }]} numberOfLines={1}>
            {event.city ?? ''}{event.attending != null ? ` · ${event.attending} going` : ''}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: event.status === 'published' ? '#10B98118' : colors.surfaceElevated }]}>
          <Text style={[styles.statusText, { color: event.status === 'published' ? '#10B981' : m3.onSurfaceVariant }]}>
            {event.status ?? 'draft'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Dashboard screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const colors = useColors();
  const m3 = useM3Colors();
  const insets = useSafeAreaInsets();
  const { hPad, isDesktop } = useLayout();
  const { user, userId } = useAuth();

  const { data: eventsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['host', 'events', 'upcoming'],
    queryFn: () => api.events.list({ organizerId: userId ?? undefined, pageSize: 5 }),
    enabled: !!userId,
  });

  const events: any[] = (eventsData as any)?.events ?? [];
  const published = events.filter((e: any) => e.status === 'published').length;

  const STATS = [
    { label: 'Published', value: String(published), icon: 'radio-outline' as const, color: CultureTokens.indigo },
    { label: 'Upcoming', value: String(events.length), icon: 'calendar-outline' as const, color: CultureTokens.teal },
    { label: 'Tickets', value: '—', icon: 'ticket-outline' as const, color: CultureTokens.coral },
    { label: 'Revenue', value: '—', icon: 'cash-outline' as const, color: CultureTokens.violet },
  ];

  const QUICK_ACTIONS = [
    { label: 'New Event', icon: 'add-circle-outline' as const, color: CultureTokens.indigo, route: '/(tabs)/create' },
    { label: 'Scanner', icon: 'scan-outline' as const, color: CultureTokens.violet, route: '/(tabs)/scanner' },
    { label: 'My Events', icon: 'calendar' as const, color: CultureTokens.teal, route: '/(tabs)/events' },
  ];

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const firstName = user?.displayName?.split(' ')[0] ?? 'Host';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[CultureTokens.indigo + '10', CultureTokens.violet + '06', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingHorizontal: hPad, paddingBottom: 120 },
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: m3.onSurfaceVariant }]}>Good to see you,</Text>
            <Text style={[styles.name, { color: m3.onSurface }]}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/settings/about' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={m3.onSurface} />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: m3.onSurfaceVariant }]}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((a, i) => (
              <QuickAction
                key={a.label}
                {...a}
                onPress={() => router.push(a.route as any)}
                index={i}
              />
            ))}
          </View>
        </Animated.View>

        {/* Upcoming events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: m3.onSurfaceVariant }]}>UPCOMING EVENTS</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/events' as any)}>
              <Text style={[styles.seeAll, { color: CultureTokens.indigo }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.eventsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {isLoading ? (
              <Text style={[styles.emptyText, { color: m3.onSurfaceVariant }]}>Loading…</Text>
            ) : events.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={32} color={m3.onSurfaceVariant} />
                <Text style={[styles.emptyText, { color: m3.onSurfaceVariant }]}>No events yet</Text>
                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: CultureTokens.indigo }]}
                  onPress={() => router.push('/(tabs)/create' as any)}
                >
                  <Text style={styles.createBtnText}>Create your first event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              events.map((e: any, i: number) => <EventRow key={e.id ?? i} event={e} index={i} />)
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { ...M3Typography.bodyMedium },
  name: {
    ...M3Typography.headlineSmall,
    fontFamily: FontFamily.bold,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...M3Typography.titleLarge,
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },
  statLabel: { ...M3Typography.labelSmall },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: {
    ...M3Typography.labelSmall,
    letterSpacing: 1.2,
  },
  seeAll: { ...M3Typography.labelMedium },
  quickActionsRow: { flexDirection: 'row', gap: 10 },
  quickAction: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  qaIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: { ...M3Typography.labelMedium, textAlign: 'center' },
  eventsCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  eventDateText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.3,
  },
  eventTitle: {
    ...M3Typography.titleSmall,
    fontFamily: FontFamily.semibold,
  },
  eventMeta: { ...M3Typography.bodySmall },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { ...M3Typography.bodyMedium },
  createBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  createBtnText: {
    color: '#fff',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
});
