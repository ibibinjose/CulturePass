/**
 * Page Pro Wizard — Contact, address & social step
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing } from '@/design-system/tokens/theme';
import type { HostPageFormData } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { hostPageRequiresPhysicalAddress } from '@/shared/schema/hostPage';
import type { Address } from '@shared/schema/hostProfile';
import { EmailField } from '../fields/EmailField';
import { PhoneField } from '../fields/PhoneField';
import LocationField from '../fields/LocationField';
import SocialLinksField, { type SocialLink, type PrimaryContactMethod } from '../fields/SocialLinksField';
import { WizardFormSection } from './WizardFormSection';

export interface PageWizardContactStepProps {
  entityType: HostEntityType;
  formData: HostPageFormData;
  updateFormData: (patch: Partial<HostPageFormData>) => void;
  getFieldError: (field: string) => string | undefined;
}

export function PageWizardContactStep({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: PageWizardContactStepProps) {
  const colors = useM3Colors();
  const venueAddressRequired = hostPageRequiresPhysicalAddress(entityType);
  const showOnlineOnly = ['business', 'artist', 'professional', 'organiser', 'organizer'].includes(entityType);

  const handleAddressChange = useCallback(
    (address: Address) => {
      updateFormData({
        primaryAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          postcode: address.postcode,
          country: address.country,
          latitude: address.latitude,
          longitude: address.longitude,
          lgaCode: address.lgaCode,
          placeId: address.placeId,
          isPrimary: true,
        },
        isOnlineOnly: false,
      });
    },
    [updateFormData],
  );

  const addressValue: Address | null = formData.primaryAddress?.street
    ? {
        street: formData.primaryAddress.street ?? '',
        city: formData.primaryAddress.city ?? '',
        state: formData.primaryAddress.state ?? '',
        postcode: formData.primaryAddress.postcode ?? '',
        country: formData.primaryAddress.country ?? 'Australia',
        latitude: formData.primaryAddress.latitude ?? 0,
        longitude: formData.primaryAddress.longitude ?? 0,
        lgaCode: formData.primaryAddress.lgaCode,
        placeId: formData.primaryAddress.placeId,
        isPrimary: true,
      }
    : null;

  return (
    <View style={styles.step} testID="page-wizard-contact-step">
      <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Contact & location</Text>
      <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
        How members, bookers, and CulturePass can reach you. This appears on your Page and verification review.
      </Text>

      <WizardFormSection title="Contact details" subtitle="Public email and phone for your Page" icon="mail-outline">
        <EmailField
          value={formData.publicEmail ?? ''}
          onChange={(publicEmail) => updateFormData({ publicEmail })}
          label="Public email"
          hint="Shown on your Page for enquiries"
          required
          error={getFieldError('publicEmail')}
          supportDomainVerification={entityType === 'business' || entityType === 'venue'}
        />
        <PhoneField
          value={formData.phoneNumber ?? ''}
          onChange={(phoneNumber) => updateFormData({ phoneNumber })}
          label="Phone number"
          hint="International format, e.g. +61412345678"
          error={getFieldError('phoneNumber')}
        />
        <PhoneField
          value={formData.whatsappNumber ?? ''}
          onChange={(whatsappNumber) => updateFormData({ whatsappNumber })}
          label="WhatsApp (optional)"
          hint="Same international format"
          error={getFieldError('whatsappNumber')}
        />
      </WizardFormSection>

      <WizardFormSection
        title="Location"
        subtitle={venueAddressRequired ? 'Physical venue address required' : 'Add an address or mark as online-only'}
        icon="location-outline"
        optional={!venueAddressRequired}
      >
        {showOnlineOnly ? (
          <Pressable
            onPress={() => updateFormData({ isOnlineOnly: !formData.isOnlineOnly, primaryAddress: undefined })}
            style={[styles.onlineRow, { borderColor: colors.outline }]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: formData.isOnlineOnly }}
          >
            <Ionicons
              name={formData.isOnlineOnly ? 'checkbox' : 'square-outline'}
              size={22}
              color={formData.isOnlineOnly ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={[M3Typography.bodyMedium, { color: colors.onSurface, flex: 1 }]}>
              Online only — no physical storefront
            </Text>
          </Pressable>
        ) : null}

        {!formData.isOnlineOnly ? (
          <LocationField
            value={addressValue}
            onChange={handleAddressChange}
            requirePhysical={venueAddressRequired}
            label={venueAddressRequired ? 'Venue address' : 'Primary address'}
            error={getFieldError('primaryAddress')}
          />
        ) : null}
      </WizardFormSection>

      <WizardFormSection
        title="Social & web"
        subtitle="Website, Instagram, Facebook, and more"
        icon="share-social-outline"
        optional
      >
        <SocialLinksField
          value={(formData.socialLinks ?? []) as SocialLink[]}
          onChange={(socialLinks) =>
            updateFormData({ socialLinks: socialLinks as HostPageFormData['socialLinks'] })
          }
          showPrimaryContactMethod
          primaryContactMethod={(formData.primaryContactMethod ?? 'email') as PrimaryContactMethod}
          onPrimaryContactMethodChange={(primaryContactMethod) => updateFormData({ primaryContactMethod })}
          hasWhatsApp={!!formData.whatsappNumber?.trim()}
        />
      </WizardFormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: Spacing.xs },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
});