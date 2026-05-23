/**
 * ShopListingCard — UNiDAYS benefit-tile layout.
 *
 * Structure (matches reference screenshot):
 *   ┌──────────────────────────────┐
 *   │  [cover image / gradient]    │  ← aspect 280:166
 *   │                    [logo □]  │  ← white square, bottom-right
 *   ├──────────────────────────────┤
 *   │ Seller name          ♥ Save  │  ← gray 14px + heart icon
 *   │                              │
 *   │ Title (bold, 2 lines)        │
 *   │ AUD $89.00                   │
 *   └──────────────────────────────┘
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { ShopListing } from '@/shared/schema';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';
import { DefaultHostBrandMark } from '@/modules/marketplace/DefaultHostBrandMark';

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENT: Record<string, [string, string]> = {
  coral:  [CultureTokens.coral  + 'EE', CultureTokens.coral  + '44'],
  violet: [CultureTokens.violet + 'EE', CultureTokens.violet + '44'],
  teal:   [CultureTokens.teal   + 'EE', CultureTokens.teal   + '44'],
  gold:   [CultureTokens.gold   + 'EE', CultureTokens.gold   + '44'],
};

function accentGrad(l: ShopListing): [string, string] {
  return ACCENT[l.accentKey ?? 'violet'] ?? ACCENT.violet;
}

function priceLabel(l: ShopListing): string {
  if (l.isFree) return 'Free';
  if (!l.priceCents) return 'Contact for price';
  return `${l.currency ?? 'AUD'} $${(l.priceCents / 100).toFixed(2)}`;
}

function typeLabel(t: ShopListing['type']): string {
  return t === 'product' ? 'Product' : t === 'service' ? 'Service' : 'Visit site';
}

// ─── Brand logo tile ─────────────────────────────────────────────────────────
// Matches the UNiDAYS white square logo positioned at bottom-right of image.

function BrandLogoTile({ listing, size }: { listing: ShopListing; size: number }) {
  if (listing.logoUrl) {
    return (
      <View style={[styles.logoBox, { width: size, height: size }]}>
        <Image
          source={{ uri: listing.logoUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.logoShell, { width: size, height: size }]}>
      <DefaultHostBrandMark size={size} listingId={listing.id} borderRadius={8} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  listing: ShopListing;
  width: number;
  onPress: () => void;
  onSave?: () => void;
  saved?: boolean;
};

export function ShopListingCard({ listing, width, onPress, onSave, saved }: Props) {
  const colors = useColors();
  const grad = accentGrad(listing);

  // Logo size: 46px on mobile, 25% of card width on wider cards (capped 62)
  const logoSize = Math.min(Math.max(Math.round(width * 0.22), 46), 62);
  // Image height follows 280:166 aspect ratio
  const imageH = Math.round(width * (166 / 280));

  return (
    // Outer View — card shell with shadow. Never a Pressable so nested
    // interactive elements (heart button) don't cause button-in-button errors.
    <View style={[styles.card, { width, backgroundColor: colors.surface }]}>

      {/* ── Main tap area (image + body) ─────────────────────────────────── */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tapArea, pressed && { opacity: 0.93 }]}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title} by ${listing.sellerName} — ${priceLabel(listing)}`}
      >
        {/* Cover image */}
        <View style={[styles.imageWrap, { height: imageH }]}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={150}
              recyclingKey={`shop-${listing.id}`}
            />
          ) : (
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          {/* Type badge — top-left */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel(listing.type)}</Text>
          </View>

          {/* Brand logo tile — bottom-right (UNiDAYS pattern) */}
          <View style={styles.logoWrap}>
            <BrandLogoTile listing={listing} size={logoSize} />
          </View>
        </View>

        {/* Card body — seller name row leaves space for the heart (positioned absolute) */}
        <View style={styles.body}>
          <Text style={[styles.sellerName, { color: colors.textTertiary, paddingRight: 28 }]} numberOfLines={1}>
            {listing.sellerName}{listing.city ? `  ·  ${listing.city}` : ''}
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={[styles.price, { color: colors.textSecondary }]}>
            {priceLabel(listing)}
          </Text>
        </View>
      </Pressable>

      {/* ── Heart button — sibling of tap Pressable, never nested inside it ── */}
      {onSave !== undefined && (
        <Pressable
          onPress={onSave}
          hitSlop={10}
          style={({ pressed }) => [styles.heartBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved' : 'Save listing'}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? CultureTokens.coral : colors.textTertiary}
          />
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer card shell — View so nested Pressables never cause button-in-button errors
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(0,45,80)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0px 2px 8px 0px rgba(0, 45, 80, 0.10)' } as any,
    }),
  },
  // Inner tap area covers the whole card content
  tapArea: {
    width: '100%',
  },

  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    // top-left corner sharp (UNiDAYS style: borderTopLeftRadius: 0)
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
  },

  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 2,
  },
  typeBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.4,
  },

  logoWrap: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    zIndex: 3,
  },

  // Heart button — absolutely positioned over the body, right-aligned with seller row
  heartBtn: {
    position: 'absolute',
    right: 8,
    bottom: 26, // sits alongside the seller name row
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },

  // White square logo box — exact UNiDAYS pattern
  logoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(0,45,80)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 2px 8px 0px rgba(0, 45, 80, 0.10)' } as any,
    }),
  },
  logoShell: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  // Card body — below image
  body: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 90,
  },

  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sellerName: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },

  title: {
    fontFamily: FontFamily.semibold,
    fontSize: Platform.OS === 'web' ? 15 : 14,
    lineHeight: Platform.OS === 'web' ? 21 : 19,
    marginBottom: 5,
  },

  price: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 17,
  },
});
