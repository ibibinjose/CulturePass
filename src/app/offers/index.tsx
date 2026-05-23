import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, ActivityIndicator,
  ScrollView, RefreshControl, Alert, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { modulesApi } from '@/modules/api';
import { getApiErrorMessage } from '@/lib/format';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { useIsCreator } from '@/hooks/useCanEdit';
import { useRole } from '@/hooks/useRole';
import { createLabCategoryHref } from '@/constants/navigation/createNav';
import { usePerks } from '@/hooks/queries/usePerks';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { CreatorFAB } from '@/design-system/ui/CreatorActions';
import type { PerkData } from '@/shared/schema';
import {
  CultureTokens,
  FontFamily,
  TextStyles,
  InputTokens,
  ChipTokens,
} from '@/design-system/tokens/theme';
import { Button } from '@/design-system/ui/Button';
import { GlassView } from '@/design-system/ui/GlassView';

const isWeb = Platform.OS === 'web';

// ─── Type filter options ──────────────────────────────────────────────────────

const TYPE_FILTERS = [
  { key: 'All', label: 'All', icon: 'grid-outline' as const },
  { key: 'discount_percent', label: 'Discounts', icon: 'pricetag-outline' as const },
  { key: 'discount_fixed', label: 'Deals', icon: 'cash-outline' as const },
  { key: 'free_ticket', label: 'Freebies', icon: 'gift-outline' as const },
  { key: 'vip_upgrade', label: 'Upgrades', icon: 'arrow-up-circle-outline' as const },
  { key: 'early_access', label: 'Access', icon: 'key-outline' as const },
  { key: 'cashback', label: 'Cashback', icon: 'wallet-outline' as const },
] as const;

type TypeFilterKey = (typeof TYPE_FILTERS)[number]['key'];

const SKELETON_COUNT = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPerkTypeLabel(perkType?: string): string {
  switch (perkType) {
    case 'discount_percent': return 'Discount';
    case 'discount_fixed': return 'Deal';
    case 'free_ticket': return 'Freebie';
    case 'early_access': return 'Access';
    case 'vip_upgrade': return 'Upgrade';
    case 'cashback': return 'Cashback';
    default: return 'Offer';
  }
}

function getPerkTypeBadgeColor(perkType?: string): string {
  switch (perkType) {
    case 'discount_percent':
    case 'discount_fixed': return CultureTokens.coral;
    case 'free_ticket': return CultureTokens.teal;
    case 'early_access': return CultureTokens.indigo;
    case 'vip_upgrade': return CultureTokens.violet;
    case 'cashback': return CultureTokens.teal;
    default: return CultureTokens.indigo;
  }
}

function formatDiscount(perk: PerkData): string | null {
  if (perk.discountPercent && perk.discountPercent > 0) return `${perk.discountPercent}% off`;
  return null;
}

function formatExpiry(expiresAt?: string): string | null {
  if (!expiresAt) return null;
  try {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `${diffDays}d left`;
    return `Expires ${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;
  } catch {
    return null;
  }
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function OfferCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[s.posterSkeleton, { backgroundColor: colors.surfaceElevated }]} />
      <View style={s.cardBody}>
        <View style={[s.skeletonLine, { width: '60%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '80%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '40%', backgroundColor: colors.surfaceElevated }]} />
      </View>
    </View>
  );
}

// ─── Offer card ───────────────────────────────────────────────────────────────

const OfferCard = React.memo(function OfferCard({
  perk,
  canManage,
  onEdit,
  onDelete,
  index,
  hasRendered,
}: {
  perk: PerkData;
  canManage: boolean;
  onEdit: (p: PerkData) => void;
  onDelete: (p: PerkData) => void;
  index: number;
  hasRendered: boolean;
}) {
  const colors = useColors();
  const badgeColor = getPerkTypeBadgeColor(perk.perkType);
  const discountLabel = formatDiscount(perk);
  const expiryLabel = formatExpiry(perk.expiresAt);

  const entering = !hasRendered
    ? FadeInDown.delay(Math.min(index * 60, 400)).springify().damping(18)
    : undefined;

  return (
    <Animated.View entering={entering} style={s.cardWrapper}>
      <Pressable
        onPress={() => router.push(`/perks/${perk.id}`)}
        style={({ pressed }) => [
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`View ${perk.title}`}
      >
        {/* Cover image */}
        <View style={s.posterContainer}>
          {perk.coverUrl ? (
            <Image
              source={{ uri: perk.coverUrl }}
              style={s.poster}
              contentFit="cover"
              transition={200}
              placeholder={perk.thumbhash ? { thumbhash: perk.thumbhash } : undefined}
            />
          ) : (
            <View style={[s.poster, s.posterPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="pricetag-outline" size={32} color={colors.textTertiary} />
            </View>
          )}
          {/* Type badge */}
          <View style={[s.typeBadge, { backgroundColor: badgeColor }]}>
            <Text style={s.typeBadgeText}>{getPerkTypeLabel(perk.perkType)}</Text>
          </View>
          {/* Discount badge */}
          {discountLabel && (
            <View style={[s.discountBadge, { backgroundColor: colors.surface + 'E6' }]}>
              <Text style={[s.discountText, { color: CultureTokens.coral }]}>{discountLabel}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={s.cardBody}>
          <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {perk.title}
          </Text>
          {perk.partnerName ? (
            <View style={s.providerRow}>
              <Ionicons name="storefront-outline" size={12} color={colors.textSecondary} />
              <Text style={[s.providerText, { color: colors.textSecondary }]} numberOfLines={1}>
                {perk.partnerName}
              </Text>
            </View>
          ) : null}
          {expiryLabel ? (
            <View style={s.expiryRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={expiryLabel === 'Expired' ? CultureTokens.coral : colors.textTertiary}
              />
              <Text
                style={[
                  s.expiryText,
                  { color: expiryLabel === 'Expired' ? CultureTokens.coral : colors.textTertiary },
                ]}
              >
                {expiryLabel}
              </Text>
            </View>
          ) : null}
          {perk.pointsCost != null && perk.pointsCost > 0 && (
            <View style={s.pointsRow}>
              <Ionicons name="diamond-outline" size={12} color={CultureTokens.indigo} />
              <Text style={[s.pointsText, { color: CultureTokens.indigo }]}>
                {perk.pointsCost} pts
              </Text>
            </View>
          )}
        </View>

        {/* Admin/creator actions */}
        {canManage && (
          <View style={[s.manageRow, { borderTopColor: colors.borderLight }]}>
            <Button
              variant="glass"
              size="sm"
              leftIcon="create-outline"
              onPress={() => onEdit(perk)}
              style={{ flex: 1, height: 36, minHeight: 36 }}
              textStyle={{ color: CultureTokens.indigo, fontSize: 12 }}
            >
              Edit
            </Button>
            <Button
              variant="glass"
              size="sm"
              leftIcon="trash-outline"
              onPress={() => onDelete(perk)}
              style={{ flex: 1, height: 36, minHeight: 36 }}
              textStyle={{ color: CultureTokens.coral, fontSize: 12 }}
            >
              Delete
            </Button>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

function OffersScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const colors = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();
  const { userId } = useAuth();
  const { isAdmin, isModerator } = useRole();
  const isCreator = useIsCreator();
  const queryClient = useQueryClient();

  const numCols = isDesktop ? 3 : 2;
  const colGap = isDesktop ? 20 : 12;

  // Filter & search state
  const [selectedType, setSelectedType] = useState<TypeFilterKey>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const city = state.city || '';
  const country = state.country || '';

  const { data: perks, isLoading, refetch, isRefetching } = usePerks({
    city: city || undefined,
    country: country || undefined,
  });

  // Client-side type + search filter
  const filtered = useMemo(() => {
    if (!perks) return [];
    let result = perks;
    if (selectedType !== 'All') {
      result = result.filter(p => p.perkType === selectedType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.partnerName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [perks, selectedType, searchQuery]);

  const handleEdit = useCallback((perk: PerkData) => {
    router.push(`/perks/${perk.id}`);
  }, []);

  const handleDelete = useCallback((perk: PerkData) => {
    Alert.alert(
      'Delete offer',
      `Remove "${perk.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await modulesApi.perks.remove(perk.id);
                await queryClient.invalidateQueries({ queryKey: ['perks'] });
              } catch (err) {
                Alert.alert('Delete failed', getApiErrorMessage(err, 'Could not delete this offer.'));
              }
            })();
          },
        },
      ],
    );
  }, [queryClient]);

  const hasRenderedRef = useRef(false);
  useEffect(() => {
    if (filtered.length > 0) hasRenderedRef.current = true;
  }, [filtered.length]);

  const locationLabel = city
    ? `${city}${country ? `, ${country}` : ''}`
    : country || 'your area';

  const clearFilters = useCallback(() => {
    setSelectedType('All');
    setSearchQuery('');
  }, []);

  const filtersActive = selectedType !== 'All' || searchQuery.trim().length > 0;

  // ── Build grid rows ────────────────────────────────────────────────────
  const rows = useMemo(() => {
    const result: PerkData[][] = [];
    for (let i = 0; i < filtered.length; i += numCols) {
      result.push(filtered.slice(i, i + numCols));
    }
    return result;
  }, [filtered, numCols]);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>

      {/* ── Header ── */}
      <Animated.View
        entering={FadeInUp.duration(320).springify()}
        style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}
      >
        <View style={s.headerContent}>
          <BackButton
            fallback="/(tabs)"
            style={[s.backBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Offers</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location" size={11} color={CultureTokens.indigo} />
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!isLoading && filtered.length > 0
                  ? ` · ${filtered.length} offer${filtered.length !== 1 ? 's' : ''}`
                  : ''}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => refetch()}
            style={[s.iconBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh offers"
          >
            {isRefetching
              ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
              : <Ionicons name="refresh" size={18} color={colors.text} />}
          </Pressable>
        </View>
      </Animated.View>

      {/* ── Centred content shell ── */}
      <View style={[s.shell, isDesktop && s.shellDesktop]}>

        {/* ── Search bar ── */}
        <View style={[s.searchRow, { paddingHorizontal: hPad }]}>
          <GlassView
            intensity={10}
            style={[s.searchInput, { backgroundColor: colors.surfaceElevated + 'B0', borderColor: colors.borderLight, height: InputTokens.height, borderRadius: InputTokens.radius }]}
          >
            <Ionicons name="search-outline" size={InputTokens.iconSize} color={colors.textTertiary} />
            <TextInput
              placeholder="Search offers…"
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[s.searchTextInput, { color: colors.text, fontSize: InputTokens.fontSize }]}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search offers"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} accessibilityLabel="Clear search" hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </GlassView>
        </View>

        {/* ── Type filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.chipRow, { paddingHorizontal: hPad }]}
          style={s.chipScroll}
        >
          {TYPE_FILTERS.map(({ key, label, icon }) => {
            const active = selectedType === key;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedType(key)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${label}`}
                accessibilityState={{ selected: active }}
              >
                <GlassView
                  intensity={active ? 30 : 5}
                  style={[
                    s.chip,
                    {
                      height: ChipTokens.height,
                      borderRadius: ChipTokens.radius,
                      backgroundColor: active ? CultureTokens.indigo : colors.surfaceElevated + '90',
                      borderColor: active ? CultureTokens.indigo : colors.borderLight,
                      gap: ChipTokens.gap,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={14} color={active ? '#fff' : colors.text} />
                  <Text style={[s.chipText, { color: active ? '#fff' : colors.text, fontSize: ChipTokens.fontSize }]}>{label}</Text>
                </GlassView>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Offer grid ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={CultureTokens.indigo} />
          }
          contentContainerStyle={[s.gridContent, { paddingHorizontal: hPad, paddingBottom: bottomInset + 100 }]}
        >
          {isLoading ? (
            <View style={[s.gridRow, { gap: colGap }]}>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <View key={`sk-${i}`} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                  <OfferCardSkeleton colors={colors} />
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            /* ── Empty state ── */
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Ionicons name="pricetag-outline" size={28} color={colors.textTertiary} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No offers found</Text>
              <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                {filtersActive
                  ? 'Try adjusting your search or filter.'
                  : `No offers yet in ${locationLabel}.`}
              </Text>
              {filtersActive && (
                <Button
                  variant="outline"
                  size="md"
                  leftIcon="refresh-outline"
                  onPress={clearFilters}
                  style={{ marginTop: 12, paddingHorizontal: 20 }}
                >
                  Reset filters
                </Button>
              )}
            </View>
          ) : (
            rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={[s.gridRow, { gap: colGap }]}>
                {row.map((perk, colIdx) => {
                  const canManage =
                    !!userId &&
                    (perk.partnerId === userId || isAdmin || isModerator);
                  return (
                    <View key={perk.id} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                      <OfferCard
                        perk={perk}
                        canManage={canManage}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        index={rowIdx * numCols + colIdx}
                        hasRendered={hasRenderedRef.current}
                      />
                    </View>
                  );
                })}
                {/* Fill empty cells so the last row aligns */}
                {row.length < numCols &&
                  Array.from({ length: numCols - row.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={[s.gridCell, numCols === 3 && s.gridCell3]} />
                  ))}
              </View>
            ))
          )}

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <View style={s.listFooter}>
              <View style={[s.endLine, { backgroundColor: colors.divider }]} />
              <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                {filtered.length} offer{filtered.length !== 1 ? 's' : ''}
              </Text>
              <View style={[s.endLine, { backgroundColor: colors.divider }]} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Creator FAB ── */}
      {isCreator && (
        <CreatorFAB
          label="Add Offer"
          icon="pricetag-outline"
          onPress={() => router.push(createLabCategoryHref('offer') as never)}
        />
      )}
    </View>
  );
}

// ─── Export with ErrorBoundary ─────────────────────────────────────────────────

export default function OffersPage() {
  return (
    <ErrorBoundary>
      <OffersScreen />
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.7,
  },

  // Shell
  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Search
  searchRow: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    padding: 0,
    ...(isWeb ? { outlineStyle: 'none' } : {}),
  } as Record<string, unknown>,

  // Type filter chips
  chipScroll: { flexGrow: 0 },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 18,
  },

  // Grid
  gridContent: { paddingTop: 8, gap: 16 },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCell: { flex: 1, minWidth: 0 },
  gridCell3: { flex: 1, maxWidth: '33.33%' as unknown as number },

  // Card
  cardWrapper: { flex: 1 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posterContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 10,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#fff',
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
  },

  // Card body
  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  expiryText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pointsText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 14,
  },

  // Admin manage row
  manageRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manageBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
  },

  // Skeleton
  posterSkeleton: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginTop: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
    gap: 14,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  emptyTitle: {
    ...TextStyles.title3,
    lineHeight: 24,
  },
  emptyDesc: {
    ...TextStyles.callout,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  resetBtnText: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 19,
  },

  // Footer
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  listFooterText: {
    ...TextStyles.cardTitle,
    textTransform: 'uppercase',
    letterSpacing: 1,
    lineHeight: 20,
  },
  endLine: { flex: 1, height: 1, opacity: 0.5 },
});
