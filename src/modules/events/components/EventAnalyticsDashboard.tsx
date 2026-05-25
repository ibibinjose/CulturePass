import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Spacing, Radius, TextStyles } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';

interface EventAnalyticsDashboardProps {
  eventId: string;
}

export function EventAnalyticsDashboard({ eventId }: EventAnalyticsDashboardProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => api.events.getAnalytics(eventId),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={CultureTokens.violet} />
      </View>
    );
  }

  if (error || !analytics) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={CultureTokens.coral} />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load analytics</Text>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={{ color: CultureTokens.indigo }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const { totals, trend, trafficSources } = analytics;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Event Performance</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Real-time insights for your event
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Views"
          value={totals.views}
          icon="eye-outline"
          color={CultureTokens.indigo}
          colors={colors}
        />
        <StatCard
          label="Tickets"
          value={totals.ticketSales}
          icon="ticket-outline"
          color={CultureTokens.teal}
          colors={colors}
        />
        <StatCard
          label="Revenue"
          value={`$${(totals.revenueCents / 100).toFixed(0)}`}
          icon="cash-outline"
          color={CultureTokens.violet}
          colors={colors}
        />
        <StatCard
          label="Saves"
          value={totals.saves}
          icon="bookmark-outline"
          color={CultureTokens.coral}
          colors={colors}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Sales Trend</Text>
        {trend.length > 0 ? (
          <View style={styles.trendContainer}>
             {/* Simplified trend visualization */}
             <View style={styles.trendBars}>
                {trend.slice(-14).map((day, i) => {
                  const maxSales = Math.max(...trend.map(t => t.ticketSales), 1);
                  const height = (day.ticketSales / maxSales) * 100;
                  return (
                    <View key={day.day} style={styles.trendBarColumn}>
                      <View
                        style={[
                          styles.trendBarFill,
                          { height: `${height}%`, backgroundColor: CultureTokens.teal }
                        ]}
                      />
                      {i % 3 === 0 && (
                        <Text style={[styles.trendLabel, { color: colors.textTertiary }]}>
                          {day.day.slice(8, 10)}/{day.day.slice(5, 7)}
                        </Text>
                      )}
                    </View>
                  );
                })}
             </View>
          </View>
        ) : (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
            Not enough data to show trends
          </Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Traffic Sources</Text>
        <TrafficRow label="Direct" count={trafficSources.direct} total={totals.views} color={CultureTokens.indigo} colors={colors} />
        <TrafficRow label="Search" count={trafficSources.search} total={totals.views} color={CultureTokens.teal} colors={colors} />
        <TrafficRow label="Social" count={trafficSources.social} total={totals.views} color={CultureTokens.violet} colors={colors} />
        <TrafficRow label="Referral" count={trafficSources.referral} total={totals.views} color={CultureTokens.coral} colors={colors} />
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, icon, color, colors }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[styles.statIcon, { backgroundColor: withAlpha(color, 0.1) }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function TrafficRow({ label, count, total, color, colors }: any) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.trafficRow}>
      <View style={styles.trafficInfo}>
        <Text style={[styles.trafficLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.trafficCount, { color: colors.textSecondary }]}>{count} ({percent.toFixed(0)}%)</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  contentDesktop: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { marginBottom: Spacing.sm },
  title: { ...TextStyles.title2, marginBottom: 4 },
  subtitle: { ...TextStyles.bodyMedium },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { ...TextStyles.title, fontSize: 24 },
  statLabel: { ...TextStyles.captionSemibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { padding: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.md },
  cardTitle: { ...TextStyles.title3 },
  trendContainer: { height: 160, paddingTop: 20 },
  trendBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  trendBarColumn: { flex: 1, alignItems: 'center', gap: 8 },
  trendBarFill: { width: '100%', borderRadius: 4, minHeight: 2 },
  trendLabel: { fontSize: 9, fontFamily: 'Manrope_600SemiBold' },
  trafficRow: { gap: 8 },
  trafficInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trafficLabel: { ...TextStyles.headline, fontWeight: '600' },
  trafficCount: { ...TextStyles.caption },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  errorText: { ...TextStyles.title3, marginTop: 16 },
  retryBtn: { marginTop: 12, padding: 8 },
});
