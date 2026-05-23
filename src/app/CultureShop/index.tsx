/**
 * CultureShop — CulturePass-managed daily deals and member offers.
 *
 * CultureMarket is the host marketplace for third-party products/services.
 * CultureShop is the curated CulturePass storefront for rewards, perks, and
 * featured campaigns managed by CulturePass.
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, type Href } from 'expo-router';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { fetchDailyDealsWithFallback } from '@/lib/cultureShopDeals';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { Button } from '@/design-system/ui/Button';
import { DailyDealSquareTile } from '@/modules/marketplace/DailyDealSquareTile';
import {
  CultureTokens,
  FontFamily,
  Radius,
  Spacing,
  SignatureGradient,
  TextStyles,
} from '@/design-system/tokens/theme';
import type { DailyDeal } from '@/shared/schema';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

const SHOP_INDEX_TITLE = `CultureShop · Deals & perks · ${APP_NAME}`;
const SHOP_INDEX_DESC =
  'Curated CulturePass daily deals, rewards, and member-only offers — official campaigns managed by CulturePass.';
const SHOP_INDEX_URL = `${SITE_ORIGIN}/CultureShop`;

function dealGroupLabel(deal: DailyDeal): string {
  if (deal.kind === 'reward') return 'Rewards';
  if (deal.kind === 'offer') return 'Member offers';
  return 'Featured by CulturePass';
}

function CultureShopScreenInner() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const colors = useColors();
  const { hPad, contentWidth, columnGap, isDesktop, isTablet } = useLayout();
  const { user } = useAuth();
  const { isModerator, isOrganizer } = useRole();
  const canManage = isModerator || isOrganizer;
  const isPlus = user?.subscriptionTier === 'plus' || user?.subscriptionTier === 'elite';

  const innerW = Math.min(880, contentWidth);
  const cols = isDesktop ? 4 : isTablet ? 3 : 2;
  const tileW = useMemo(
    () => (innerW - (cols - 1) * columnGap) / cols,
    [cols, columnGap, innerW],
  );

  const pageCol = useMemo(
    () => ({
      width: '100%' as const,
      maxWidth: isDesktop ? 880 : undefined,
      alignSelf: isDesktop ? ('center' as const) : ('stretch' as const),
    }),
    [isDesktop],
  );

  const dealsQuery = useQuery({
    queryKey: ['culture-shop-daily-deals'],
    queryFn: fetchDailyDealsWithFallback,
    staleTime: 2 * 60 * 1000,
  });

  const deals = useMemo(() => dealsQuery.data?.deals ?? [], [dealsQuery.data?.deals]);
  const groupedDeals = useMemo(() => {
    const groups = new Map<string, DailyDeal[]>();
    for (const deal of deals) {
      const label = dealGroupLabel(deal);
      groups.set(label, [...(groups.get(label) ?? []), deal]);
    }
    return [...groups.entries()];
  }, [deals]);

  const openDeal = useCallback(
    (deal: DailyDeal) => {
      if (deal.linkPolicy === 'premium_required' && !isPlus) {
        router.push('/membership/upgrade' as Href);
        return;
      }
      router.push(deal.href as Href);
    },
    [isPlus],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Head>
        <title>{SHOP_INDEX_TITLE}</title>
        <meta name="description" content={SHOP_INDEX_DESC} />
        <meta property="og:title" content={SHOP_INDEX_TITLE} />
        <meta property="og:description" content={SHOP_INDEX_DESC} />
        <meta property="og:url" content={SHOP_INDEX_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={SHOP_INDEX_URL} />
      </Head>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={dealsQuery.isFetching}
            onRefresh={() => void dealsQuery.refetch()}
            tintColor={CultureTokens.gold}
          />
        }
      >
        <View style={[styles.hero, { paddingTop: topInset + Spacing.sm, paddingHorizontal: hPad }]}>
          <LinearGradient
            colors={['#151127', '#211043']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.headerRow, pageCol]}>
            <BackButton fallback="/(tabs)" color="rgba(255,255,255,0.86)" />
            <Text style={styles.headerTitle}>CultureShop</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={[styles.heroContent, pageCol]}>
            <Text style={styles.eyebrow}>MANAGED BY CULTUREPASS</Text>
            <Text style={styles.title}>Daily deals, rewards, and member perks.</Text>
            <Text style={styles.subtitle}>
              Curated CulturePass offers in one place. Products and services from hosts now live in CultureMarket.
            </Text>
            <View style={styles.ctaRow}>
              <Button
                variant="gradient"
                leftIcon="pricetag-outline"
                onPress={() => router.push('/offers' as Href)}
              >
                Browse offers
              </Button>
              <Button
                variant="outline"
                leftIcon="storefront-outline"
                onPress={() => router.push('/CultureMarket' as Href)}
              >
                CultureMarket
              </Button>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: hPad, paddingTop: Spacing.xl }}>
          <View style={pageCol}>
            <View style={[styles.architectureCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <View style={[styles.archIcon, { backgroundColor: CultureTokens.gold + '22' }]}>
                <Ionicons name="sparkles-outline" size={22} color={CultureTokens.gold} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.archTitle, { color: colors.text }]}>CultureShop is curated by CulturePass</Text>
                <Text style={[styles.archText, { color: colors.textSecondary }]}>
                  Rewards, featured offers, and official campaigns stay here. Host posts, product sales,
                  services, and website listings belong in CultureMarket.
                </Text>
              </View>
            </View>

            {canManage ? (
              <View style={styles.manageRow}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon="create-outline"
                  onPress={() => router.push('/CultureShop/manage' as Href)}
                >
                  Manage CultureShop deals
                </Button>
              </View>
            ) : null}

            {dealsQuery.isPending ? (
              <ActivityIndicator style={styles.loader} color={CultureTokens.gold} />
            ) : groupedDeals.length > 0 ? (
              groupedDeals.map(([label, items]) => (
                <View key={label} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{label}</Text>
                  <View style={[styles.grid, { gap: columnGap }]}>
                    {items.map((deal) => (
                      <View key={deal.id} style={{ width: tileW }}>
                        <DailyDealSquareTile
                          deal={deal}
                          size={tileW}
                          isPlus={isPlus}
                          onPress={() => openDeal(deal)}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="pricetag-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No CultureShop deals today</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Check back soon for CulturePass-managed offers.
                </Text>
              </View>
            )}

            <View style={[styles.marketBanner, { borderColor: colors.borderLight }]}>
              <LinearGradient
                colors={SignatureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.marketTitle}>Selling products or services?</Text>
              <Text style={styles.marketText}>
                Use CultureMarket through Hostspace to post products, offer services, or link your business website.
              </Text>
              <Button
                variant="secondary"
                leftIcon="storefront-outline"
                onPress={() => router.push('/CultureMarket' as Href)}
              >
                Open CultureMarket
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function CultureShopScreen() {
  return (
    <ErrorBoundary>
      <CultureShopScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingBottom: 42,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  heroContent: { gap: 14 },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: CultureTokens.gold,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 44 : 34,
    lineHeight: Platform.OS === 'web' ? 52 : 42,
    color: '#fff',
    maxWidth: 680,
  },
  subtitle: {
    ...TextStyles.body,
    color: 'rgba(255,255,255,0.72)',
    maxWidth: 600,
    lineHeight: 23,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  architectureCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  archIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    marginBottom: 4,
  },
  archText: {
    ...TextStyles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  manageRow: {
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  loader: { marginVertical: Spacing.xl * 2 },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: Platform.OS === 'web' ? 22 : 20,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 54,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
  },
  emptyText: {
    ...TextStyles.body,
    textAlign: 'center',
  },
  marketBanner: {
    marginTop: Spacing.xl * 2,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
    gap: 10,
  },
  marketTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#fff',
  },
  marketText: {
    ...TextStyles.body,
    color: 'rgba(255,255,255,0.86)',
    maxWidth: 560,
    lineHeight: 22,
  },
});
