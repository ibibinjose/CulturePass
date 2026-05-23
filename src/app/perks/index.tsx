/**
 * /perks — Perks listing page
 *
 * Browse all available CulturePass+ perks with category filters and search.
 * Individual perk detail: /perks/[id]
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { usePerks } from '@/hooks/queries/usePerks';
import { useLayout } from '@/hooks/useLayout';
import { useColors } from '@/hooks/useColors';
import { useSafeBack } from '@/lib/navigation';
import { Skeleton } from '@/design-system/ui/Skeleton';
import {
  CultureTokens, FontFamily, gradients,
} from '@/design-system/tokens/theme';
import type { PerkData } from '@/shared/schema';

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: 'all',              label: 'All',       icon: 'grid-outline' as const },
  { key: 'discount_percent', label: 'Discounts', icon: 'pricetag-outline' as const },
  { key: 'free_ticket',      label: 'Freebies',  icon: 'gift-outline' as const },
  { key: 'early_access',     label: 'Access',    icon: 'key-outline' as const },
  { key: 'cashback',         label: 'Cashback',  icon: 'wallet-outline' as const },
  { key: 'vip_upgrade',      label: 'Upgrades',  icon: 'arrow-up-circle-outline' as const },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function badgeColor(perkType?: string | null) {
  switch (perkType) {
    case 'discount_percent':
    case 'discount_fixed': return CultureTokens.coral;
    case 'free_ticket':    return CultureTokens.teal;
    case 'early_access':   return CultureTokens.indigo;
    case 'vip_upgrade':    return CultureTokens.violet;
    case 'cashback':       return CultureTokens.teal;
    default:               return CultureTokens.indigo;
  }
}

function typeLabel(perkType?: string | null) {
  switch (perkType) {
    case 'discount_percent':
    case 'discount_fixed': return 'Discount';
    case 'free_ticket':    return 'Freebie';
    case 'early_access':   return 'Access';
    case 'vip_upgrade':    return 'Upgrade';
    case 'cashback':       return 'Cashback';
    default:               return 'Offer';
  }
}

function expiryLabel(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expired';
  if (diff === 0) return 'Ends today';
  if (diff === 1) return 'Ends tomorrow';
  if (diff <= 7) return `${diff}d left`;
  return null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PerkSkeleton({ width }: { width: number }) {
  return (
    <View style={[card.wrap, { width }]}>
      <Skeleton width="100%" height={140} borderRadius={0} />
      <View style={{ padding: 12, gap: 8 }}>
        <Skeleton width="55%" height={12} borderRadius={6} />
        <Skeleton width="80%" height={16} borderRadius={6} />
        <Skeleton width="40%" height={11} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Perk card ────────────────────────────────────────────────────────────────

const PerkCard = React.memo(function PerkCard({
  perk,
  width,
  index,
}: {
  perk: PerkData;
  width: number;
  index: number;
}) {
  const colors = useColors();
  const color = badgeColor(perk.perkType);
  const expiry = expiryLabel(perk.expiresAt);
  const isExpired = expiry === 'Expired';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 50, 350)).springify().damping(18)}
      style={[card.wrap, { width, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
    >
      <Pressable
        onPress={() => router.push(`/perks/${perk.id}`)}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`View ${perk.title}`}
      >
        {/* Image */}
        <View style={card.imageBox}>
          {perk.coverUrl ? (
            <Image
              source={{ uri: perk.coverUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, card.imagePlaceholder, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="pricetag-outline" size={28} color={colors.textTertiary} />
            </View>
          )}

          {/* Type badge */}
          <View style={[card.badge, { backgroundColor: color }]}>
            <Text style={card.badgeText}>{typeLabel(perk.perkType)}</Text>
          </View>

          {/* Discount badge */}
          {perk.discountPercent && perk.discountPercent > 0 ? (
            <View style={[card.discountBadge, { backgroundColor: colors.surface + 'EE' }]}>
              <Text style={[card.discountText, { color: CultureTokens.coral }]}>
                {perk.discountPercent}% off
              </Text>
            </View>
          ) : null}

          {/* Expired overlay */}
          {isExpired ? (
            <View style={card.expiredOverlay}>
              <Text style={card.expiredText}>EXPIRED</Text>
            </View>
          ) : null}

          {/* Plus required indicator */}
          {perk.isMembershipRequired ? (
            <View style={card.plusBadge}>
              <Ionicons name="diamond" size={9} color={CultureTokens.gold} />
              <Text style={card.plusBadgeText}>Plus</Text>
            </View>
          ) : null}
        </View>

        {/* Info */}
        <View style={card.body}>
          {perk.partnerName ? (
            <Text style={[card.partner, { color: CultureTokens.indigo }]} numberOfLines={1}>
              {perk.partnerName}
            </Text>
          ) : null}

          <Text style={[card.title, { color: colors.text }]} numberOfLines={2}>
            {perk.title}
          </Text>

          {expiry && !isExpired ? (
            <View style={card.expiryRow}>
              <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
              <Text style={[card.expiryText, { color: colors.textTertiary }]}>{expiry}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PerksScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDesktop, hPad, columnWidth } = useLayout();
  const handleBack = useSafeBack('/(tabs)');
  const topInset = Platform.OS === 'web' ? 0 : insets.top;

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const { data: perks, isLoading } = usePerks({ pageSize: 50 });

  const numCols = isDesktop ? 3 : 2;
  const gap = isDesktop ? 16 : 12;
  // columnWidth(1) = full content area (window - sidebar - hPad*2), no column-splitting
  const contentW = columnWidth(1);
  const cardW = (contentW - gap * (numCols - 1)) / numCols;

  const filtered = useMemo(() => {
    if (!perks) return [];
    let list = perks;
    if (selectedFilter !== 'all') {
      list = list.filter(p => p.perkType === selectedFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.partnerName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [perks, selectedFilter, search]);

  return (
    <View style={[pg.root, { backgroundColor: colors.background }]}>
      {/* Subtle top gradient accent */}
      <LinearGradient
        colors={[CultureTokens.violet + '10', 'transparent']}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { height: '30%' }]}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[pg.header, { paddingTop: topInset + 12, paddingHorizontal: hPad }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [pg.backBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, opacity: pressed ? 0.8 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={pg.headerCenter}>
          <Text style={[pg.headerTitle, { color: colors.text }]}>Perks</Text>
          {perks && perks.length > 0 ? (
            <View style={[pg.headerCount, { backgroundColor: CultureTokens.violet + '18' }]}>
              <Text style={[pg.headerCountText, { color: CultureTokens.violet }]}>{perks.length}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          pg.scroll,
          {
            paddingHorizontal: hPad,
            paddingTop: 16,
            paddingBottom: insets.bottom + 48,
          },
        ]}
      >
        {/* Search */}
        <View style={[pg.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
          <Ionicons name="search-outline" size={17} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search perks…"
            placeholderTextColor={colors.textTertiary}
            style={[pg.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter chips */}
        <View style={{ marginHorizontal: -hPad }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={pg.chips}
          >
            <View style={{ width: hPad }} />
            {FILTERS.map(f => {
              const active = selectedFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setSelectedFilter(f.key)}
                  style={[
                    pg.chip,
                    active
                      ? { backgroundColor: CultureTokens.violet, borderColor: CultureTokens.violet }
                      : { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                  ]}
                >
                  <Ionicons
                    name={f.icon}
                    size={14}
                    color={active ? '#FFF' : colors.textSecondary}
                  />
                  <Text style={[pg.chipText, { color: active ? '#FFF' : colors.textSecondary }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
            <View style={{ width: hPad }} />
          </ScrollView>
        </View>

        {/* Grid */}
        {isLoading ? (
          <View style={[pg.grid, { gap }]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <PerkSkeleton key={i} width={cardW} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={pg.empty}>
            <Ionicons name="gift-outline" size={48} color={colors.textTertiary} style={{ marginBottom: 12 }} />
            <Text style={[pg.emptyTitle, { color: colors.text }]}>
              {search ? 'No matches found' : 'No perks yet'}
            </Text>
            <Text style={[pg.emptySub, { color: colors.textSecondary }]}>
              {search ? 'Try a different search or filter.' : 'Check back soon — new perks are added regularly.'}
            </Text>
          </View>
        ) : (
          <View style={[pg.grid, { gap }]}>
            {filtered.map((perk, i) => (
              <PerkCard
                key={perk.id}
                perk={perk}
                width={cardW ?? '48%'}
                index={i}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const pg = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', zIndex: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, letterSpacing: -0.3 },
  headerCount: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
  },
  headerCountText: { fontSize: 12, fontFamily: FontFamily.bold },
  scroll: { flexGrow: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, height: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: FontFamily.regular,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 20, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 36,
    borderRadius: 999, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: FontFamily.medium },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  empty: {
    paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontFamily: FontFamily.bold, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: FontFamily.regular, textAlign: 'center', lineHeight: 20 },
});

const card = StyleSheet.create({
  wrap: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    marginBottom: 0,
  },
  imageBox: { height: 140, width: '100%', backgroundColor: '#1E1E2D' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: '#FFF', letterSpacing: 0.4 },
  discountBadge: {
    position: 'absolute', bottom: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  discountText: { fontFamily: FontFamily.bold, fontSize: 11 },
  expiredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  expiredText: { fontFamily: FontFamily.bold, fontSize: 13, color: '#FFF', letterSpacing: 1.5 },
  plusBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.60)',
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8,
  },
  plusBadgeText: { fontFamily: FontFamily.bold, fontSize: 9, color: CultureTokens.gold },
  body: { padding: 12, gap: 4 },
  partner: { fontFamily: FontFamily.semibold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  expiryText: { fontFamily: FontFamily.regular, fontSize: 11 },
});
