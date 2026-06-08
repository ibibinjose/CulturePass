/**
 * Live Page home preview — "Your Page is your home on CulturePass"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { useLayout } from '@/hooks/useLayout';
import { M3Card, GlassView } from '@/design-system/ui';
import { M3Typography } from '@/design-system/tokens/typography';
import { Radius, Spacing } from '@/design-system/tokens/theme';
import type { HostPageFormData } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';

export interface PageHomePreviewProps {
  formData: HostPageFormData;
  entityType: HostEntityType;
}

const ENTITY_LABELS: Record<string, string> = {
  community: 'Community',
  organiser: 'Organiser',
  organizer: 'Organiser',
  venue: 'Venue',
  business: 'Business',
  artist: 'Artist',
  professional: 'Professional',
};

export function PageHomePreview({ formData, entityType }: PageHomePreviewProps) {
  const colors = useM3Colors();
  const { isDesktop } = useLayout();

  const coverUri = formData.coverUrl;
  const logoUri = formData.logoUrl;
  const displayName = formData.name?.trim() || 'Your Page Name';
  const bio = formData.bio?.trim() || 'Your bio appears here — tell the diaspora who you are.';
  const ctaLabel = formData.ctaLabel ?? 'Follow';

  return (
    <M3Card
      style={[styles.card, isDesktop && styles.cardDesktop, { backgroundColor: colors.surfaceContainerLow }]}
      accessibilityLabel={`Page preview for ${displayName}`}
    >
      <View style={styles.coverWrap}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" accessibilityLabel="Cover image preview" />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: colors.surfaceContainerHighest }]}>
            <Ionicons name="image-outline" size={32} color={colors.onSurfaceVariant} />
            <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
              Cover 820×312+
            </Text>
          </View>
        )}
        <GlassView intensity={24} style={styles.coverOverlay}>
          <Text style={[M3Typography.labelSmall, { color: colors.onPrimary, opacity: 0.9 }]}>
            Your Page is your home on CulturePass
          </Text>
        </GlassView>
      </View>

      <View style={styles.body}>
        <View style={styles.logoRow}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} contentFit="cover" accessibilityLabel="Logo preview" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="person-circle-outline" size={36} color={colors.onPrimaryContainer} />
            </View>
          )}
          <View style={styles.titleBlock}>
            <Text style={[M3Typography.titleLarge, { color: colors.onSurface }]} numberOfLines={2}>
              {displayName}
            </Text>
            <Text style={[M3Typography.labelMedium, { color: colors.primary }]}>
              {ENTITY_LABELS[entityType] ?? 'Page'}
            </Text>
          </View>
        </View>

        <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: Spacing.sm }]} numberOfLines={4}>
          {bio}
        </Text>

        {(formData.publicEmail || formData.phoneNumber || formData.primaryAddress?.city) && (
          <View style={[styles.metaBlock, { backgroundColor: colors.surfaceContainerHighest }]}>
            {formData.publicEmail ? (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>{formData.publicEmail}</Text>
              </View>
            ) : null}
            {formData.phoneNumber ? (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]}>{formData.phoneNumber}</Text>
              </View>
            ) : null}
            {formData.primaryAddress?.city ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {[formData.primaryAddress.city, formData.primaryAddress.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {(formData.culturalTags?.length > 0 || formData.languageTags?.length > 0) && (
          <View style={styles.tagRow}>
            {[...(formData.culturalTags ?? []), ...(formData.languageTags ?? [])].slice(0, 6).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[M3Typography.labelSmall, { color: colors.onSecondaryContainer }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.cta, { backgroundColor: colors.primary }]}>
          <Text style={[M3Typography.labelLarge, { color: colors.onPrimary }]}>{ctaLabel}</Text>
        </View>

        <Text style={[M3Typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: Spacing.md, textAlign: 'center' }]}>
          {formData.membershipModel === 'paid'
            ? 'Paid membership'
            : formData.membershipModel === 'invite-only'
              ? 'Invite-only'
              : 'Free to follow'}
        </Text>
      </View>
    </M3Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
  },
  cardDesktop: {
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  coverWrap: {
    height: 160,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  body: {
    padding: Spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -40,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  titleBlock: {
    flex: 1,
    marginLeft: Spacing.md,
    paddingTop: 40,
  },
  metaBlock: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  cta: {
    marginTop: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
});