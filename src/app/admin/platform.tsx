/**
 * Platform Control Panel
 * ======================
 * High-authority configuration terminal for global variables and system toggles.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens } from '@/design-system/tokens/colors';
import { FontFamily } from '@/design-system/tokens/theme';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3Button } from '@/design-system/ui';
import { Input } from '@/design-system/ui/Input';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFeatureFlags } from '@/lib/feature-flags';
import { openExternalUrl } from '@/lib/openExternalUrl';

import { adminKeys } from '@/hooks/queries/keys';

export default function PlatformControlScreen() {
  const colors = useColors();
  const { hPad, isDesktop } = useLayout();
  const isWeb = Platform.OS === 'web';
  const queryClient = useQueryClient();

  const [maintenance, setMaintenance] = useState(false);
  const [feeBps, setFeeBps] = useState('1000'); // 10.0%
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [minimumPayoutThresholdCents, setMinimumPayoutThresholdCents] = useState('5000');

  const { data: config } = useQuery({
    queryKey: adminKeys.platformConfig(),
    queryFn: () => api.admin.platformConfig(),
  });

  React.useEffect(() => {
    if (!config) return;
    setMaintenance(!!config.maintenanceMode);
    setReadOnlyMode(!!config.readOnlyMode);
    setFeeBps(String(config.feeBps ?? 1000));
    setMinimumPayoutThresholdCents(String(config.minimumPayoutThresholdCents ?? 5000));
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: () =>
      api.admin.updatePlatformConfig({
        maintenanceMode: maintenance,
        readOnlyMode,
        feeBps: Number(feeBps),
        minimumPayoutThresholdCents: Number(minimumPayoutThresholdCents),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.platformConfig() });
    },
  });

  const { data: rolloutFlags, isLoading: rolloutFlagsLoading } = useFeatureFlags();

  const geohashMutation = useMutation({
    mutationFn: () => api.admin.runGeohashBackfill({ limit: 400 }),
    onSuccess: (res) => {
      const summary =
        res.result != null && typeof res.result === 'object'
          ? JSON.stringify(res.result).slice(0, 500)
          : String(res.result ?? 'ok');
      Alert.alert('Geohash backfill', summary);
    },
    onError: (e: Error) => Alert.alert('Backfill failed', e.message ?? 'Unknown error'),
  });

  return (
    <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: isWeb && isDesktop ? Math.max(16, hPad - 12) : hPad },
        ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Platform Control</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Global Configuration Terminal</Text>
      </View>

      <View style={styles.layout}>
        <View style={styles.mainCol}>
            {/* ── Emergency Controls ── */}
            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>EMERGENCY PROTOCOLS</Text>
            <GlassView style={styles.emergencyCard} contentStyle={styles.emergencyContent}>
                <View style={styles.controlRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.controlLabel, { color: colors.text }]}>Maintenance Mode</Text>
                        <Text style={[styles.controlDesc, { color: colors.textSecondary }]}>Disables all write operations and shows maintenance screen to users.</Text>
                    </View>
                    <Switch
                        value={maintenance}
                        onValueChange={setMaintenance}
                        trackColor={{ false: colors.border, true: CultureTokens.coral }}
                        thumbColor="#FFFFFF"
                    />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                <View style={styles.controlRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.controlLabel, { color: colors.text }]}>Read-Only Mode</Text>
                        <Text style={[styles.controlDesc, { color: colors.textSecondary }]}>Prevents new bookings and signups but allows browsing.</Text>
                    </View>
                    <Switch
                        value={readOnlyMode}
                        onValueChange={setReadOnlyMode}
                        trackColor={{ false: colors.border, true: colors.primary }}
                    />
                </View>
            </GlassView>

            <View style={{ height: 32 }} />

            {/* ── Marketplace Configuration ── */}
            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>MARKETPLACE ECONOMICS</Text>
            <GlassView contentStyle={{ padding: isWeb ? 16 : 24, gap: isWeb ? 16 : 24 }}>
                <View style={{ gap: isWeb ? 10 : 16 }}>
                    <Input
                        label="Standard Marketplace Fee (BPS)"
                        value={feeBps}
                        onChangeText={setFeeBps}
                        placeholder="e.g. 1000 for 10%"
                        hint="Applies to all paid event transactions globally."
                    />
                    <View style={styles.feePreview}>
                        <Text style={{ color: colors.textTertiary }}>Calculated Rate:</Text>
                        <Text style={{ color: colors.primary, fontFamily: FontFamily.bold, fontSize: 16 }}>{(parseInt(feeBps) / 100).toFixed(1)}%</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />

                <View style={{ gap: isWeb ? 10 : 16 }}>
                    <Input
                        label="Minimum Payout Threshold"
                        value={minimumPayoutThresholdCents}
                        onChangeText={setMinimumPayoutThresholdCents}
                        placeholder="Cents"
                        hint="Users must earn this amount before a payout can be initiated."
                    />
                </View>

                <M3Button variant="filled" onPress={() => updateConfigMutation.mutate()}>
                  {updateConfigMutation.isPending ? 'Saving…' : 'Update Economics'}
                </M3Button>
            </GlassView>
        </View>

        <View style={styles.sideCol}>
            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>ROLLOUT / FLAGS (SERVER)</Text>
            <GlassView contentStyle={{ padding: isWeb ? 12 : 16, gap: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: FontFamily.medium, lineHeight: 18 }}>
                  Values come from <Text style={{ fontFamily: FontFamily.bold }}>api/rollout/flags</Text>. They cannot be edited here; use your rollout pipeline or remote config.
                </Text>
                {rolloutFlagsLoading ? (
                  <Text style={{ color: colors.textTertiary, fontFamily: FontFamily.medium }}>Loading flags…</Text>
                ) : (
                  <>
                    <View style={styles.flagRow}>
                      <Text style={[styles.flagId, { color: colors.text }]}>Rollout phase</Text>
                      <Text style={[styles.flagId, { color: colors.primary }]}>
                        {rolloutFlags?.rollout?.phase ?? '—'} ({rolloutFlags?.rollout?.percentage ?? 0}%)
                      </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />
                    {Object.keys(rolloutFlags?.flags ?? {}).length === 0 ? (
                      <Text style={{ color: colors.textTertiary, fontSize: 13, fontFamily: FontFamily.medium }}>No feature keys in this response.</Text>
                    ) : (
                      Object.entries(rolloutFlags?.flags ?? {}).map(([id, active], i, arr) => (
                        <View key={id}>
                          <View style={styles.flagRow}>
                            <Text style={[styles.flagId, { color: colors.text }]}>{id}</Text>
                            <Text style={[styles.flagId, { color: active ? CultureTokens.teal : colors.textTertiary }]}>
                              {active ? 'ON' : 'OFF'}
                            </Text>
                          </View>
                          {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.borderLight, opacity: 0.5 }]} />}
                        </View>
                      ))
                    )}
                  </>
                )}
            </GlassView>

            <View style={{ height: 32 }} />

            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>DATA JOBS</Text>
            <GlassView contentStyle={{ padding: isWeb ? 12 : 16, gap: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: FontFamily.medium, lineHeight: 18 }}>
                Geocode / geohash backfill for events missing coordinates (bounded batch).
              </Text>
              <M3Button
                variant="tonal"
                leftIcon="map"
                loading={geohashMutation.isPending}
                onPress={() => geohashMutation.mutate()}
              >
                Run geohash backfill
              </M3Button>
            </GlassView>

            <View style={{ height: 32 }} />

            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>SYSTEM ACCESS</Text>
            <View style={{ gap: isWeb ? 8 : 12 }}>
                <M3Button
                  variant="outlined"
                  leftIcon="server-outline"
                  onPress={() => void openExternalUrl('https://console.firebase.google.com')}
                >
                  Firebase console
                </M3Button>
                <M3Button
                  variant="tonal"
                  leftIcon="open-outline"
                  onPress={() => void openExternalUrl('https://dashboard.stripe.com')}
                >
                  Stripe dashboard
                </M3Button>
            </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Platform.OS === 'web' ? 18 : 32, gap: Platform.OS === 'web' ? 18 : 32 },
  header: { gap: 4 },
  title: { fontSize: Platform.OS === 'web' ? 26 : 32, fontFamily: FontFamily.bold, letterSpacing: -1 },
  subtitle: { fontSize: Platform.OS === 'web' ? 13 : 14, fontFamily: FontFamily.medium, opacity: 0.7 },

  layout: { flexDirection: 'row', gap: Platform.OS === 'web' ? 18 : 32, flexWrap: 'wrap' },
  mainCol: { flex: 2, minWidth: 340 },
  sideCol: { flex: 1, minWidth: Platform.OS === 'web' ? 250 : 280 },

  groupLabel: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.2, marginLeft: 4, marginBottom: Platform.OS === 'web' ? 10 : 16 },

  emergencyCard: { borderColor: CultureTokens.coral + '40' },
  emergencyContent: { padding: Platform.OS === 'web' ? 16 : 24, gap: Platform.OS === 'web' ? 14 : 20 },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: Platform.OS === 'web' ? 12 : 20 },
  controlLabel: { fontSize: Platform.OS === 'web' ? 14 : 16, fontFamily: FontFamily.bold },
  controlDesc: { fontSize: Platform.OS === 'web' ? 12 : 13, fontFamily: FontFamily.medium, lineHeight: Platform.OS === 'web' ? 16 : 18 },

  feePreview: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, paddingLeft: 4 },
  divider: { height: 1 },

  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'web' ? 10 : 16,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 16,
  },
  flagId: { fontSize: Platform.OS === 'web' ? 12 : 13, fontFamily: FontFamily.medium },
});
