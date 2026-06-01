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
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { CreatorFAB } from '@/design-system/ui/CreatorActions';
import { Skeleton } from '@/design-system/ui/Skeleton';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { TextStyles } from '@/design-system/tokens/typography';
import { useRole } from '@/hooks/useRole';
import { listingCreateNavigateParams } from '@/constants/navigation/experienceNav';
import type { RestaurantData } from '@/shared/schema/restaurant';

const isWeb = Platform.OS === 'web';

// ─── Cuisine filter options ───────────────────────────────────────────────────

const CUISINE_OPTIONS = [
  'All', 'Indian', 'Chinese', 'Italian', 'Japanese', 'Thai',
  'Middle Eastern', 'Korean', 'Vietnamese', 'Mexican', 'Greek',
  'Lebanese', 'African', 'Sri Lankan', 'Filipino',
] as const;

type CuisineFilter = (typeof CUISINE_OPTIONS)[number];

// ─── Skeleton card ────────────────────────────────────────────────────────────

function RestaurantCardSkeleton({ isDesktop }: { isDesktop: boolean }) {
  const colors = useColors();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }, !isDesktop && s.cardMobile]}>
      <Skeleton width={isDesktop ? 160 : 120} height={isDesktop ? '100%' as any : 120} borderRadius={0} />
      <View style={s.cardInfo}>
        <Skeleton width="80%" height={16} borderRadius={6} />
        <Skeleton width="50%" height={12} borderRadius={5} style={{ marginTop: 8 }} />
        <Skeleton width="40%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
        <Skeleton width="60%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
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

// ─── Single restaurant card ───────────────────────────────────────────────────

const RestaurantCard = React.memo(function RestaurantCard({
  item,
  isDesktop,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: RestaurantData;
  isDesktop: boolean;
  canEdit: boolean;
  onEdit: (r: RestaurantData) => void;
  onDelete: (r: RestaurantData) => void;
}) {
  const colors = useColors();

  return (
    <View style={isDesktop ? s.gridCard : undefined}>
      <Pressable
        style={({ pressed }) => [
          s.card,
          { backgroundColor: colors.surface, borderColor: colors.borderLight, opacity: pressed ? 0.85 : 1 },
          !isDesktop && s.cardMobile,
        ]}
        onPress={() => router.push(`/restaurants/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}`}
      >
        {/* Image */}
        <View style={[s.cardImageWrap, !isDesktop && s.cardImageWrapMobile]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={s.cardImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.cardImagePlaceholder, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
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
        <View style={s.cardInfo}>
          <Text style={[s.cardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>

          <View style={s.metaRow}>
            <View style={[s.cuisineBadge, { backgroundColor: CultureTokens.indigo + '14' }]}>
              <Text style={[s.cuisineBadgeText, { color: CultureTokens.indigo }]}>{item.cuisine}</Text>
            </View>
            <Text style={[s.priceRange, { color: colors.textSecondary }]}>{item.priceRange}</Text>
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

          {/* Admin/owner actions */}
          {canEdit && (
            <View style={s.actionRow}>
              <Pressable
                onPress={() => onEdit(item)}
                style={[s.actionBtn, { backgroundColor: CultureTokens.indigo + '14' }]}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.name}`}
              >
                <Ionicons name="create-outline" size={14} color={CultureTokens.indigo} />
                <Text style={[s.actionBtnText, { color: CultureTokens.indigo }]}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => onDelete(item)}
                style={[s.actionBtn, { backgroundColor: CultureTokens.coral + '14' }]}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Ionicons name="trash-outline" size={14} color={CultureTokens.coral} />
                <Text style={[s.actionBtnText, { color: CultureTokens.coral }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

function RestaurantsScreen() {
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

  const [cuisine, setCuisine] = useState<CuisineFilter>('All');
  const [search, setSearch] = useState('');

  const queryKey = useMemo(
    () => ['restaurants', state.city, state.country, cuisine === 'All' ? undefined : cuisine],
    [state.city, state.country, cuisine],
  );

  const {
    data: restaurants,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<RestaurantData[]>({
    queryKey,
    queryFn: () =>
      modulesApi.restaurants.list({
        city: state.city || undefined,
        country: state.country || undefined,
        cuisine: cuisine !== 'All' ? cuisine : undefined,
      }),
  });

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!restaurants) return [];
    if (!search.trim()) return restaurants;
    const q = search.trim().toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q),
    );
  }, [restaurants, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modulesApi.restaurants.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  const handleEdit = useCallback((r: RestaurantData) => {
    router.push(`/restaurants/${r.id}?edit=1`);
  }, []);

  const handleDelete = useCallback(
    (r: RestaurantData) => {
      Alert.alert(
        'Delete restaurant',
        `Remove "${r.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(r.id),
          },
        ],
      );
    },
    [deleteMutation],
  );

  const handleFabPress = useCallback(() => router.push(listingCreateNavigateParams('restaurant') as never), []);

  const locationLabel = state.city
    ? `${state.city}${state.country ? `, ${state.country}` : ''}`
    : state.country || 'your area';

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
            <Text style={[s.headerTitle, { color: colors.text }]}>Restaurants</Text>
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
            accessibilityLabel="Refresh restaurants"
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
              placeholder="Search restaurants…"
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              accessibilityLabel="Search restaurants"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Cuisine filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={[s.filterRow, { paddingHorizontal: hPad }]}
        >
          {CUISINE_OPTIONS.map((c) => {
            const active = cuisine === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCuisine(c)}
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

        {/* ── Restaurant list ── */}
        <ScrollView
          style={s.listScroll}
          contentContainerStyle={[
            s.list,
            { paddingHorizontal: hPad, paddingBottom: bottomInset + 100 },
            isDesktop && s.listDesktop,
          ]}
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
            <View style={isDesktop ? s.grid : undefined}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={`sk-${i}`} style={isDesktop ? s.gridCard : undefined}>
                  <RestaurantCardSkeleton isDesktop={isDesktop} />
                </View>
              ))}
            </View>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
                <Ionicons name="restaurant-outline" size={28} color={colors.textTertiary} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No restaurants found</Text>
              <Text style={[s.emptyDesc, { color: colors.textSecondary }]}>
                {search.trim() || cuisine !== 'All'
                  ? 'Try adjusting your search or filters.'
                  : `No restaurants yet in ${locationLabel}.`}
              </Text>
              {(search.trim() || cuisine !== 'All') && (
                <Pressable
                  style={[s.resetBtn, { backgroundColor: CultureTokens.indigo + '14', borderColor: CultureTokens.indigo + '40' }]}
                  onPress={() => { setSearch(''); setCuisine('All'); }}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh-outline" size={14} color={CultureTokens.indigo} />
                  <Text style={[s.resetBtnText, { color: CultureTokens.indigo }]}>Reset filters</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={isDesktop ? s.grid : undefined}>
              {filtered.map((item) => {
                const canEdit =
                  !!item &&
                  (item.ownerId === userId || isAdmin || isModerator || isAppAdmin);
                return (
                  <RestaurantCard
                    key={item.id}
                    item={item}
                    isDesktop={isDesktop}
                    canEdit={canEdit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                );
              })}
            </View>
          )}

          {/* Footer count */}
          {!isLoading && filtered.length > 0 && (
            <View style={s.listFooter}>
              <View style={[s.endLine, { backgroundColor: colors.divider }]} />
              <Text style={[s.listFooterText, { color: colors.textTertiary }]}>
                {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}
              </Text>
              <View style={[s.endLine, { backgroundColor: colors.divider }]} />
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── FAB ── */}
      <CreatorFAB
        label="Add Restaurant"
        icon="restaurant-outline"
        onPress={handleFabPress}
      />
    </View>
  );
}

// ─── Export with ErrorBoundary ─────────────────────────────────────────────────

export default function RestaurantsPage() {
  return (
    <ErrorBoundary>
      <RestaurantsScreen />
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
  searchWrap: { paddingTop: 14, paddingBottom: 6 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 44, borderRadius: 12, borderWidth: 1,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.regular, fontSize: 15,
    ...(isWeb ? { outlineStyle: 'none' as any } : {}),
  },

  // Cuisine filter
  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18 },

  // List / grid
  listScroll: { flex: 1 },
  list: { paddingTop: 12, gap: 14 },
  listDesktop: {},
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: { width: '48.5%' as any },

  // Card
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardMobile: { flexDirection: 'row' },

  cardImageWrap: { width: 160, minHeight: 160, position: 'relative' },
  cardImageWrapMobile: { width: 120, minHeight: 120 },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },

  openBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  openBadgeText: { fontFamily: FontFamily.semibold, fontSize: 10, color: '#fff', lineHeight: 14 },

  promotedBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
  },
  promotedBadgeText: { fontFamily: FontFamily.semibold, fontSize: 10, color: '#fff', lineHeight: 14 },

  // Card info
  cardInfo: { flex: 1, padding: 14, gap: 6, justifyContent: 'center' },
  cardName: { ...TextStyles.cardTitle, fontSize: 16, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cuisineBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cuisineBadgeText: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 16 },
  priceRange: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 18, letterSpacing: 0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  reviewCount: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 16, flex: 1 },

  // Admin actions
  actionRow: {
    flexDirection: 'row', gap: 8, marginTop: 6, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.06)',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  actionBtnText: { fontFamily: FontFamily.semibold, fontSize: 12 },

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
