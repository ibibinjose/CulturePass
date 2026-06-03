/**
 * Admin — Promo Codes
 * Create and manage CulturePass+ gift/promo codes.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Switch,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { CultureTokens, FontFamily, M3Typography, Radius } from '@/design-system/tokens/theme';
import { Button, M3Button } from '@/design-system/ui';
import { withAlpha } from '@/lib/withAlpha';

// ─── Types ────────────────────────────────────────────────────────────────────

type PromoCode = {
  id: string;
  code: string;
  type: 'free_plus' | 'ticket_discount';
  durationDays?: number;
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
  eventId?: string | null;
  maxUses?: number | null;
  maxRedemptions?: number | null;
  usedCount: number;
  redeemedCount?: number;
  isActive: boolean;
  expiresAt: string | null;
  note: string;
  createdAt: string;
  createdBy?: string;
};

// ─── Create form ─────────────────────────────────────────────────────────────

function CreateCodeForm({ onDone }: { onDone: () => void }) {
  const m3Colors = useM3Colors();
  const queryClient = useQueryClient();
  const [promoType, setPromoType] = useState<'free_plus' | 'ticket_discount'>('free_plus');
  const [code, setCode] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [maxUses, setMaxUses] = useState('');
  const [note, setNote] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  // Ticket discount fields
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [eventId, setEventId] = useState(''); // optional
  const [maxRedemptions, setMaxRedemptions] = useState('');

  const parsedMaxUses = (() => {
    const t = maxUses.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  })();

  const parsedMaxRedemptions = (() => {
    const t = maxRedemptions.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  })();

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        code: code.trim().toUpperCase(),
        type: promoType,
        maxUses: parsedMaxUses,
        expiresAt: hasExpiry && expiryDate.trim() ? new Date(expiryDate).toISOString() : null,
        note: note.trim(),
      };
      if (promoType === 'free_plus') {
        return api.admin.createPromoCode({
          ...base,
          durationDays: Math.max(1, parseInt(durationDays, 10) || 30),
        });
      } else {
        const dv = parseFloat(discountValue);
        return api.admin.createPromoCode({
          ...base,
          discountType,
          discountValue: Number.isFinite(dv) ? dv : 0,
          eventId: eventId.trim() || undefined,
          maxRedemptions: parsedMaxRedemptions,
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      onDone();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not create code';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(`Failed\n\n${msg}`);
      } else {
        Alert.alert('Failed', msg);
      }
    },
  });

  const maxUsesOk = maxUses.trim() === '' || parsedMaxUses !== null;
  const maxRedemptionsOk = maxRedemptions.trim() === '' || parsedMaxRedemptions !== null;
  const isValid = code.trim().length >= 3 &&
    (promoType === 'free_plus' ? (parseInt(durationDays, 10) > 0 && maxUsesOk) :
      (['fixed','percent'].includes(discountType) && parseFloat(discountValue) > 0 && maxRedemptionsOk));

  return (
    <View style={[form.wrap, { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant }]}>
      <Text style={[form.heading, { color: m3Colors.onSurface }]}>New Promo Code</Text>

      <View style={form.field}>
        <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['free_plus', 'ticket_discount'] as const).map(t => (
            <Pressable
              key={t}
              onPress={() => setPromoType(t)}
              style={[form.typeBtn, promoType === t && form.typeBtnActive, { borderColor: m3Colors.outlineVariant }]}
            >
              <Text style={[form.typeText, promoType === t && { color: m3Colors.onSurface }]}>{t === 'free_plus' ? 'Membership Free+' : 'Ticket Discount'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={form.field}>
        <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Code</Text>
        <TextInput
          value={code}
          onChangeText={v => setCode(v.toUpperCase())}
          placeholder="e.g. CULTURE30"
          placeholderTextColor={m3Colors.onSurfaceVariant}
          autoCapitalize="characters"
          autoCorrect={false}
          style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
        />
      </View>

      {promoType === 'free_plus' ? (
        <View style={form.row}>
          <View style={[form.field, { flex: 1 }]}>
            <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Days of Plus</Text>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={m3Colors.onSurfaceVariant}
              style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
            />
          </View>
          <View style={[form.field, { flex: 1 }]}>
            <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Max uses (blank = ∞)</Text>
            <TextInput
              value={maxUses}
              onChangeText={setMaxUses}
              keyboardType="number-pad"
              placeholder="Unlimited"
              placeholderTextColor={m3Colors.onSurfaceVariant}
              style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
            />
          </View>
        </View>
      ) : (
        <View>
          <View style={form.row}>
            <View style={[form.field, { flex: 1 }]}>
              <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Discount Type</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['percent', 'fixed'] as const).map(dt => (
                  <Pressable key={dt} onPress={() => setDiscountType(dt)} style={[form.typeBtnSmall, discountType === dt && form.typeBtnActiveSmall, { borderColor: m3Colors.outlineVariant }]}>
                    <Text style={{ fontSize: 12, color: discountType === dt ? m3Colors.onSurface : m3Colors.onSurfaceVariant }}>{dt === 'percent' ? '%' : 'Fixed $'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[form.field, { flex: 1 }]}>
              <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Value</Text>
              <TextInput
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="decimal-pad"
                placeholder={discountType === 'percent' ? '20' : '5.00'}
                placeholderTextColor={m3Colors.onSurfaceVariant}
                style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
              />
            </View>
          </View>
          <View style={form.row}>
            <View style={[form.field, { flex: 1 }]}>
              <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Event ID (optional)</Text>
              <TextInput
                value={eventId}
                onChangeText={setEventId}
                placeholder="evt_123"
                placeholderTextColor={m3Colors.onSurfaceVariant}
                autoCapitalize="none"
                style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
              />
            </View>
            <View style={[form.field, { flex: 1 }]}>
              <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Max redemptions</Text>
              <TextInput
                value={maxRedemptions}
                onChangeText={setMaxRedemptions}
                keyboardType="number-pad"
                placeholder="Unlimited"
                placeholderTextColor={m3Colors.onSurfaceVariant}
                style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
              />
            </View>
          </View>
        </View>
      )}

      <View style={form.field}>
        <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Note (internal)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Event partner gift — April 2026"
          placeholderTextColor={m3Colors.onSurfaceVariant}
          style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
        />
      </View>

      <View style={[form.toggleRow, { borderColor: m3Colors.outlineVariant }]}>
        <Text style={[form.label, { color: m3Colors.onSurfaceVariant, marginBottom: 0 }]}>Set expiry date</Text>
        <Switch
          value={hasExpiry}
          onValueChange={setHasExpiry}
          thumbColor={hasExpiry ? CultureTokens.indigo : m3Colors.outline}
          trackColor={{ true: withAlpha(CultureTokens.indigo, 0.4), false: m3Colors.surfaceContainerHigh }}
        />
      </View>

      {hasExpiry && (
        <View style={form.field}>
          <Text style={[form.label, { color: m3Colors.onSurfaceVariant }]}>Expiry date (YYYY-MM-DD)</Text>
          <TextInput
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="2026-12-31"
            placeholderTextColor={m3Colors.onSurfaceVariant}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            style={[form.input, { backgroundColor: m3Colors.surfaceContainerHigh, color: m3Colors.onSurface, borderColor: m3Colors.outlineVariant }]}
          />
        </View>
      )}

      {/* Plain Pressable path (Button) — M3Button uses Reanimated Pressable which can miss onPress on web. */}
      <Button
        variant="primary"
        onPress={() => mutation.mutate()}
        disabled={!isValid || mutation.isPending}
        loading={mutation.isPending}
        fullWidth
        style={{ marginTop: 8 }}
        accessibilityLabel="Create promo code"
      >
        Create Code
      </Button>
      {mutation.isError ? (
        <Text style={[form.error, { color: m3Colors.error }]}>
          {mutation.error instanceof Error ? mutation.error.message : 'Could not create code'}
        </Text>
      ) : null}
    </View>
  );
}

const form = StyleSheet.create({
  wrap: { borderRadius: Radius.lg, borderWidth: 1, padding: 20, gap: 16, marginBottom: 24 },
  heading: { fontSize: 15, fontFamily: FontFamily.bold, marginBottom: 4 },
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 0.2 },
  input: {
    height: 44, borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: 12, fontFamily: FontFamily.regular, fontSize: 14,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 14 },
  error: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 4 },
  typeBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderRadius: Radius.sm, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  typeText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#666' },
  typeBtnSmall: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderRadius: 6, alignItems: 'center' },
  typeBtnActiveSmall: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
});

// ─── Code row ────────────────────────────────────────────────────────────────

function CodeRow({ item, onToggle }: { item: PromoCode; onToggle: (id: string, isActive: boolean) => void }) {
  const m3Colors = useM3Colors();
  const isExpired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
  const max = item.maxRedemptions ?? item.maxUses;
  const used = item.redeemedCount ?? item.usedCount;
  const isFull = typeof max === 'number' && used >= max;
  const statusColor = !item.isActive ? m3Colors.error : isExpired || isFull ? CultureTokens.gold : CultureTokens.teal;
  const statusText = !item.isActive ? 'Disabled' : isExpired ? 'Expired' : isFull ? 'Used up' : 'Active';

  return (
    <View style={[row.wrap, { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant }]}>
      <View style={row.top}>
        <Text style={[row.code, { color: m3Colors.onSurface }]}>{item.code}</Text>
        <View style={[row.badge, { backgroundColor: withAlpha(statusColor, 0.15) }]}>
          <View style={[row.dot, { backgroundColor: statusColor }]} />
          <Text style={[row.badgeText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={row.meta}>
        {item.type === 'free_plus' ? (
          <View style={row.chip}>
            <Ionicons name="diamond" size={12} color={CultureTokens.indigo} />
            <Text style={[row.chipText, { color: m3Colors.onSurfaceVariant }]}>
              {item.durationDays}d Plus
            </Text>
          </View>
        ) : (
          <View style={row.chip}>
            <Ionicons name="pricetag" size={12} color={CultureTokens.teal} />
            <Text style={[row.chipText, { color: m3Colors.onSurfaceVariant }]}>
              {item.discountType === 'percent' ? `${item.discountValue}%` : `$${((item.discountValue||0)/100).toFixed(2)}`} off
              {item.eventId ? ' (event)' : ''}
            </Text>
          </View>
        )}
        <View style={row.chip}>
          <Ionicons name="people" size={12} color={m3Colors.onSurfaceVariant} />
          <Text style={[row.chipText, { color: m3Colors.onSurfaceVariant }]}>
            {(item.redeemedCount ?? item.usedCount)}{(item.maxRedemptions ?? item.maxUses) !== null ? `/${item.maxRedemptions ?? item.maxUses}` : ''} used
          </Text>
        </View>
        {item.expiresAt ? (
          <View style={row.chip}>
            <Ionicons name="calendar" size={12} color={m3Colors.onSurfaceVariant} />
            <Text style={[row.chipText, { color: m3Colors.onSurfaceVariant }]}>
              Expires {new Date(item.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        ) : null}
      </View>

      {item.note ? <Text style={[row.note, { color: m3Colors.onSurfaceVariant }]}>{item.note}</Text> : null}

      <View style={row.actions}>
        <M3Button
          variant="text"
          onPress={() => onToggle(item.id, !item.isActive)}
          leftIcon={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
          style={{ flex: 1 }}
        >
          {item.isActive ? 'Disable' : 'Enable'}
        </M3Button>
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: { borderRadius: Radius.md, borderWidth: 1, padding: 16, gap: 10, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 17, fontFamily: FontFamily.bold, letterSpacing: 0.8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 12, fontFamily: FontFamily.regular },
  note: { fontSize: 12, fontFamily: FontFamily.regular, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 8, marginTop: 2 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function PromoCodesScreen() {
  const colors = useColors();
  const m3Colors = useM3Colors();
  const { hPad } = useLayout();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: () => api.admin.listPromoCodes(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.admin.togglePromoCode(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promo-codes'] }),
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const codes = data?.codes ?? [];
  const activeCodes = codes.filter(c => c.isActive);
  const inactiveCodes = codes.filter(c => !c.isActive);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Promo Codes</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create gift codes to grant CulturePass+ access
          </Text>
        </View>
        <M3Button
          variant={showForm ? 'tonal' : 'filled'}
          leftIcon={showForm ? 'close' : 'add'}
          onPress={() => setShowForm(v => !v)}
        >
          {showForm ? 'Cancel' : 'New Code'}
        </M3Button>
      </View>

      {/* Stats row */}
      <View style={[styles.statsRow, { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant }]}>
        {[
          { label: 'Total codes', value: String(codes.length) },
          { label: 'Active', value: String(activeCodes.length), color: CultureTokens.teal },
          { label: 'Total redeemed', value: String(codes.reduce((n, c) => n + (c.redeemedCount ?? c.usedCount), 0)) },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <View style={[styles.statDiv, { backgroundColor: m3Colors.outlineVariant }]} />}
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: s.color ?? colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Create form */}
      {showForm && (
        <CreateCodeForm
          onDone={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {/* Active codes */}
      {isLoading ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading…</Text>
      ) : codes.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: m3Colors.surfaceContainerLow, borderColor: m3Colors.outlineVariant }]}>
          <Ionicons name="pricetag-outline" size={40} color={m3Colors.onSurfaceVariant} />
          <Text style={[M3Typography.bodyMedium, { color: m3Colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }]}>
            No promo codes yet.{'\n'}Create one to get started.
          </Text>
        </View>
      ) : (
        <>
          {activeCodes.length > 0 && (
            <>
              <Text style={[styles.section, { color: colors.textTertiary }]}>ACTIVE — {activeCodes.length}</Text>
              {activeCodes.map(c => (
                <CodeRow
                  key={c.id}
                  item={c}
                  onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                />
              ))}
            </>
          )}
          {inactiveCodes.length > 0 && (
            <>
              <Text style={[styles.section, { color: colors.textTertiary, marginTop: 16 }]}>
                DISABLED — {inactiveCodes.length}
              </Text>
              {inactiveCodes.map(c => (
                <CodeRow
                  key={c.id}
                  item={c}
                  onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 60, gap: 0 },
  pageHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 20, gap: 16,
  },
  title: { fontSize: 24, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 4 },

  statsRow: {
    flexDirection: 'row', borderRadius: Radius.md, borderWidth: 1,
    padding: 16, marginBottom: 24,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 22, fontFamily: FontFamily.bold, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: FontFamily.regular },
  statDiv: { width: 1, marginVertical: 4, marginHorizontal: 8 },

  section: { fontSize: 11, fontFamily: FontFamily.bold, letterSpacing: 1.4, marginBottom: 10 },

  emptyCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    alignItems: 'center', padding: 48, gap: 4,
  },
  empty: { textAlign: 'center', padding: 40, fontFamily: FontFamily.regular },
});
