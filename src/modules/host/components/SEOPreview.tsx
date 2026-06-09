/**
 * SEOPreview Component
 *
 * Displays a live preview of how the profile will appear in:
 * - Google search results
 * - Facebook/Open Graph social cards
 * - Twitter Cards
 *
 * Also shows JSON-LD structured data summary and SEO health indicators.
 *
 * Requirements: 30
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3Card } from '@/design-system/ui/M3Card';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';
import {
  generateProfileSEO,
  generateMetaTitle,
  generateMetaDescription,
  type SEOProfileData,
  type ProfileSEOMeta,
  type SEOEntityType,
} from '../services/seoService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SEOPreviewProps {
  /** Profile data for SEO generation */
  profileData: SEOProfileData;
  /** Whether to show the full expanded view */
  expanded?: boolean;
  /** Callback when user wants to edit SEO fields */
  onEditRequest?: (field: 'tagline' | 'description' | 'handle') => void;
}

interface SEOScoreItem {
  label: string;
  status: 'good' | 'warning' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SEOPreview({
  profileData,
  expanded = false,
  onEditRequest,
}: SEOPreviewProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // Generate SEO metadata
  const seoMeta = useMemo<ProfileSEOMeta>(
    () => generateProfileSEO(profileData),
    [profileData],
  );

  // Calculate SEO health score
  const seoScore = useMemo(() => calculateSEOScore(profileData, seoMeta), [profileData, seoMeta]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View
      style={[styles.container, isDesktop && styles.containerDesktop]}
      accessible
      accessibilityLabel="SEO Preview"
    >
      {/* SEO Health Score */}
      <SEOHealthBadge score={seoScore.overall} />

      {/* Google Search Preview */}
      <M3Card style={[styles.previewCard, { backgroundColor: colors.card }]}>
        <View style={styles.previewHeader}>
          <Ionicons name="logo-google" size={16} color={colors.textSecondary} />
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
            Google Search Preview
          </Text>
        </View>

        <View style={styles.googlePreview}>
          <Text
            style={[styles.googleTitle, { color: CultureTokens.indigo }]}
            numberOfLines={1}
          >
            {seoMeta.title || 'Your Profile Title'}
          </Text>
          <Text
            style={[styles.googleUrl, { color: CultureTokens.teal }]}
            numberOfLines={1}
          >
            {seoMeta.canonicalUrl || 'culturepass.co/...'}
          </Text>
          <Text
            style={[styles.googleDescription, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {seoMeta.description || 'Your meta description will appear here...'}
          </Text>
        </View>
      </M3Card>

      {/* Social Media Preview */}
      <M3Card style={[styles.previewCard, { backgroundColor: colors.card }]}>
        <View style={styles.previewHeader}>
          <Ionicons name="share-social" size={16} color={colors.textSecondary} />
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
            Social Media Preview
          </Text>
        </View>

        <View style={[styles.socialPreview, { borderColor: colors.borderLight }]}>
          {/* Image placeholder */}
          <View style={[styles.socialImage, { backgroundColor: colors.surfaceElevated }]}>
            {(profileData.heroImageUrl || profileData.coverImageUrl) ? (
              <Text style={[styles.socialImageText, { color: colors.textTertiary }]}>
                Hero Image
              </Text>
            ) : (
              <View style={styles.socialImagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.socialImageText, { color: colors.textTertiary }]}>
                  Add a hero image for better social previews
                </Text>
              </View>
            )}
          </View>

          {/* Card content */}
          <View style={styles.socialContent}>
            <Text
              style={[styles.socialDomain, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              culturepass.co
            </Text>
            <Text
              style={[styles.socialTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {seoMeta.openGraph['og:title'] || 'Profile Title'}
            </Text>
            <Text
              style={[styles.socialDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {seoMeta.openGraph['og:description'] || 'Description preview...'}
            </Text>
          </View>
        </View>
      </M3Card>

      {/* SEO Checklist (expanded view) */}
      {expanded && (
        <M3Card style={[styles.previewCard, { backgroundColor: colors.card }]}>
          <View style={styles.previewHeader}>
            <Ionicons name="checkmark-done" size={16} color={colors.textSecondary} />
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              SEO Checklist
            </Text>
          </View>

          <View style={styles.checklist}>
            {seoScore.items.map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={18}
                  color={getStatusColor(item.status)}
                />
                <View style={styles.checklistContent}>
                  <Text style={[styles.checklistLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.checklistMessage, { color: colors.textSecondary }]}>
                    {item.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </M3Card>
      )}

      {/* Structured Data Preview (expanded view) */}
      {expanded && (
        <M3Card style={[styles.previewCard, { backgroundColor: colors.card }]}>
          <View style={styles.previewHeader}>
            <Ionicons name="code-slash" size={16} color={colors.textSecondary} />
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Structured Data (JSON-LD)
            </Text>
          </View>

          <View style={[styles.codeBlock, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.codeText, { color: colors.textSecondary }]}>
              {JSON.stringify(seoMeta.jsonLd, null, 2).substring(0, 500)}
              {JSON.stringify(seoMeta.jsonLd, null, 2).length > 500 ? '\n...' : ''}
            </Text>
          </View>
        </M3Card>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SEOHealthBadge({ score }: { score: number }) {
  const colors = useColors();
  const badgeColor =
    score >= 80 ? CultureTokens.teal :
    score >= 50 ? '#00A7EF' :
    CultureTokens.coral;

  const label =
    score >= 80 ? 'Good' :
    score >= 50 ? 'Needs Work' :
    'Poor';

  return (
    <View style={[styles.healthBadge, { borderColor: badgeColor }]}>
      <View style={[styles.healthScoreCircle, { borderColor: badgeColor }]}>
        <Text style={[styles.healthScoreText, { color: badgeColor }]}>
          {score}
        </Text>
      </View>
      <View style={styles.healthInfo}>
        <Text style={[styles.healthLabel, { color: colors.text }]}>
          SEO Score
        </Text>
        <Text style={[styles.healthStatus, { color: badgeColor }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate SEO health score based on profile completeness.
 */
function calculateSEOScore(
  profile: SEOProfileData,
  meta: ProfileSEOMeta,
): { overall: number; items: SEOScoreItem[] } {
  const items: SEOScoreItem[] = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  // Meta title (15 points)
  totalPoints += 15;
  const name = profile.officialName || profile.name || '';
  if (name.length >= 2) {
    earnedPoints += 15;
    items.push({
      label: 'Meta Title',
      status: 'good',
      message: `"${meta.title}" (${meta.title.length} chars)`,
    });
  } else {
    items.push({
      label: 'Meta Title',
      status: 'error',
      message: 'Add a profile name to generate a meta title',
    });
  }

  // Meta description (20 points)
  totalPoints += 20;
  if (meta.description.length >= 80) {
    earnedPoints += 20;
    items.push({
      label: 'Meta Description',
      status: 'good',
      message: `${meta.description.length} characters (ideal: 120-160)`,
    });
  } else if (meta.description.length >= 40) {
    earnedPoints += 10;
    items.push({
      label: 'Meta Description',
      status: 'warning',
      message: `${meta.description.length} chars — aim for 120-160 for best results`,
    });
  } else {
    items.push({
      label: 'Meta Description',
      status: 'error',
      message: 'Add a tagline and description for better search visibility',
    });
  }

  // Hero/OG image (15 points)
  totalPoints += 15;
  const hasImage = !!(profile.heroImageUrl || profile.coverImageUrl || profile.logoUrl || profile.imageUrl);
  if (hasImage) {
    earnedPoints += 15;
    items.push({
      label: 'Social Image',
      status: 'good',
      message: 'Image set for social sharing previews',
    });
  } else {
    items.push({
      label: 'Social Image',
      status: 'error',
      message: 'Add a hero image for attractive social media previews',
    });
  }

  // Handle / URL (15 points)
  totalPoints += 15;
  const handle = (profile.handle ?? '').trim();
  if (handle && profile.handleStatus === 'approved') {
    earnedPoints += 15;
    items.push({
      label: 'Custom URL',
      status: 'good',
      message: `Using approved handle: @${handle}`,
    });
  } else if (handle) {
    earnedPoints += 8;
    items.push({
      label: 'Custom URL',
      status: 'warning',
      message: 'Handle pending approval — URL will update once approved',
    });
  } else {
    items.push({
      label: 'Custom URL',
      status: 'warning',
      message: 'Set a handle for a cleaner, more memorable URL',
    });
  }

  // Category tags (10 points)
  totalPoints += 10;
  const tags = profile.categoryTags || profile.tags || [];
  if (tags.length >= 3) {
    earnedPoints += 10;
    items.push({
      label: 'Category Tags',
      status: 'good',
      message: `${tags.length} tags selected for discoverability`,
    });
  } else if (tags.length > 0) {
    earnedPoints += 5;
    items.push({
      label: 'Category Tags',
      status: 'warning',
      message: `${tags.length} tag(s) — add at least 3 for better SEO`,
    });
  } else {
    items.push({
      label: 'Category Tags',
      status: 'error',
      message: 'Add category tags to improve search ranking',
    });
  }

  // Contact info (10 points)
  totalPoints += 10;
  const hasContact = !!(profile.publicEmail || profile.email || profile.phone);
  if (hasContact) {
    earnedPoints += 10;
    items.push({
      label: 'Contact Info',
      status: 'good',
      message: 'Contact details available for structured data',
    });
  } else {
    items.push({
      label: 'Contact Info',
      status: 'warning',
      message: 'Add contact info for richer search results',
    });
  }

  // Location (15 points)
  totalPoints += 15;
  const hasLocation = !!(
    profile.primaryAddress?.city ||
    profile.city ||
    (profile.primaryAddress?.latitude && profile.primaryAddress?.longitude) ||
    (profile.latitude && profile.longitude)
  );
  if (hasLocation) {
    earnedPoints += 15;
    items.push({
      label: 'Location Data',
      status: 'good',
      message: 'Location set for local search visibility',
    });
  } else {
    items.push({
      label: 'Location Data',
      status: 'warning',
      message: 'Add a location for local search results',
    });
  }

  const overall = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return { overall, items };
}

function getStatusIcon(status: 'good' | 'warning' | 'error'): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'good':
      return 'checkmark-circle';
    case 'warning':
      return 'alert-circle';
    case 'error':
      return 'close-circle';
  }
}

function getStatusColor(status: 'good' | 'warning' | 'error'): string {
  switch (status) {
    case 'good':
      return CultureTokens.teal;
    case 'warning':
      return '#00A7EF';
    case 'error':
      return CultureTokens.coral;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  containerDesktop: {
    maxWidth: 600,
  },
  previewCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Google Preview
  googlePreview: {
    gap: 2,
  },
  googleTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    textDecorationLine: 'underline',
    lineHeight: 24,
  },
  googleUrl: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  googleDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginTop: 2,
  },

  // Social Preview
  socialPreview: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  socialImage: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialImagePlaceholder: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  socialImageText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  socialContent: {
    padding: Spacing.md,
    gap: 2,
  },
  socialDomain: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  socialTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    lineHeight: 22,
  },
  socialDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },

  // SEO Health Badge
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    alignSelf: 'flex-start',
  },
  healthScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  healthInfo: {
    gap: 1,
  },
  healthLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  healthStatus: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },

  // Checklist
  checklist: {
    gap: Spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checklistContent: {
    flex: 1,
    gap: 1,
  },
  checklistLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  checklistMessage: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },

  // Code Block
  codeBlock: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  codeText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});
