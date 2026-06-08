/**
 * Post-publish success with quick publish shortcuts
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { LuxeText, LuxeButton, GlassView } from '@/design-system/ui';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { Spacing } from '@/design-system/tokens/theme';
import { VerificationStatusBanner } from './VerificationStatusBanner';
import { navigateToCreateById } from '@/lib/creationRouting';

export interface PagePublishSuccessProps {
  pageId: string;
  entityType: string;
  verificationRequired: boolean;
  onDone?: () => void;
}

const QUICK_ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; categoryId: string }[] = [
  { label: 'New Event', icon: 'calendar-outline', categoryId: 'event' },
  { label: 'New Listing', icon: 'pricetag-outline', categoryId: 'other-listing' },
  { label: 'New Offer', icon: 'gift-outline', categoryId: 'offer' },
  { label: 'New Activity', icon: 'flash-outline', categoryId: 'activity' },
];

export function PagePublishSuccess({
  pageId,
  entityType,
  verificationRequired,
  onDone,
}: PagePublishSuccessProps) {
  const colors = useColors();
  const { hPad } = useLayout();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingHorizontal: hPad, backgroundColor: colors.background }]}
      accessibilityLabel="Page published successfully"
    >
      <View style={styles.hero}>
        <GlassView intensity={20} style={[styles.iconWrap, { backgroundColor: Luxe.colors.emerald + '15' }]}>
          <Ionicons name="sparkles" size={48} color={Luxe.colors.emerald} />
        </GlassView>
        <LuxeText variant="display" style={{ color: colors.text, textAlign: 'center' }}>
          Your Page is live
        </LuxeText>
        <LuxeText variant="body" style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 12, maxWidth: 380 }}>
          Your Page is your home on CulturePass — start sharing events, stories, and community with the diaspora.
        </LuxeText>
      </View>

      {verificationRequired && (
        <VerificationStatusBanner
          status="in_review"
          entityType={entityType as never}
          unlocksToday={['Page visible in HostSpace', 'Free posts & community updates']}
          unlocksAfter={['Paid ticketing', 'CultureMarket listings', 'Verified badge']}
          onAction={() => router.replace('/hostspace' as never)}
          location="post_publish"
        />
      )}

      <View style={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <LuxeButton
            key={action.label}
            variant="tonal"
            size="lg"
            leftIcon={action.icon}
            onPress={() =>
              navigateToCreateById(action.categoryId, {
                source: 'page_publish_success',
                parentProfileId: pageId,
              })
            }
            accessibilityLabel={`Create ${action.label}`}
          >
            {action.label}
          </LuxeButton>
        ))}
      </View>

      {onDone ? (
        <LuxeButton variant="filled" size="lg" onPress={onDone} style={{ marginTop: Spacing.lg }}>
          Done
        </LuxeButton>
      ) : (
        <LuxeButton
          variant="ghost"
          size="md"
          onPress={() => router.replace('/hostspace' as never)}
          style={{ marginTop: Spacing.lg }}
        >
          Back to HostSpace
        </LuxeButton>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actions: {
    gap: Spacing.sm,
  },
});