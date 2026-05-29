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
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { ShopListing } from '@/shared/schema';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { LuxeText } from '@/design-system/ui/LuxeText';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { FontFamily } from '@/design-system/tokens/theme';
import { DefaultHostBrandMark } from '@/modules/marketplace/DefaultHostBrandMark';

// ─── Accent palette ───────────────────────────────────────────────────────────

const ACCENT: Record<string, [string, string]> = {
  coral:  [Luxe.colors.dark.primary + 'EE', Luxe.colors.dark.primary + '44'],
  violet: [Luxe.colors.dark.accent + 'EE', Luxe.colors.dark.accent + '44'],
  teal:   [Luxe.colors.dark.emerald + 'EE', Luxe.colors.dark.emerald + '44'],
  gold:   [Luxe.colors.gold + 'EE', Luxe.colors.gold + '44'],
  indigo: [Luxe.colors.indigo + 'EE', Luxe.colors.indigo + '44'],
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
    // LuxeCard wrapper for premium visual treatment (big win)
    <LuxeCard
      variant="default"
      size="md"
      style={{ width, overflow: 'visible' }}
      onPress={onPress}
      haptic={true}
    >
      {/* ── Main tap area (image + body) ─────────────────────────────────── */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.93 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${listing.title} by ${listing.sellerName} — ${priceLabel(listing)}`}
      >
        {/* Cover image */}
        <View style={[styles.imageWrap, { height: imageH }]}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              recyclingKey={`shop-${listing.id}`}
            />
          ) : (
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Type badge — top-left */}
          <View style={styles.typeBadge}>
            <LuxeText variant="caption" style={styles.typeBadgeText}>{typeLabel(listing.type)}</LuxeText>
          </View>

          {/* Brand logo tile — bottom-right (UNiDAYS pattern) */}
          <View style={styles.logoWrap}>
            <BrandLogoTile listing={listing} size={logoSize} />
          </View>
        </View>

        {/* Card body — LuxeText for premium typography */}
        <View style={styles.body}>
          <LuxeText variant="caption" style={{ color: colors.textTertiary, paddingRight: 28 }} numberOfLines={1}>
            {listing.sellerName}{listing.city ? `  ·  ${listing.city}` : ''}
          </LuxeText>
          <LuxeText variant="body" style={{ color: colors.text, fontWeight: '600', marginTop: 4 }} numberOfLines={2}>
            {listing.title}
          </LuxeText>
          <LuxeText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
            {priceLabel(listing)}
          </LuxeText>
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
            color={saved ? Luxe.colors.dark.primary : colors.textTertiary}
          />
        </Pressable>
      )}
    </LuxeCard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tapArea: { width: "100%" },
  imageWrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#111",
    borderTopLeftRadius: 0,
    borderTopRightRadius: Luxe.radius.lg,
  },
  typeBadge: {
    position: "absolute",
    top: Luxe.spacing.sm,
    left: Luxe.spacing.sm,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Luxe.radius.sm,
    zIndex: 2,
  },
  typeBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  logoWrap: {
    position: "absolute",
    right: Luxe.spacing.sm,
    bottom: Luxe.spacing.sm,
    zIndex: 3,
  },
  heartBtn: {
    position: "absolute",
    top: Luxe.spacing.md,
    right: Luxe.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  // Added for JSX references (incomplete migration)
  logoBox: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden' },
  logoShell: { width: 64, height: 64, backgroundColor: '#222', borderRadius: 12 },
  body: { padding: 12, gap: 4 },
});
