/**
 * CultureMarket — cultural marketplace homepage.
 * Hero → brand carousel → category chips → subcategory chips → listings grid
 * → sell CTA → FAQ
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
  TextInput,
  type TextStyle,
} from 'react-native';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { GlassView } from '@/design-system/ui/GlassView';
import { Luxe, luxeDark, LuxeTextStyles } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { LuxeFilterChip } from '@/design-system/ui/LuxeFilterChip';
import {
  CultureTokens,
  FontFamily,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';
import { USE_NATIVE_DRIVER } from '@/design-system/tokens/animations';
import type { ShopListing } from '@/shared/schema';
import { MARKET_CATEGORIES } from '@/shared/schema/cultureShopListing';
import { ShopListingCard } from '@/modules/marketplace/ShopListingCard';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { navigateToCreateById } from '@/lib/creationRouting';

const MARKET_INDEX_TITLE = `CultureMarket · ${APP_NAME}`;
const MARKET_INDEX_DESC =
  'Browse diaspora-friendly products, services, and links from CulturePass hosts — fashion, food, art, skills, and more.';
const MARKET_INDEX_URL = `${SITE_ORIGIN}/CultureMarket`;

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_BG = '#0F0B1A';
const HERO_WORDS = ['Products', 'Services', 'Fashion', 'Food', 'Art', 'Skills'];

const TILE_W = 116;
const TILE_H = 87;
const TILE_GAP = 12;
const TILES_PER_ROW = 8;
const SINGLE_SET_W = TILES_PER_ROW * (TILE_W + TILE_GAP);

const ACCENT_MAP: Record<string, string> = {
  coral:  CultureTokens.coral,
  violet: CultureTokens.violet,
  teal:   CultureTokens.teal,
  gold:   CultureTokens.gold,
};

const FAQ_ITEMS = [
  {
    id: 'q1',
    question: 'What can I list on CultureMarket?',
    answer:
      'Products (ship anywhere), services (in-person or online), or simply list your business with a link to your own website. All listings should relate to cultural, diaspora, or community themes.',
  },
  {
    id: 'q2',
    question: 'How do buyers contact sellers?',
    answer:
      'For products: buyers tap "Buy Now" and are directed to checkout or the seller\'s website. For services: buyers call or email directly from the listing. For link listings: visitors go straight to your website.',
  },
  {
    id: 'q3',
    question: 'Is it free to list?',
    answer:
      'Yes — creating a CultureMarket listing is completely free. CulturePass+ members get featured placement, priority in search results, and promotional badge support.',
  },
  {
    id: 'q4',
    question: 'How do I share my listing?',
    answer:
      'Every listing gets a unique shareable deep link at culturepass.co/CultureMarket/[id] and a short form at culturepass.co/s/[id]. Share on social media, in emails, or embed on your site.',
  },
];

// ─── Rotating hero word ───────────────────────────────────────────────────────

function RotatingWord() {
  const [idx, setIdx] = useState(0);
  const animRef = useRef(new Animated.Value(0));
  const anim = animRef.current;

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(anim, {
        toValue: 1, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        setIdx((i) => (i + 1) % HERO_WORDS.length);
        anim.setValue(-1);
        Animated.timing(anim, {
          toValue: 0, duration: 240, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      });
    }, 2500);
    return () => clearInterval(id);
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [-1, 0, 1], outputRange: [22, 0, -22] });
  const opacity = anim.interpolate({ inputRange: [-1, -0.3, 0, 0.3, 1], outputRange: [0, 1, 1, 1, 0] });

  return (
    <View style={styles.rotatingWrap}>
      <Animated.Text
        style={[
          Luxe.typography.styles.display,
          styles.heroWord,
          { transform: [{ translateY }], opacity }
        ]}
        numberOfLines={1}
      >
        {HERO_WORDS[idx]}
      </Animated.Text>
    </View>
  );
}

// ─── Brand carousel row ───────────────────────────────────────────────────────

type BrandRowData = readonly { id: string; name: string; color: string }[];

async function fetchLiveListings(params?: {
  category?: string;
  type?: string;
  city?: string;
  country?: string;
  limit?: number;
  featured?: boolean;
}): Promise<{ listings: ShopListing[] }> {
  try {
    const res = await api.cultureMarket.getListings(params);
    return { listings: res.listings ?? [] };
  } catch {
    return { listings: [] };
  }
}

function brandRowsFromListings(listings: ShopListing[]): [BrandRowData, BrandRowData] {
  const accents = [
    CultureTokens.coral,
    CultureTokens.violet,
    CultureTokens.teal,
    CultureTokens.indigo,
    CultureTokens.gold,
  ];
  const sellers = new Map<string, { id: string; name: string; color: string }>();

  listings.forEach((listing) => {
    const key = listing.sellerProfileId ?? listing.sellerUserId ?? listing.sellerName;
    if (!key || sellers.has(key)) return;
    const color = ACCENT_MAP[listing.accentKey ?? ''] ?? accents[sellers.size % accents.length];
    sellers.set(key, {
      id: key,
      name: listing.sellerName,
      color,
    });
  });

  const brands = Array.from(sellers.values());
  if (brands.length === 0) return [[], []];

  while (brands.length < TILES_PER_ROW) {
    const source = brands[brands.length % sellers.size];
    brands.push({ ...source, id: `${source.id}-${brands.length}` });
  }

  const row1 = brands.filter((_, index) => index % 2 === 0).slice(0, TILES_PER_ROW);
  const row2 = brands.filter((_, index) => index % 2 === 1).slice(0, TILES_PER_ROW);
  return [
    row1.length ? row1 : brands.slice(0, TILES_PER_ROW),
    row2.length ? row2 : brands.slice(0, TILES_PER_ROW),
  ];
}

function CarouselRow({ brands, reverse }: { brands: BrandRowData; reverse?: boolean }) {
  const anim = useRef(new Animated.Value(reverse ? -SINGLE_SET_W : 0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: reverse ? 0 : -SINGLE_SET_W,
          duration: 22000, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(anim, {
          toValue: reverse ? -SINGLE_SET_W : 0, duration: 0, useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, reverse]);

  const doubled = useMemo(() => [...brands, ...brands], [brands]);

  return (
    <View style={styles.carouselRow}>
      <Animated.View style={[styles.carouselInner, { transform: [{ translateX: anim }] }]}>
        {doubled.map((b, i) => (
          <View key={`${b.id}-${i}`} style={{ marginRight: TILE_GAP }}>
            <View style={styles.brandTile}>
              <LinearGradient
                colors={[b.color + 'DD', b.color + '55']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.brandTileName} numberOfLines={2}>{b.name}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ─── Category chips ───────────────────────────────────────────────────────────

function CategoryChips({
  activeCat,
  onSelect,
  hPad,
}: {
  activeCat: string | null;
  onSelect: (id: string | null) => void;
  hPad: number;
}) {
  const colors = useColors();
  const chipBg = colors.surfaceSecondary;
  const chipBorder = colors.border;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipRow, { paddingHorizontal: hPad }]}
    >
      <LuxeFilterChip
        label="All"
        selected={activeCat == null}
        onPress={() => onSelect(null)}
        icon="apps"
        style={{ marginRight: 8 }}
      />

      {MARKET_CATEGORIES.map((cat) => {
        const isActive = activeCat === cat.id;
        return (
          <LuxeFilterChip
            key={cat.id}
            label={cat.label}
            selected={isActive}
            onPress={() => onSelect(isActive ? null : cat.id)}
            icon={cat.icon as any}
            style={{ marginRight: 8 }}
          />
        );
      })}
    </ScrollView>
  );
}

// ─── Search ────────────────────────────────────────────────────────────────────

type MarketSearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
  hPad: number;
  pageCol: { width: '100%' | number; maxWidth?: number; alignSelf: 'center' | 'stretch' };
};

const MarketSearchBar = React.forwardRef<ComponentRef<typeof TextInput>, MarketSearchBarProps>(
  function MarketSearchBar({ value, onChange, colors, hPad, pageCol }, ref) {
    return (
      <View style={{ paddingHorizontal: hPad, paddingTop: Spacing.md, paddingBottom: 4 }}>
        <View style={pageCol}>
          <View
            style={[
              styles.searchWrap,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChange}
              placeholder="Search by title, seller, or keywords"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Search CultureMarket listings"
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={[
                styles.searchInput,
                { color: colors.text },
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null,
              ]}
            />
            {value.length > 0 ? (
              <Pressable
                onPress={() => onChange('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

function listingsMatchSearch(listing: ShopListing, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  const hay = [
    listing.title,
    listing.sellerName,
    listing.description,
    listing.city ?? '',
    listing.country ?? '',
    listing.subcategory ?? '',
    listing.cultureTag ?? '',
    ...(listing.tags ?? []),
    ...(listing.cultureTags ?? []),
    ...(listing.cityTags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

// ─── Subcategory chips ────────────────────────────────────────────────────────

function SubcategoryChips({
  parentId,
  activeSub,
  onSelect,
  hPad,
}: {
  parentId: string;
  activeSub: string | null;
  onSelect: (id: string | null) => void;
  hPad: number;
}) {
  const cat = MARKET_CATEGORIES.find((c) => c.id === parentId);
  if (!cat || cat.subcategories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chipRow, styles.subChipRow, { paddingHorizontal: hPad }]}
    >
      <LuxeFilterChip
        label={`All ${cat.label}`}
        selected={activeSub == null}
        onPress={() => onSelect(null)}
        compact
        style={{ marginRight: 8 }}
      />
      {cat.subcategories.map((sub) => {
        const isActive = activeSub === sub.id;
        return (
          <LuxeFilterChip
            key={sub.id}
            label={sub.label}
            selected={isActive}
            onPress={() => onSelect(isActive ? null : sub.id)}
            compact
            style={{ marginRight: 8 }}
          />
        );
      })}
    </ScrollView>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={styles.faqItem}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.faqRow}>
        <Text style={styles.faqQ}>{question}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={CultureTokens.teal} />
      </View>
      {open && <Text style={styles.faqA}>{answer}</Text>}
    </Pressable>
  );
}

// ─── Listings grid ────────────────────────────────────────────────────────────

function ListingsGrid({
  listings,
  cardWidth,
  gap,
  onPress,
}: {
  listings: ShopListing[];
  cardWidth: number;
  gap: number;
  onPress: (l: ShopListing) => void;
}) {
  if (!listings.length) return null;
  return (
    <View style={styles.grid}>
      {listings.map((l) => (
        <View key={l.id} style={{ width: cardWidth, marginBottom: gap }}>
          <ShopListingCard
            listing={l}
            width={cardWidth}
            onPress={() => onPress(l)}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  sub,
  count,
  icon,
  accent,
  onMore,
}: {
  title: string;
  sub?: string;
  count?: number;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  onMore?: () => void;
}) {
  const colors = useColors();
  const c = accent ?? colors.text;
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionHeadLeft}>
        {icon && (
          <View style={[styles.sectionIcon, { backgroundColor: c + '18' }]}>
            <Ionicons name={icon} size={16} color={c} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <LuxeText variant="title3" style={{ color: colors.text }}>{title}</LuxeText>
          {sub && <LuxeText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>{sub}</LuxeText>}
        </View>
      </View>
      {onMore && (
        <Pressable
          onPress={onMore}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
        >
          <Text style={[styles.viewMore, { color: CultureTokens.teal }]}>
            View all{count ? ` (${count})` : ''} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function CultureMarketScreenInner() {
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const colors = useColors();
  const { isDesktop, isTablet, hPad, contentWidth, columnGap } = useLayout();
  const { user } = useAuth();
  const city = user?.city?.trim();
  const country = user?.country?.trim();
  const { isModerator, isOrganizer } = useRole();
  const canManage = isModerator || isOrganizer;

  const innerW = useMemo(() => Math.min(920, contentWidth), [contentWidth]);
  const cols = isDesktop ? 4 : isTablet ? 3 : 2;
  const cardW = useMemo(
    () => (innerW - (cols - 1) * columnGap) / cols,
    [cols, columnGap, innerW],
  );

  const pageCol = useMemo(
    () => ({
      width: '100%' as const,
      maxWidth: isDesktop ? 920 : undefined,
      alignSelf: isDesktop ? ('center' as const) : ('stretch' as const),
    }),
    [isDesktop],
  );

  const openHostListingWizard = useCallback(() => {
    navigateToCreateById('market-listing', { source: 'culture_market_index' });
  }, []);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const trimmedSearch = searchQuery.trim();

  const handleCatSelect = useCallback((id: string | null) => {
    setActiveCat(id);
    setActiveSubCat(null);
  }, []);

  const marketScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const searchSectionYRef = useRef(0);

  const scrollToSearchAndFocus = useCallback(() => {
    const y = Math.max(0, searchSectionYRef.current - Spacing.sm);
    marketScrollRef.current?.scrollTo({ y, animated: true });
    const delay = Platform.OS === 'web' ? 380 : Platform.OS === 'ios' ? 460 : 220;
    setTimeout(() => searchInputRef.current?.focus(), delay);
  }, []);

  const allQuery = useQuery({
    queryKey: ['culture-market-listings', activeCat ?? 'all', city ?? '', country ?? ''],
    queryFn: () =>
      fetchLiveListings({
        category: activeCat ?? undefined,
        city: city || undefined,
        country: country || undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const featuredQuery = useQuery({
    queryKey: ['culture-market-listings-featured'],
    queryFn: () => fetchLiveListings({ featured: true, limit: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const allListings = useMemo(() => allQuery.data?.listings ?? [], [allQuery.data?.listings]);
  const featured = useMemo(() => featuredQuery.data?.listings ?? [], [featuredQuery.data?.listings]);
  const carouselListings = featured.length > 0 ? featured : allListings;
  const [brandRow1, brandRow2] = useMemo(
    () => brandRowsFromListings(carouselListings),
    [carouselListings],
  );

  const searchFiltered = useMemo(
    () => allListings.filter((l) => listingsMatchSearch(l, trimmedSearch)),
    [allListings, trimmedSearch],
  );

  const featuredFiltered = useMemo(
    () => featured.filter((l) => listingsMatchSearch(l, trimmedSearch)),
    [featured, trimmedSearch],
  );

  // Client-side subcategory filter (after search)
  const listings = useMemo(
    () =>
      activeSubCat
        ? searchFiltered.filter((l) => l.subcategory === activeSubCat)
        : searchFiltered,
    [searchFiltered, activeSubCat],
  );

  const onRefresh = useCallback(() => {
    void allQuery.refetch();
    void featuredQuery.refetch();
  }, [allQuery, featuredQuery]);

  const openListing = useCallback((l: ShopListing) => {
    router.push(`/CultureMarket/${l.id}` as never);
  }, []);

  // Group search-filtered listings by parent category (used when no filter active)
  const byCategory = useMemo(() => {
    const map = new Map<string, ShopListing[]>();
    for (const l of searchFiltered) {
      const arr = map.get(l.category) ?? [];
      arr.push(l);
      map.set(l.category, arr);
    }
    return map;
  }, [searchFiltered]);

  const mainListingsLoading = allQuery.isPending && allListings.length === 0;
  const featuredLoading = featuredQuery.isPending && featured.length === 0;
  const hasAnyListings = allListings.length > 0;
  const searchHasNoMatches =
    Boolean(trimmedSearch) && searchFiltered.length === 0 && hasAnyListings && !mainListingsLoading;

  const activeCatMeta = activeCat
    ? MARKET_CATEGORIES.find((c) => c.id === activeCat)
    : null;
  const activeAccent = activeCatMeta
    ? (ACCENT_MAP[activeCatMeta.accentKey] ?? CultureTokens.violet)
    : CultureTokens.violet;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Head>
        <title>{MARKET_INDEX_TITLE}</title>
        <meta name="description" content={MARKET_INDEX_DESC} />
        <meta property="og:title" content={MARKET_INDEX_TITLE} />
        <meta property="og:description" content={MARKET_INDEX_DESC} />
        <meta property="og:url" content={MARKET_INDEX_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={MARKET_INDEX_URL} />
        {Platform.OS === 'web' ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: MARKET_INDEX_TITLE,
                description: MARKET_INDEX_DESC,
                url: MARKET_INDEX_URL,
              }),
            }}
          />
        ) : null}
      </Head>
      <ScrollView
        ref={marketScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safeInsets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={allQuery.isFetching || featuredQuery.isFetching}
            onRefresh={onRefresh}
            tintColor={CultureTokens.coral}
          />
        }
      >
        <View collapsable={false}>
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingHorizontal: hPad }]}>
          <LinearGradient
            colors={[HERO_BG, '#1C162E', '#0A0812']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={[CultureTokens.violet + '44', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Nav row */}
          <View style={[styles.headerRow, { paddingTop: topInset + Spacing.sm }, pageCol]}>
            <BackButton fallback="/(tabs)" color="rgba(255,255,255,0.85)" />
            <Text style={styles.headerTitle}>CultureMarket</Text>
            {canManage ? (
              <Pressable
                onPress={openHostListingWizard}
                style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityLabel="Create CultureMarket listing"
              >
                <GlassView style={styles.iconGlass}>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                </GlassView>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Hero copy */}
          <View style={[styles.heroContent, pageCol]}>
            <LuxeText variant="badgeCaps" style={styles.heroEyebrow}>MARKETPLACE · {APP_NAME}</LuxeText>
            <View style={styles.heroTitleRow}>
              <LuxeText variant="displayHero" style={styles.heroStatic}>Discover{' '}</LuxeText>
              <RotatingWord />
            </View>
            <LuxeText variant="body" style={styles.heroSub}>
              {city && country
                ? `Cultural shops and services in ${city}, ${country} — plus online listings.`
                : city
                  ? `Cultural businesses in ${city} — products, services, and listings.`
                  : 'Browse products, services, and business links from CulturePass hosts.'}
            </LuxeText>
            <View style={styles.heroCtas}>
              <LuxeButton
                variant="filled"
                leftIcon="add-circle-outline"
                onPress={openHostListingWizard}
                style={{ minWidth: 180 }}
              >
                List your business
              </LuxeButton>
              <LuxeButton
                variant="tonal"
                onPress={() => handleCatSelect(null)}
                style={{ minWidth: 120 }}
              >
                Browse all
              </LuxeButton>
              <LuxeButton
                variant="glass"
                leftIcon="search-outline"
                onPress={scrollToSearchAndFocus}
                style={{ minWidth: 120 }}
              >
                Search
              </LuxeButton>
            </View>
          </View>
        </View>

        {/* ── Seller carousel ─────────────────────────────────────────── */}
        {brandRow1.length > 0 || brandRow2.length > 0 ? (
          <View style={[styles.carouselSection, { backgroundColor: colors.background }]}>
            <View style={styles.carouselClip}>
              {brandRow1.length > 0 ? <CarouselRow brands={brandRow1} /> : null}
              {brandRow2.length > 0 ? <CarouselRow brands={brandRow2} reverse /> : null}
            </View>
          </View>
        ) : null}

        {/* ── Category chips ──────────────────────────────────────────── */}
        <CategoryChips activeCat={activeCat} onSelect={handleCatSelect} hPad={hPad} />

        {/* ── Subcategory chips (shown when parent has subs) ───────────── */}
        {activeCat ? (
          <SubcategoryChips
            parentId={activeCat}
            activeSub={activeSubCat}
            onSelect={setActiveSubCat}
            hPad={hPad}
          />
        ) : null}

        {/* ── Search ───────────────────────────────────────────────────── */}
        <View
          collapsable={false}
          onLayout={(e) => {
            searchSectionYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <MarketSearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            colors={colors}
            hPad={hPad}
            pageCol={pageCol}
          />
        </View>

        {/* ── Listings content ─────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: hPad, paddingTop: Spacing.sm }}>
          <View style={pageCol}>
            {searchHasNoMatches ? (
              <View
                style={[
                  styles.searchEmpty,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <Ionicons name="search-outline" size={28} color={CultureTokens.violet} />
                <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
                  No listings match your search
                </Text>
                <Text style={[styles.searchEmptySub, { color: colors.textSecondary }]}>
                  Try another keyword, or clear filters to see everything in this view.
                </Text>
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={({ pressed }) => [
                    styles.searchEmptyClear,
                    { borderColor: CultureTokens.violet, opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.searchEmptyClearText, { color: CultureTokens.violet }]}>
                    Clear search
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!searchHasNoMatches && mainListingsLoading ? (
              <ActivityIndicator style={styles.loader} color={CultureTokens.violet} />
            ) : null}

            {!searchHasNoMatches && !mainListingsLoading ? (
              <>
                {/* ── Filtered view (category/subcategory selected) ─────── */}
                {activeCat ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title={activeCatMeta?.label ?? activeCat}
                      sub={
                        activeSubCat
                          ? activeCatMeta?.subcategories.find((s) => s.id === activeSubCat)?.label
                          : trimmedSearch
                            ? `Matches for “${trimmedSearch}”`
                            : undefined
                      }
                      count={listings.length}
                      icon={activeCatMeta?.icon as any}
                      accent={activeAccent}
                    />
                    {listings.length === 0 ? (
                      <View style={styles.emptyBox}>
                        <View style={[styles.emptyIconBox, { backgroundColor: activeAccent + '18' }]}>
                          <Ionicons name="storefront-outline" size={32} color={activeAccent} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                          {trimmedSearch ? 'No matches in this category' : 'No listings yet'}
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          {trimmedSearch
                            ? 'Try a different search or pick another category.'
                            : `Be the first to list in ${activeCatMeta?.label ?? activeCat}`}
                        </Text>
                        <Pressable
                          onPress={openHostListingWizard}
                          style={({ pressed }) => [
                            styles.emptyBtn,
                            {
                              borderColor: activeAccent,
                              opacity: pressed ? 0.8 : 1,
                            },
                          ]}
                          accessibilityRole="button"
                        >
                          <Ionicons name="add-circle-outline" size={16} color={activeAccent} />
                          <Text style={[styles.emptyBtnText, { color: activeAccent }]}>
                            Create a listing
                          </Text>
                        </Pressable>
                      </View>
                    ) : (
                      <ListingsGrid
                        listings={listings}
                        cardWidth={cardW}
                        gap={columnGap}
                        onPress={openListing}
                      />
                    )}
                  </View>
                ) : (
                  <>
                    {/* ── Featured ──────────────────────────────────────── */}
                    {featuredLoading ? (
                      <ActivityIndicator style={styles.loader} color={CultureTokens.gold} />
                    ) : null}
                    {!featuredLoading && featuredFiltered.length > 0 ? (
                      <View style={styles.section}>
                        <SectionHeader
                          title="Featured listings"
                          sub={
                            trimmedSearch
                              ? `Matches for “${trimmedSearch}”`
                              : 'Hand-picked from cultural businesses near you'
                          }
                          icon="star-outline"
                          accent={CultureTokens.gold}
                        />
                        <ListingsGrid
                          listings={featuredFiltered.slice(0, cols * 2)}
                          cardWidth={cardW}
                          gap={columnGap}
                          onPress={openListing}
                        />
                      </View>
                    ) : null}

                    {/* ── Category sections ─────────────────────────────── */}
                    {MARKET_CATEGORIES.map((cat) => {
                      const catListings = byCategory.get(cat.id) ?? [];
                      if (!catListings.length) return null;
                      const accent = ACCENT_MAP[cat.accentKey] ?? CultureTokens.violet;
                      return (
                        <View key={cat.id} style={styles.section}>
                          <SectionHeader
                            title={cat.label}
                            count={catListings.length}
                            icon={cat.icon as any}
                            accent={accent}
                            onMore={
                              catListings.length > cols
                                ? () => handleCatSelect(cat.id)
                                : undefined
                            }
                          />
                          <ListingsGrid
                            listings={catListings.slice(0, cols)}
                            cardWidth={cardW}
                            gap={columnGap}
                            onPress={openListing}
                          />
                        </View>
                      );
                    })}

                    {/* ── Empty state when no listings at all ─────────── */}
                    {allListings.length === 0 && !mainListingsLoading && (
                      <View style={styles.emptyBox}>
                        <View style={[styles.emptyIconBox, { backgroundColor: CultureTokens.violet + '18' }]}>
                          <Ionicons name="storefront-outline" size={36} color={CultureTokens.violet} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                          CultureMarket is warming up
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          Be the first cultural business to list here.
                        </Text>
                        <Pressable
                          onPress={openHostListingWizard}
                          style={({ pressed }) => [
                            styles.emptyBtn,
                            { borderColor: CultureTokens.violet, opacity: pressed ? 0.8 : 1 },
                          ]}
                          accessibilityRole="button"
                        >
                          <Ionicons name="add-circle-outline" size={16} color={CultureTokens.violet} />
                          <Text style={[styles.emptyBtnText, { color: CultureTokens.violet }]}>
                            Create the first listing
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </>
            ) : null}
          </View>
        </View>

        {/* ── Sell on CultureMarket banner ──────────────────────────────── */}
        <View style={[styles.sellBanner, { marginTop: Spacing.xl * 2 }]}>
          <LinearGradient
            colors={[CultureTokens.violet, '#130C2A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.sellContent, { paddingHorizontal: hPad }]}>
            <View style={pageCol}>
              <View style={styles.sellIconRow}>
                {[
                  { icon: 'storefront' as const, color: CultureTokens.coral },
                  { icon: 'briefcase' as const, color: CultureTokens.teal },
                  { icon: 'globe' as const, color: CultureTokens.gold },
                ].map((opt) => (
                  <View
                    key={opt.icon}
                    style={[styles.sellIconBox, { backgroundColor: opt.color + '33' }]}
                  >
                    <Ionicons name={opt.icon} size={26} color={opt.color} />
                  </View>
                ))}
              </View>
              <Text style={styles.sellTitle}>
                Sell, offer services,{'\n'}or link your site
              </Text>
              <Text style={styles.sellSub}>
                List a product for sale, offer a bookable service, or simply add your business with a
                link to your own website. Free for all CulturePass members.
              </Text>
              <View style={styles.sellOptionsRow}>
                {[
                  { icon: 'cube-outline' as const, label: 'Sell a product' },
                  { icon: 'briefcase-outline' as const, label: 'Offer a service' },
                  { icon: 'open-outline' as const, label: 'Link your site' },
                ].map((opt) => (
                  <View key={opt.label} style={styles.sellOption}>
                    <Ionicons name={opt.icon} size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.sellOptionText}>{opt.label}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={openHostListingWizard}
                style={({ pressed }) => [styles.sellCta, { opacity: pressed ? 0.88 : 1 }]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[CultureTokens.coral, '#CC237F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={styles.sellCtaText}>List on CultureMarket — free</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <View style={[styles.faqSection, { paddingHorizontal: hPad }]}>
          <View style={pageCol}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.id} question={item.question} answer={item.answer} />
            ))}
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={[styles.footer, { paddingHorizontal: hPad }]}>
          <View style={pageCol}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              CultureMarket is part of CulturePass — the cultural lifestyle platform for diaspora
              communities.
            </Text>
          </View>
        </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: { backgroundColor: HERO_BG, paddingBottom: 64 },
  heroGradient: { ...StyleSheet.absoluteFill },
  heroNoise: { ...StyleSheet.absoluteFill, opacity: 0.03 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconGlass: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { paddingTop: Spacing.md },
  heroEyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    letterSpacing: 1.8,
    color: CultureTokens.coral,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  heroStatic: {
    color: '#fff',
    letterSpacing: -1,
  },
  rotatingWrap: {
    height: Platform.OS === 'web' ? 60 : 48,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroWord: {
    color: CultureTokens.coral,
    letterSpacing: -1,
  },
  heroSub: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 18,
    maxWidth: 560,
  },
  heroCtas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  heroBtn: {
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 6,
    minWidth: 140,
  },
  heroBtnFill: {},
  heroBtnFillText: { fontFamily: FontFamily.semibold, fontSize: 15, color: '#fff', letterSpacing: 0.1 },
  heroBtnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  heroBtnOutlineText: { fontFamily: FontFamily.semibold, fontSize: 15, color: 'rgba(255,255,255,0.82)' },

  // Carousel
  carouselSection: { paddingTop: 16, paddingBottom: 4 },
  carouselClip: { overflow: 'hidden' },
  carouselRow: { height: TILE_H + 8, overflow: 'hidden', marginBottom: 6 },
  carouselInner: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  brandTile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: Radius.md,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'flex-end',
  },
  brandTileName:
    Platform.OS === 'web'
      ? ({
          fontFamily: FontFamily.semibold,
          fontSize: 11,
          color: '#fff',
          lineHeight: 14,
          padding: 8,
          paddingTop: 4,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        } as TextStyle)
      : ({
          fontFamily: FontFamily.semibold,
          fontSize: 11,
          color: '#fff',
          lineHeight: 14,
          padding: 8,
          paddingTop: 4,
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        } as TextStyle),

  // Category chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  subChipRow: { paddingTop: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chipActiveViolet: {
    borderColor: CultureTokens.violet,
    backgroundColor: CultureTokens.violet + '12',
    shadowColor: CultureTokens.violet,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  chipLabel: { fontFamily: FontFamily.semibold, fontSize: 13 },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  subChipLabel: { fontFamily: FontFamily.medium, fontSize: 12 },

  // Content
  section: { marginTop: Spacing.xl },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: 8,
  },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: Platform.OS === 'web' ? 20 : 18, letterSpacing: -0.3 },
  sectionSub: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 18, marginTop: 2 },
  viewMore: { fontFamily: FontFamily.semibold, fontSize: 13, flexShrink: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between' },
  loader: { marginVertical: Spacing.xl * 2, alignSelf: 'center' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    paddingVertical: Platform.OS === 'web' ? 4 : 0,
    minHeight: 36,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 10,
    marginBottom: Spacing.md,
  },
  searchEmptyTitle: { fontFamily: FontFamily.bold, fontSize: 17, textAlign: 'center' },
  searchEmptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 340,
  },
  searchEmptyClear: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  searchEmptyClearText: { fontFamily: FontFamily.semibold, fontSize: 14 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: 18, letterSpacing: -0.3 },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: FontFamily.semibold, fontSize: 14 },

  // Sell banner
  sellBanner: { overflow: 'hidden' },
  sellContent: { paddingTop: 44, paddingBottom: 56 },
  sellIconRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  sellIconBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 32 : 26,
    color: '#fff',
    lineHeight: Platform.OS === 'web' ? 40 : 32,
    letterSpacing: -0.5,
    maxWidth: 440,
  },
  sellSub: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    lineHeight: 22,
    maxWidth: 480,
  },
  sellOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 18, marginBottom: 4 },
  sellOption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellOptionText: { fontFamily: FontFamily.semibold, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  sellCta: {
    marginTop: 22,
    height: 52,
    borderRadius: 999,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 8,
    minWidth: 220,
  },
  sellCtaText: { fontFamily: FontFamily.semibold, fontSize: 15, color: '#fff' },

  // FAQ
  faqSection: { backgroundColor: '#1A1624', paddingTop: 40, paddingBottom: 48, marginTop: 0 },
  faqTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 22 : 20,
    color: '#fff',
    marginBottom: 22,
    letterSpacing: -0.3,
  },
  faqItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 16,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQ: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    color: CultureTokens.teal,
    flex: 1,
    lineHeight: 22,
  },
  faqA: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 22,
    marginTop: 10,
  },

  // Footer
  footer: { backgroundColor: '#1A1624', paddingTop: 4, paddingBottom: 28 },
  footerText: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18, maxWidth: 520 },
});

export default function CultureMarketScreen() {
  return (
    <ErrorBoundary>
      <CultureMarketScreenInner />
    </ErrorBoundary>
  );
}
