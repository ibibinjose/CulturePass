/**
 * Page Pro Wizard — Business & registration step
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useM3Colors } from '@/hooks/useM3Colors';
import { M3Typography } from '@/design-system/tokens/typography';
import { Spacing, Radius } from '@/design-system/tokens/theme';
import type { HostPageFormData } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { hostPageRequiresAbn } from '@/shared/schema/hostPage';
import { ABNField } from '../fields/ABNField';
import { TaxStatusField } from '../fields/TaxStatusField';
import { WizardFormSection } from './WizardFormSection';

export interface PageWizardBusinessStepProps {
  entityType: HostEntityType;
  formData: HostPageFormData;
  updateFormData: (patch: Partial<HostPageFormData>) => void;
  getFieldError: (field: string) => string | undefined;
}

export function PageWizardBusinessStep({
  entityType,
  formData,
  updateFormData,
  getFieldError,
}: PageWizardBusinessStepProps) {
  const colors = useM3Colors();
  const abnRequired = hostPageRequiresAbn(entityType);

  const inputStyle = [
    styles.input,
    { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.surface },
  ];

  return (
    <View style={styles.step} testID="page-wizard-business-step">
      <Text style={[M3Typography.headlineSmall, { color: colors.onSurface }]}>Business & registration</Text>
      <Text style={[M3Typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: Spacing.sm }]}>
        {abnRequired
          ? 'Australian businesses and venues need a valid ABN and registered name for verification.'
          : 'Add registration details if you operate as a registered entity. You can skip fields that do not apply.'}
      </Text>

      <WizardFormSection
        title="Legal identity"
        subtitle="Registered name may differ from your public Page name"
        icon="business-outline"
      >
        <Text style={[M3Typography.labelLarge, { color: colors.onSurface }]}>
          Registered business name{abnRequired ? '' : ' (optional)'}
        </Text>
        <TextInput
          value={formData.registeredBusinessName ?? ''}
          onChangeText={(registeredBusinessName) => updateFormData({ registeredBusinessName })}
          placeholder="e.g. Kerala Cultural Society Inc."
          placeholderTextColor={colors.onSurfaceVariant}
          style={inputStyle}
          accessibilityLabel="Registered business name"
        />
        {getFieldError('registeredBusinessName') ? (
          <Text style={[styles.error, { color: colors.error }]}>{getFieldError('registeredBusinessName')}</Text>
        ) : null}

        <Text style={[M3Typography.labelLarge, { color: colors.onSurface, marginTop: Spacing.sm }]}>
          Trading name (optional)
        </Text>
        <TextInput
          value={formData.tradingName ?? ''}
          onChangeText={(tradingName) => updateFormData({ tradingName })}
          placeholder="Name customers know you by"
          placeholderTextColor={colors.onSurfaceVariant}
          style={inputStyle}
          accessibilityLabel="Trading name"
        />
      </WizardFormSection>

      {['business', 'venue', 'organiser', 'organizer', 'professional'].includes(entityType) && (
        <WizardFormSection
          title="ABN"
          subtitle={abnRequired ? '11-digit Australian Business Number' : 'Required if you run paid events'}
          icon="document-text-outline"
          optional={!abnRequired}
        >
          <ABNField
            value={formData.abn ?? ''}
            onChange={(abn) => updateFormData({ abn })}
            required={abnRequired}
            error={getFieldError('abn')}
            label="Australian Business Number (ABN)"
            hint="We verify your ABN against the Australian Business Register"
          />
        </WizardFormSection>
      )}

      <WizardFormSection
        title="Tax status"
        subtitle="GST registration for commercial Pages"
        icon="receipt-outline"
        optional
      >
        <TaxStatusField
          taxStatus={formData.gstRegistered ? 'registered' : 'not-registered'}
          gstId={formData.gstId ?? ''}
          onTaxStatusChange={(status) =>
            updateFormData({ gstRegistered: status === 'registered' })
          }
          onGstIdChange={(gstId) => updateFormData({ gstId })}
          error={getFieldError('gstId')}
        />
      </WizardFormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  step: { gap: Spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginTop: 6,
    fontSize: 16,
  },
  error: { ...M3Typography.bodySmall, marginTop: 4 },
});