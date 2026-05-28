/**
 * ProfessionalFields Component
 *
 * Entity-specific fields for the "professional" entity type in the HostSpace
 * Enterprise-Grade Form System. Collects credentials, influencer licence,
 * expertise areas, availability, rate card, and response time.
 *
 * Features:
 * - Credentials upload with verification workflow
 * - Influencer licence field (platform, handle, follower count)
 * - Expertise areas multi-select with AI extraction
 * - Availability toggle (Available / Not Available / By Request)
 * - Rate card with tiers (Hourly, Project-Based, Sponsorship) and currency
 * - Response time selector (24 hours, 2-3 days, 1 week)
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 *
 * Requirements: 17
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore - expo-document-picker may not be installed
// eslint-disable-next-line import/no-unresolved
import * as DocumentPicker from 'expo-document-picker';

import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import {
  CultureTokens,
  Spacing,
  Radius,
  FontFamily,
  ButtonTokens,
  InputTokens,
} from '@/design-system/tokens/theme';
import type { ProfessionalData, RateCardTier } from '@/shared/schema/hostProfile';
import type { PartialFormData } from '../../services/formStateSerializer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfessionalFieldsProps {
  /** Current form data */
  formData: PartialFormData;
  /** Update form data callback */
  updateFormData: (data: Partial<PartialFormData>) => void;
  /** Get field error helper */
  getFieldError: (field: string) => string | undefined;
  /** Whether validation is in progress */
  isValidating?: boolean;
}

type AvailabilityStatus = 'available' | 'not-available' | 'by-request';
type Currency = 'AUD' | 'USD' | 'GBP' | 'EUR' | 'NZD' | 'AED';
type ResponseTime = '24-hours' | '2-3-days' | '1-week';
type RateCardType = 'hourly' | 'project-based' | 'sponsorship';

interface InfluencerLicence {
  platform: string;
  handle: string;
  followerCount: number;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Predefined expertise areas taxonomy */
const EXPERTISE_AREAS = [
  'Business Strategy',
  'Marketing & Advertising',
  'Social Media Management',
  'Content Creation',
  'Photography',
  'Videography',
  'Graphic Design',
  'Web Development',
  'App Development',
  'Data Analytics',
  'Financial Planning',
  'Legal Consulting',
  'HR & Recruitment',
  'Event Management',
  'Public Relations',
  'Brand Management',
  'UX/UI Design',
  'Copywriting',
  'SEO & SEM',
  'Community Management',
  'Cultural Consulting',
  'Translation & Interpretation',
  'Music Production',
  'Voice Over',
  'Coaching & Mentoring',
  'Health & Wellness',
  'Fitness Training',
  'Nutrition',
  'Education & Training',
  'Research & Analysis',
];

/** Available currencies */
const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'AUD', label: 'AUD', symbol: 'A$' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'GBP', label: 'GBP', symbol: '£' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'NZD', label: 'NZD', symbol: 'NZ$' },
  { value: 'AED', label: 'AED', symbol: 'د.إ' },
];

/** Rate card tier options */
const RATE_CARD_TYPES: { value: RateCardType; label: string; description: string }[] = [
  { value: 'hourly', label: 'Hourly', description: 'Per hour rate' },
  { value: 'project-based', label: 'Project-Based', description: 'Fixed project fee' },
  { value: 'sponsorship', label: 'Sponsorship', description: 'Sponsorship/collaboration rate' },
];

/** Response time options */
const RESPONSE_TIME_OPTIONS: { value: ResponseTime; label: string }[] = [
  { value: '24-hours', label: 'Within 24 hours' },
  { value: '2-3-days', label: '2–3 days' },
  { value: '1-week', label: '1 week' },
];

/** Availability status options */
const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; icon: string }[] = [
  { value: 'available', label: 'Available', icon: 'checkmark-circle' },
  { value: 'not-available', label: 'Not Available', icon: 'close-circle' },
  { value: 'by-request', label: 'By Request', icon: 'mail' },
];

/** Social platforms for influencer licence */
const INFLUENCER_PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Twitter/X',
  'Facebook',
  'LinkedIn',
  'Other',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfessionalFields({
  formData,
  updateFormData,
  getFieldError,
  isValidating = false,
}: ProfessionalFieldsProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();

  // Local state
  const [isUploadingCredential, setIsUploadingCredential] = useState(false);
  const [showInfluencerFields, setShowInfluencerFields] = useState(
    !!formData.professionalData?.influencerLicence
  );
  const [aiExtracting, setAiExtracting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Accessors
  // ---------------------------------------------------------------------------

  const professionalData = useMemo(() => formData.professionalData || {
    credentials: [],
    credentialsVerified: false,
    expertiseAreas: [],
    availabilityStatus: 'available' as AvailabilityStatus,
    rateCard: [],
    currency: 'AUD' as Currency,
    responseTime: '24-hours' as ResponseTime,
  }, [formData.professionalData]);

  const credentials = professionalData.credentials || [];
  const influencerLicence = professionalData.influencerLicence;
  const expertiseAreas = professionalData.expertiseAreas || [];
  const availabilityStatus = professionalData.availabilityStatus || 'available';
  const rateCard = professionalData.rateCard || [];
  const currency = professionalData.currency || 'AUD';
  const responseTime = professionalData.responseTime || '24-hours';

  // ---------------------------------------------------------------------------
  // Update Helpers
  // ---------------------------------------------------------------------------

  const updateProfessionalData = useCallback(
    (updates: Partial<ProfessionalData>) => {
      updateFormData({
        professionalData: {
          ...professionalData,
          ...updates,
        } as ProfessionalData,
      });
    },
    [professionalData, updateFormData]
  );

  // ---------------------------------------------------------------------------
  // Credentials Upload
  // ---------------------------------------------------------------------------

  const handleUploadCredential = useCallback(async () => {
    try {
      setIsUploadingCredential(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
      });

      if (!result.canceled && result.assets?.length) {
        // In production, upload to Firebase Storage and get download URLs
        // For now, use the local URI as placeholder
        const newUrls = result.assets.map((asset: { uri: string }) => asset.uri);
        updateProfessionalData({
          credentials: [...credentials, ...newUrls],
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Credential upload error:', error);
    } finally {
      setIsUploadingCredential(false);
    }
  }, [credentials, updateProfessionalData]);

  const handleRemoveCredential = useCallback(
    (index: number) => {
      const updated = credentials.filter((_, i) => i !== index);
      updateProfessionalData({ credentials: updated });
    },
    [credentials, updateProfessionalData]
  );

  // ---------------------------------------------------------------------------
  // Influencer Licence
  // ---------------------------------------------------------------------------

  const handleInfluencerToggle = useCallback(() => {
    const newShow = !showInfluencerFields;
    setShowInfluencerFields(newShow);
    if (!newShow) {
      updateProfessionalData({ influencerLicence: undefined });
    }
  }, [showInfluencerFields, updateProfessionalData]);

  const handleInfluencerUpdate = useCallback(
    (updates: Partial<InfluencerLicence>) => {
      const current = influencerLicence || {
        platform: '',
        handle: '',
        followerCount: 0,
        verified: false,
      };
      updateProfessionalData({
        influencerLicence: { ...current, ...updates },
      });
    },
    [influencerLicence, updateProfessionalData]
  );

  // ---------------------------------------------------------------------------
  // Expertise Areas
  // ---------------------------------------------------------------------------

  const handleToggleExpertise = useCallback(
    (area: string) => {
      const updated = expertiseAreas.includes(area)
        ? expertiseAreas.filter((a) => a !== area)
        : [...expertiseAreas, area];
      updateProfessionalData({ expertiseAreas: updated });
    },
    [expertiseAreas, updateProfessionalData]
  );

  const handleAIExtractExpertise = useCallback(async () => {
    setAiExtracting(true);
    try {
      // Simulate AI extraction from credentials/description
      // In production, this calls the AI service to analyze uploaded documents
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // AI would suggest areas based on uploaded credentials
      const suggested = EXPERTISE_AREAS.slice(0, 5);
      const merged = [...new Set([...expertiseAreas, ...suggested])];
      updateProfessionalData({ expertiseAreas: merged });
    } catch (error) {
      if (__DEV__) console.error('AI extraction error:', error);
    } finally {
      setAiExtracting(false);
    }
  }, [expertiseAreas, updateProfessionalData]);

  // ---------------------------------------------------------------------------
  // Rate Card
  // ---------------------------------------------------------------------------

  const handleAddRateCardTier = useCallback(
    (type: RateCardType) => {
      // Don't add duplicate tier types
      if (rateCard.some((tier) => tier.type === type)) return;
      const newTier: RateCardTier = { type, rate: 0 };
      updateProfessionalData({ rateCard: [...rateCard, newTier] });
    },
    [rateCard, updateProfessionalData]
  );

  const handleUpdateRateCardTier = useCallback(
    (index: number, updates: Partial<RateCardTier>) => {
      const updated = rateCard.map((tier, i) =>
        i === index ? { ...tier, ...updates } : tier
      );
      updateProfessionalData({ rateCard: updated });
    },
    [rateCard, updateProfessionalData]
  );

  const handleRemoveRateCardTier = useCallback(
    (index: number) => {
      const updated = rateCard.filter((_, i) => i !== index);
      updateProfessionalData({ rateCard: updated });
    },
    [rateCard, updateProfessionalData]
  );

  // ---------------------------------------------------------------------------
  // Currency symbol helper
  // ---------------------------------------------------------------------------

  const getCurrencySymbol = useCallback((): string => {
    return CURRENCIES.find((c) => c.value === currency)?.symbol || '$';
  }, [currency]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons
            name="briefcase-outline"
            size={28}
            color={CultureTokens.violet}
          />
        </View>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          Professional Details
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Showcase your credentials, expertise, and pricing to attract clients.
        </Text>
      </View>

      {/* ================================================================== */}
      {/* Section 1: Credentials Upload */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Professional Credentials
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Upload degrees, certificates, or licences to verify your expertise.
        </Text>

        {/* Uploaded credentials list */}
        {credentials.length > 0 && (
          <View style={styles.credentialsList}>
            {credentials.map((url, index) => (
              <View
                key={`credential-${index}`}
                style={[styles.credentialItem, { backgroundColor: colors.surfaceElevated }]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={CultureTokens.indigo}
                />
                <Text
                  style={[styles.credentialName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {url.split('/').pop() || `Credential ${index + 1}`}
                </Text>
                {professionalData.credentialsVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={CultureTokens.teal} />
                    <Text style={[styles.verifiedText, { color: CultureTokens.teal }]}>
                      Verified
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time-outline" size={16} color={CultureTokens.indigo} />
                    <Text style={[styles.pendingText, { color: CultureTokens.indigo }]}>
                      Pending
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() => handleRemoveCredential(index)}
                  accessibilityLabel={`Remove credential ${index + 1}`}
                  accessibilityRole="button"
                  style={styles.removeButton}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Upload button */}
        <Pressable
          onPress={handleUploadCredential}
          disabled={isUploadingCredential}
          accessibilityLabel="Upload credential document"
          accessibilityRole="button"
          style={[
            styles.uploadButton,
            { borderColor: colors.border },
            isUploadingCredential && styles.uploadButtonDisabled,
          ]}
        >
          {isUploadingCredential ? (
            <ActivityIndicator size="small" color={CultureTokens.indigo} />
          ) : (
            <Ionicons name="cloud-upload-outline" size={22} color={CultureTokens.indigo} />
          )}
          <Text style={[styles.uploadButtonText, { color: CultureTokens.indigo }]}>
            {isUploadingCredential ? 'Uploading...' : 'Upload Credential'}
          </Text>
        </Pressable>

        {getFieldError('professionalData.credentials') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('professionalData.credentials')}
          </Text>
        )}

        {/* Verification info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={CultureTokens.teal} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Credentials are reviewed by our team within 48 hours for verification.
          </Text>
        </View>
      </View>

      {/* ================================================================== */}
      {/* Section 2: Influencer Licence */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Influencer Licence
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          If you are an influencer, provide your platform details for verification.
        </Text>

        {/* Toggle influencer status */}
        <Pressable
          onPress={handleInfluencerToggle}
          accessibilityLabel={
            showInfluencerFields
              ? 'I am not claiming influencer status'
              : 'I am claiming influencer status'
          }
          accessibilityRole="switch"
          accessibilityState={{ checked: showInfluencerFields }}
          style={[
            styles.toggleRow,
            { backgroundColor: colors.surfaceElevated },
          ]}
        >
          <View style={styles.toggleContent}>
            <Ionicons
              name="megaphone-outline"
              size={20}
              color={showInfluencerFields ? CultureTokens.violet : colors.textSecondary}
            />
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              I am an influencer / content creator
            </Text>
          </View>
          <View
            style={[
              styles.toggleSwitch,
              showInfluencerFields && styles.toggleSwitchActive,
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                showInfluencerFields && styles.toggleKnobActive,
              ]}
            />
          </View>
        </Pressable>

        {/* Influencer fields (conditional) */}
        {showInfluencerFields && (
          <View style={styles.influencerFields}>
            {/* Platform selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Platform
              </Text>
              <View style={styles.platformGrid}>
                {INFLUENCER_PLATFORMS.map((platform) => (
                  <Pressable
                    key={platform}
                    onPress={() => handleInfluencerUpdate({ platform })}
                    accessibilityLabel={`Select ${platform}`}
                    accessibilityRole="radio"
                    accessibilityState={{
                      selected: influencerLicence?.platform === platform,
                    }}
                    style={[
                      styles.platformChip,
                      { borderColor: colors.border },
                      influencerLicence?.platform === platform && {
                        borderColor: CultureTokens.violet,
                        backgroundColor: `${CultureTokens.violet}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.platformChipText,
                        { color: colors.text },
                        influencerLicence?.platform === platform && {
                          color: CultureTokens.violet,
                        },
                      ]}
                    >
                      {platform}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Handle */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Platform Handle
              </Text>
              <TextInput
                value={influencerLicence?.handle || ''}
                onChangeText={(text) => handleInfluencerUpdate({ handle: text })}
                placeholder="@yourhandle"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="Influencer platform handle"
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            {/* Follower count */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Follower Count
              </Text>
              <TextInput
                value={
                  influencerLicence?.followerCount
                    ? String(influencerLicence.followerCount)
                    : ''
                }
                onChangeText={(text) => {
                  const count = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                  handleInfluencerUpdate({ followerCount: count });
                }}
                placeholder="Minimum 10,000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                accessibilityLabel="Follower count"
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              />
              <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
                Minimum 10,000 followers required for influencer verification.
              </Text>
            </View>

            {getFieldError('professionalData.influencerLicence') && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {getFieldError('professionalData.influencerLicence')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 3: Expertise Areas */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text
              style={[styles.sectionTitle, { color: colors.text }]}
              accessibilityRole="header"
            >
              Areas of Expertise
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Select your areas of expertise. AI can suggest areas from your credentials.
            </Text>
          </View>
          {/* AI Extract button */}
          <Pressable
            onPress={handleAIExtractExpertise}
            disabled={aiExtracting || credentials.length === 0}
            accessibilityLabel="AI suggest expertise areas from credentials"
            accessibilityRole="button"
            style={[
              styles.aiButton,
              (aiExtracting || credentials.length === 0) && styles.aiButtonDisabled,
            ]}
          >
            {aiExtracting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.aiButtonText}>
              {aiExtracting ? 'Extracting...' : 'AI Suggest'}
            </Text>
          </Pressable>
        </View>

        {/* Expertise chips */}
        <View style={styles.chipGrid}>
          {EXPERTISE_AREAS.map((area) => {
            const isSelected = expertiseAreas.includes(area);
            return (
              <Pressable
                key={area}
                onPress={() => handleToggleExpertise(area)}
                accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} ${area}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                style={[
                  styles.expertiseChip,
                  { borderColor: colors.border },
                  isSelected && {
                    borderColor: CultureTokens.teal,
                    backgroundColor: `${CultureTokens.teal}15`,
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={CultureTokens.teal} />
                )}
                <Text
                  style={[
                    styles.expertiseChipText,
                    { color: colors.text },
                    isSelected && { color: CultureTokens.teal },
                  ]}
                >
                  {area}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {expertiseAreas.length > 0 && (
          <Text style={[styles.fieldHint, { color: colors.textSecondary }]}>
            {expertiseAreas.length} selected
          </Text>
        )}

        {getFieldError('professionalData.expertiseAreas') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('professionalData.expertiseAreas')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 4: Availability Toggle */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Availability for Bookings
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Let clients know if you are currently available for work.
        </Text>

        <View style={styles.availabilityOptions}>
          {AVAILABILITY_OPTIONS.map((option) => {
            const isSelected = availabilityStatus === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  updateProfessionalData({ availabilityStatus: option.value })
                }
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.availabilityOption,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                  isSelected && {
                    borderColor: CultureTokens.teal,
                    backgroundColor: `${CultureTokens.teal}10`,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={isSelected ? CultureTokens.teal : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.availabilityLabel,
                    { color: colors.text },
                    isSelected && { color: CultureTokens.teal },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={CultureTokens.teal}
                    style={styles.availabilityCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {getFieldError('professionalData.availabilityStatus') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('professionalData.availabilityStatus')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 5: Rate Card */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Rate Card
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Set your pricing tiers so clients know your rates upfront.
        </Text>

        {/* Currency selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Currency</Text>
          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => {
              const isSelected = currency === curr.value;
              return (
                <Pressable
                  key={curr.value}
                  onPress={() => updateProfessionalData({ currency: curr.value })}
                  accessibilityLabel={`Select ${curr.label} currency`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.currencyChip,
                    { borderColor: colors.border },
                    isSelected && {
                      borderColor: CultureTokens.indigo,
                      backgroundColor: `${CultureTokens.indigo}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      { color: colors.text },
                      isSelected && { color: CultureTokens.indigo },
                    ]}
                  >
                    {curr.symbol} {curr.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Rate card tiers */}
        <View style={styles.rateCardTiers}>
          {rateCard.map((tier, index) => (
            <View
              key={`tier-${tier.type}-${index}`}
              style={[styles.rateCardTier, { backgroundColor: colors.surfaceElevated }]}
            >
              <View style={styles.rateCardTierHeader}>
                <Text style={[styles.rateCardTierType, { color: colors.text }]}>
                  {RATE_CARD_TYPES.find((t) => t.value === tier.type)?.label || tier.type}
                </Text>
                <Pressable
                  onPress={() => handleRemoveRateCardTier(index)}
                  accessibilityLabel={`Remove ${tier.type} rate`}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.rateInputRow}>
                <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>
                  {getCurrencySymbol()}
                </Text>
                <TextInput
                  value={tier.rate > 0 ? String(tier.rate) : ''}
                  onChangeText={(text) => {
                    const rate = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
                    handleUpdateRateCardTier(index, { rate });
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  accessibilityLabel={`${tier.type} rate amount`}
                  style={[
                    styles.rateInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
              <TextInput
                value={tier.description || ''}
                onChangeText={(text) =>
                  handleUpdateRateCardTier(index, { description: text })
                }
                placeholder="Optional description (e.g., includes revisions)"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel={`${tier.type} rate description`}
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Add tier buttons */}
        <View style={styles.addTierRow}>
          {RATE_CARD_TYPES.filter(
            (type) => !rateCard.some((tier) => tier.type === type.value)
          ).map((type) => (
            <Pressable
              key={type.value}
              onPress={() => handleAddRateCardTier(type.value)}
              accessibilityLabel={`Add ${type.label} rate tier`}
              accessibilityRole="button"
              style={[styles.addTierButton, { borderColor: colors.border }]}
            >
              <Ionicons name="add" size={16} color={CultureTokens.indigo} />
              <Text style={[styles.addTierText, { color: CultureTokens.indigo }]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {getFieldError('professionalData.rateCard') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('professionalData.rateCard')}
          </Text>
        )}
      </View>

      {/* ================================================================== */}
      {/* Section 6: Response Time */}
      {/* ================================================================== */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          Typical Response Time
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          How quickly do you typically respond to enquiries?
        </Text>

        <View style={styles.responseTimeOptions}>
          {RESPONSE_TIME_OPTIONS.map((option) => {
            const isSelected = responseTime === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => updateProfessionalData({ responseTime: option.value })}
                accessibilityLabel={`Response time: ${option.label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.responseTimeOption,
                  { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
                  isSelected && {
                    borderColor: CultureTokens.indigo,
                    backgroundColor: `${CultureTokens.indigo}10`,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={isSelected ? CultureTokens.indigo : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.responseTimeLabel,
                    { color: colors.text },
                    isSelected && { color: CultureTokens.indigo },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={CultureTokens.indigo}
                    style={styles.responseTimeCheck}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {getFieldError('professionalData.responseTime') && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {getFieldError('professionalData.responseTime')}
          </Text>
        )}
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
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
    paddingBottom: Spacing.xxl,
  },
  contentDesktop: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    lineHeight: 24,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    lineHeight: 20,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 16,
    marginTop: 4,
  },
  textInput: {
    height: InputTokens.height,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: InputTokens.paddingH,
    fontSize: InputTokens.fontSize,
    fontFamily: FontFamily.medium,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: CultureTokens.coral,
    marginTop: 4,
  },
  // Credentials
  credentialsList: {
    gap: Spacing.sm,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  credentialName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  removeButton: {
    padding: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: ButtonTokens.height.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  // Influencer
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: CultureTokens.violet,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  influencerFields: {
    gap: Spacing.lg,
    paddingTop: Spacing.md,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  platformChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  // Expertise
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: CultureTokens.violet,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#FFFFFF',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  expertiseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  expertiseChipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  // Availability
  availabilityOptions: {
    gap: Spacing.sm,
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  availabilityLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  availabilityCheck: {
    marginLeft: 'auto',
  },
  // Rate Card
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  currencyChipText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  rateCardTiers: {
    gap: Spacing.md,
  },
  rateCardTier: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  rateCardTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateCardTierType: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    width: 32,
  },
  rateInput: {
    flex: 1,
    height: InputTokens.height,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: InputTokens.paddingH,
    fontSize: InputTokens.fontSize,
    fontFamily: FontFamily.medium,
  },
  addTierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  addTierButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  addTierText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  // Response Time
  responseTimeOptions: {
    gap: Spacing.sm,
  },
  responseTimeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  responseTimeLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  responseTimeCheck: {
    marginLeft: 'auto',
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});

export default ProfessionalFields;
