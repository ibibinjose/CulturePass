/**
 * Admin Compliance Hub
 * ====================
 * GDPR/CCPA tools, data export requests, and privacy policy versioning.
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
import { M3Button } from '@/design-system/ui';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

export default function ComplianceScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const { data: compliance, isLoading } = useQuery({
    queryKey: adminKeys.complianceSummary(),
    queryFn: () => api.admin.complianceSummary(),
    refetchInterval: 60000,
  });
  const requests = compliance?.requests ?? [];

  const LEGAL_DOCS: { name: string; route: '/legal/privacy' | '/legal/terms' | '/legal/guidelines' | '/legal/cookies'; version: string; updated: string }[] = [
    { name: 'Privacy Policy', route: '/legal/privacy', version: '2.4.0', updated: 'Apr 12, 2026' },
    { name: 'Terms of Service', route: '/legal/terms', version: '1.9.2', updated: 'Jan 05, 2026' },
    { name: 'Community Guidelines', route: '/legal/guidelines', version: '3.0.1', updated: 'May 01, 2026' },
    { name: 'Cookie Policy', route: '/legal/cookies', version: '1.0.0', updated: 'Dec 20, 2025' },
  ];

  return (
    <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingHorizontal: hPad }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Data & Compliance</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Security and Privacy Regulatory Terminal</Text>
      </View>

      <View style={styles.layout}>
          <View style={styles.mainCol}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>PENDING DATA REQUESTS</Text>
              <GlassView contentStyle={{ padding: 4 }}>
                  {requests.map((req, i) => (
                      <View key={req.id}>
                          <View style={styles.reqRow}>
                                <View style={[styles.reqIcon, { backgroundColor: req.type.toLowerCase().includes('pending') ? CultureTokens.coral + '15' : colors.primarySoft }]}>
                                    <Ionicons name={req.type.toLowerCase().includes('pending') ? 'alert-circle' : 'checkmark-done'} size={18} color={req.type.toLowerCase().includes('pending') ? CultureTokens.coral : colors.primary} />
                                </View>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={[styles.reqUser, { color: colors.text }]}>{req.user}</Text>
                                    <Text style={[styles.reqType, { color: colors.textTertiary }]}>{req.type} • {req.date} • Count: {req.count}</Text>
                                </View>
                                <View style={styles.reqActions}>
                                    <M3Button
                                      variant="outlined"
                                      style={{ height: 32 }}
                                      onPress={() => router.push('/admin/moderation')}
                                    >
                                      Queue
                                    </M3Button>
                                </View>
                          </View>
                          {i < requests.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                      </View>
                  ))}
                  {!requests.length && (
                    <View style={{ padding: 20 }}>
                      <Text style={{ color: colors.textTertiary }}>
                        {isLoading ? 'Loading compliance requests...' : 'No compliance requests found'}
                      </Text>
                    </View>
                  )}
              </GlassView>

              <View style={{ height: 32 }} />

              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>LEGAL DOCUMENTS</Text>
              <View style={styles.legalGrid}>
                  {LEGAL_DOCS.map((doc) => (
                      <Pressable key={doc.name} onPress={() => router.push(doc.route)} accessibilityRole="link">
                      <GlassView style={styles.docCard} contentStyle={styles.docContent}>
                           <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                           <Text style={[styles.docName, { color: colors.text }]}>{doc.name}</Text>
                           <Text style={[styles.docMeta, { color: colors.textTertiary }]}>v{doc.version} • {doc.updated}</Text>
                           <View style={{ marginTop: 8 }}>
                               <M3Button variant="tonal" style={{ height: 32 }} onPress={() => router.push(doc.route)}>View in app</M3Button>
                           </View>
                      </GlassView>
                      </Pressable>
                  ))}
              </View>
          </View>

          <View style={styles.sideCol}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>AUDIT & SECURITY</Text>
              <GlassView contentStyle={{ padding: 20, gap: 20 }}>
                  <View style={styles.securityRow}>
                       <Text style={[styles.securityLabel, { color: colors.textSecondary }]}>Last Security Scan</Text>
                       <Text style={[styles.securityVal, { color: CultureTokens.emerald }]}>{(compliance?.pendingReports ?? 0) > 0 ? 'REVIEW NEEDED' : 'PASSED'}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: FontFamily.medium }}>
                      Pending reports: {compliance?.pendingReports ?? 0}. Resolved reports: {compliance?.resolvedReports ?? 0}. Audit entries tracked: {compliance?.auditLogs ?? 0}.
                  </Text>
                  <M3Button variant="outlined" leftIcon="list" onPress={() => router.push('/admin/audit-logs')}>
                    Open audit logs
                  </M3Button>
              </GlassView>

              <View style={{ height: 32 }} />

              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>GDPR TOOLS</Text>
              <View style={{ gap: 12 }}>
                  <M3Button variant="tonal" leftIcon="people" onPress={() => router.push('/admin/users')}>
                    User directory
                  </M3Button>
                  <M3Button variant="tonal" leftIcon="lock-closed" onPress={() => router.push('/admin/platform')}>
                    Read-only & maintenance
                  </M3Button>
              </View>
          </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 32, gap: 32 },
  header: { gap: 4 },
  title: { fontSize: 32, fontFamily: FontFamily.bold, letterSpacing: -1 },
  subtitle: { fontSize: 14, fontFamily: FontFamily.medium, opacity: 0.7 },

  layout: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  mainCol: { flex: 2, minWidth: 340 },
  sideCol: { flex: 1, minWidth: 280 },

  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 4, marginBottom: 16 },

  reqRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  reqIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reqUser: { fontSize: 15, fontFamily: FontFamily.bold },
  reqType: { fontSize: 12, fontFamily: FontFamily.medium, opacity: 0.7 },
  reqActions: { flexDirection: 'row', gap: 8 },

  divider: { height: 1 },

  legalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  docCard: { width: '47%', minWidth: 180 },
  docContent: { padding: 20, gap: 4 },
  docName: { fontSize: 14, fontFamily: FontFamily.bold, marginTop: 8 },
  docMeta: { fontSize: 11, fontFamily: FontFamily.medium, opacity: 0.6 },

  securityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  securityLabel: { fontSize: 12, fontFamily: FontFamily.bold },
  securityVal: { fontSize: 12, fontFamily: FontFamily.bold },
});
