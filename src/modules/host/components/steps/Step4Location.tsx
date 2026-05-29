/**
 * Step4Location Component
 * 
 * Fourth wizard step for location and operations information.
 * Handles address input, accessibility features, and operational details.
 * 
 * Features:
 * - Primary address with Google Places autocomplete
 * - Map preview with pin adjustment
 * - Accessibility checklist for venues
 * - Online-only option for digital businesses
 * - Multiple location support (future)
 * 
 * Requirements: 10 (Location and Address Management)
 * 
 * Design System Usage:
 * - LocationField for address input
 * - AccessibilityChecklistField for venue accessibility
 * - MapPreview for location visualization
 * - LuxeCard for section containers
 * - CultureTokens for colors
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LuxeCard } from '@/design-system/ui/LuxeCard';
import { Checkbox } from '@/design-system/ui/Checkbox';
import { useColors } from '@/hooks/useColors';
import { Luxe } from '@/design-system/tokens/luxeHeritage';
import { FontFamily, Radius, Spacing } from '@/design-system/tokens/theme';
import LocationField from '../fields/LocationField';
import AccessibilityChecklistField from '../fields/AccessibilityChecklistField';
import type { WizardStepProps } from '../FormWizard/WizardStep';
import type { Address, AccessibilityFeatures } from '@shared/schema/hostProfile';

/**
 * Step 4: Location & Operations
 * 
 * Collects location and operational information:
 * - Primary address (required)
 * - Accessibility features (for venues)
 * - Online-only option (for digital businesses)
 */
export default function Step4Location({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: WizardStepProps) {
  const colors = useColors();

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  /**
   * Determine if this entity type requires physical address
   * Venues always require physical address (no PO boxes)
   */
  const requirePhysicalAddress = useMemo(() => {
    return entityType === 'venue';
  }, [entityType]);

  /**
   * Determine if accessibility checklist should be shown
   * Only venues need accessibility features
   */
  const showAccessibilityChecklist = useMemo(() => {
    return entityType === 'venue';
  }, [entityType]);

  /**
   * Determine if online-only option should be shown
   * Digital businesses, artists, and professionals can be online-only
   */
  const showOnlineOnlyOption = useMemo(() => {
    return ['business', 'artist', 'professional'].includes(entityType);
  }, [entityType]);

  /**
   * Get current address value
   */
  const currentAddress = useMemo(() => {
    return formData.primaryAddress || null;
  }, [formData.primaryAddress]);

  /**
   * Get current accessibility features
   */
  const currentAccessibility = useMemo(() => {
    if (entityType === 'venue' && formData.venueData?.accessibility) {
      return formData.venueData.accessibility;
    }
    // Default values
    return {
      wheelchairAccess: false,
      accessibleParking: false,
      accessibleToilets: false,
      hearingLoop: false,
      brailleSignage: false,
      serviceAnimalFriendly: false,
    };
  }, [entityType, formData.venueData]);

  /**
   * Get current online-only status
   */
  const isOnlineOnly = useMemo(() => {
    return formData.isOnlineOnly || false;
  }, [formData.isOnlineOnly]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle address change
   */
  const handleAddressChange = useCallback(
    (address: Address) => {
      updateFormData({
        primaryAddress: {
          ...address,
          isPrimary: true,
        },
        // Auto-populate lgaCode from address
        lgaCode: address.lgaCode,
      });
    },
    [updateFormData]
  );

  /**
   * Handle accessibility features change
   */
  const handleAccessibilityChange = useCallback(
    (accessibility: AccessibilityFeatures) => {
      // Calculate accessibility score
      const enabledCount = Object.values(accessibility).filter(Boolean).length;
      const totalCount = 6; // Total number of accessibility features
      const score = Math.round((enabledCount / totalCount) * 100);

      // Get existing venue data or create minimal structure
      const existingVenueData = formData.venueData || {};

      updateFormData({
        venueData: {
          ...existingVenueData,
          accessibility,
          accessibilityScore: score,
        } as any, // Type assertion needed due to partial data
      });
    },
    [formData.venueData, updateFormData]
  );

  /**
   * Handle online-only toggle
   */
  const handleOnlineOnlyToggle = useCallback(() => {
    const newValue = !isOnlineOnly;
    updateFormData({
      isOnlineOnly: newValue,
      // Clear address if switching to online-only
      ...(newValue && { primaryAddress: undefined }),
    });
  }, [isOnlineOnly, updateFormData]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${Luxe.colors.dark.emerald}15` }]}>
          <Ionicons name="location" size={28} color={Luxe.colors.dark.emerald} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            Location & Operations
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {requirePhysicalAddress
              ? 'Provide your physical address and accessibility information'
              : 'Specify where you operate from'}
          </Text>
        </View>
      </View>

      {/* Online-Only Option */}
      {showOnlineOnlyOption && (
        <LuxeCard
          style={[
            styles.onlineOnlyCard,
            {
              backgroundColor: isOnlineOnly
                ? `${Luxe.colors.dark.accent}10`
                : colors.card,
              borderColor: isOnlineOnly
                ? Luxe.colors.dark.accent
                : colors.borderLight,
            },
          ]}
        >
          <View style={styles.onlineOnlyContent}>
            <View style={styles.onlineOnlyLeft}>
              <View
                style={[
                  styles.onlineOnlyIcon,
                  {
                    backgroundColor: isOnlineOnly
                      ? `${Luxe.colors.dark.accent}20`
                      : colors.surfaceElevated,
                  },
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={24}
                  color={isOnlineOnly ? Luxe.colors.dark.accent : colors.textSecondary}
                />
              </View>
              <View style={styles.onlineOnlyText}>
                <Text style={[styles.onlineOnlyLabel, { color: colors.text }]}>
                  Online Only
                </Text>
                <Text style={[styles.onlineOnlyDescription, { color: colors.textSecondary }]}>
                  I operate exclusively online without a physical location
                </Text>
              </View>
            </View>
            <Checkbox checked={isOnlineOnly} onToggle={handleOnlineOnlyToggle} />
          </View>
        </LuxeCard>
      )}

      {/* Address Section */}
      {!isOnlineOnly && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Primary Address
            </Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Required</Text>
            </View>
          </View>

          <LocationField
            value={currentAddress}
            onChange={handleAddressChange}
            requirePhysical={requirePhysicalAddress}
            error={getFieldError('primaryAddress')}
            label="Address"
          />

          {/* Address Info */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
            ]}
          >
            <Ionicons name="information-circle" size={16} color={Luxe.colors.dark.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {requirePhysicalAddress
                ? 'Physical address required. PO Boxes are not allowed for venues.'
                : 'Start typing to search for your address. Your location will be used for local searches and proximity filtering.'}
            </Text>
          </View>
        </View>
      )}

      {/* Accessibility Section (Venues Only) */}
      {showAccessibilityChecklist && !isOnlineOnly && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Accessibility Features
            </Text>
            <View style={[styles.optionalBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.optionalText, { color: colors.textSecondary }]}>
                Optional
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Select all accessibility features available at your venue. This helps users with
            disabilities find suitable spaces.
          </Text>

          <AccessibilityChecklistField
            value={currentAccessibility}
            onChange={handleAccessibilityChange}
            showScore={true}
          />

          {/* Accessibility Benefits */}
          <View
            style={[
              styles.benefitsBox,
              { backgroundColor: `${Luxe.colors.dark.emerald}10`, borderColor: Luxe.colors.dark.emerald },
            ]}
          >
            <Ionicons name="star" size={16} color={Luxe.colors.dark.emerald} />
            <Text style={[styles.benefitsText, { color: colors.text }]}>
              Higher accessibility scores improve visibility in accessibility-focused searches
              and demonstrate your commitment to inclusive spaces.
            </Text>
          </View>
        </View>
      )}

      {/* LGA Information (if available) */}
      {currentAddress?.lgaCode && !isOnlineOnly && (
        <View
          style={[
            styles.lgaBox,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
          ]}
        >
          <View style={styles.lgaHeader}>
            <Ionicons name="map" size={18} color={Luxe.colors.dark.accent} />
            <Text style={[styles.lgaTitle, { color: colors.text }]}>
              Local Government Area
            </Text>
          </View>
          <Text style={[styles.lgaCode, { color: colors.textSecondary }]}>
            LGA Code: {currentAddress.lgaCode}
          </Text>
          <Text style={[styles.lgaDescription, { color: colors.textTertiary }]}>
            Automatically determined from your address for local event discovery
          </Text>
        </View>
      )}

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
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...TextStyles.title2,
    fontSize: 24,
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 14,
    lineHeight: 20,
  },
  onlineOnlyCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  onlineOnlyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  onlineOnlyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  onlineOnlyIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineOnlyText: {
    flex: 1,
    gap: 2,
  },
  onlineOnlyLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  onlineOnlyDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  section: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
    marginTop: -4,
  },
  requiredBadge: {
    backgroundColor: Luxe.colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  requiredText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  optionalText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  benefitsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  benefitsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 18,
  },
  lgaBox: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    marginBottom: Spacing.lg,
  },
  lgaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lgaTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  lgaCode: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  lgaDescription: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

