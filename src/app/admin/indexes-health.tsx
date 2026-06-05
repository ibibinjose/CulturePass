/**
 * Admin — Indexes Health
 * ======================
 * Runs protected Firestore query probes and reports indexed, fallback, or failed mode.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3TopAppBar, GlassView, M3Button } from '@/design-system/ui';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeBack } from '@/lib/navigation';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

type ProbeStatus = 'healthy' | 'fallback' | 'degraded';

function statusColor(status: ProbeStatus) {
  if (status === 'healthy') return CultureTokens.teal;
  if (status === 'fallback') return CultureTokens.gold;
  return CultureTokens.coral;
}

export default function IndexesHealthScreen() {
  const colors = useColors();
  const { hPad } = useLayout();
  const handleBack = useSafeBack('/admin');
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: adminKeys.indexesHealth(),
    queryFn: () => api.admin.indexesHealth(),
    refetchInterval: 120000,
  });

  const overall = data?.status ?? 'healthy';
  const overallColor = statusColor(overall);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <M3TopAppBar title="Indexes Health" onBack={handleBack} />

      <ScrollView contentContainerStyle={{ padding: hPad, gap: 16, paddingBottom: 80 }}>
        <GlassView style={{ padding: 20, gap: 12 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontFamily: FontFamily.semibold, color: colors.text }}>
                Firestore Query Probes
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                Executes the same query shapes used by critical admin surfaces and reports whether each path is indexed, in fallback mode, or degraded.
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.primarySoft }]}>
              <View style={[styles.statusDot, { backgroundColor: overallColor }]} />
              <Text style={[styles.statusText, { color: overallColor }]}>{overall.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Summary label="Healthy" value={data?.summary.healthy ?? 0} color={CultureTokens.teal} />
            <Summary label="Fallback" value={data?.summary.fallback ?? 0} color={CultureTokens.gold} />
            <Summary label="Degraded" value={data?.summary.degraded ?? 0} color={CultureTokens.coral} />
          </View>

          <M3Button variant="tonal" onPress={() => refetch()} disabled={isFetching} style={{ alignSelf: 'flex-start' }}>
            {isFetching ? 'Running probes...' : 'Run Test Queries'}
          </M3Button>
        </GlassView>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Running index probes...</Text>
          </View>
        ) : (
          data?.probes.map((probe) => {
            const probeColor = statusColor(probe.status);
            return (
              <GlassView key={probe.id} style={{ padding: 16, gap: 8 }}>
                <View style={styles.probeHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: FontFamily.semibold, color: colors.text }}>
                      {probe.name}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      {probe.collection} · {probe.description}
                    </Text>
                  </View>
                  <View style={[styles.probeBadge, { backgroundColor: colors.primarySoft }]}>
                    <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: probeColor }}>
                      {probe.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Meta icon="speedometer-outline" label={`${probe.latencyMs}ms`} />
                  <Meta icon="albums-outline" label={`${probe.sampleCount} docs`} />
                  <Meta icon="git-branch-outline" label={probe.queryMode} />
                </View>

                {probe.lastError ? (
                  <Text style={{ color: colors.error, fontSize: 12, lineHeight: 18 }}>
                    {probe.lastError}
                  </Text>
                ) : null}
              </GlassView>
            );
          })
        )}

        <Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          Last generated: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'not yet'}
        </Text>
      </ScrollView>
    </View>
  );

  function Summary({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <View style={[styles.summaryCard, { borderColor: colors.borderLight }]}>
        <Text style={{ color, fontSize: 22, fontFamily: FontFamily.bold }}>{value}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: FontFamily.medium }}>{label}</Text>
      </View>
    );
  }

  function Meta({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
    return (
      <Pressable accessibilityRole="text" style={[styles.metaPill, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={13} color={colors.textTertiary} />
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: FontFamily.medium }}>{label}</Text>
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontFamily: FontFamily.bold },
  summaryRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  summaryCard: { minWidth: 120, flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, gap: 2 },
  loading: { padding: 48, alignItems: 'center', justifyContent: 'center' },
  probeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  probeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
