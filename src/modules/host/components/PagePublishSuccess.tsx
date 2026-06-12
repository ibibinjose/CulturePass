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
import { OrgHostListingCreateSection } from './OrgHostListingCreateSection';

export interface PagePublishSuccessProps {
  pageId: string;
  entityType: string;
  verificationRequired: boolean;
  onDone?: () => void;
}

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
          Your org or community page is ready — add events, offers, and listings under your host profile.
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

      <OrgHostListingCreateSection hostPageId={pageId} source="page_publish_success" />

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
});