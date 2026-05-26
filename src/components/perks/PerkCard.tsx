import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { CultureImage } from '@/design-system/ui/CultureImage';
import { CultureTagRow } from '@/design-system/ui/CultureTag';
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens, SpringConfig } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { PerkData } from '@/shared/schema';
import type { PerkStatus } from '@/lib/perks-utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PerkCardProps {
  perk: PerkData;
  containerWidth?: number;
  highlight?: boolean;
  /** Classification status from classifyPerk() — drives locked/unavailable overlay. */
  perkStatus?: PerkStatus;
  /** Required tier name for locked perks — shown in lock overlay. */
  requiredTierLabel?: string;
}

function PerkCardInner({ perk, containerWidth, highlight, perkStatus, requiredTierLabel }: PerkCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.97, SpringConfig.snappy); };
  const handlePressOut = () => { scale.value = withSpring(1, SpringConfig.smooth); };

  const [isHovered, setIsHovered] = React.useState(false);

  const displayPrice = perk.priceTier === 'free' ? 'Free Perk' : `Premium Perk`;
  const isExpired = perk.expiresAt && new Date(perk.expiresAt) < new Date();

  // Trust signals
  const isVerified = !!perk.partnerId || perk.status === 'featured';
  const redeemedCount = (perk as any).usedCount || (perk as any).redemptionCount || 0;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
        containerWidth ? { width: containerWidth } : null,
        highlight && { borderColor: CultureTokens.gold, borderWidth: 2 },
        animatedStyle,
        Platform.OS === 'web' && { 
          cursor: 'pointer' as any,
          transition: 'all 0.3s ease',
        },
        isHovered && Platform.OS === 'web' && { 
          transform: [{ scale: 1.02 }],
          boxShadow: '0px 12px 30px rgba(0,0,0,0.15)',
        },
      ]}
      onPress={() => router.push({ pathname: '/p/[id]', params: { id: perk.id } })}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...({
        onHoverIn: () => setIsHovered(true),
        onHoverOut: () => setIsHovered(false),
      } as any)}
    >
      <View style={styles.imageContainer}>
        <CultureImage
          uri={perk.coverUrl}
          thumbhash={perk.thumbhash}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={`perk-${perk.id}`}
        />

        {/* Trust Layer: Featured / Verified */}
        <View style={styles.badgeColumn}>
          {perk.status === 'featured' && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
          {isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={10} color="#FFF" />
              <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
            </View>
          )}
        </View>

        {/* Trust Layer: Redemption Count */}
        {redeemedCount > 0 && (
          <View style={styles.redeemBadge}>
            <Ionicons name="flash" size={10} color="#FFF" />
            <Text style={styles.redeemBadgeText}>{redeemedCount.toLocaleString()} REDEEMED</Text>
          </View>
        )}

        {isExpired && (
          <View style={[StyleSheet.absoluteFill, styles.expiredOverlay]}>
            <Text style={styles.expiredText}>EXPIRED</Text>
          </View>
        )}

        {/* Tier-locked overlay (Req 13.2, 13.7) */}
        {perkStatus === 'tier_locked' && (
          <View style={[StyleSheet.absoluteFill, styles.lockedOverlay]}>
            <Ionicons name="lock-closed" size={22} color="#fff" />
            {requiredTierLabel ? (
              <Text style={styles.lockedText}>{requiredTierLabel} required</Text>
            ) : null}
          </View>
        )}

        {/* Limit reached overlay (Req 13.7) */}
        {perkStatus === 'limit_reached' && (
          <View style={[StyleSheet.absoluteFill, styles.limitOverlay]}>
            <Text style={styles.expiredText}>LIMIT REACHED</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.partnerName, { color: CultureTokens.indigo }]}>
            {perk.partnerName || 'CulturePass Hub'}
          </Text>
          <View style={[styles.priceTag, { backgroundColor: perk.priceTier === 'free' ? CultureTokens.teal + '20' : CultureTokens.gold + '20' }]}>
            <Text style={[styles.priceTagText, { color: perk.priceTier === 'free' ? CultureTokens.teal : CultureTokens.gold }]}>
               {displayPrice}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {perk.title}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {perk.description}
        </Text>

        {perk.cultureTags && perk.cultureTags.length > 0 && (
          <CultureTagRow tags={perk.cultureTags} max={2} />
        )}
      </View>
    </AnimatedPressable>
  );
}

export const PerkCard = React.memo(PerkCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'column',
    marginBottom: 16,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: '#1E1E2D',
  },
  badgeColumn: {
    position: 'absolute',
    top: 12,
    left: 12,
    gap: 6,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CultureTokens.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  featuredBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  redeemBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  redeemBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  expiredOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 2,
  },
  lockedOverlay: {
    backgroundColor: 'rgba(30,20,60,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  limitOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  partnerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceTagText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
});
