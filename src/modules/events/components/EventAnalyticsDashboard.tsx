import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, Spacing, Radius, TextStyles } from '@/design-system/tokens/theme';
import { withAlpha } from '@/lib/withAlpha';
import { PromoCode } from '@/shared/schema';

interface EventAnalyticsDashboardProps {
  eventId: string;
}

export function EventAnalyticsDashboard({ eventId }: EventAnalyticsDashboardProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Host-facing promos for this event (ticket discounts)
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [promoDiscountValue, setPromoDiscountValue] = useState('');
  const [promoMaxRedemptions, setPromoMaxRedemptions] = useState('');
  const [creatingPromo, setCreatingPromo] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
    setSendingBroadcast(true);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await api.events.messageAttendees(eventId, broadcastTitle.trim(), broadcastBody.trim());
      if (res.ok) {
        Alert.alert(
          'Message Sent',
          `Successfully sent broadcast to ${res.recipientsCount} attendee(s).`,
          [{ text: 'OK', onPress: () => { setBroadcastTitle(''); setBroadcastBody(''); } }]
        );
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!promoCode.trim() || !promoDiscountValue.trim()) return;
    setCreatingPromo(true);
    try {
      const dv = parseFloat(promoDiscountValue);
      if (!Number.isFinite(dv) || dv <= 0) throw new Error('Invalid discount value');
      await api.events.promos.create(eventId, {
        code: promoCode.trim().toUpperCase(),
        discountType: promoDiscountType,
        discountValue: promoDiscountType === 'percent' ? dv : Math.round(dv * 100),
        maxRedemptions: promoMaxRedemptions ? parseInt(promoMaxRedemptions, 10) : null,
      });
      Alert.alert('Promo Created', `Code ${promoCode.toUpperCase()} is now active for this event.`);
      setPromoCode(''); setPromoDiscountValue(''); setPromoMaxRedemptions('');
      await refetchPromos();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create promo');
    } finally {
      setCreatingPromo(false);
    }
  };

  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => api.events.getAnalytics(eventId),
  });

  const { data: promosData, isLoading: promosLoading, refetch: refetchPromos } = useQuery({
    queryKey: ['event-promos', eventId],
    queryFn: () => api.events.promos.list(eventId),
    enabled: !!eventId,
  });
  const promos = promosData?.promos || [];

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

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Broadcast Announcement</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Send a push notification and in-app message to all {totals.ticketSales} ticketholders.
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
          placeholder="Announcement Title (e.g. Venue change)"
          placeholderTextColor={colors.textTertiary}
          value={broadcastTitle}
          onChangeText={setBroadcastTitle}
          accessibilityLabel="Announcement Title"
        />
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
          placeholder="Write your announcement details here..."
          placeholderTextColor={colors.textTertiary}
          value={broadcastBody}
          onChangeText={setBroadcastBody}
          multiline
          numberOfLines={4}
          accessibilityLabel="Announcement Message"
        />
        <Pressable
          onPress={() => void handleSendBroadcast()}
          disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim()}
          style={({ pressed }) => [
            styles.broadcastBtn,
            {
              backgroundColor: (sendingBroadcast || !broadcastTitle.trim() || !broadcastBody.trim())
                ? colors.borderLight
                : CultureTokens.violet,
              opacity: pressed ? 0.9 : 1
            }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send broadcast to attendees"
        >
          {sendingBroadcast ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="send-outline" size={16} color="#FFFFFF" />
              <Text style={styles.btnText}>Send to {totals.ticketSales} Attendees</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Host-facing Promos for this event (ticket discounts via promoCodes) */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Promos</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Create discount codes for this event. Codes are validated at checkout (fixed or % off).
        </Text>

        {/* Create form */}
        <View style={{ gap: 8, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
            placeholder="PROMO20"
            value={promoCode}
            onChangeText={v => setPromoCode(v.toUpperCase())}
            autoCapitalize="characters"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setPromoDiscountType('percent')} style={[styles.promoTypeBtn, promoDiscountType === 'percent' && styles.promoTypeActive]}>
              <Text style={{ color: promoDiscountType === 'percent' ? '#fff' : colors.text }}> % </Text>
            </Pressable>
            <Pressable onPress={() => setPromoDiscountType('fixed')} style={[styles.promoTypeBtn, promoDiscountType === 'fixed' && styles.promoTypeActive]}>
              <Text style={{ color: promoDiscountType === 'fixed' ? '#fff' : colors.text }}> $ </Text>
            </Pressable>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
              placeholder={promoDiscountType === 'percent' ? '20' : '5.00'}
              value={promoDiscountValue}
              onChangeText={setPromoDiscountValue}
              keyboardType="decimal-pad"
            />
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
            placeholder="Max redemptions (optional)"
            value={promoMaxRedemptions}
            onChangeText={setPromoMaxRedemptions}
            keyboardType="number-pad"
          />
          <Pressable
            onPress={() => void handleCreatePromo()}
            disabled={creatingPromo || !promoCode.trim() || !promoDiscountValue.trim()}
            style={[styles.broadcastBtn, { backgroundColor: creatingPromo || !promoCode.trim() || !promoDiscountValue.trim() ? colors.borderLight : CultureTokens.teal }]}
          >
            {creatingPromo ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnText}>Create Promo</Text>}
          </Pressable>
        </View>

        {/* List existing promos */}
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Active Promos for Event</Text>
          {promosLoading ? (
            <ActivityIndicator />
          ) : promos.length === 0 ? (
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>No promos yet.</Text>
          ) : (
            (promos as PromoCode[]).map((p, i) => (
              <View key={i} style={{ padding: 8, backgroundColor: colors.background, borderRadius: 8, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontFamily: 'monospace' }}>{p.code}</Text>
                <Text style={{ color: colors.textSecondary }}>
                  {p.discountType === 'percent' ? `${p.discountValue}%` : `$${(p.discountValue/100).toFixed(2)}`} · {p.redeemedCount || 0} used
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  colors: Record<string, string>;
}

function StatCard({ label, value, icon, color, colors }: StatCardProps) {
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

interface TrafficRowProps {
  label: string;
  count: number;
  total: number;
  color: string;
  colors: Record<string, string>;
}

function TrafficRow({ label, count, total, color, colors }: TrafficRowProps) {
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
  input: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    ...TextStyles.body,
    marginTop: 8,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  broadcastBtn: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
  },
  cardSubtitle: {
    ...TextStyles.bodyMedium,
    marginTop: -Spacing.xs,
  },
  promoTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  promoTypeActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
});
