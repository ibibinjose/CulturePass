/**
 * Admin Finance Terminal
 * =====================
 * Payout management, revenue tracking, and Stripe Connect status.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { openExternalUrl } from '@/lib/openExternalUrl';

import { adminKeys } from '@/hooks/queries/keys';

export default function FinanceScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => api.admin.stats(),
  });
  const { data: txData } = useQuery({
    queryKey: adminKeys.financeTransactions({ limit: 40 }),
    queryFn: () => api.admin.financeTransactions({ limit: 40 }),
  });
  const transactions = txData?.transactions ?? [];
  const { data: financeConfig } = useQuery({
    queryKey: adminKeys.financeConfig(),
    queryFn: () => api.admin.financeConfig(),
  });
  const [feeBps, setFeeBps] = useState('1000');
  const [minimumPayoutThresholdCents, setMinimumPayoutThresholdCents] = useState('5000');
  const [reserveRateBps, setReserveRateBps] = useState('300');
  const [autoPayoutsEnabled, setAutoPayoutsEnabled] = useState(true);
  useEffect(() => {
    if (!financeConfig) return;
    setFeeBps(String(financeConfig.feeBps ?? 1000));
    setMinimumPayoutThresholdCents(String(financeConfig.minimumPayoutThresholdCents ?? 5000));
    setReserveRateBps(String(financeConfig.reserveRateBps ?? 300));
    setAutoPayoutsEnabled(Boolean(financeConfig.autoPayoutsEnabled));
  }, [financeConfig]);
  const saveFinanceConfig = useMutation({
    mutationFn: () =>
      api.admin.updateFinanceConfig({
        feeBps: Number(feeBps),
        minimumPayoutThresholdCents: Number(minimumPayoutThresholdCents),
        reserveRateBps: Number(reserveRateBps),
        autoPayoutsEnabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.financeConfig() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
  const grossVolume = stats?.revenue ?? 0;
  const feeBpsNum = Number(financeConfig?.feeBps ?? feeBps) || 0;
  const netRevenue = Math.round((grossVolume * feeBpsNum) / 10000);
  const pendingPayouts = transactions
    .filter((tx) => tx.status !== 'cancelled' && tx.paymentStatus !== 'refunded')
    .reduce((sum, tx) => sum + tx.amountCents, 0);
  const queuedTransfers = transactions.filter((tx) => tx.status === 'confirmed').length;

  return (
    <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingHorizontal: hPad }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Financials</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Marketplace Economy & Payouts</Text>
      </View>

      {/* ── Summary Cards ── */}
      <View style={styles.summaryGrid}>
          <GlassView contentStyle={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>GROSS VOLUME (30D)</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>${(grossVolume / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={[styles.summarySub, { color: colors.textTertiary }]}>From admin stats</Text>
          </GlassView>

          <GlassView contentStyle={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>NET PLATFORM REVENUE</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>${(netRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={[styles.summarySub, { color: colors.textTertiary }]}>
                {(feeBpsNum / 100).toFixed(1)}% of gross (feeBps {feeBpsNum})
              </Text>
          </GlassView>

          <GlassView contentStyle={styles.summaryCard}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>PENDING PAYOUTS</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>${(pendingPayouts / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <View style={[styles.payoutBadge, { backgroundColor: CultureTokens.gold + '15' }]}>
                  <Text style={{ color: CultureTokens.gold, fontSize: 10, fontFamily: FontFamily.bold }}>{queuedTransfers} TRANSFERS QUEUED</Text>
              </View>
          </GlassView>
      </View>

      <View style={styles.mainLayout}>
          {/* ── Recent Transactions ── */}
          <View style={styles.transactionsCol}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>RECENT TRANSACTIONS</Text>
              <GlassView contentStyle={{ padding: 4 }}>
                  {transactions.map((tx, i) => (
                      <View key={tx.id}>
                          <View style={styles.txRow}>
                              <View style={[styles.txIcon, { backgroundColor: colors.backgroundSecondary }]}>
                                  <Ionicons
                                    name={tx.paymentStatus === 'refunded' ? 'arrow-undo' : 'card'}
                                    size={18}
                                    color={tx.paymentStatus === 'refunded' ? CultureTokens.coral : colors.primary}
                                  />
                              </View>
                              <View style={{ flex: 1, gap: 2 }}>
                                  <Text style={[styles.txUser, { color: colors.text }]}>{tx.eventTitle || tx.userId}</Text>
                                  <Text style={[styles.txType, { color: colors.textTertiary }]}>Ticket Purchase</Text>
                              </View>
                              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                  <Text style={[styles.txAmount, { color: tx.paymentStatus === 'refunded' ? CultureTokens.coral : colors.text }]}>
                                    ${(tx.amountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                  <Text style={[styles.txTime, { color: colors.textTertiary }]}>
                                    {new Date(tx.createdAt).toLocaleString()}
                                  </Text>
                              </View>
                          </View>
                          {i < transactions.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                      </View>
                  ))}
                  {transactions.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Text style={{ color: colors.textTertiary }}>No transactions yet</Text>
                    </View>
                  ) : null}
                  <Pressable style={styles.viewMore}>
                      <Text style={[styles.viewMoreText, { color: colors.primary }]}>View All Transactions</Text>
                  </Pressable>
              </GlassView>
          </View>

          {/* ── Stripe Connect Status ── */}
          <View style={styles.stripeCol}>
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>STRIPE</Text>
              <GlassView contentStyle={styles.stripeCard}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: FontFamily.medium, lineHeight: 20 }}>
                    Connect payouts and live fee splits are managed in Stripe. This console shows ticket rows from Firestore; reconcile totals in Stripe reporting.
                  </Text>
                  <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                  <M3Button
                    variant="filled"
                    leftIcon="open-outline"
                    onPress={() => void openExternalUrl('https://dashboard.stripe.com')}
                  >
                    Open Stripe Dashboard
                  </M3Button>
              </GlassView>
              <View style={{ height: 16 }} />
              <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>FINANCE CONTROLS</Text>
              <GlassView contentStyle={styles.financeControls}>
                <Input label="Platform Fee (BPS)" value={feeBps} onChangeText={setFeeBps} />
                <Input label="Minimum Payout Threshold (cents)" value={minimumPayoutThresholdCents} onChangeText={setMinimumPayoutThresholdCents} />
                <Input label="Reserve Rate (BPS)" value={reserveRateBps} onChangeText={setReserveRateBps} />
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.text }]}>Auto Payouts Enabled</Text>
                  <Switch
                    value={autoPayoutsEnabled}
                    onValueChange={setAutoPayoutsEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
                <M3Button variant="filled" onPress={() => saveFinanceConfig.mutate()}>
                  {saveFinanceConfig.isPending ? 'Saving…' : 'Save Finance Controls'}
                </M3Button>
              </GlassView>
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

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  summaryCard: { flex: 1, minWidth: 260, padding: 24, gap: 12 },
  summaryLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1 },
  summaryVal: { fontSize: 28, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  summarySub: { fontSize: 12, fontFamily: FontFamily.medium },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payoutBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  mainLayout: { flexDirection: 'row', gap: 32, flexWrap: 'wrap' },
  transactionsCol: { flex: 2, minWidth: 340 },
  stripeCol: { flex: 1, minWidth: 280 },

  sectionTitle: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 4, marginBottom: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txUser: { fontSize: 15, fontFamily: FontFamily.bold },
  txType: { fontSize: 12, fontFamily: FontFamily.medium, opacity: 0.7 },
  txAmount: { fontSize: 15, fontFamily: FontFamily.bold },
  txTime: { fontSize: 11, fontFamily: FontFamily.medium, opacity: 0.5 },
  divider: { height: 1 },
  viewMore: { padding: 16, alignItems: 'center' },
  viewMoreText: { fontSize: 13, fontFamily: FontFamily.bold },

  stripeCard: { padding: 24, gap: 20 },
  stripeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  stripeLabel: { fontSize: 12, fontFamily: FontFamily.bold },
  stripeId: { fontSize: 14, fontFamily: FontFamily.medium, opacity: 0.8 },
  stripeStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stripeStatLabel: { fontSize: 10, fontFamily: FontFamily.bold },
  stripeStatVal: { fontSize: 18, fontFamily: FontFamily.bold },
  financeControls: { padding: 16, gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 13, fontFamily: FontFamily.medium },
});
