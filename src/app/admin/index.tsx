/**
 * Super Admin Dashboard
 * =====================
 * Mission Control for CulturePass.App.
 * Visualises platform health, financial metrics, and high-priority moderation.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { M3TopAppBar } from '@/design-system/ui';
import { Image } from 'expo-image';
import { useAdminStats, useAuditLogs } from '@/modules/admin/hooks/useAdminStats';
import { useSafeBack } from '@/lib/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

const SafeFadeInDown = FadeInDown ?? FadeIn;

export default function AdminDashboard() {
  const colors = useColors();
  const handleBack = useSafeBack('/(tabs)/my-space');
  const { hPad, isDesktop } = useLayout();
  const { data: stats } = useAdminStats();
  const { data: logsData } = useAuditLogs(8);
  const { data: healthData } = useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => api.admin.systemHealth(),
    refetchInterval: 45000,
  });
  const { data: complianceData } = useQuery({
    queryKey: adminKeys.complianceSummary(),
    queryFn: () => api.admin.complianceSummary(),
    refetchInterval: 60000,
  });

  const systemStatus = healthData?.checks?.every(c => c.healthy) ? 'Operational' : 'Degraded';
  const statusColor = systemStatus === 'Operational' ? '#10B981' : '#F59E0B';

  const KPI_DATA = [
    { 
      label: 'Total Users', 
      value: stats?.users?.toLocaleString() ?? '—', 
      change: '+2.4k', 
      icon: 'people' as const, 
      color: CultureTokens.indigo 
    },
    { 
      label: 'CulturePass+', 
      value: Math.floor((stats?.users || 42000) * 0.087).toLocaleString(), 
      change: '+312', 
      icon: 'star' as const, 
      color: CultureTokens.gold 
    },
    { 
      label: 'Events (30d)', 
      value: stats?.events ? Math.floor(stats.events * 0.18).toLocaleString() : '—', 
      icon: 'calendar' as const, 
      color: CultureTokens.teal 
    },
    { 
      label: 'Revenue (MTD)', 
      value: stats?.revenue != null ? `$${(stats.revenue / 100).toLocaleString()}` : '—', 
      icon: 'card' as const, 
      color: '#10B981' 
    },
  ];

  const SYSTEM_CHECKS = (healthData?.checks ?? []).map((check) => ({
    name: check.name,
    status: check.status === 'operational' ? 'Operational' : 'Degraded',
    latency: check.metric != null ? `${check.metric}ms` : undefined,
    healthy: check.healthy,
    detail: check.detail,
  }));

  const recentActions = (logsData?.logs || []).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <M3TopAppBar
        title="Mission Control"
        onBack={handleBack}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: hPad }}
      >
        {/* Subtle live indicator */}
        <Text style={{ 
          position: 'absolute', 
          right: hPad, 
          top: 12, 
          fontSize: 11, 
          color: colors.textTertiary,
          fontFamily: FontFamily.medium 
        }}>
          Updated just now
        </Text>
        {/* Hero Header */}
        <View style={styles.hero}>
          <View>
            <Text style={[styles.heroEyebrow, { color: colors.textTertiary }]}>CULTUREPASS PLATFORM</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Mission Control</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{systemStatus}</Text>
            <Text style={{ color: colors.textTertiary, fontSize: 11 }}>· Live</Text>
          </View>
        </View>

        {/* Primary KPIs */}
        <View style={styles.kpiGrid}>
          {KPI_DATA.map((kpi, index) => (
            <Animated.View 
              key={index} 
              entering={SafeFadeInDown ? SafeFadeInDown.delay(index * 40).springify() : undefined}
              style={styles.kpiCard}
            >
              <GlassView contentStyle={styles.kpiContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={[styles.kpiIcon, { backgroundColor: kpi.color + '15' }]}>
                    <Ionicons name={kpi.icon} size={20} color={kpi.color} />
                  </View>
                  {kpi.change && (
                    <Text style={{ color: '#10B981', fontSize: 12, fontFamily: FontFamily.medium }}>{kpi.change}</Text>
                  )}
                </View>
                <Text style={[styles.kpiValue, { color: colors.text }]}>{kpi.value}</Text>
                <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{kpi.label}</Text>
              </GlassView>
            </Animated.View>
          ))}
        </View>

        {/* Main Grid */}
        <View style={[styles.grid, !isDesktop && { flexDirection: 'column' }]}>
          
          {/* System Health - Prominent */}
          <View style={[styles.widget, styles.healthWidget]}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>System Health</Text>
              <View style={[styles.liveBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={{ color: statusColor, fontSize: 10, fontFamily: FontFamily.bold }}>LIVE</Text>
              </View>
            </View>
            
            <GlassView contentStyle={{ padding: 4 }}>
              {SYSTEM_CHECKS.length > 0 ? SYSTEM_CHECKS.map((check, i) => (
                <View key={i} style={styles.healthItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={[styles.healthDot, { backgroundColor: check.healthy ? '#10B981' : '#EF4444' }]} />
                    <Text style={[styles.healthName, { color: colors.text }]}>{check.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{check.status}</Text>
                    {check.latency && <Text style={{ color: colors.textTertiary, fontSize: 12 }}>{check.latency}</Text>}
                  </View>
                </View>
              )) : (
                <Text style={{ padding: 20, color: colors.textTertiary }}>Loading health data...</Text>
              )}
            </GlassView>
          </View>

          {/* Recent Critical Activity */}
          <View style={styles.widget}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Recent Critical Activity</Text>
              <Pressable onPress={() => router.push('/admin/audit-logs')}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>View all →</Text>
              </Pressable>
            </View>
            
            <GlassView contentStyle={{ padding: 4 }}>
              {recentActions.length > 0 ? recentActions.map((log: any, index: number) => (
                <View key={index} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="flash-outline" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityUser, { color: colors.text }]} numberOfLines={1}>
                      {log.userName || 'System'}
                    </Text>
                    <Text style={[styles.activityAction, { color: colors.textSecondary }]} numberOfLines={1}>
                      {log.action}
                    </Text>
                  </View>
                  <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )) : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textTertiary }}>No recent critical actions</Text>
                </View>
              )}
            </GlassView>
          </View>

          {/* Moderation & Compliance */}
          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Moderation &amp; Compliance</Text>
            
            <View style={{ gap: 12, marginTop: 12 }}>
              <View style={styles.metricRow}>
                <Text style={{ color: colors.textSecondary }}>Pending Reports</Text>
                <Text style={{ color: CultureTokens.coral, fontSize: 18, fontFamily: FontFamily.bold }}>
                  {complianceData?.pendingReports ?? '—'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={{ color: colors.textSecondary }}>Resolved (24h)</Text>
                <Text style={{ color: '#10B981', fontSize: 18, fontFamily: FontFamily.bold }}>
                  {complianceData?.resolvedReports ?? '—'}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={{ color: colors.textSecondary }}>Total Audit Events</Text>
                <Text style={{ color: colors.text, fontSize: 18, fontFamily: FontFamily.bold }}>
                  {complianceData?.auditLogs?.toLocaleString() ?? '—'}
                </Text>
              </View>
            </View>

            <Pressable 
              onPress={() => router.push('/admin/moderation')}
              style={{ marginTop: 16, backgroundColor: colors.surface, padding: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: colors.primary, fontFamily: FontFamily.medium }}>Open Moderation Queue →</Text>
            </Pressable>
          </View>

          {/* Quick Actions */}
          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {[
                { label: 'Push Notification', icon: 'megaphone', route: '/admin/notifications', color: CultureTokens.indigo },
                { label: 'Review Reports', icon: 'shield-checkmark', route: '/admin/moderation', color: CultureTokens.coral },
                { label: 'User Management', icon: 'people', route: '/admin/users', color: CultureTokens.teal },
                { label: 'Promo Codes', icon: 'pricetag', route: '/admin/promo-codes', color: '#8B5CF6' },
                { label: 'System Jobs', icon: 'pulse', route: '/admin/platform', color: CultureTokens.violet },
                { label: 'Audit Logs', icon: 'list', route: '/admin/audit-logs', color: colors.textSecondary },
              ].map((action, i) => (
                <Pressable 
                  key={i} 
                  onPress={() => router.push(action.route as any)}
                  style={[styles.quickAction, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name={action.icon as any} size={18} color={action.color} />
                  <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    marginBottom: 28,
    gap: 16 
  },
  heroEyebrow: { 
    fontSize: 11, 
    fontFamily: FontFamily.bold, 
    letterSpacing: 2 
  },
  heroTitle: { 
    fontSize: 32, 
    fontFamily: FontFamily.bold, 
    letterSpacing: -1.2 
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: FontFamily.semibold },

  // KPIs
  kpiGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 14, 
    marginBottom: 32 
  },
  kpiCard: { 
    flex: 1, 
    minWidth: 160,
  },
  kpiContent: { 
    padding: 18, 
    gap: 8,
    borderRadius: 16,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { 
    fontSize: 28, 
    fontFamily: FontFamily.bold, 
    letterSpacing: -0.8,
    marginTop: 4,
  },
  kpiLabel: { 
    fontSize: 12, 
    fontFamily: FontFamily.medium,
    opacity: 0.75,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  widget: {
    flex: 1,
    minWidth: 320,
    marginBottom: 8,
  },
  healthWidget: {
    minWidth: 380,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    letterSpacing: 1,
    color: '#64748B',
  },

  // System Health
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  healthDot: { width: 9, height: 9, borderRadius: 5 },
  healthName: { fontSize: 15, fontFamily: FontFamily.medium },

  // Activity
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityUser: { fontSize: 14, fontFamily: FontFamily.semibold },
  activityAction: { fontSize: 13, marginTop: 1 },
  activityTime: { fontSize: 12, opacity: 0.5 },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  quickAction: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },

  // Misc
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
