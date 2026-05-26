import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideOutUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/lib/feature-flags';
import { M3Card } from '@/design-system/ui';
import { M3Typography, Radius, CultureTokens } from '@/design-system/tokens/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface NationBuildersPromoProps {
  variant?: 'compact' | 'full';
  onCTAPress?: () => void;
}

const NATION_BUILDERS_DISMISS_KEY = '@culturepass_nation_builders_dismiss_v2';
const NATION_BUILDERS_FLAG = 'nation-builders-promo';

function isCulturePassPlus(tier?: string | null): boolean {
  if (!tier) return false;
  const t = tier.toLowerCase();
  return ['plus', 'elite', 'pro', 'premium', 'vip'].includes(t);
}

export function NationBuildersPromo({ 
  variant = 'full', 
  onCTAPress 
}: NationBuildersPromoProps) {
  const m3Colors = useM3Colors();
  const { user } = useAuth();
  const featureFlags = useFeatureFlags();

  // Dismissal state (local, admin can retrigger by flag or future revision bump)
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissLoaded, setDismissLoaded] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(NATION_BUILDERS_DISMISS_KEY)
      .then((val) => {
        if (!cancelled) {
          setIsDismissed(!!val);
          setDismissLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setDismissLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const tier = user?.subscriptionTier;
  const isPlusUser = isCulturePassPlus(tier);
  const promoEnabled = (featureFlags.data?.flags || {})[NATION_BUILDERS_FLAG] !== false;

  const canShow = dismissLoaded && promoEnabled && !isPlusUser && !isDismissed;

  const handleDismiss = useCallback(() => {
    setShow(false);
    // Persist after nice exit animation
    setTimeout(() => {
      setIsDismissed(true);
      AsyncStorage.setItem(NATION_BUILDERS_DISMISS_KEY, '1').catch(() => {});
    }, 260);
  }, []);

  const handleLearnMore = () => {
    if (onCTAPress) {
      onCTAPress();
    } else {
      router.push('/NationBuildersProgram');
    }
  };

  const handleApplyNow = () => {
    // For business acquisition goal: Prefer routing business owners toward the host/business creation flow.
    // Staff can still discover the program page for the staff-side story.
    // We pass an intent so future flows can show Nation Builder Partner messaging.
    router.push('/hostspace/apply?intent=nation-builder' as any);
  };

  // Gate: only non CulturePass+ users + admin flag controlled
  if (variant === 'full' && !canShow) {
    return null;
  }

  if (variant === 'compact') {
    // Compact variant remains simple (used in other contexts); still respects basic gate if desired
    if (isPlusUser) return null;
    return (
      <M3Card 
        variant="elevated" 
        style={[
          styles.compactCard, 
          { 
            backgroundColor: m3Colors.primaryContainer,
            borderColor: m3Colors.outlineVariant,
          }
        ]}
        onPress={handleLearnMore}
      >
        <View style={styles.compactContent}>
          <View style={[styles.compactBadge, { backgroundColor: m3Colors.primary }]}>
            <Ionicons name="star" size={16} color={m3Colors.onPrimary} />
          </View>
          <Text style={[styles.compactTitle, { color: m3Colors.onPrimaryContainer }]}>
            Nation Builders
          </Text>
          <Text style={[styles.compactSubtitle, { color: m3Colors.onPrimaryContainer }]}>
            You serve Sydney. Now let Sydney serve you back.
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={m3Colors.onPrimaryContainer} 
            style={styles.compactChevron} 
          />
        </View>
      </M3Card>
    );
  }

  if (!show) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(320)}
      exiting={SlideOutUp.duration(220)}
      style={styles.wrapper}
    >
      <M3Card 
        variant="elevated" 
        style={[
          styles.fullCard, 
          { 
            backgroundColor: m3Colors.surfaceContainerLow,
            borderColor: m3Colors.outlineVariant,
          }
        ]}
      >
        {/* Premium gradient header for visual impact */}
        <LinearGradient
          colors={[CultureTokens.gold, '#E8A923', CultureTokens.terracottaGlow]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.9 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
              <Ionicons name="shield-checkmark" size={15} color={CultureTokens.terracottaGlow} />
              <Text style={[styles.badgeText, { color: '#1C1917', letterSpacing: 1.5 }]}>
                NATION BUILDERS
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Dismiss Nation Builders promo"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color="rgba(28,25,23,0.7)" />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: '#1C1917' }]}>
            You serve Sydney.{'\n'}Now let Sydney serve you back.
          </Text>
        </LinearGradient>

        <View style={styles.fullContent}>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant }]}>
            Essential workers (hospitality, retail, transport, service &amp; more) get <Text style={{ fontWeight: '600', color: m3Colors.onSurface }}>50% off CulturePass+</Text> when their workplace becomes a Nation Builder Partner. Plus a special badge.
          </Text>

          {/* Improved visual features — cleaner, higher quality */}
          <View style={styles.features}>
            <View style={[styles.featurePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Ionicons name="ticket-outline" size={18} color={CultureTokens.gold} />
              <Text style={[styles.featureText, { color: m3Colors.onSurface }]}>$69/yr (50% off)</Text>
            </View>
            <View style={[styles.featurePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Ionicons name="gift-outline" size={18} color={CultureTokens.gold} />
              <Text style={[styles.featureText, { color: m3Colors.onSurface }]}>Birthday gifts</Text>
            </View>
            <View style={[styles.featurePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Ionicons name="star-outline" size={18} color={CultureTokens.gold} />
              <Text style={[styles.featureText, { color: m3Colors.onSurface }]}>Exclusive access</Text>
            </View>
          </View>

          {/* Improved CTAs — Apply Now is now the clear primary action with quality URL */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryCta, { backgroundColor: CultureTokens.terracottaGlow }]}
              onPress={handleApplyNow}
              accessibilityLabel="Apply as a business or venue to become a Nation Builder Partner"
            >
              <Text style={[styles.primaryCtaText, { color: '#FFFFFF' }]}>
                Apply Now
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCta}
              onPress={handleLearnMore}
              accessibilityLabel="Learn more about the Nation Builders program"
            >
              <Text style={[styles.secondaryCtaText, { color: m3Colors.primary }]}>
                Learn More
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </M3Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Compact (kept for compatibility)
  compactCard: {
    margin: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  compactBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactTitle: {
    ...M3Typography.titleMedium,
    flex: 1,
  },
  compactSubtitle: {
    ...M3Typography.bodySmall,
    flex: 1,
    marginRight: 8,
  },
  compactChevron: {
    marginLeft: 8,
  },

  // Full variant – significantly improved visuals + UX
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  fullCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
  },
  badgeText: {
    ...M3Typography.labelSmall,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  title: {
    ...M3Typography.headlineSmall,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fullContent: {
    padding: 18,
    paddingTop: 16,
    gap: 14,
  },
  description: {
    ...M3Typography.bodyMedium,
    lineHeight: 20,
    fontSize: 14,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  featureText: {
    ...M3Typography.bodySmall,
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: Radius.md,
    flex: 1,
    minHeight: 46,
  },
  primaryCtaText: {
    ...M3Typography.labelLarge,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryCta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryCtaText: {
    ...M3Typography.labelLarge,
    fontWeight: '500',
    fontSize: 14,
  },
});