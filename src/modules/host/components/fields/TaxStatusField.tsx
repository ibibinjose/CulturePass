import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import {
  CultureTokens,
  FontFamily,
  Radius,
} from '@/design-system/tokens/theme';

export type TaxStatus = 'registered' | 'not-registered' | 'exempt';

export interface TaxStatusFieldProps {
  /** Current tax status selection */
  taxStatus: TaxStatus;
  /** GST/VAT ID (required when registered) */
  gstId?: string;
  /** Callback when tax status changes */
  onTaxStatusChange: (status: TaxStatus) => void;
  /** Callback when GST ID changes */
  onGstIdChange: (gstId: string) => void;
  error?: string;
  label?: string;
  hint?: string;
  /** Verification status for the tax registration */
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  /** Notes from verification review */
  verificationNotes?: string;
  /**
   * @deprecated Use taxStatus and onTaxStatusChange instead.
   * Kept for backward compatibility.
   */
  gstRegistered?: boolean;
  /**
   * @deprecated Use onTaxStatusChange instead.
   * Kept for backward compatibility.
   */
  onGstRegisteredChange?: (registered: boolean) => void;
}

/**
 * TaxStatusField Component
 * 
 * Tax registration status selector for business entities.
 * 
 * Features:
 * - Three-option selector: GST registered, not registered, exempt
 * - Conditional GST ID input when registered
 * - Format validation for Australian GST IDs (XX XXX XXX XXX)
 * - Checksum validation using Australian government algorithm
 * - Visual feedback for registration and verification status
 * - Backward-compatible with legacy gstRegistered boolean prop
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * 
 * GST ID Format (Australia):
 * - 11 digits (same as ABN)
 * - Format: XX XXX XXX XXX
 * - Validates using same checksum as ABN
 * 
 * @example
 * ```tsx
 * <TaxStatusField
 *   taxStatus={formData.taxStatus}
 *   gstId={formData.gstId}
 *   onTaxStatusChange={(status) => 
 *     setFormData({ ...formData, taxStatus: status })
 *   }
 *   onGstIdChange={(gstId) => 
 *     setFormData({ ...formData, gstId })
 *   }
 * />
 * ```
 */
export function TaxStatusField({
  taxStatus: taxStatusProp,
  gstRegistered: gstRegisteredLegacy,
  gstId = '',
  onTaxStatusChange,
  onGstRegisteredChange,
  onGstIdChange,
  error,
  label = 'Tax Status',
  hint = 'Select your GST registration status',
  verificationStatus,
  verificationNotes,
}: TaxStatusFieldProps) {
  const colors = useColors();
  const [gstIdError, setGstIdError] = useState<string | undefined>();

  // Support backward compatibility: derive taxStatus from legacy prop if new prop not provided
  const taxStatus: TaxStatus = taxStatusProp ?? (gstRegisteredLegacy ? 'registered' : 'not-registered');
  const gstRegistered = taxStatus === 'registered';

  // Format GST ID with spaces: XX XXX XXX XXX
  const formatGstId = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  };

  // Validate GST ID format
  const validateGstId = (gstIdValue: string): boolean => {
    const digits = gstIdValue.replace(/\D/g, '');
    if (digits.length !== 11) {
      setGstIdError('GST ID must be 11 digits');
      return false;
    }

    // GST ID uses same checksum as ABN
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const gstArray = digits.split('').map(Number);
    
    // Subtract 1 from first digit
    gstArray[0] = gstArray[0] - 1;
    
    // Calculate weighted sum
    const sum = gstArray.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    
    // Valid if sum is divisible by 89
    if (sum % 89 !== 0) {
      setGstIdError('Invalid GST ID checksum');
      return false;
    }

    setGstIdError(undefined);
    return true;
  };

  const handleGstIdChange = (text: string) => {
    const formatted = formatGstId(text);
    onGstIdChange(formatted);
    
    // Validate if complete
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 11) {
      validateGstId(formatted);
    } else if (digits.length > 0) {
      setGstIdError(undefined);
    }
  };

  const handleSelectStatus = (status: TaxStatus) => {
    onTaxStatusChange?.(status);
    // Backward compatibility
    onGstRegisteredChange?.(status === 'registered');
    
    if (status !== 'registered') {
      onGstIdChange('');
      setGstIdError(undefined);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>
      )}

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}

      {/* GST Registration Toggle */}
      <View style={styles.toggleContainer} accessibilityRole="radiogroup" accessibilityLabel="Tax registration status">
        <Pressable
          onPress={() => handleSelectStatus('registered')}
          style={({ pressed }) => [
            styles.toggleOption,
            {
              backgroundColor: taxStatus === 'registered'
                ? `${CultureTokens.teal}15`
                : colors.surfaceElevated,
              borderColor: taxStatus === 'registered' ? CultureTokens.teal : colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: taxStatus === 'registered' }}
          accessibilityLabel="GST Registered. I am registered for GST/VAT"
        >
          <View style={styles.toggleContent}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: taxStatus === 'registered' ? CultureTokens.teal : colors.borderLight,
                },
              ]}
            >
              {taxStatus === 'registered' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: CultureTokens.teal },
                  ]}
                />
              )}
            </View>
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  {
                    color: taxStatus === 'registered' ? CultureTokens.teal : colors.text,
                    fontFamily: taxStatus === 'registered' ? FontFamily.semibold : FontFamily.medium,
                  },
                ]}
              >
                GST Registered
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                I am registered for GST/VAT
              </Text>
            </View>
          </View>
          {taxStatus === 'registered' && (
            <Ionicons name="checkmark-circle" size={20} color={CultureTokens.teal} />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleSelectStatus('not-registered')}
          style={({ pressed }) => [
            styles.toggleOption,
            {
              backgroundColor: taxStatus === 'not-registered'
                ? `${CultureTokens.indigo}15`
                : colors.surfaceElevated,
              borderColor: taxStatus === 'not-registered' ? CultureTokens.indigo : colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: taxStatus === 'not-registered' }}
          accessibilityLabel="Not Registered. I am not registered for GST/VAT"
        >
          <View style={styles.toggleContent}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: taxStatus === 'not-registered' ? CultureTokens.indigo : colors.borderLight,
                },
              ]}
            >
              {taxStatus === 'not-registered' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: CultureTokens.indigo },
                  ]}
                />
              )}
            </View>
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  {
                    color: taxStatus === 'not-registered' ? CultureTokens.indigo : colors.text,
                    fontFamily: taxStatus === 'not-registered' ? FontFamily.semibold : FontFamily.medium,
                  },
                ]}
              >
                Not Registered
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                I am not registered for GST/VAT
              </Text>
            </View>
          </View>
          {taxStatus === 'not-registered' && (
            <Ionicons name="checkmark-circle" size={20} color={CultureTokens.indigo} />
          )}
        </Pressable>

        <Pressable
          onPress={() => handleSelectStatus('exempt')}
          style={({ pressed }) => [
            styles.toggleOption,
            {
              backgroundColor: taxStatus === 'exempt'
                ? `${CultureTokens.violet}15`
                : colors.surfaceElevated,
              borderColor: taxStatus === 'exempt' ? CultureTokens.violet : colors.borderLight,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: taxStatus === 'exempt' }}
          accessibilityLabel="GST Exempt. My organisation is exempt from GST"
        >
          <View style={styles.toggleContent}>
            <View
              style={[
                styles.radioCircle,
                {
                  borderColor: taxStatus === 'exempt' ? CultureTokens.violet : colors.borderLight,
                },
              ]}
            >
              {taxStatus === 'exempt' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: CultureTokens.violet },
                  ]}
                />
              )}
            </View>
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleTitle,
                  {
                    color: taxStatus === 'exempt' ? CultureTokens.violet : colors.text,
                    fontFamily: taxStatus === 'exempt' ? FontFamily.semibold : FontFamily.medium,
                  },
                ]}
              >
                GST Exempt
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                My organisation is exempt from GST (e.g., charity, education)
              </Text>
            </View>
          </View>
          {taxStatus === 'exempt' && (
            <Ionicons name="checkmark-circle" size={20} color={CultureTokens.violet} />
          )}
        </Pressable>
      </View>

      {/* GST ID Input (shown when registered) */}
      {gstRegistered && (
        <View style={styles.gstIdContainer}>
          <Input
            label="GST/VAT ID"
            hint="Enter your 11-digit GST identification number"
            error={gstIdError}
            value={gstId}
            onChangeText={handleGstIdChange}
            placeholder="XX XXX XXX XXX"
            keyboardType="numeric"
            maxLength={14} // 11 digits + 3 spaces
            leftIcon="card-outline"
            rightIcon={
              gstId.replace(/\D/g, '').length === 11 && !gstIdError
                ? 'checkmark-circle'
                : undefined
            }
          />

          <View style={[styles.infoBox, { backgroundColor: `${CultureTokens.teal}10` }]}>
            <Ionicons name="information-circle" size={16} color={CultureTokens.teal} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your GST ID is typically the same as your ABN. It will be displayed on tax
              invoices and used for GST reporting.
            </Text>
          </View>
        </View>
      )}

      {/* Verification Status Badge */}
      {verificationStatus && (
        <View
          style={[
            styles.verificationBadgeContainer,
            {
              backgroundColor:
                verificationStatus === 'verified'
                  ? `${CultureTokens.teal}12`
                  : verificationStatus === 'rejected'
                    ? `${CultureTokens.coral}12`
                    : `${CultureTokens.indigo}12`,
            },
          ]}
          accessibilityLabel={`Tax verification status: ${verificationStatus}`}
          accessibilityRole="text"
        >
          <Ionicons
            name={
              verificationStatus === 'verified'
                ? 'checkmark-circle'
                : verificationStatus === 'rejected'
                  ? 'close-circle'
                  : 'time-outline'
            }
            size={18}
            color={
              verificationStatus === 'verified'
                ? CultureTokens.teal
                : verificationStatus === 'rejected'
                  ? CultureTokens.coral
                  : CultureTokens.indigo
            }
          />
          <View style={styles.verificationContent}>
            <Text
              style={[
                styles.verificationLabel,
                {
                  color:
                    verificationStatus === 'verified'
                      ? CultureTokens.teal
                      : verificationStatus === 'rejected'
                        ? CultureTokens.coral
                        : CultureTokens.indigo,
                },
              ]}
            >
              {verificationStatus === 'verified'
                ? 'Tax Status Verified'
                : verificationStatus === 'rejected'
                  ? 'Verification Rejected'
                  : 'Pending Verification'}
            </Text>
            {verificationNotes && (
              <Text style={[styles.verificationNotes, { color: colors.textSecondary }]}>
                {verificationNotes}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginLeft: 4,
  },
  error: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
  },
  toggleContainer: {
    gap: 10,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 2,
    minHeight: 68, // Exceeds 44pt touch target
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: 15,
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  gstIdContainer: {
    gap: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  verificationBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
  },
  verificationContent: {
    flex: 1,
    gap: 4,
  },
  verificationLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
  },
  verificationNotes: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
});

export default TaxStatusField;
