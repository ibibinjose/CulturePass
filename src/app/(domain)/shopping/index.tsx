import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, ActivityIndicator,
  ScrollView, RefreshControl, TextInput, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi } from '@/modules/api';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import { isAppAdminEmail } from '@/lib/admin';
import { useRole } from '@/hooks/useRole';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { CreatorFAB } from '@/design-system/ui/CreatorActions';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { listingCreateNavigateParams } from '@/constants/navigation/experienceNav';
import type { ShopData } from '@/shared/schema/shopping';

const isWeb = Platform.OS === 'web';

// ─── Category filter options ──────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  'All', 'Fashion', 'Electronics', 'Books', 'Home', 'Beauty', 'Food', 'Crafts',
] as const;

type CategoryFilter = (typeof CATEGORY_OPTIONS)[number];

// ─── Skeleton card ────────────────────────────────────────────────────────────

function ShopCardSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={[s.posterSkeleton, { backgroundColor: colors.surfaceElevated }]} />
      <View style={s.cardBody}>
        <View style={[s.skeletonLine, { width: '75%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '50%', backgroundColor: colors.surfaceElevated }]} />
        <View style={[s.skeletonLine, { width: '40%', backgroundColor: colors.surfaceElevated }]} />
      </View>
    </View>
  );
}

// ─── Rating stars ─────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={s.starsRow}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f-${i}`} name="star" size={13} color={CultureTokens.coral} />
      ))}
      {half && <Ionicons name="star-half" size={13} color={CultureTokens.coral} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons key={`e-${i}`} name="star-outline" size={13} color={CultureTokens.coral} />
      ))}
    </View>
  );
}

// ─── Single shop card ─────────────────────────────────────────────────────────

const ShopCard = React.memo(function ShopCard({
  item,
  numCols,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: ShopData;
  numCols: number;
  canEdit: boolean;
  onEdit: (s: ShopData) => void;
  onDelete: (s: ShopData) => void;
}) {
  const colors = useColors();

  const activeDeals = (item.deals ?? []).filter((d) => d.isActive).length;

  return (
    <View style={s.cardWrapper}>
      <Pressable
        style={({ pressed }) => [
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => router.push(`/shopping/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}`}
      >
        {/* Image */}
        <View style={s.posterContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={s.poster}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.poster, s.posterPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="storefront-outline" size={32} color={colors.textTertiary} />
            </View>
          )}
          {/* Open/Closed badge */}
          <View style={[s.openBadge, { backgroundColor: item.isOpen ? '#22c55e' : colors.textTertiary }]}>
            <Text style={s.openBadgeText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
          </View>
          {item.isPromoted && (
            <View style={[s.promotedBadge, { backgroundColor: CultureTokens.indigo }]}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={s.promotedBadgeText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={s.cardBody}>
          <Text style={[s.shopName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>

          <View style={s.metaRow}>
            <View style={[s.categoryBadge, { backgroundColor: CultureTokens.indigo + '14' }]}>
              <Text style={[s.categoryBadgeText, { color: CultureTokens.indigo }]}>{item.category}</Text>
            </View>
          </View>

          <View style={s.ratingRow}>
            <RatingStars rating={item.rating} />
            <Text style={[s.reviewCount, { color: colors.textTertiary }]}>
              {item.rating.toFixed(1)} ({item.reviewsCount})
            </Text>
          </View>

          <View style={s.addressRow}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text style={[s.addressText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {/* Delivery & deals badges */}
          <View style={s.badgeRow}>
            {item.deliveryAvailable && (
              <View style={[s.infoBadge, { backgroundColor: CultureTokens.teal + '14' }]}>
                <Ionicons name="bicycle-outline" size={12} color={CultureTokens.teal} />
                <Text style={[s.infoBadgeText, { color: CultureTokens.teal }]}>Delivery</Text>
              </View>
            )}
            {activeDeals > 0 && (
              <View style={[s.infoBadge, { backgroundColor: CultureTokens.coral + '14' }]}>
                <Ionicons name="pricetag-outline" size={12} color={CultureTokens.coral} />
                <Text style={[s.infoBadgeText, { color: CultureTokens.coral }]}>
                  {activeDeals} deal{activeDeals !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Owner/admin actions */}
          {canEdit && (
            <View style={[s.manageRow, { borderTopColor: colors.borderLight }]}>
              <Pressable
                onPress={() => onEdit(item)}
                style={[s.manageBtn, { backgroundColor: CultureTokens.indigo + '14' }]}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons name="create-outline" size={14} color={CultureTokens.indigo} />
                <Text style={[s.manageBtnText, { color: CultureTokens.indigo }]}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => onDelete(item)}
                style={[s.manageBtn, { backgroundColor: CultureTokens.coral + '14' }]}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                <Text style={[s.manageBtnText, { color: CultureTokens.coral }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

function ShoppingScreen() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const bottomInset = safeInsets.bottom;
  const colors = useColors();
  const { state } = useOnboarding();
  const { isDesktop, hPad } = useLayout();
  const { userId, user } = useAuth();
  const isAppAdmin = isAppAdminEmail(user?.email);
  const { isAdmin, isModerator } = useRole();
  const queryClient = useQueryClient();

  const numCols = isDesktop ? 3 : 2;
  const colGap = isDesktop ? 20 : 12;

  const [category, setCategory] = useState<CategoryFilter>('All');
  const [search, setSearch] = useState('');

  const city = state.city || '';
  const country = state.country || '';

  const queryKey = useMemo(
    () => ['shopping', city, country, category === 'All' ? undefined : category],
    [city, country, category],
  );

  const {
    data: shops,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<ShopData[]>({
    queryKey,
    queryFn: () =>
      modulesApi.shopping.list({
        city: city || undefined,
        country: country || undefined,
        category: category !== 'All' ? category : undefined,
      }),
  });

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!shops) return [];
    if (!search.trim()) return shops;
    const q = search.trim().toLowerCase();
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q),
    );
  }, [shops, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modulesApi.shopping.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping'] });
    },
  });

  const handleEdit = useCallback((shop: ShopData) => {
    router.push(`/shopping/${shop.id}?edit=1`);
  }, []);

  const handleDelete = useCallback(
    (shop: ShopData) => {
      Alert.alert(
        'Delete shop',
        `Remove "${shop.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(shop.id),
          },
        ],
      );
    },
    [deleteMutation],
  );

  const handleFabPress = useCallback(() => router.push(listingCreateNavigateParams('business') as never), []);

  const locationLabel = city
    ? `${city}${country ? `, ${country}` : ''}`
    : country || 'your area';

  const filtersActive = category !== 'All' || search.trim().length > 0;

  const clearFilters = useCallback(() => {
    setSearch('');
    setCategory('All');
  }, []);

  // ── Manual grid rows (ScrollView + manual layout) ──────────────────────
  const rows = useMemo(() => {
    const result: ShopData[][] = [];
    for (let i = 0; i < filtered.length; i += numCols) {
      result.push(filtered.slice(i, i + numCols));
    }
    return result;
  }, [filtered, numCols]);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>

      {/* ── Header ── */}
      <View
        style={[s.header, { paddingHorizontal: hPad, borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}
      >
        <View style={s.headerContent}>
          <BackButton
            fallback="/(tabs)"
            style={[s.backBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Shopping</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location" size={11} color={CultureTokens.indigo} />
              <Text style={[s.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {locationLabel}
                {!isLoading && filtered.length > 0
                  ? ` · ${filtered.length} found`
                  : ''}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => refetch()}
            style={[s.iconBtn, { backgroundColor: colors.surface + 'B0', borderColor: colors.borderLight }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh shops"
          >
            {isRefetching
              ? <ActivityIndicator size="small" color={CultureTokens.indigo} />
              : <Ionicons name="refresh" size={18} color={colors.text} />}
          </Pressable>
        </View>
      </View>

      {/* ── Centred content shell ── */}
      <View style={[s.shell, isDesktop && s.shellDesktop]}>

        {/* ── Search input ── */}
        <View style={[s.searchWrap, { paddingHorizontal: hPad }]}>
          <View style={[s.searchRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
            <TextInput
              style={[s.searchInput, { color: colors.text }]}
              placeholder="Search shops…"
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Search shops"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Category filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={[s.filterRow, { paddingHorizontal: hPad }]}
        >
          {CATEGORY_OPTIONS.map((c) => {
            const active = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  s.filterChip,
                  {
                    backgroundColor: active ? CultureTokens.indigo : colors.surface,
                    borderColor: active ? CultureTokens.indigo : colors.borderLight,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${c}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.filterChipText, { color: active ? '#fff' : colors.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Shop grid ── */}
        <ScrollView
          style={s.listScroll}
          contentContainerStyle={[s.gridContent, { paddingHorizontal: hPad, paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={CultureTokens.indigo}
            />
          }
        >
          {isLoading ? (
            <View style={[s.gridRow, { gap: colGap }]}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`sk-${i}`} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                  <ShopCardSkeleton colors={colors} />
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Ionicons name="storefront-outline" size={28} color={colors.textTertiary} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No shops found</Text>
              <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                {filtersActive
                  ? 'Try adjusting your search or category filter.'
                  : `No shops yet in ${locationLabel}.`}
              </Text>
              {filtersActive && (
                <Pressable
                  style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                  onPress={clearFilters}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                  <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                </Pressable>
              )}
            </View>
          ) : (
            rows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={[s.gridRow, { gap: colGap }]}>
                {row.map((item) => {
                  const canEdit =
                    !!item &&
                    (item.ownerId === userId || isAdmin || isModerator || isAppAdmin);
                  return (
                    <View key={item.id} style={[s.gridCell, numCols === 3 && s.gridCell3]}>
                      <ShopCard
                        item={item}
                        numCols={numCols}
                        canEdit={canEdit}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
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
                {filtered.length} shop{filtered.length !== 1 ? 's' : ''}
              </Text>
              <View style={[s.endLine, { backgroundColor: colors.divider }]} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── FAB ── */}
      <CreatorFAB
        label="Add Shop"
        icon="storefront-outline"
        onPress={handleFabPress}
      />
    </View>
  );
}

// ─── Export with ErrorBoundary ─────────────────────────────────────────────────

export default function ShoppingPage() {
  return (
    <ErrorBoundary>
      <ShoppingScreen />
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
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden', zIndex: 10,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden', zIndex: 10,
  },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  headerSub: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18, opacity: 0.7 },

  // Shell
  shell: { flex: 1 },
  shellDesktop: { maxWidth: 1200, width: '100%', alignSelf: 'center' as const },

  // Search
  searchWrap: { paddingTop: 14, paddingBottom: 4 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: 15, padding: 0,
    ...(isWeb ? { outlineStyle: 'none' as any } : {}),
  },

  // Category filter
  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18 },

  // Grid
  listScroll: { flex: 1 },
  gridContent: { paddingTop: 8, gap: 16 },
  gridRow: { flexDirection: 'row', width: '100%' },
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
    aspectRatio: 4 / 3,
  },
  poster: { width: '100%', height: '100%' },
  posterPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  openBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  openBadgeText: { fontFamily: FontFamily.semibold, fontSize: 10, color: '#fff', lineHeight: 14 },

  promotedBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  promotedBadgeText: { fontFamily: FontFamily.semibold, fontSize: 10, color: '#fff', lineHeight: 14 },

  // Card body
  cardBody: { padding: 10, gap: 5 },
  shopName: { fontFamily: FontFamily.semibold, fontSize: 14, lineHeight: 20, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 16 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  reviewCount: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16 },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, flex: 1 },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  infoBadgeText: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 14 },

  // Manage actions
  manageRow: {
    flexDirection: 'row', gap: 8, padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  manageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10,
  },
  manageBtnText: { fontFamily: FontFamily.semibold, fontSize: 12 },

  // Skeleton
  posterSkeleton: {
    width: '100%', aspectRatio: 4 / 3,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  skeletonLine: { height: 12, borderRadius: 6 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40, gap: 14 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, marginBottom: 8,
  },
  emptyTitle: { ...TextStyles.title3, lineHeight: 24 },
  emptyDesc: { ...TextStyles.callout, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, marginTop: 12,
  },
  resetBtnText: { ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 19 },

  // Footer
  listFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 40, paddingHorizontal: 20, justifyContent: 'center',
  },
  listFooterText: { ...TextStyles.cardTitle, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 20 },
  endLine: { flex: 1, height: 1, opacity: 0.5 },
});
