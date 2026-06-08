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
import { navigateToPageProEntity } from '@/lib/creationRouting';

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
    navigateToPageProEntity('community', 'nation_builders_promo', { intent: 'nation-builder' });
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
      entering={FadeInDown.duration(280)}
      exiting={SlideOutUp.duration(200)}
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
        {/* Cleaner, more subtle banner */}
        <View style={[styles.header, { backgroundColor: m3Colors.primaryContainer }]}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: m3Colors.primary }]}>
              <Ionicons name="shield-checkmark" size={14} color={m3Colors.onPrimary} />
              <Text style={[styles.badgeText, { color: m3Colors.onPrimary }]}>
                NATION BUILDERS
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              hitSlop={10}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Dismiss Nation Builders promo"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={16} color={m3Colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: m3Colors.onPrimaryContainer }]}>
            You serve. Now let the city serve you back.
          </Text>
        </View>

        <View style={styles.fullContent}>
          <Text style={[styles.description, { color: m3Colors.onSurfaceVariant }]}>
            Essential workers get <Text style={{ fontWeight: '600' }}>50% off CulturePass+</Text> when their workplace joins as a Nation Builder Partner.
          </Text>

          <View style={styles.features}>
            <View style={[styles.featurePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Ionicons name="ticket-outline" size={14} color={m3Colors.primary} />
              <Text style={[styles.featureText, { color: m3Colors.onSurface }]}>50% off</Text>
            </View>
            <View style={[styles.featurePill, { backgroundColor: m3Colors.surfaceContainerHigh }]}>
              <Ionicons name="gift-outline" size={14} color={m3Colors.primary} />
              <Text style={[styles.featureText, { color: m3Colors.onSurface }]}>Gifts</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryCta, { backgroundColor: m3Colors.primary }]}
              onPress={handleApplyNow}
            >
              <Text style={[styles.primaryCtaText, { color: m3Colors.onPrimary }]}>
                Apply as Partner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryCta}
              onPress={handleLearnMore}
            >
              <Text style={[styles.secondaryCtaText, { color: m3Colors.primary }]}>
                Learn more
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

  // Full variant – compact & cleaner
  wrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  fullCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  fullContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  features: {
    flexDirection: 'row',
    gap: 6,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  primaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.md,
  },
  primaryCtaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryCta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  secondaryCtaText: {
    fontSize: 13,
    fontWeight: '500',
  },
});