/**
 * /admin/hostspace — HostSpace operations hub
 * Applications, verification, pages, and creator events at a glance.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { GlassView, M3Button } from '@/design-system/ui';
import { AdminPageHeader } from '@/modules/admin/components/AdminPageHeader';
import { AdminStatCard } from '@/modules/admin/components/AdminStatCard';
import { formatCompactDate } from '@/lib/format';

export default function AdminHostspaceScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: adminKeys.hostspaceOverview(),
    queryFn: () => api.admin.hostspaceOverview(),
    refetchInterval: 60_000,
  });

  const c = data?.counts;

  const statCards = [
    {
      label: 'Pending applications',
      value: c ? String(c.pendingApplications) : '—',
      icon: 'person-add' as const,
      color: CultureTokens.coral,
      route: '/admin/host-applications',
    },
    {
      label: 'Verification queue',
      value: c ? String(c.pendingVerification + c.inReviewVerification) : '—',
      icon: 'document-lock' as const,
      color: CultureTokens.gold,
      route: '/admin/verification',
    },
    {
      label: 'Published pages',
      value: c ? String(c.publishedHostPages) : '—',
      icon: 'layers' as const,
      color: CultureTokens.indigo,
      route: '/admin/verification',
    },
    {
      label: 'Active organizers',
      value: c ? String(c.activeOrganizers) : '—',
      icon: 'briefcase' as const,
      color: CultureTokens.teal,
      route: '/admin/users',
    },
    {
      label: 'Published events',
      value: c ? String(c.publishedEvents) : '—',
      icon: 'calendar' as const,
      color: '#10B981',
      route: '/admin/hostspace',
    },
    {
      label: 'Draft events',
      value: c ? String(c.draftEvents) : '—',
      icon: 'create' as const,
      color: colors.textSecondary,
      route: '/admin/hostspace',
    },
  ];

  const quickActions = [
    { label: 'Review applications', icon: 'person-add', route: '/admin/host-applications', color: CultureTokens.coral },
    { label: 'Verification queue', icon: 'document-lock', route: '/admin/verification', color: CultureTokens.gold },
    { label: 'User directory', icon: 'people', route: '/admin/users', color: CultureTokens.indigo },
    { label: 'Open HostSpace', icon: 'open-outline', route: '/hostspace', color: CultureTokens.teal },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: hPad, backgroundColor: colors.background }]}
    >
      <AdminPageHeader
        eyebrow="HOST OPERATIONS"
        title="HostSpace Ops"
        subtitle="Onboard cultural hosts, verify org pages, and monitor creator output across the platform."
        icon="briefcase"
        iconColor={CultureTokens.indigo}
        trailing={
          <M3Button variant="tonal" size="sm" onPress={() => refetch()} disabled={isRefetching}>
            {isRefetching ? 'Refreshing…' : 'Refresh'}
          </M3Button>
        }
      />

      <View style={[styles.statGrid, !isDesktop && styles.statGridMobile]}>
        {statCards.map((card, index) => (
          <AdminStatCard
            key={card.label}
            {...card}
            index={index}
            onPress={() => router.push(card.route as never)}
          />
        ))}
      </View>

      <View style={[styles.row, !isDesktop && { flexDirection: 'column' }]}>
        <View style={[styles.panel, { flex: 1 }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Quick actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as never)}
                style={({ pressed }) => [pressed && { opacity: 0.85 }]}
              >
                <GlassView contentStyle={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                    <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={18} color={action.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{action.label}</Text>
                </GlassView>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.panel, { flex: 1.2 }]}>
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, { color: colors.text }]}>Recent applications</Text>
            <Pressable onPress={() => router.push('/admin/host-applications' as never)}>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: FontFamily.medium }}>View all →</Text>
            </Pressable>
          </View>

          <GlassView contentStyle={{ padding: 4 }}>
            {isLoading ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>Loading…</Text>
            ) : (data?.recentApplications?.length ?? 0) === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>No host applications yet.</Text>
            ) : (
              data!.recentApplications.map((app, index) => (
                <Animated.View key={app.id} entering={FadeInDown.delay(index * 30)}>
                  <Pressable
                    onPress={() => router.push('/admin/host-applications' as never)}
                    style={[styles.appRow, { borderBottomColor: colors.borderLight }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
                        {app.businessName || app.fullName}
                      </Text>
                      <Text style={[styles.appMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {[app.hostType, app.city].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.appRight}>
                      <StatusPill status={app.status} />
                      <Text style={[styles.appDate, { color: colors.textTertiary }]}>
                        {app.createdAt ? formatCompactDate(app.createdAt) : ''}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </GlassView>
        </View>
      </View>

      {c && c.blockedHostPages > 0 ? (
        <GlassView
          style={[styles.alertBanner, { borderColor: CultureTokens.coral + '44' }]}
          contentStyle={styles.alertContent}
        >
          <Ionicons name="warning-outline" size={20} color={CultureTokens.coral} />
          <Text style={[styles.alertText, { color: colors.text }]}>
            {c.blockedHostPages} host page{c.blockedHostPages === 1 ? '' : 's'} currently blocked — review in Verification.
          </Text>
          <M3Button variant="tonal" size="sm" onPress={() => router.push('/admin/verification' as never)}>
            Review
          </M3Button>
        </GlassView>
      ) : null}
    </ScrollView>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const color =
    normalized === 'approved'
      ? '#10B981'
      : normalized === 'rejected'
        ? '#EF4444'
        : CultureTokens.gold;
  return (
    <View style={[styles.pill, { backgroundColor: color + '20' }]}>
      <Text style={[styles.pillText, { color }]}>{normalized}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 24, paddingBottom: 60, gap: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statGridMobile: { flexDirection: 'column' },
  row: { flexDirection: 'row', gap: 16, marginTop: 8 },
  panel: { gap: 12 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 16, fontFamily: FontFamily.bold },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { padding: 14, gap: 10, minWidth: 140 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontFamily: FontFamily.semibold },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: { fontSize: 14, fontFamily: FontFamily.semibold },
  appMeta: { fontSize: 12, marginTop: 2, fontFamily: FontFamily.regular },
  appRight: { alignItems: 'flex-end', gap: 4 },
  appDate: { fontSize: 11, fontFamily: FontFamily.regular },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: 10, fontFamily: FontFamily.bold, textTransform: 'uppercase' },
  empty: { padding: 24, textAlign: 'center', fontSize: 13 },
  alertBanner: { marginTop: 20, borderWidth: 1 },
  alertContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  alertText: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium },
});