/**
 * CultureMarket listing detail — Buy Now / Contact Seller / Visit Website
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { goBackOrReplace } from '@/lib/navigation';
import Head from 'expo-router/head';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { fetchListingWithFallback } from '@/lib/cultureShopDeals';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { useRole } from '@/hooks/useRole';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { BackButton } from '@/design-system/ui/BackButton';
import {
  CultureTokens,
  FontFamily,
  Radius,
  Spacing,
  SignatureGradient,
} from '@/design-system/tokens/theme';
import type { ShopListing } from '@/shared/schema';
import { SHOP_CATEGORIES } from '@/shared/schema';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { DefaultHostBrandMark } from '@/modules/marketplace/DefaultHostBrandMark';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACCENT_GRAD: Record<string, [string, string]> = {
  coral:  [CultureTokens.coral  + 'EE', CultureTokens.coral  + '44'],
  violet: [CultureTokens.violet + 'EE', CultureTokens.violet + '44'],
  teal:   [CultureTokens.teal   + 'EE', CultureTokens.teal   + '44'],
  gold:   [CultureTokens.gold   + 'EE', CultureTokens.gold   + '44'],
};

function accentGrad(l: ShopListing): [string, string] {
  return ACCENT_GRAD[l.accentKey ?? 'violet'] ?? ACCENT_GRAD.violet;
}

function formatPrice(l: ShopListing): string {
  if (l.isFree) return 'Free';
  if (!l.priceCents) return 'Contact for price';
  const dollars = (l.priceCents / 100).toFixed(2);
  return `${l.currency ?? 'AUD'} $${dollars}`;
}

function typeLabel(t: ShopListing['type']): string {
  return t === 'product' ? 'Product' : t === 'service' ? 'Service' : 'Link listing';
}

function typeIcon(t: ShopListing['type']): keyof typeof Ionicons.glyphMap {
  return t === 'product' ? 'cube-outline' : t === 'service' ? 'briefcase-outline' : 'open-outline';
}

function categoryLabel(cat: string): string {
  return SHOP_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

/** Host mark on hero — `logoUrl` → `sellerAvatar` → CulturePass + patterned fallback. */
function HeroHostMark({ listing }: { listing: ShopListing }) {
  const logo = listing.logoUrl?.trim();
  const avatar = listing.sellerAvatarUrl?.trim();

  if (!logo && !avatar) {
    return (
      <View
        style={styles.heroHostMarkWrap}
        accessibilityRole="image"
        accessibilityLabel="CultureMarket — CulturePass"
      >
        <DefaultHostBrandMark size={56} listingId={listing.id} borderRadius={10} />
      </View>
    );
  }

  const inner = logo ? (
    <Image source={{ uri: logo }} style={StyleSheet.absoluteFill} contentFit="contain" />
  ) : (
    <Image source={{ uri: avatar! }} style={StyleSheet.absoluteFill} contentFit="cover" />
  );

  return (
    <View
      style={styles.heroHostMarkWrap}
      accessibilityRole="image"
      accessibilityLabel={`${listing.sellerName} logo`}
    >
      <View style={[styles.heroHostMarkTile, styles.heroHostMarkTileLight]}>{inner}</View>
    </View>
  );
}

// ─── Detail screen ────────────────────────────────────────────────────────────

function ListingDetailInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const safeInsets = useSafeAreaInsetsWeb();
  const topInset = safeInsets.top;
  const colors = useColors();
  const { hPad, isDesktop, contentWidth, isMobile } = useLayout();
  const wideListingChrome = Platform.OS === 'web' && !isMobile;
  const { userId } = useAuth();
  const { isModerator } = useRole();
  const { width: screenW } = useWindowDimensions();
  const qc = useQueryClient();

  const maxW = Math.min(680, contentWidth);
  const imageH = Math.round(Math.min(screenW, maxW) * 0.56);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['shop-listing', id],
    queryFn: () => fetchListingWithFallback(id ?? ''),
    enabled: !!id,
  });

  const listing = data?.listing;

  const isOwner = listing && (listing.sellerUserId === userId || isModerator);

  const deleteMutation = useMutation({
    mutationFn: () => api.cultureShop.deleteListing(id ?? ''),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shop-listings'] });
      router.back();
    },
  });

  const handlePrimary = useCallback(() => {
    if (!listing) return;
    if (listing.type === 'link') {
      if (listing.externalUrl) openExternalUrl(listing.externalUrl);
    } else if (listing.type === 'product') {
      // In a full implementation this would open the checkout flow
      Alert.alert('Coming soon', 'In-app checkout is coming soon. Contact the seller to purchase.');
    } else {
      // service — contact
      if (listing.contactPhone) {
        openExternalUrl(`tel:${listing.contactPhone}`);
      } else if (listing.contactEmail) {
        openExternalUrl(`mailto:${listing.contactEmail}?subject=Enquiry about ${listing.title}`);
      } else {
        Alert.alert('Contact seller', 'No direct contact provided. Try messaging through the Directory.');
      }
    }
  }, [listing]);

  const handleContact = useCallback(() => {
    if (!listing) return;
    if (listing.contactEmail) {
      openExternalUrl(`mailto:${listing.contactEmail}?subject=Enquiry: ${listing.title}`);
    } else if (listing.contactPhone) {
      openExternalUrl(`tel:${listing.contactPhone}`);
    } else {
      Alert.alert('No contact info', 'The seller has not provided contact details.');
    }
  }, [listing]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Delete listing', 'Are you sure you want to delete this listing? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }, [deleteMutation]);

  const listingCanonicalBase = `${SITE_ORIGIN}/CultureMarket/${id ?? ''}`;
  const deepLink = listingCanonicalBase;

  if (isLoading) {
    const loadingTitle = `Loading listing · CultureMarket · ${APP_NAME}`;
    return (
      <>
        <Head>
          <title>{loadingTitle}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <View style={[styles.centeredFull, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={CultureTokens.violet} size="large" />
        </View>
      </>
    );
  }

  if (isError || !listing) {
    const notFoundTitle = `Listing not found · CultureMarket · ${APP_NAME}`;
    return (
      <>
        <Head>
          <title>{notFoundTitle}</title>
          <meta name="description" content="This CultureMarket listing could not be found." />
          <meta name="robots" content="noindex" />
        </Head>
      <View style={[styles.centeredFull, { backgroundColor: colors.background, paddingTop: topInset + 16 }]}>
        <BackButton fallback="/CultureMarket" color={colors.text} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Listing not found</Text>
        <Pressable onPress={() => goBackOrReplace('/CultureMarket')} style={styles.errorBack}>
          <Text style={{ color: CultureTokens.violet, fontFamily: FontFamily.semibold }}>Back to CultureMarket</Text>
        </Pressable>
      </View>
      </>
    );
  }

  const grad = accentGrad(listing);
  const primaryLabel =
    listing.type === 'link' ? 'Visit website' :
    listing.type === 'service' ? 'Contact seller' :
    'Buy now';
  const primaryIcon: keyof typeof Ionicons.glyphMap =
    listing.type === 'link' ? 'open-outline' :
    listing.type === 'service' ? 'call-outline' :
    'cart-outline';

  const listingPageTitle = `${listing.title} · CultureMarket · ${APP_NAME}`;
  const listingPageDesc =
    (listing.description && listing.description.replace(/\s+/g, ' ').trim().slice(0, 155)) ||
    `${typeLabel(listing.type)} in ${listing.city ?? 'your city'} — contact or buy on CulturePass CultureMarket.`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Head>
        <title>{listingPageTitle}</title>
        <meta name="description" content={listingPageDesc} />
        <meta property="og:title" content={listingPageTitle} />
        <meta property="og:description" content={listingPageDesc} />
        <meta property="og:url" content={listingCanonicalBase} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={listingCanonicalBase} />
      </Head>
      {/* Floating back button */}
      <View style={[styles.floatingHeader, { top: topInset + 8 }]}>
        <Pressable
          onPress={() => goBackOrReplace('/CultureMarket')}
          style={[styles.floatBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
        {isOwner && (
          <View style={styles.floatRight}>
            <Pressable
              onPress={() => router.push(`/hostspace/create/listing?edit=${id}` as any)}
              style={[styles.floatBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
              accessibilityLabel="Edit listing"
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              style={[styles.floatBtn, { backgroundColor: 'rgba(200,0,0,0.5)' }]}
              accessibilityLabel="Delete listing"
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: safeInsets.bottom + 120 }}
      >
        {/* Hero image */}
        <View style={[styles.heroImg, { height: imageH }]}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Type badge overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroBadgeRow}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Ionicons name={typeIcon(listing.type)} size={13} color="#fff" />
              <Text style={styles.heroBadgeText}>{typeLabel(listing.type)}</Text>
            </View>
            {listing.cultureTag && (
              <View style={[styles.heroBadge, { backgroundColor: grad[0] + '99' }]}>
                <Text style={styles.heroBadgeText}>{listing.cultureTag}</Text>
              </View>
            )}
          </View>
          <HeroHostMark listing={listing} />
        </View>

        {/* Content */}
        <View style={[styles.body, { paddingHorizontal: hPad, maxWidth: isDesktop ? 680 : undefined, alignSelf: isDesktop ? 'center' : 'stretch', width: '100%' }]}>

          {/* Category & seller */}
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: CultureTokens.teal }]}>
              {categoryLabel(listing.category)}
            </Text>
            {!!listing.city && (
              <View style={styles.metaDot}>
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>· {listing.city}</Text>
              </View>
            )}
            {listing.isOnline && (
              <View style={[styles.onlinePill, { backgroundColor: CultureTokens.teal + '20' }]}>
                <Ionicons name="globe-outline" size={12} color={CultureTokens.teal} />
                <Text style={[styles.onlineText, { color: CultureTokens.teal }]}>Online</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>

          {/* Price */}
          <Text style={[styles.price, { color: CultureTokens.coral }]}>{formatPrice(listing)}</Text>

          {/* Seller row */}
          <View style={[styles.sellerRow, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
            <View style={[styles.sellerAvatar, { backgroundColor: grad[0] + '33' }]}>
              {listing.logoUrl?.trim() || listing.sellerAvatarUrl?.trim() ? (
                <Image
                  source={{ uri: (listing.logoUrl?.trim() || listing.sellerAvatarUrl) ?? '' }}
                  style={StyleSheet.absoluteFill}
                  contentFit={listing.logoUrl?.trim() ? 'contain' : 'cover'}
                />
              ) : (
                <DefaultHostBrandMark size={44} listingId={listing.id} borderRadius={22} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: colors.text }]}>{listing.sellerName}</Text>
              <Text style={[styles.sellerSub, { color: colors.textTertiary }]}>
                Listed on CultureMarket
              </Text>
            </View>
            {listing.sellerProfileId && (
              <Pressable
                onPress={() => router.push(`/profile/${listing.sellerProfileId}` as any)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={{ color: CultureTokens.teal, fontFamily: FontFamily.semibold, fontSize: 13 }}>
                  View profile
                </Text>
              </Pressable>
            )}
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={[styles.descTitle, { color: colors.text }]}>About this listing</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{listing.description}</Text>
          </View>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {listing.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.backgroundSecondary ?? colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Contact info */}
          {(listing.contactPhone || listing.contactEmail) && (
            <View style={[styles.contactBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>Contact details</Text>
              {listing.contactPhone && (
                <Pressable
                  onPress={() => openExternalUrl(`tel:${listing.contactPhone}`)}
                  style={styles.contactRow}
                >
                  <Ionicons name="call-outline" size={16} color={CultureTokens.teal} />
                  <Text style={[styles.contactVal, { color: CultureTokens.teal }]}>{listing.contactPhone}</Text>
                </Pressable>
              )}
              {listing.contactEmail && (
                <Pressable
                  onPress={() => openExternalUrl(`mailto:${listing.contactEmail}`)}
                  style={styles.contactRow}
                >
                  <Ionicons name="mail-outline" size={16} color={CultureTokens.teal} />
                  <Text style={[styles.contactVal, { color: CultureTokens.teal }]}>{listing.contactEmail}</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Deep link share row */}
          <View style={styles.shareRow}>
            <Ionicons name="link-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.shareLink, { color: colors.textTertiary }]} numberOfLines={1} selectable>
              {deepLink}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom CTA bar ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.ctaBar,
          {
            paddingBottom: safeInsets.bottom + 12,
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <View
          style={[
            styles.ctaRow,
            wideListingChrome && styles.ctaRowWide,
            { paddingHorizontal: hPad },
            wideListingChrome && { maxWidth: Math.min(680, contentWidth), width: '100%', alignSelf: 'center' },
          ]}
        >
          {/* Secondary: Contact (shown for all types except link-only) */}
          {listing.type !== 'link' && (listing.contactPhone || listing.contactEmail) && (
            <Pressable
              onPress={handleContact}
              style={({ pressed }) => [
                styles.ctaSecondary,
                { borderColor: colors.borderLight, backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
            </Pressable>
          )}

          {/* Primary action */}
          <Pressable
            onPress={handlePrimary}
            style={({ pressed }) => [
              styles.ctaPrimary,
              wideListingChrome && styles.ctaPrimaryWideChrome,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
          >
            <LinearGradient
              colors={SignatureGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={primaryIcon} size={20} color="#fff" />
            <Text style={styles.ctaPrimaryText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  centeredFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontFamily: FontFamily.regular, fontSize: 16 },
  errorBack: { marginTop: 8, padding: 12 },

  floatingHeader: {
    position: 'absolute', left: 16, right: 16, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  floatBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  floatRight: { flexDirection: 'row', gap: 8 },

  heroImg: { width: '100%', backgroundColor: '#111' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 88,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    zIndex: 3,
  },
  heroHostMarkWrap: { position: 'absolute', bottom: 10, right: 16, zIndex: 4 },
  heroHostMarkTile: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(0,45,80)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.35)' } as object,
    }),
  },
  heroHostMarkTileLight: { backgroundColor: '#FFFFFF' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm },
  heroBadgeText: { fontFamily: FontFamily.semibold, fontSize: 11, color: '#fff', letterSpacing: 0.3 },

  body: { paddingTop: Spacing.lg },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  category: { fontFamily: FontFamily.semibold, fontSize: 13, letterSpacing: 0.3 },
  metaDot: {},
  metaText: { fontFamily: FontFamily.regular, fontSize: 13 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  onlineText: { fontFamily: FontFamily.semibold, fontSize: 11 },

  title: { fontFamily: FontFamily.bold, fontSize: Platform.OS === 'web' ? 28 : 24, lineHeight: Platform.OS === 'web' ? 34 : 30, letterSpacing: -0.4, marginBottom: 8 },
  price: { fontFamily: FontFamily.bold, fontSize: 22, marginBottom: Spacing.md },

  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.lg, overflow: 'hidden',
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerName: { fontFamily: FontFamily.semibold, fontSize: 15 },
  sellerSub: { fontFamily: FontFamily.regular, fontSize: 12, marginTop: 2 },

  descSection: { marginBottom: Spacing.lg },
  descTitle: { fontFamily: FontFamily.bold, fontSize: 17, marginBottom: 8 },
  desc: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 23 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, borderWidth: 1 },
  tagText: { fontFamily: FontFamily.regular, fontSize: 12 },

  contactBox: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md, gap: 10 },
  contactTitle: { fontFamily: FontFamily.semibold, fontSize: 14, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactVal: { fontFamily: FontFamily.semibold, fontSize: 14 },

  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4, paddingBottom: Spacing.md },
  shareLink: { fontFamily: FontFamily.regular, fontSize: 12, flex: 1 },

  // Bottom CTA
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingTop: 12,
  },
  ctaRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  /** Web tablet/desktop: align actions with listing column, primary is content-sized not full-bleed. */
  ctaRowWide: { justifyContent: 'flex-end', flexShrink: 0 },
  ctaSecondary: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  ctaPrimary: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
  },
  ctaPrimaryWideChrome: {
    flex: 0,
    flexGrow: 0,
    alignSelf: 'center',
    minWidth: 200,
    maxWidth: 420,
  },
  ctaPrimaryText: { fontFamily: FontFamily.semibold, fontSize: 16, color: '#fff' },
});

export default function ListingDetailScreen() {
  return (
    <ErrorBoundary>
      <ListingDetailInner />
    </ErrorBoundary>
  );
}
