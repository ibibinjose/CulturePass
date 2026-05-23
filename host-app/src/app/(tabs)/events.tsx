import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

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
} from '@/design-system/tokens/theme';

type EventStatus = 'all' | 'published' | 'draft' | 'cancelled';

const STATUS_FILTERS: { key: EventStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Live' },
  { key: 'draft', label: 'Drafts' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLOR: Record<string, string> = {
  published: '#10B981',
  draft: '#F59E0B',
  cancelled: '#EF4444',
};

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        {
          backgroundColor: active ? CultureTokens.indigo : colors.surface,
          borderColor: active ? CultureTokens.indigo : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? '#fff' : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EventCard({ event, index }: { event: any; index: number }) {
  const colors = useColors();
  const m3 = useM3Colors();
  const status: string = event.status ?? 'draft';
  const statusColor = STATUS_COLOR[status] ?? colors.textTertiary;

  const dateStr = event.date
    ? format(new Date(event.date), 'EEE d MMM yyyy')
    : 'No date';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <TouchableOpacity
        style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() => router.push(`/(domain)/event/${event.id}` as any)}
      >
        {/* Status badge */}
        <View style={styles.eventCardTop}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/create/event?id=${event.id}` as any);
            }}
          >
            <Ionicons name="pencil-outline" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.eventTitle, { color: m3.onSurface }]} numberOfLines={2}>
          {event.title ?? 'Untitled Event'}
        </Text>

        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={m3.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: m3.onSurfaceVariant }]}>{dateStr}</Text>
          </View>
          {event.venue ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={m3.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: m3.onSurfaceVariant }]} numberOfLines={1}>
                {event.venue}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color={m3.onSurfaceVariant} />
            <Text style={[styles.statVal, { color: m3.onSurface }]}>{event.attending ?? 0}</Text>
            <Text style={[styles.statUnit, { color: m3.onSurfaceVariant }]}>going</Text>
          </View>
          {event.capacity ? (
            <View style={styles.statItem}>
              <Ionicons name="albums-outline" size={14} color={m3.onSurfaceVariant} />
              <Text style={[styles.statVal, { color: m3.onSurface }]}>{event.capacity}</Text>
              <Text style={[styles.statUnit, { color: m3.onSurfaceVariant }]}>cap.</Text>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={14} color={m3.onSurfaceVariant} />
            <Text style={[styles.statVal, { color: m3.onSurface }]}>
              {event.isFree ? 'Free' : event.priceCents != null ? `$${(event.priceCents / 100).toFixed(0)}` : '—'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function EventsScreen() {
  const colors = useColors();
  const m3 = useM3Colors();
  const insets = useSafeAreaInsets();
  const { hPad } = useLayout();
  const { userId } = useAuth();

  const [filter, setFilter] = useState<EventStatus>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['host', 'events', 'all', userId],
    queryFn: () => api.events.list({ organizerId: userId ?? undefined, pageSize: 50 }),
    enabled: !!userId,
  });

  const allEvents: any[] = (data as any)?.events ?? [];
  const filtered = filter === 'all' ? allEvents : allEvents.filter((e: any) => e.status === filter);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: hPad,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: m3.onSurface }]}>Events</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: CultureTokens.indigo }]}
          onPress={() => router.push('/(tabs)/create' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnLabel}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filtersRow, { paddingHorizontal: hPad }]}
        style={{ flexGrow: 0, paddingVertical: 12 }}
      >
        {STATUS_FILTERS.map(f => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {/* Event list */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingHorizontal: hPad, paddingBottom: 120 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={CultureTokens.indigo} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={m3.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: m3.onSurface }]}>
              {filter === 'all' ? 'No events yet' : `No ${filter} events`}
            </Text>
            <Text style={[styles.emptyBody, { color: m3.onSurfaceVariant }]}>
              {filter === 'all' ? 'Create your first event to get started.' : `You have no events with "${filter}" status.`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: CultureTokens.indigo }]}
                onPress={() => router.push('/(tabs)/create' as any)}
              >
                <Text style={styles.createBtnText}>Create Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map((e: any, i: number) => <EventCard key={e.id ?? i} event={e} index={i} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...M3Typography.headlineMedium,
    fontFamily: FontFamily.bold,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  newBtnLabel: {
    color: '#fff',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
  },
  filtersRow: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  list: { gap: 12, paddingTop: 4 },
  eventCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontFamily: FontFamily.semibold },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    ...M3Typography.titleMedium,
    fontFamily: FontFamily.semibold,
  },
  eventMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...M3Typography.bodySmall },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { ...M3Typography.labelLarge, fontFamily: FontFamily.semibold },
  statUnit: { ...M3Typography.labelSmall },
  empty: {
    marginTop: 80,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: { ...M3Typography.titleMedium, fontFamily: FontFamily.semibold, textAlign: 'center' },
  emptyBody: { ...M3Typography.bodyMedium, textAlign: 'center' },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 8,
  },
  createBtnText: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 14 },
});
