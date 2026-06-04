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
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { fetchDailyDealsWithFallback } from '@/lib/cultureShopDeals';
import { useAuth } from '@/lib/auth';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import { Luxe, luxeDark } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { LuxeButton } from '@/design-system/ui/LuxeButton';
import { GlassView } from '@/design-system/ui/GlassView';
import { DailyDealSquareTile } from '@/modules/marketplace/DailyDealSquareTile';
import {
  CultureTokens,
  FontFamily,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import { Radius, Spacing } from '@/design-system/tokens/spacing';
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
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const colors = useColors();
  const isDark = useIsDark();
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
      maxWidth: 880,
      alignSelf: 'center' as const,
    }),
    []
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
        contentContainerStyle={{ paddingBottom: safeInsets.bottom + 40 }}
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
            colors={['#0F0B1A', '#1C162E', '#2B124C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.headerRow, pageCol]}>
            <BackButton fallback="/(tabs)" color="rgba(255,255,255,0.86)" />
            <LuxeText variant="title" style={{ color: '#fff', flex: 1, textAlign: 'center' }}>CultureShop</LuxeText>
            <View style={{ width: 44 }} />
          </View>

          <View style={[styles.heroContent, pageCol]}>
            <LuxeText variant="badgeCaps" style={{ color: CultureTokens.gold }}>MANAGED BY CULTUREPASS</LuxeText>
            <LuxeText variant="displayHero" style={{ color: '#fff', letterSpacing: -1 }}>Daily deals, rewards, and member perks.</LuxeText>
            <LuxeText variant="body" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Curated CulturePass offers in one place. Host products and services live in CultureMarket.
            </LuxeText>
            <View style={styles.ctaRow}>
              <LuxeButton
                variant="filled"
                leftIcon="pricetag-outline"
                onPress={() => router.push('/offers' as Href)}
                style={{ minWidth: 160 }}
              >
                Browse offers
              </LuxeButton>
              <LuxeButton
                variant="glass"
                leftIcon="storefront-outline"
                onPress={() => router.push('/CultureMarket' as Href)}
                style={{ minWidth: 160 }}
              >
                CultureMarket
              </LuxeButton>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: hPad, paddingTop: Spacing.xl }}>
          <View style={pageCol}>
            <GlassView intensity={10} style={styles.architectureCard} contentStyle={{ padding: 20, flexDirection: 'row', gap: 16 }}>
              <View style={[styles.archIcon, { backgroundColor: Luxe.colors.gold + '22' }]}>
                <Ionicons name="sparkles-outline" size={22} color={Luxe.colors.gold} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LuxeText variant="title3" style={{ color: colors.text }}>Curated by CulturePass</LuxeText>
                <LuxeText variant="body" style={{ color: colors.textSecondary, fontSize: 14 }}>
                  Rewards, featured offers, and official campaigns stay here. Host products and services belong in CultureMarket.
                </LuxeText>
              </View>
            </GlassView>

            {canManage ? (
              <View style={styles.manageRow}>
                <LuxeButton
                  variant="tonal"
                  size="sm"
                  leftIcon="create-outline"
                  onPress={() => router.push('/CultureShop/manage' as Href)}
                >
                  Manage deals
                </LuxeButton>
              </View>
            ) : null}

            {dealsQuery.isPending ? (
              <ActivityIndicator style={styles.loader} color={CultureTokens.gold} />
            ) : groupedDeals.length > 0 ? (
              groupedDeals.map(([label, items]) => (
                <View key={label} style={styles.section}>
                  <LuxeText variant="title2" style={{ color: colors.text, marginBottom: Spacing.md }}>{label}</LuxeText>
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
                <LuxeText variant="title3" style={{ color: colors.text }}>No deals today</LuxeText>
                <LuxeText variant="body" style={{ color: colors.textSecondary }}>
                  Check back soon for curated offers.
                </LuxeText>
              </View>
            )}

            <GlassView intensity={20} style={styles.marketBanner}>
              <LinearGradient
                colors={Luxe.gradients.culturepassBrand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 24, gap: 12 }}>
                <LuxeText variant="title2" style={{ color: '#fff' }}>Selling products or services?</LuxeText>
                <LuxeText variant="body" style={{ color: 'rgba(255,255,255,0.86)' }}>
                  Use CultureMarket to post products, offer services, or link your business website.
                </LuxeText>
                <LuxeButton
                    variant="filled"
                    leftIcon="storefront-outline"
                    onPress={() => router.push('/CultureMarket' as Href)}
                    style={{ alignSelf: 'flex-start', marginTop: 8 }}
                >
                    Open CultureMarket
                </LuxeButton>
              </View>
            </GlassView>
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
  hero: { paddingBottom: 64, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  heroContent: { gap: 14 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  architectureCard: { borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  archIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  manageRow: { alignItems: 'flex-start', marginTop: Spacing.md },
  loader: { marginVertical: Spacing.xl * 2 },
  section: { marginTop: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  empty: { alignItems: 'center', paddingVertical: 54, gap: 8 },
  marketBanner: { marginTop: Spacing.xl * 2, borderRadius: 24, overflow: 'hidden' },
});
