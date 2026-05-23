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
import { M3TopAppBar, M3Button } from '@/design-system/ui';
import { Image } from 'expo-image';
import { useAdminStats, useAuditLogs } from '@/modules/admin/hooks/useAdminStats';
import { useSafeBack } from '@/lib/navigation';
import { MADE_IN } from '@/lib/app-meta';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

const SafeFadeInDown = FadeInDown ?? FadeIn;

export default function AdminDashboard() {
  const colors = useColors();
  const handleBack = useSafeBack('/(tabs)/my-space');
  const { hPad } = useLayout();
  const { data: stats } = useAdminStats();
  const { data: logsData, isLoading: logsLoading } = useAuditLogs(5);
  const { data: healthData } = useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => api.admin.systemHealth(),
    refetchInterval: 60000,
  });
  const { data: complianceData } = useQuery({
    queryKey: adminKeys.complianceSummary(),
    queryFn: () => api.admin.complianceSummary(),
    refetchInterval: 60000,
  });

  const STATS = [
    { label: 'Active Users', value: stats?.users?.toLocaleString() ?? '—', icon: 'people' as const, color: CultureTokens.indigo },
    { label: 'Total Events', value: stats?.events?.toLocaleString() ?? '—', icon: 'calendar' as const, color: CultureTokens.teal },
    { label: 'Tickets Sold', value: stats?.tickets?.toLocaleString() ?? '—', icon: 'ticket' as const, color: CultureTokens.teal },
    { label: 'Total Revenue', value: stats?.revenue != null ? `$${(stats.revenue / 100).toLocaleString()}` : '—', icon: 'card' as const, color: '#10B981' },
  ];

  const SYSTEM_CHECKS = (healthData?.checks ?? []).map((check) => ({
    name: check.name,
    status: check.status === 'operational' ? 'Operational' : 'Degraded',
    latency: check.metric != null ? String(check.metric) : undefined,
    healthy: check.healthy,
    detail: check.detail,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <M3TopAppBar
        title="Admin"
        onBack={handleBack}
        titleLeading={
          <Image
            source={require('@/assets/images/culturepass-logo.png')}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="contain"
          />
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingHorizontal: hPad }]}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={[styles.heroSubtitle, { color: colors.textTertiary }]}>WELCOME BACK · {MADE_IN.toUpperCase()}</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Platform Overview</Text>
          </View>
          <View style={[styles.rolloutPill, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '15' }]}>
            <View style={[styles.pulseDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.rolloutText, { color: colors.primary }]}>PHASE: FULL ROLLOUT</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {STATS.map((stat, idx) => (
            <Animated.View key={stat.label} entering={SafeFadeInDown ? SafeFadeInDown.delay(idx * 60).springify() : undefined} style={styles.kpiCell}>
              <GlassView contentStyle={styles.kpiInner}>
                <View style={[styles.kpiIconBox, { backgroundColor: stat.color + '12' }]}>
                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>{stat.value}</Text>
                </View>
              </GlassView>
            </Animated.View>
          ))}
        </View>

        <View style={styles.layoutBody}>
          <View style={styles.mainCol}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>SYSTEM HEALTH</Text>
            <GlassView contentStyle={styles.healthPanel}>
              {(SYSTEM_CHECKS.length ? SYSTEM_CHECKS : [
                { name: 'System Telemetry', status: 'Loading', healthy: true, latency: '...', detail: '' },
              ]).map((check, i) => (
                <View key={check.name}>
                  <View style={styles.healthRow}>
                    <View style={[styles.statusIndicator, { backgroundColor: check.healthy ? '#10B981' : '#EF4444' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.healthName, { color: colors.text }]}>{check.name}</Text>
                      <Text style={[styles.healthStatus, { color: colors.textSecondary }]}>
                        {check.status}{check.detail ? ` · ${check.detail}` : ''}
                      </Text>
                    </View>
                    {check.latency && (
                      <Text style={[styles.latencyText, { color: colors.textTertiary }]}>{check.latency}</Text>
                    )}
                  </View>
                  {i < SYSTEM_CHECKS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                </View>
              ))}
            </GlassView>

            <View style={{ height: 24 }} />

            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>AUDIT LOGS (RECENT)</Text>
            <GlassView contentStyle={{ padding: 4 }}>
              {(logsData?.logs || []).map((log, i) => (
                <View key={log.id}>
                  <View style={styles.logRow}>
                    <View style={[styles.logIcon, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="flash" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.logUser, { color: colors.text }]}>{log.userName}</Text>
                      <Text style={[styles.logAction, { color: colors.textSecondary }]}>{log.action}</Text>
                    </View>
                    <Text style={[styles.logTime, { color: colors.textTertiary }]}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {i < (logsData?.logs?.length || 0) - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5, marginLeft: 64 }]} />}
                </View>
              ))}
              {(!logsData?.logs?.length && !logsLoading) && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: colors.textTertiary }}>No recent activity</Text>
                </View>
              )}
            </GlassView>
          </View>

          <View style={styles.sideCol}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>QUICK ACTIONS</Text>
            <View style={{ gap: 12 }}>
              {[
                { label: 'Campaign push', icon: 'megaphone' as const, color: CultureTokens.indigo, route: '/admin/notifications' as const },
                { label: 'Moderation queue', icon: 'shield-checkmark' as const, color: CultureTokens.coral, route: '/admin/moderation' as const },
                { label: 'User directory', icon: 'people' as const, color: CultureTokens.teal, route: '/admin/users' as const },
                { label: 'Finance & fees', icon: 'card' as const, color: '#10B981', route: '/admin/finance' as const },
                { label: 'System & jobs', icon: 'pulse' as const, color: CultureTokens.violet, route: '/admin/platform' as const },
                { label: 'Communities', icon: 'people-circle' as const, color: CultureTokens.violet, route: '/admin/communities' as const },
              ].map(action => (
                <Pressable
                  key={action.label}
                  onPress={() => router.push(action.route)}
                  style={({ pressed }) => [styles.actionBtn, { backgroundColor: action.color, opacity: pressed ? 0.9 : 1 }]}
                >
                  <Ionicons name={action.icon} size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 24 }} />
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>COMPLIANCE SNAPSHOT</Text>
            <GlassView contentStyle={styles.compliancePanel}>
              <View style={styles.complianceRow}>
                <Text style={[styles.complianceLabel, { color: colors.textSecondary }]}>Pending Reports</Text>
                <Text style={[styles.complianceValue, { color: colors.text }]}>{complianceData?.pendingReports ?? '...'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
              <View style={styles.complianceRow}>
                <Text style={[styles.complianceLabel, { color: colors.textSecondary }]}>Resolved Reports</Text>
                <Text style={[styles.complianceValue, { color: colors.text }]}>{complianceData?.resolvedReports ?? '...'}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
              <View style={styles.complianceRow}>
                <Text style={[styles.complianceLabel, { color: colors.textSecondary }]}>Audit Entries</Text>
                <Text style={[styles.complianceValue, { color: colors.text }]}>{complianceData?.auditLogs ?? '...'}</Text>
              </View>
            </GlassView>

            <View style={{ height: 24 }} />

            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>ROLLOUT CONTROL</Text>
            <GlassView contentStyle={{ padding: 20, gap: 16 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: FontFamily.medium, lineHeight: 18 }}>
                Current production environment is restricted to verified regions.
              </Text>
              <M3Button variant="tonal" onPress={() => router.push('/admin/platform' as never)}>Manage Locations</M3Button>
            </GlassView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 32 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 32 },
  heroText: { gap: 4 },
  heroTitle: { fontSize: 34, fontFamily: FontFamily.bold, letterSpacing: -1 },
  heroSubtitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.5 },

  rolloutPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  rolloutText: { fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.5 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  kpiCell: { flex: 1, minWidth: 200 },
  kpiInner: { padding: 20, gap: 16 },
  kpiIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 13, fontFamily: FontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 26, fontFamily: FontFamily.bold, letterSpacing: -0.5 },

  layoutBody: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  mainCol: { flex: 2, minWidth: 340 },
  sideCol: { flex: 1, minWidth: 280 },

  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 4, marginBottom: 16 },
  healthPanel: { padding: 4 },
  healthRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  healthName: { fontSize: 15, fontFamily: FontFamily.bold },
  healthStatus: { fontSize: 12, fontFamily: FontFamily.medium, opacity: 0.8 },
  latencyText: { fontSize: 11, fontFamily: FontFamily.bold, opacity: 0.6 },
  divider: { height: 1, marginVertical: 4 },

  logRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  logIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logUser: { fontSize: 14, fontFamily: FontFamily.bold },
  logAction: { fontSize: 12, fontFamily: FontFamily.medium, opacity: 0.7 },
  logTime: { fontSize: 11, fontFamily: FontFamily.medium, opacity: 0.5 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: FontFamily.bold },
  compliancePanel: { padding: 16, gap: 12 },
  complianceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  complianceLabel: { fontSize: 13, fontFamily: FontFamily.medium },
  complianceValue: { fontSize: 15, fontFamily: FontFamily.bold },
});
