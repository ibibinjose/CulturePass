/**
 * CommunityFields Component
 *
 * Entity-specific fields for community profiles in the HostSpace wizard.
 *
 * Features:
 * - Membership model selector (Free, Paid, Invite-Only)
 * - Monthly fee input with AUD currency formatting (shown when Paid)
 * - Membership count display (read-only, auto-populated)
 * - Growth chart (sparkline showing 90-day membership trend)
 * - Community guidelines rich text with AI moderation
 * - Community logo/banner upload
 *
 * Validates: Requirements 12
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { M3Card } from '@/design-system/ui/M3Card';
import { Input } from '@/design-system/ui/Input';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
} from '@/design-system/tokens/theme';
import { RichTextEditor } from '../fields/RichTextEditor';
import { MediaUploadField } from '../fields/MediaUploadField';
import type { WizardStepProps } from '../FormWizard/WizardStep';
import type { CommunityData } from '../../schemas/profileSchema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEMBERSHIP_MODELS = [
  {
    value: 'free' as const,
    label: 'Free',
    description: 'Open to everyone at no cost',
    icon: 'people' as const,
  },
  {
    value: 'paid' as const,
    label: 'Paid',
    description: 'Monthly or annual subscription',
    icon: 'card' as const,
  },
  {
    value: 'invite-only' as const,
    label: 'Invite-Only',
    description: 'Members join by invitation',
    icon: 'mail' as const,
  },
] as const;

const GUIDELINES_MIN_LENGTH = 100;
const GUIDELINES_MAX_LENGTH = 5000;

/**
 * Default community guidelines template with standard sections.
 */
const GUIDELINES_TEMPLATE = `## Welcome

Welcome to our community! Please read these guidelines carefully.

## Respect & Inclusion

- Treat all members with respect and dignity
- Embrace diversity and cultural differences
- No discrimination, harassment, or hate speech

## Content Standards

- Share relevant, constructive content
- No spam, self-promotion without permission, or misleading information
- Credit original creators when sharing their work

## Safety

- Protect personal information (yours and others')
- Report any concerning behaviour to moderators
- Follow all applicable laws and platform policies

## Consequences

Violations may result in warnings, temporary suspension, or permanent removal.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MembershipModel = 'free' | 'paid' | 'invite-only';

interface ModerationResult {
  flagged: boolean;
  issues: string[];
}

export interface CommunityFieldsProps
  extends Omit<WizardStepProps, 'step' | 'isValidating'> {}

// ---------------------------------------------------------------------------
// Sparkline Component (Growth Chart)
// ---------------------------------------------------------------------------

interface SparklineProps {
  data: { date: string; memberCount: number }[];
  width?: number;
  height?: number;
}

/**
 * Minimal SVG-free sparkline rendered with View elements.
 * Shows 90-day membership growth trend.
 */
function Sparkline({ data, width = 200, height = 48 }: SparklineProps) {
  const colors = useColors();

  if (data.length < 2) {
    return (
      <View
        style={[sparklineStyles.empty, { width, height }]}
        accessibilityLabel="No growth data available yet"
      >
        <Text style={[sparklineStyles.emptyText, { color: colors.textTertiary }]}>
          No data yet
        </Text>
      </View>
    );
  }

  const values = data.map((d) => d.memberCount);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // Calculate bar widths and heights
  const barWidth = Math.max(2, (width - (values.length - 1) * 2) / values.length);
  const isGrowing = values[values.length - 1] > values[0];

  return (
    <View
      style={[sparklineStyles.container, { width, height }]}
      accessibilityRole="image"
      accessibilityLabel={`Membership growth chart. ${isGrowing ? 'Growing' : 'Declining'} trend over ${data.length} data points. Current: ${values[values.length - 1]} members.`}
    >
      {values.map((value, index) => {
        const barHeight = Math.max(2, ((value - min) / range) * (height - 4));
        return (
          <View
            key={`bar-${index}`}
            style={[
              sparklineStyles.bar,
              {
                width: barWidth,
                height: barHeight,
                backgroundColor: isGrowing ? CultureTokens.teal : CultureTokens.coral,
                opacity: 0.4 + (index / values.length) * 0.6,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const sparklineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    borderRadius: 1,
  },
  empty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CommunityFields({
  entityType,
  formData,
  updateFormData,
  validationErrors,
  getFieldError,
}: CommunityFieldsProps) {
  const colors = useColors();
  const { isDesktop, isMobile } = useLayout();

  // AI moderation state
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [isModerating, setIsModerating] = useState(false);

  // ---------------------------------------------------------------------------
  // Derived State
  // ---------------------------------------------------------------------------

  const communityData: Partial<CommunityData> = formData.communityData || {};
  const membershipModel = communityData.membershipModel || 'free';
  const monthlyFee = communityData.monthlyFee;
  const membershipCount = communityData.membershipCount || 0;
  const growthData = communityData.growthData || [];
  const guidelines = communityData.guidelines || '';
  const communityLogoUrl = communityData.communityLogoUrl || '';
  const communityBannerUrl = communityData.communityBannerUrl || '';

  const isPaidModel = membershipModel === 'paid';

  // Format monthly fee for display (stored in cents)
  const formattedFee = useMemo(() => {
    if (monthlyFee === undefined || monthlyFee === null) return '';
    return (monthlyFee / 100).toFixed(2);
  }, [monthlyFee]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateCommunityData = useCallback(
    (updates: Partial<CommunityData>) => {
      updateFormData({
        communityData: {
          ...communityData,
          ...updates,
        } as CommunityData,
      });
    },
    [communityData, updateFormData],
  );

  const handleMembershipModelChange = useCallback(
    (model: MembershipModel) => {
      const updates: Partial<CommunityData> = { membershipModel: model };
      // Clear monthly fee if switching away from paid
      if (model !== 'paid') {
        updates.monthlyFee = undefined;
      }
      updateCommunityData(updates);
    },
    [updateCommunityData],
  );

  const handleMonthlyFeeChange = useCallback(
    (text: string) => {
      // Strip non-numeric characters except decimal point
      const cleaned = text.replace(/[^0-9.]/g, '');
      const numericValue = parseFloat(cleaned);

      if (isNaN(numericValue)) {
        updateCommunityData({ monthlyFee: undefined });
      } else {
        // Store in cents
        updateCommunityData({ monthlyFee: Math.round(numericValue * 100) });
      }
    },
    [updateCommunityData],
  );

  const handleGuidelinesChange = useCallback(
    (text: string) => {
      updateCommunityData({ guidelines: text });
      // Clear previous moderation result when text changes
      if (moderationResult) {
        setModerationResult(null);
      }
    },
    [updateCommunityData, moderationResult],
  );

  const handleUseTemplate = useCallback(() => {
    updateCommunityData({ guidelines: GUIDELINES_TEMPLATE });
  }, [updateCommunityData]);

  /**
   * Run AI moderation check on community guidelines.
   * Flags content that may violate platform policies.
   */
  const handleRunModeration = useCallback(async () => {
    if (!guidelines || guidelines.length < GUIDELINES_MIN_LENGTH) return;

    setIsModerating(true);
    try {
      // Simulate AI moderation check (in production, call api.ai.moderate)
      // Check for common policy violations
      const lowerGuidelines = guidelines.toLowerCase();
      const issues: string[] = [];

      // Check for potentially problematic content
      const flagPatterns = [
        { pattern: /discriminat/i, issue: 'Content may contain discriminatory language' },
        { pattern: /hate\s*speech/i, issue: 'References to hate speech should be in prohibition context only' },
        { pattern: /violence|violent/i, issue: 'References to violence detected — ensure context is appropriate' },
      ];

      for (const { pattern, issue } of flagPatterns) {
        if (pattern.test(lowerGuidelines)) {
          // Only flag if not in a prohibition context (e.g., "No hate speech")
          const prohibitionContext = /\b(no|not|never|prohibit|ban|forbid)\b/i;
          const sentences = lowerGuidelines.split(/[.!?\n]/);
          for (const sentence of sentences) {
            if (pattern.test(sentence) && !prohibitionContext.test(sentence)) {
              issues.push(issue);
              break;
            }
          }
        }
      }

      setModerationResult({
        flagged: issues.length > 0,
        issues,
      });
    } catch (err) {
      if (__DEV__) console.error('Moderation check failed:', err);
    } finally {
      setIsModerating(false);
    }
  }, [guidelines]);

  const handleCommunityLogoChange = useCallback(
    (value: string | string[]) => {
      const url = Array.isArray(value) ? value[0] : value;
      updateCommunityData({ communityLogoUrl: url || undefined });
    },
    [updateCommunityData],
  );

  const handleCommunityBannerChange = useCallback(
    (value: string | string[]) => {
      const url = Array.isArray(value) ? value[0] : value;
      updateCommunityData({ communityBannerUrl: url || undefined });
    },
    [updateCommunityData],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Community Details
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Define your community structure, guidelines, and branding
        </Text>
      </View>

      {/* Membership Model Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="people"
              size={20}
              color={CultureTokens.indigo}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Membership Model
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose how members join your community
          </Text>
        </View>

        <View style={[styles.modelGrid, isMobile && styles.modelGridMobile]}>
          {MEMBERSHIP_MODELS.map((model) => {
            const isSelected = membershipModel === model.value;
            return (
              <Pressable
                key={model.value}
                onPress={() => handleMembershipModelChange(model.value)}
                style={[
                  styles.modelCard,
                  {
                    backgroundColor: isSelected
                      ? `${CultureTokens.indigo}10`
                      : colors.card,
                    borderColor: isSelected
                      ? CultureTokens.indigo
                      : colors.borderLight,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityLabel={`${model.label}: ${model.description}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.modelCardContent}>
                  <View
                    style={[
                      styles.modelIconContainer,
                      {
                        backgroundColor: isSelected
                          ? CultureTokens.indigo
                          : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Ionicons
                      name={model.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.modelLabel,
                      { color: isSelected ? CultureTokens.indigo : colors.text },
                    ]}
                  >
                    {model.label}
                  </Text>
                  <Text style={[styles.modelDescription, { color: colors.textSecondary }]}>
                    {model.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.modelCheckmark}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={CultureTokens.indigo}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {getFieldError('communityData.membershipModel') && (
          <Text
            style={[styles.errorText, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {getFieldError('communityData.membershipModel')}
          </Text>
        )}
      </View>

      {/* Monthly Fee Section (shown only for Paid model) */}
      {isPaidModel && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="cash"
                size={20}
                color={CultureTokens.teal}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Monthly Fee
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Set the monthly subscription price for your community
            </Text>
          </View>

          <View style={styles.feeInputRow}>
            <Text style={[styles.currencyPrefix, { color: colors.text }]}>
              AUD $
            </Text>
            <Input
              value={formattedFee}
              onChangeText={handleMonthlyFeeChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              label="Amount per month"
              hint="Enter the monthly membership fee in AUD"
              error={getFieldError('communityData.monthlyFee')}
              containerStyle={styles.feeInput}
              accessibilityLabel="Monthly membership fee in Australian dollars"
            />
          </View>

          {monthlyFee !== undefined && monthlyFee > 0 && (
            <View style={[styles.feeSummary, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.feeSummaryText, { color: colors.textSecondary }]}>
                Members will be charged{' '}
                <Text style={{ fontFamily: FontFamily.semibold, color: colors.text }}>
                  ${(monthlyFee / 100).toFixed(2)} AUD
                </Text>
                {' '}per month
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Membership Count & Growth Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="trending-up"
              size={20}
              color={CultureTokens.teal}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Membership Overview
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Current membership count and growth trend
          </Text>
        </View>

        <M3Card style={[styles.metricsCard, { backgroundColor: colors.card }]}>
          <View style={styles.metricsRow}>
            {/* Membership Count */}
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {membershipCount.toLocaleString()}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Members
              </Text>
            </View>

            {/* Growth Chart */}
            <View style={styles.metricItem}>
              <Sparkline
                data={growthData}
                width={isMobile ? 140 : 200}
                height={48}
              />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                90-day trend
              </Text>
            </View>
          </View>

          {membershipCount === 0 && (
            <Text style={[styles.metricsHint, { color: colors.textTertiary }]}>
              Membership count will update automatically as members join
            </Text>
          )}
        </M3Card>
      </View>

      {/* Community Guidelines Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="document-text"
              size={20}
              color={CultureTokens.violet}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Community Guidelines
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Set expectations for member behaviour and content standards
          </Text>
        </View>

        {/* Template Button */}
        {!guidelines && (
          <Pressable
            onPress={handleUseTemplate}
            style={[styles.templateButton, { borderColor: CultureTokens.violet }]}
            accessibilityRole="button"
            accessibilityLabel="Use community guidelines template"
            accessibilityHint="Fills in a standard community guidelines template that you can customise"
          >
            <Ionicons name="document" size={16} color={CultureTokens.violet} />
            <Text style={[styles.templateButtonText, { color: CultureTokens.violet }]}>
              Use Template
            </Text>
          </Pressable>
        )}

        <RichTextEditor
          value={guidelines}
          onChange={handleGuidelinesChange}
          placeholder="Write your community guidelines here..."
          maxLength={GUIDELINES_MAX_LENGTH}
          showAIAssist={true}
          showReadabilityScore={false}
          fieldType="guidelines"
          label="Guidelines"
          hint={`${guidelines.length}/${GUIDELINES_MAX_LENGTH} characters (minimum ${GUIDELINES_MIN_LENGTH})`}
          error={getFieldError('communityData.guidelines')}
          minHeight={200}
        />

        {/* AI Moderation Check */}
        {guidelines.length >= GUIDELINES_MIN_LENGTH && (
          <View style={styles.moderationSection}>
            <Pressable
              onPress={handleRunModeration}
              disabled={isModerating}
              style={[
                styles.moderationButton,
                {
                  backgroundColor: isModerating
                    ? colors.surfaceElevated
                    : `${CultureTokens.violet}10`,
                  borderColor: CultureTokens.violet,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Run AI moderation check on guidelines"
              accessibilityState={{ disabled: isModerating }}
            >
              {isModerating ? (
                <ActivityIndicator size="small" color={CultureTokens.violet} />
              ) : (
                <Ionicons name="shield-checkmark" size={16} color={CultureTokens.violet} />
              )}
              <Text style={[styles.moderationButtonText, { color: CultureTokens.violet }]}>
                {isModerating ? 'Checking...' : 'Run AI Moderation Check'}
              </Text>
            </Pressable>

            {/* Moderation Results */}
            {moderationResult && (
              <View
                style={[
                  styles.moderationResult,
                  {
                    backgroundColor: moderationResult.flagged
                      ? `${CultureTokens.coral}10`
                      : `${CultureTokens.teal}10`,
                    borderColor: moderationResult.flagged
                      ? CultureTokens.coral
                      : CultureTokens.teal,
                  },
                ]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <View style={styles.moderationResultHeader}>
                  <Ionicons
                    name={moderationResult.flagged ? 'warning' : 'checkmark-circle'}
                    size={18}
                    color={moderationResult.flagged ? CultureTokens.coral : CultureTokens.teal}
                  />
                  <Text
                    style={[
                      styles.moderationResultTitle,
                      {
                        color: moderationResult.flagged
                          ? CultureTokens.coral
                          : CultureTokens.teal,
                      },
                    ]}
                  >
                    {moderationResult.flagged
                      ? 'Review Required'
                      : 'Guidelines Look Good'}
                  </Text>
                </View>
                {moderationResult.flagged && moderationResult.issues.length > 0 && (
                  <View style={styles.moderationIssues}>
                    {moderationResult.issues.map((issue, index) => (
                      <View key={index} style={styles.moderationIssueRow}>
                        <Text style={[styles.moderationIssueBullet, { color: CultureTokens.coral }]}>
                          •
                        </Text>
                        <Text style={[styles.moderationIssueText, { color: colors.text }]}>
                          {issue}
                        </Text>
                      </View>
                    ))}
                    <Text style={[styles.moderationHint, { color: colors.textSecondary }]}>
                      Please review the flagged content and update if needed before publishing.
                    </Text>
                  </View>
                )}

                {!moderationResult.flagged && (
                  <Text style={[styles.moderationPassText, { color: colors.textSecondary }]}>
                    No policy violations detected. Your guidelines are ready to publish.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Community Logo Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="image"
              size={20}
              color={CultureTokens.indigo}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Community Logo
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Optional logo specific to your community (distinct from your profile logo)
          </Text>
        </View>

        <MediaUploadField
          type="logo"
          value={communityLogoUrl}
          onChange={handleCommunityLogoChange}
          storagePath={`profiles/${formData.handle || 'draft'}/community`}
          aspectRatio={1}
          minDimensions={{ width: 400, height: 400 }}
          label="Community Logo"
          hint="Square image, 400×400px minimum. JPEG or PNG."
          error={getFieldError('communityData.communityLogoUrl')}
          showCropTool={true}
          showBackgroundRemoval={true}
        />
      </View>

      {/* Community Banner Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="image"
              size={20}
              color={CultureTokens.indigo}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Community Banner
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Optional banner image for your community page header
          </Text>
        </View>

        <MediaUploadField
          type="hero"
          value={communityBannerUrl}
          onChange={handleCommunityBannerChange}
          storagePath={`profiles/${formData.handle || 'draft'}/community`}
          aspectRatio={16 / 9}
          label="Community Banner"
          hint="Wide image (16:9 aspect ratio). JPEG or PNG."
          error={getFieldError('communityData.communityBannerUrl')}
          showCropTool={true}
        />
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  contentDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginLeft: 28,
  },
  // Membership Model styles
  modelGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modelGridMobile: {
    flexDirection: 'column',
  },
  modelCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    minHeight: 120,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s',
      },
    }),
  },
  modelCardContent: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  modelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    textAlign: 'center',
  },
  modelDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
  modelCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Monthly Fee styles
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    paddingTop: 20, // Align with input field (accounting for label)
  },
  feeInput: {
    flex: 1,
  },
  feeSummary: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  feeSummaryText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },

  // Metrics styles
  metricsCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricValue: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    lineHeight: 40,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  metricsHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  // Guidelines styles
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  templateButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },

  // Moderation styles
  moderationSection: {
    gap: Spacing.md,
  },
  moderationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  moderationButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  moderationResult: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  moderationResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moderationResultTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  moderationIssues: {
    gap: Spacing.xs,
    marginLeft: 26,
  },
  moderationIssueRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  moderationIssueBullet: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  moderationIssueText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    flex: 1,
    lineHeight: 18,
  },
  moderationHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  moderationPassText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginLeft: 26,
  },
  // Error styles
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginLeft: 4,
  },

  // Bottom spacer
  bottomSpacer: {
    height: Spacing.xl,
  },
});

export default CommunityFields;
