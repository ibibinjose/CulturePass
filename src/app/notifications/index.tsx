import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { M3TopAppBar } from '@/design-system/ui/M3TopAppBar';
import { CultureTokens, FontFamily, gradients } from '@/design-system/tokens/theme';
import type { Notification } from '@/shared/schema';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationsService';
import { useSafeBack } from '@/lib/navigation';
import { NavigationMetadata } from '@/components/NavigationMetadata';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const now = Date.now();
  const diffMs = now - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function groupByDate(notifications: Notification[]): { title: string; data: Notification[] }[] {
  const groups: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  for (const n of notifications) {
    const d = new Date(n.createdAt).toDateString();
    if (d === today) groups['Today'].push(n);
    else if (d === yesterday) groups['Yesterday'].push(n);
    else groups['Earlier'].push(n);
  }
  return Object.entries(groups)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
}

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const TYPE_CONFIG: Record<string, { icon: IoniconsName; color: string }> = {
  event:          { icon: 'calendar',           color: CultureTokens.violet },
  ticket:         { icon: 'ticket',             color: CultureTokens.teal },
  perk:           { icon: 'gift',               color: CultureTokens.gold },
  follow:         { icon: 'person-add',         color: CultureTokens.indigo },
  update:         { icon: 'megaphone',          color: CultureTokens.coral },
  recommendation: { icon: 'sparkles',           color: CultureTokens.violet },
  system:         { icon: 'information-circle', color: CultureTokens.indigo },
};

// ─── Header logo (gradient ring, non-navigable) ────────────────────────────
function HeaderLogo() {
  const RING = 2.5, SIZE = 36, RADIUS = 10;
  const inner = SIZE - RING * 2;
  return (
    <View style={{ width: SIZE, height: SIZE, borderRadius: RADIUS, overflow: 'hidden', marginLeft: 6, flexShrink: 0 }}>
      <LinearGradient colors={[CultureTokens.violet, CultureTokens.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', top: RING, left: RING, width: inner, height: inner, borderRadius: RADIUS - RING, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Image source={require('@/assets/images/culturepass-logo.png')} style={{ width: inner - 3, height: inner - 3 }} contentFit="contain" />
      </View>
    </View>
  );
}

// ─── Notification card ────────────────────────────────────────────────────────

function NotificationCard({
  item,
  onPress,
  colors,
  isDark,
}: {
  item: Notification;
  onPress: (n: Notification) => void;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}) {
  const cfg = TYPE_CONFIG[item.type] ?? { icon: 'notifications' as IoniconsName, color: colors.textSecondary };
  const isUnread = !item.read;

  return (
    <View
      style={[
        card.wrap,
        {
          backgroundColor: isDark
            ? (isUnread ? 'rgba(147,51,234,0.11)' : 'rgba(255,255,255,0.04)')
            : (isUnread ? 'rgba(147,51,234,0.06)' : 'rgba(0,0,0,0.025)'),
          borderColor: isUnread
            ? `${CultureTokens.violet}30`
            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'),
        },
      ]}
    >
      {/* Left accent bar for unread */}
      {isUnread && (
        <View style={[card.accentBar, { backgroundColor: CultureTokens.violet }]} pointerEvents="none" />
      )}

      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
          card.inner,
          (pressed || hovered) && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
          Platform.OS === 'web' ? ({ transition: 'background-color 0.1s ease' } as object) : undefined,
        ]}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        {/* Icon box */}
        <View style={[card.iconBox, { backgroundColor: `${cfg.color}20` }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          )}
        </View>

        {/* Content */}
        <View style={card.body}>
          <View style={card.topRow}>
            <Text style={[card.title, { color: colors.text, fontFamily: isUnread ? FontFamily.semibold : FontFamily.medium }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[card.time, { color: colors.textTertiary }]}>{relativeTime(item.createdAt)}</Text>
          </View>
          <Text style={[card.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {/* Unread indicator dot */}
        {isUnread && (
          <View style={[card.dotWrap, { backgroundColor: CultureTokens.violet }]} />
        )}
      </Pressable>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    paddingLeft: 17,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  body: { flex: 1, gap: 3, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, letterSpacing: -0.1, lineHeight: 19 },
  time: { fontSize: 11, fontFamily: FontFamily.medium, flexShrink: 0 },
  message: { fontSize: 12.5, fontFamily: FontFamily.regular, lineHeight: 17, opacity: 0.9 },
  dotWrap: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden', flexShrink: 0 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const goBack = useSafeBack();
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const bottomInset = Platform.OS === 'web' ? 26 : insets.bottom;

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: listNotifications,
    enabled: !!userId,
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const filtered = useMemo(
    () => filter === 'unread' ? notifications.filter(n => !n.read) : notifications,
    [notifications, filter],
  );

  const sections = useMemo(() => groupByDate(filtered), [filtered]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const centered = { maxWidth: 720, alignSelf: 'center' as const, width: '100%' as const };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <NavigationMetadata />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Subtle brand glow background */}
      <LinearGradient
        colors={[`${CultureTokens.violet}0A`, 'transparent']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <M3TopAppBar
        title="Notifications"
        onBack={goBack}
        titleLeading={<HeaderLogo />}
        denseWeb={Platform.OS === 'web'}
        webHighContrast={Platform.OS === 'web'}
      />

      {/* Filter row */}
      <View style={[s.filterRow, { paddingHorizontal: 16, marginTop: 10, marginBottom: 4 }, centered]}>
        {/* Segment pills */}
        <View style={[s.segment, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
          {(['all', 'unread'] as const).map(id => {
            const active = filter === id;
            return (
              <View key={id} style={[s.pillWrap, active && s.pillWrapActive]}>
                {active && (
                  <LinearGradient
                    colors={gradients.culturepassBrand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 11 }]}
                  />
                )}
                <Pressable
                  style={s.pill}
                  onPress={() => {
                    setFilter(id);
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                  accessibilityRole="tab"
                  accessibilityLabel={id === 'all' ? 'All notifications' : 'Unread notifications'}
                >
                  <Text style={[
                    s.pillLabel,
                    { color: active ? '#FFFFFF' : colors.textTertiary, fontFamily: active ? FontFamily.semibold : FontFamily.medium },
                  ]}>
                    {id === 'all' ? 'All' : 'Unread'}
                    {id === 'unread' && unreadCount > 0 ? ` · ${unreadCount}` : ''}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Mark all read */}
        {unreadCount > 0 && !markAllMut.isPending && (
          <Pressable
            style={({ pressed, hovered }: { pressed?: boolean; hovered?: boolean }) => [
              s.markAllBtn,
              { borderColor: `${CultureTokens.violet}30`, backgroundColor: isDark ? 'rgba(147,51,234,0.12)' : 'rgba(147,51,234,0.07)' },
              (pressed || hovered) && { backgroundColor: isDark ? 'rgba(147,51,234,0.20)' : 'rgba(147,51,234,0.14)' },
            ]}
            onPress={() => markAllMut.mutate()}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <Ionicons name="checkmark-done" size={14} color={CultureTokens.violet} />
            <Text style={[s.markAllLabel, { color: CultureTokens.violet }]}>Mark all</Text>
          </Pressable>
        )}
      </View>

      <View style={s.flex}>
        {isLoading ? (
          <View style={[s.skeletons, { paddingHorizontal: 16 }, centered]}>
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} height={72} borderRadius={16} style={{ marginBottom: 8 }} />
            ))}
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={n => n.id}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={CultureTokens.violet}
              />
            }
            contentContainerStyle={[
              s.listContent,
              { paddingHorizontal: 16, paddingBottom: bottomInset + 80 },
              centered,
            ]}
            renderSectionHeader={({ section: { title } }) => (
              <View style={s.sectionHeadRow}>
                <View style={[s.sectionRule, { backgroundColor: colors.textTertiary + '50' }]} />
                <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>
                  {title.toUpperCase()}
                </Text>
                <View style={[s.sectionRuleRight, { backgroundColor: colors.textTertiary + '28' }]} />
              </View>
            )}
            renderItem={({ item }) => (
              <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(350).springify()}>
                <NotificationCard
                  item={item}
                  colors={colors}
                  isDark={isDark}
                  onPress={(n) => {
                    if (!n.read) markReadMut.mutate(n.id);
                  }}
                />
              </Animated.View>
            )}
            ListEmptyComponent={<EmptyState filter={filter} colors={colors} isDark={isDark} />}
          />
        )}
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  filter,
  colors,
  isDark,
}: {
  filter: 'all' | 'unread';
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}) {
  return (
    <View style={s.empty}>
      <View style={[s.emptyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
        {/* Icon ring */}
        <View style={[s.emptyIconRing, { backgroundColor: isDark ? 'rgba(147,51,234,0.15)' : 'rgba(147,51,234,0.08)', borderWidth: 1.5, borderColor: `${CultureTokens.violet}40` }]}>
          <Ionicons
            name={filter === 'unread' ? 'checkmark-done-circle' : 'notifications-off-outline'}
            size={32}
            color={CultureTokens.violet}
          />
        </View>

        <Text style={[s.emptyTitle, { color: colors.text }]}>
          {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
        </Text>
        <Text style={[s.emptyMessage, { color: colors.textSecondary }]}>
          {filter === 'unread'
            ? 'All notifications have been read.'
            : "When you have notifications, they'll appear here."}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // Filter row
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 14,
    gap: 3,
    borderWidth: 1,
  },
  pillWrap: { flex: 1, borderRadius: 11, overflow: 'hidden' },
  pillWrapActive: {},
  pill: {
    paddingVertical: Platform.OS === 'web' ? 7 : 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { fontSize: 13, letterSpacing: 0.1 },

  // Mark all
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    flexShrink: 0,
  },
  markAllLabel: { fontSize: 12, fontFamily: FontFamily.semibold },

  // List
  listContent: { paddingTop: 12 },

  // Section headers — rule-line format
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionRule: { width: 10, height: StyleSheet.hairlineWidth, flexShrink: 0 },
  sectionRuleRight: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel: { fontSize: 10, fontFamily: FontFamily.semibold, letterSpacing: 0.9 },

  skeletons: { paddingTop: 16 },

  // Empty state
  empty: { paddingTop: 40, paddingHorizontal: 8 },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 14,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: FontFamily.semibold, letterSpacing: -0.3, textAlign: 'center' },
  emptyMessage: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 20, textAlign: 'center', opacity: 0.85, maxWidth: 260 },
});
