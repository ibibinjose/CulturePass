/**
 * SuperAdmin Team & Platform Monitoring Dashboard
 * ================================================
 * 
 * Real-time oversight for:
 * - User signups & growth
 * - Platform usage (events, tickets, profiles)
 * - Organizer / Team health (multi-organizer adoption)
 * - Recent team changes (via audit logs)
 * - Community & Business entity stats
 *
 * Accessible only to admin+ (SuperAdmin emphasis in UI).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, FontFamily, Radius } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui';
import { useAdminStats, useAuditLogs } from '@/modules/admin/hooks/useAdminStats';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';
import { useRole } from '@/hooks/useRole';
import { useSafeBack } from '@/lib/navigation';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: string;
}

function MetricCard({ label, value, sub, icon, color = CultureTokens.indigo, trend }: MetricCardProps) {
  const colors = useColors();
  return (
    <GlassView style={[styles.metricCard, { borderColor: colors.borderLight }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trend, { color: CultureTokens.teal }]}>{trend}</Text>
        )}
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.metricSub, { color: colors.textTertiary }]}>{sub}</Text>}
    </GlassView>
  );
}

export default function TeamMonitoringDashboard() {
  const colors = useColors();
  const { hPad } = useLayout();
  const handleBack = useSafeBack('/admin');
  const { isSuperAdmin } = useRole();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: auditData } = useAuditLogs(20);

  const recomputeMutation = useMutation({
    mutationFn: () => api.admin.recomputeDailyStats(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });

  const [trendPeriod, setTrendPeriod] = useState<'30d' | '90d'>('30d');

  const recentTeamChanges = (auditData?.logs || [])
    .filter((log: any) => 
      log.action?.toLowerCase().includes('profile') || 
      log.action?.toLowerCase().includes('organizer') ||
      log.action?.toLowerCase().includes('team')
    )
    .slice(0, 8);

  const KPI_CARDS: MetricCardProps[] = [
    {
      label: 'Total Signups',
      value: stats?.users?.toLocaleString() ?? '—',
      sub: 'All time',
      icon: 'person-add',
      color: CultureTokens.indigo,
      trend: '+1.2k',
    },
    {
      label: 'Active Organizers',
      value: (stats as any)?.activeOrganizers?.toLocaleString() ?? '—',
      sub: 'Unique team members',
      icon: 'people',
      color: CultureTokens.teal,
    },
    {
      label: 'New Signups (30d)',
      value: (stats as any)?.signupTrends?.reduce((sum: number, d: any) => sum + d.count, 0)?.toLocaleString() ?? '—',
      sub: 'Last 30 days',
      icon: 'trending-up',
      color: CultureTokens.coral,
    },
    {
      label: 'Multi-Organizer Entities',
      value: (stats as any)?.multiOrganizerProfiles?.toLocaleString() ?? '—',
      sub: 'Communities + Businesses',
      icon: 'git-branch',
      color: CultureTokens.gold,
    },
    {
      label: 'New Profiles (30d)',
      value: (stats as any)?.newProfiles30d?.toLocaleString() ?? '—',
      sub: 'Communities, Businesses, etc.',
      icon: 'business',
      color: '#8B5CF6',
    },
    {
      label: 'New Events (30d)',
      value: (stats as any)?.newEvents30d?.toLocaleString() ?? '—',
      icon: 'calendar',
      color: '#10B981',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <M3TopAppBar
        title="Team & Platform Monitoring"
        onBack={handleBack}
      />

      <ScrollView
        contentContainerStyle={{ padding: hPad, paddingBottom: 120, gap: 24 }}
      >
        {(statsLoading) && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={CultureTokens.indigo} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Loading platform metrics...</Text>
          </View>
        )}
        {/* Header */}
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Team Health & Usage</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <View style={[styles.pill, { backgroundColor: '#10B98122' }]}>
            <Text style={[styles.pillText, { color: '#10B981' }]}>Pre-aggregated stats</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#8B5CF622' }]}>
            <Text style={[styles.pillText, { color: '#8B5CF6' }]}>90-day trends</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#00A7EF22' }]}>
            <Text style={[styles.pillText, { color: '#00A7EF' }]}>Role breakdown</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#EF444422' }]}>
            <Text style={[styles.pillText, { color: '#EF4444' }]}>Manual recompute</Text>
          </View>
        </View>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            Monitor signups, organizer adoption, event activity, and team changes across the platform.
          </Text>

          {isSuperAdmin && (
            <Pressable
              onPress={() => recomputeMutation.mutate()}
              disabled={recomputeMutation.isPending}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.primarySoft,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginTop: 12,
              }}
            >
              <Text style={{ color: colors.primary, fontFamily: FontFamily.semibold }}>
                {recomputeMutation.isPending ? 'Recomputing Daily Stats...' : 'Recompute Daily Stats Now'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* KPI Grid */}
        <View style={styles.grid}>
          {KPI_CARDS.map((card, index) => (
            <MetricCard key={index} {...card} />
          ))}
        </View>

        {/* Signup Trends - Proper SVG Chart with 30d/90d toggle */}
        {(stats as any)?.signupTrends?.length > 0 && (
          <GlassView style={styles.section}>
            <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="trending-up" size={22} color={CultureTokens.indigo} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Signup Trends</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['30d', '90d'] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setTrendPeriod(p)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: trendPeriod === p ? colors.primarySoft : 'transparent',
                    }}
                  >
                    <Text style={{
                      color: trendPeriod === p ? colors.primary : colors.textSecondary,
                      fontFamily: FontFamily.semibold,
                      fontSize: 13,
                    }}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <SimpleBarChart
              data={(stats as any).signupTrends
                .slice(trendPeriod === '30d' ? -14 : -30)
                .map((d: any) => ({
                  label: d.date.slice(5),
                  value: d.count,
                }))}
              height={160}
              barColor={CultureTokens.indigo}
            />

            <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8, textAlign: 'center' }}>
              Daily new user registrations ({trendPeriod})
            </Text>
          </GlassView>
        )}

        {/* Team Adoption Section */}
        <GlassView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle" size={22} color={CultureTokens.teal} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Organizer & Team Adoption</Text>
          </View>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            Growing adoption of the multi-organizer model. Teams are now delegating management of communities and businesses.
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: CultureTokens.indigo }]}>{(stats as any)?.activeOrganizers ?? '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Organizers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: CultureTokens.gold }]}>{(stats as any)?.multiOrganizerProfiles ?? '—'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Multi-Org Entities</Text>
            </View>
          </View>

          {/* Entity Type Breakdown */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(79, 70, 229, 0.08)', padding: 10, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Communities</Text>
              <Text style={{ fontSize: 20, fontFamily: FontFamily.bold, color: CultureTokens.indigo }}>
                {(stats as any)?.multiOrganizerCommunities ?? '—'}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: 10, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Businesses</Text>
              <Text style={{ fontSize: 20, fontFamily: FontFamily.bold, color: '#10B981' }}>
                {(stats as any)?.multiOrganizerBusinesses ?? '—'}
              </Text>
            </View>
          </View>

          <Pressable 
            style={{ marginTop: 12, alignSelf: 'flex-start' }} 
            onPress={() => router.push('/admin/communities' as never)}
          >
            <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>View all Communities &amp; Businesses →</Text>
          </Pressable>

          {/* Role Breakdown */}
          {(stats as any)?.organizerRoleCounts && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { fontSize: 15, marginBottom: 8 }]}>Organizer Roles Breakdown</Text>
              {Object.entries((stats as any).organizerRoleCounts as Record<string, number>).map(([role, count]) => (
                <View key={role} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: colors.text }}>{role.replace(/_/g, ' ')}</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: FontFamily.semibold }}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassView>

        {/* Recent Team / Profile Activity */}
        <GlassView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={22} color={CultureTokens.coral} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Team & Profile Activity</Text>
            <Pressable onPress={() => router.push('/admin/audit-logs' as never)}>
              <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>View Audit Logs →</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/admin/indexes-health' as never)}>
              <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>View Indexes Health →</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/admin/team-monitoring' as never)}>
              <Text style={{ color: CultureTokens.indigo, fontFamily: FontFamily.semibold }}>View all</Text>
            </Pressable>
          </View>

          {recentTeamChanges.length === 0 ? (
            <Text style={{ color: colors.textTertiary, padding: 16 }}>No recent team-related actions found.</Text>
          ) : (
            recentTeamChanges.map((log: any, idx: number) => (
              <View key={idx} style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>
                    {log.userName || log.userId} • {log.action}
                  </Text>
                  <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                    Target: {log.targetId || '—'} • {new Date(log.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </View>
            ))
          )}
        </GlassView>

        {/* Usage Snapshot */}
        <GlassView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={22} color={CultureTokens.indigo} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Usage Snapshot</Text>
          </View>

          <View style={styles.usageGrid}>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>{stats?.events?.toLocaleString() ?? '—'}</Text>
              <Text style={styles.usageLabel}>Total Events</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>{stats?.tickets?.toLocaleString() ?? '—'}</Text>
              <Text style={styles.usageLabel}>Tickets Issued</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageValue}>
                {stats?.revenue != null ? `$${(stats.revenue / 100).toLocaleString()}` : '—'}
              </Text>
              <Text style={styles.usageLabel}>Gross Revenue</Text>
            </View>
          </View>
        </GlassView>

        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Data refreshes automatically. For deeper analysis use the full Audit Logs and Platform pages.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    maxWidth: 620,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  metricSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
  },
  trend: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  section: {
    padding: 20,
    borderRadius: Radius.lg,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  usageGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: Radius.md,
  },
  usageValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  usageLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#666',
    marginTop: 2,
  },
  superBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  superText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  // (Old trend styles removed - now using SimpleBarChart component)
});
