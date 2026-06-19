import React, { useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import hostPricing from '@/data/static/hostPricing.json';
import { useColors } from '@/hooks/useColors';
import { CultureTokens, gradients, type ColorTheme } from '@/design-system/tokens/theme';
import { FontFamily } from '@/design-system/tokens/typography';
import { GlassView } from '@/design-system/ui/GlassView';
import { M3TopAppBar } from '@/design-system/ui';
import { Footer } from '@/components/Footer';
import { goBackOrReplace } from '@/lib/navigation';
import { APP_AKA, APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { organizerPricingMeta, resolveOrganizerTierCards } from '@/lib/organizerPricing';
import { withAlpha } from '@/lib/withAlpha';

const PAGE_TITLE = `Organiser Pricing — ${APP_NAME}`;
const PAGE_DESCRIPTION =
  'Transparent ticketing pricing for cultural event organisers on CulturePass. Free RSVPs, Standard and Premium paid-ticket plans, and custom NGO & enterprise packages.';
const PAGE_URL = `${SITE_ORIGIN}/pricing`;
const OG_IMAGE = `${SITE_ORIGIN}/assets/images/social-preview.png`;

type TierId = 'free' | 'premium' | 'standard';
type FeatureCell = boolean | string;

type FeatureRow = {
  label: string;
  free: FeatureCell;
  premium: FeatureCell;
  standard: FeatureCell;
};

function FeatureValue({ value, colors }: { value: FeatureCell; colors: ColorTheme }) {
  if (value === true) {
    return <Ionicons name="checkmark-circle" size={20} color={CultureTokens.passGreen} accessibilityLabel="Included" />;
  }
  if (value === false) {
    return <Ionicons name="close-circle-outline" size={20} color={withAlpha(colors.textTertiary, 0.6)} accessibilityLabel="Not included" />;
  }
  return (
    <Text style={{ fontFamily: FontFamily.medium, fontSize: 12, color: colors.textSecondary, textAlign: 'center' }} numberOfLines={2}>
      {value}
    </Text>
  );
}

export default function PricingPage() {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 720;
  const featuresRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [passFeeToAttendees, setPassFeeToAttendees] = React.useState(false);
  const { user } = useAuth();
  const billingCountry = user?.country ?? 'Australia';

  const { data: pricingData, isPending: isPricingPending, isError: isPricingError } = useQuery({
    queryKey: ['pricing-plans', billingCountry],
    queryFn: () => api.pricing.plans(billingCountry),
    staleTime: 60_000,
  });

  const tierCards = useMemo(
    () =>
      resolveOrganizerTierCards(pricingData?.organizer, {
        market: pricingData?.market,
        currency: pricingData?.currency,
        useFallback: !isPricingPending && (isPricingError || !pricingData?.organizer),
      }),
    [pricingData?.organizer, pricingData?.market, pricingData?.currency, isPricingPending, isPricingError],
  );
  const pricingMeta = useMemo(() => organizerPricingMeta(pricingData), [pricingData]);

  const scrollToFeatures = useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.getElementById('pricing-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    featuresRef.current?.measureLayout(
      scrollRef.current?.getInnerViewNode?.() as number,
      (_x, y) => scrollRef.current?.scrollTo({ y, animated: true }),
      () => {},
    );
  }, []);

  const tierColumns: { id: TierId; label: string; accent: string }[] = [
    { id: 'free', label: 'Free', accent: colors.textSecondary },
    { id: 'premium', label: 'Premium', accent: CultureTokens.cultureRed },
    { id: 'standard', label: 'Standard', accent: CultureTokens.appBlue },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {Platform.OS === 'web' && (
        <Head>
          <title>{PAGE_TITLE}</title>
          <meta name="description" content={PAGE_DESCRIPTION} />
          <meta
            name="keywords"
            content="CulturePass pricing, event ticketing fees, organiser pricing, cultural events, Stripe Connect, Apple Wallet tickets"
          />
          <meta name="robots" content="index,follow" />
          <link rel="canonical" href={PAGE_URL} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={PAGE_TITLE} />
          <meta property="og:description" content={PAGE_DESCRIPTION} />
          <meta property="og:url" content={PAGE_URL} />
          <meta property="og:image" content={OG_IMAGE} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={PAGE_TITLE} />
          <meta name="twitter:description" content={PAGE_DESCRIPTION} />
          <meta name="twitter:image" content={OG_IMAGE} />
        </Head>
      )}

      <M3TopAppBar title="Pricing" onBack={() => goBackOrReplace('/about')} denseWeb webChromeless />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero */}
        <View style={[styles.heroWrap, { minHeight: isDesktop ? 420 : 360 }]}>
          <LinearGradient colors={['#181A26', '#0E2929', '#1A1030']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Animated.View entering={FadeInDown.duration(600)} style={[styles.heroContent, { maxWidth: isDesktop ? 880 : '100%' }]}>
            <GlassView tone="dark" borderRadius={999} style={styles.heroPill}>
              <View style={styles.heroPillInner}>
                <Ionicons name="pricetag-outline" size={14} color={CultureTokens.passGreen} />
                <Text style={styles.heroPillText}>{hostPricing.hero.eyebrow.toUpperCase()}</Text>
              </View>
            </GlassView>

            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 42 : 30 }]}>{hostPricing.hero.title}</Text>
            <Text style={styles.heroSub}>{hostPricing.hero.subtitle}</Text>

            <View style={styles.heroCtas}>
              <Pressable
                onPress={scrollToFeatures}
                style={[styles.ctaPrimary, { backgroundColor: CultureTokens.appBlue }]}
                accessibilityRole="button"
                accessibilityLabel="View features"
              >
                <Text style={styles.ctaPrimaryText}>View features</Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </Pressable>
              <Link href="/contact" asChild>
                <Pressable style={styles.ctaSecondary} accessibilityRole="link" accessibilityLabel="Book demo">
                  <Text style={styles.ctaSecondaryText}>Book demo</Text>
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                </Pressable>
              </Link>
            </View>

            {isPricingPending ? (
              <Text style={styles.heroMeta}>Loading live ticket fees…</Text>
            ) : pricingMeta ? (
              <Text style={styles.heroMeta}>{pricingMeta}</Text>
            ) : isPricingError ? (
              <Text style={styles.heroMeta}>Showing catalogue copy — live fees unavailable.</Text>
            ) : null}
          </Animated.View>
        </View>

        {/* Tier cards */}
        <View style={[styles.section, { paddingTop: 36 }]}>
          <View style={[styles.tierGrid, { flexDirection: isTablet ? 'row' : 'column', flexWrap: 'wrap' }]}>
            {tierCards.map((tier, index) => {
              const isHighlight = tier.highlight;
              const priceLoading = tier.isLive && isPricingPending;
              return (
                <Animated.View
                  key={tier.id}
                  entering={FadeInDown.delay(index * 70).duration(450)}
                  style={[
                    styles.tierCard,
                    {
                      width: isDesktop ? '23%' : isTablet ? '48%' : '100%',
                      minWidth: isDesktop ? 200 : undefined,
                      borderColor: isHighlight ? CultureTokens.cultureRed : colors.borderLight,
                      backgroundColor: isHighlight ? withAlpha(CultureTokens.cultureRed, 0.04) : colors.surface,
                    },
                  ]}
                >
                  {isHighlight ? (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Most popular</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
                  <Text style={[styles.tierPrice, { color: isHighlight ? CultureTokens.cultureRed : CultureTokens.appBlue }]}>
                    {priceLoading ? '…' : tier.priceLine}
                  </Text>
                  <Text style={[styles.tierPriceSub, { color: colors.textSecondary }]}>
                    {priceLoading ? 'Syncing live fees' : tier.priceSub}
                  </Text>
                  {tier.isLive && pricingData ? (
                    <Text style={[styles.tierLiveBadge, { color: CultureTokens.passGreen }]}>Live · {pricingData.currency}</Text>
                  ) : null}
                  <Text style={[styles.tierFeeDetail, { color: colors.textTertiary }]}>{tier.feeDetail}</Text>
                  <Text style={[styles.tierDesc, { color: colors.textSecondary }]}>{tier.description}</Text>
                  <Link href={tier.ctaHref as never} asChild>
                    <Pressable
                      style={[
                        styles.tierCta,
                        {
                          backgroundColor: isHighlight ? CultureTokens.cultureRed : withAlpha(CultureTokens.appBlue, 0.1),
                          borderColor: isHighlight ? CultureTokens.cultureRed : withAlpha(CultureTokens.appBlue, 0.35),
                        },
                      ]}
                      accessibilityRole="link"
                      accessibilityLabel={tier.cta}
                    >
                      <Text style={[styles.tierCtaText, { color: isHighlight ? '#fff' : CultureTokens.appBlue }]}>{tier.cta}</Text>
                    </Pressable>
                  </Link>
                </Animated.View>
              );
            })}
          </View>

          {/* Pass fee toggle */}
          <GlassView intensity={16} style={[styles.passFeeCard, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <View style={styles.passFeeRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.passFeeTitle, { color: colors.text }]}>Pass the organiser fee to attendees?</Text>
                <Text style={[styles.passFeeBody, { color: colors.textSecondary }]}>{hostPricing.passFeeNote}</Text>
              </View>
              <Switch
                value={passFeeToAttendees}
                onValueChange={setPassFeeToAttendees}
                trackColor={{ false: colors.borderLight, true: CultureTokens.passGreen }}
                thumbColor="#fff"
                accessibilityLabel="Pass organiser fee to attendees"
              />
            </View>
            {passFeeToAttendees ? (
              <View style={[styles.passFeeHint, { backgroundColor: withAlpha(CultureTokens.passGreen, 0.1) }]}>
                <Ionicons name="information-circle-outline" size={16} color={CultureTokens.passGreen} />
                <Text style={[styles.passFeeHintText, { color: colors.textSecondary }]}>
                  Attendees see a transparent line item at checkout. You receive the full ticket price you set.
                </Text>
              </View>
            ) : null}
          </GlassView>
        </View>

        {/* Feature comparison */}
        <View
          ref={featuresRef}
          nativeID="pricing-features"
          {...(Platform.OS === 'web' ? ({ id: 'pricing-features' } as object) : {})}
          style={[styles.section, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.h2, { color: colors.text }]}>Compare plans</Text>
          <Text style={[styles.sectionLead, { color: colors.textSecondary }]}>
            Everything included across {APP_AKA} HostSpace — from free community RSVPs to premium festival tooling.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={Platform.OS === 'web'} contentContainerStyle={{ minWidth: isDesktop ? '100%' : 640 }}>
            <View style={[styles.table, { borderColor: colors.borderLight, backgroundColor: colors.background }]}>
              <View style={[styles.tableHead, { backgroundColor: withAlpha(CultureTokens.indigo, 0.06) }]}>
                <Text style={[styles.tableFeatureHead, { color: colors.text }]}>Features</Text>
                {tierColumns.map((col) => (
                  <Text key={col.id} style={[styles.tableTierHead, { color: col.accent }]}>{col.label}</Text>
                ))}
              </View>
              {(hostPricing.features as FeatureRow[]).map((row) => (
                <View key={row.label} style={[styles.tableRow, { borderTopColor: colors.borderLight }]}>
                  <Text style={[styles.tableFeatureLabel, { color: colors.text }]}>{row.label}</Text>
                  <View style={styles.tableCell}><FeatureValue value={row.free} colors={colors} /></View>
                  <View style={styles.tableCell}><FeatureValue value={row.premium} colors={colors} /></View>
                  <View style={styles.tableCell}><FeatureValue value={row.standard} colors={colors} /></View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <View style={[styles.benefitGrid, { flexDirection: isTablet ? 'row' : 'column' }]}>
            {hostPricing.benefits.map((item, i) => (
              <Animated.View
                key={item.title}
                entering={FadeInDown.delay(i * 80)}
                style={[styles.benefitCard, { borderColor: colors.borderLight, backgroundColor: colors.surface, flex: isTablet ? 1 : undefined }]}
              >
                <LinearGradient colors={gradients.culturepassBrand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.benefitIcon}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.benefitBody, { color: colors.textSecondary }]}>{item.body}</Text>
              </Animated.View>
            ))}
          </View>

          <View style={styles.footnotes}>
            {hostPricing.footnotes.map((note) => (
              <Text key={note} style={[styles.footnote, { color: colors.textTertiary }]}>
                • {note}
              </Text>
            ))}
          </View>

          <View style={styles.bottomCtas}>
            <Link href="/hostspace" asChild>
              <Pressable style={[styles.ctaPrimary, { backgroundColor: CultureTokens.passGreen }]} accessibilityRole="link">
                <Text style={styles.ctaPrimaryText}>Apply to host</Text>
                <Ionicons name="rocket-outline" size={18} color="#fff" />
              </Pressable>
            </Link>
            <Link href="/membership/upgrade" asChild>
              <Pressable style={[styles.ctaOutline, { borderColor: colors.borderLight }]} accessibilityRole="link">
                <Text style={[styles.ctaOutlineText, { color: colors.text }]}>CulturePass+ for members</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

function getStyles(colors: ColorTheme) {
  return StyleSheet.create({
    heroWrap: { position: 'relative', overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 48, alignItems: 'center' },
    heroContent: { alignItems: 'center', gap: 14, zIndex: 1 },
    heroPill: { backgroundColor: 'rgba(0,166,81,0.08)', borderColor: 'rgba(0,166,81,0.25)' },
    heroPillInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6 },
    heroPillText: { color: CultureTokens.passGreen, fontSize: 11, fontFamily: FontFamily.semibold, letterSpacing: 0.6 },
    heroTitle: { color: '#fff', fontFamily: FontFamily.bold, textAlign: 'center', lineHeight: 48 },
    heroSub: { color: 'rgba(255,255,255,0.82)', fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 26, textAlign: 'center', maxWidth: 640 },
    heroCtas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 },
    heroMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: FontFamily.regular, textAlign: 'center', marginTop: 4 },
    ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
    ctaPrimaryText: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 15 },
    ctaSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    ctaSecondaryText: { color: '#fff', fontFamily: FontFamily.semibold, fontSize: 15 },
    section: { paddingHorizontal: 20, paddingVertical: 32, gap: 20 },
    tierGrid: { gap: 16, justifyContent: 'center' },
    tierCard: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
      gap: 6,
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: CultureTokens.cultureRed,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    popularBadgeText: { color: '#fff', fontSize: 10, fontFamily: FontFamily.bold, letterSpacing: 0.4 },
    tierName: { fontFamily: FontFamily.bold, fontSize: 18, marginTop: 4 },
    tierPrice: { fontFamily: FontFamily.bold, fontSize: 28, lineHeight: 34 },
    tierPriceSub: { fontFamily: FontFamily.medium, fontSize: 14 },
    tierLiveBadge: { fontFamily: FontFamily.semibold, fontSize: 11, letterSpacing: 0.3 },
    tierFeeDetail: { fontFamily: FontFamily.regular, fontSize: 12, marginBottom: 4 },
    tierDesc: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 20, flex: 1 },
    tierCta: { marginTop: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    tierCtaText: { fontFamily: FontFamily.semibold, fontSize: 14 },
    passFeeCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 8, gap: 12 },
    passFeeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    passFeeTitle: { fontFamily: FontFamily.semibold, fontSize: 15 },
    passFeeBody: { fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 20 },
    passFeeHint: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
    passFeeHintText: { flex: 1, fontFamily: FontFamily.regular, fontSize: 13, lineHeight: 19 },
    h2: { fontFamily: FontFamily.bold, fontSize: 28, textAlign: 'center' },
    sectionLead: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 640, alignSelf: 'center' },
    table: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', minWidth: 620 },
    tableHead: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 12 },
    tableFeatureHead: { flex: 2.2, fontFamily: FontFamily.bold, fontSize: 14 },
    tableTierHead: { flex: 1, fontFamily: FontFamily.bold, fontSize: 13, textAlign: 'center' },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1 },
    tableFeatureLabel: { flex: 2.2, fontFamily: FontFamily.regular, fontSize: 13, paddingRight: 8 },
    tableCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    benefitGrid: { gap: 16 },
    benefitCard: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 10 },
    benefitIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    benefitTitle: { fontFamily: FontFamily.bold, fontSize: 17 },
    benefitBody: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 22 },
    footnotes: { gap: 6, marginTop: 8 },
    footnote: { fontFamily: FontFamily.regular, fontSize: 12, lineHeight: 18 },
    bottomCtas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 16 },
    ctaOutline: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, borderWidth: 1 },
    ctaOutlineText: { fontFamily: FontFamily.semibold, fontSize: 15 },
  });
}