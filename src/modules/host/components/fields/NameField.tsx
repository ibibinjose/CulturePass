/**
 * NameField Component
 * 
 * Name input field with character count and validation for the HostSpace
 * Enterprise-Grade Form System. Supports both official name and trading name
 * with real-time validation.
 * 
 * Features:
 * - Real-time validation (2-120 characters)
 * - Character count display with color coding
 * - Auto-trim whitespace
 * - Visual validation feedback
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * 
 * @example
 * ```tsx
 * <NameField
 *   value={officialName}
 *   onChange={setOfficialName}
 *   label="Official Name"
 *   required
 * />
 * 
 * <NameField
 *   value={tradingName}
 *   onChange={setTradingName}
 *   label="Trading Name"
 *   hint="Optional: Different name you operate under"
 * />
 * ```
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useFieldValidation } from '@/modules/host/hooks/useFieldValidation';
import { officialNameSchema } from '@/modules/host/schemas/profileSchema';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';

export interface NameFieldProps {
  /**
   * Current name value
   */
  value: string;
  
  /**
   * Callback when name changes
   */
  onChange: (value: string) => void;
  
  /**
   * External error message (e.g., from form validation)
   */
  error?: string;
  
  /**
   * Label text (default: "Name")
   */
  label?: string;
  
  /**
   * Hint text
   */
  hint?: string;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Whether the field is disabled
   */
  disabled?: boolean;
  
  /**
   * Minimum character length (default: 2)
   */
  minLength?: number;
  
  /**
   * Maximum character length (default: 120)
   */
  maxLength?: number;
  
  /**
   * Callback when validation completes
   */
  onValidationComplete?: (isValid: boolean) => void;
  
  /**
   * Whether to show character count (default: true)
   */
  showCharCount?: boolean;
}

export function NameField({
  value,
  onChange,
  error: externalError,
  label = 'Name',
  hint,
  placeholder = 'Enter name',
  required = true,
  disabled = false,
  minLength = 2,
  maxLength = 120,
  onValidationComplete,
  showCharCount = true,
}: NameFieldProps) {
  const colors = useColors();

  /**
   * Field validation hook
   */
  const {
    error: validationError,
    isValid,
    hasValidated,
    validate,
  } = useFieldValidation({
    schema: officialNameSchema,
    debounceMs: 300,
  });

  /**
   * Handle input change
   */
  const handleChange = (text: string) => {
    onChange(text);
    
    // Only validate if there's a value
    if (text.trim()) {
      validate(text.trim());
    }
  };

  /**
   * Notify parent of validation state changes
   */
  useEffect(() => {
    if (hasValidated && onValidationComplete) {
      onValidationComplete(isValid);
    }
  }, [isValid, hasValidated, onValidationComplete]);

  /**
   * Determine which error to display (external or validation)
   */
  const displayError = externalError || validationError || undefined;

  /**
   * Character count color based on length
   */
  const getCharCountColor = () => {
    const length = value.length;
    
    if (length === 0) return colors.textTertiary;
    if (length < minLength) return colors.error;
    if (length > maxLength) return colors.error;
    if (length > maxLength * 0.9) return colors.warning || colors.textSecondary;
    
    return colors.textSecondary;
  };

  /**
   * Get character count status text
   */
  const getCharCountStatus = () => {
    const length = value.length;
    
    if (length === 0) return '';
    if (length < minLength) return ` (${minLength - length} more needed)`;
    if (length > maxLength) return ` (${length - maxLength} over limit)`;
    
    return '';
  };

  /**
   * Determine right icon based on validation state
   */
  const getRightIcon = () => {
    if (hasValidated && value.trim()) {
      if (isValid && !displayError) {
        return 'checkmark-circle' as const;
      } else if (displayError) {
        return 'close-circle' as const;
      }
    }
    return undefined;
  };

  const rightIcon = getRightIcon();

  return (
    <View style={styles.container}>
      <Input
        label={required ? `${label} *` : label}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        error={displayError}
        hint={displayError ? undefined : hint}
        autoCapitalize="words"
        autoCorrect={true}
        editable={!disabled}
        maxLength={maxLength}
        accessibilityLabel={label}
        accessibilityHint={`Enter ${label.toLowerCase()} (${minLength}-${maxLength} characters)`}
        rightIcon={rightIcon}
      />{showCharCount && (
        <View style={styles.footer}><Text style={[styles.charCount, { color: getCharCountColor() }]}>{value.length}/{maxLength} characters{getCharCountStatus()}</Text></View>
      )}{hasValidated && isValid && !displayError && value.trim() && (
        <View style={styles.successContainer}><Ionicons
            name="checkmark-circle"
            size={14}
            color={CultureTokens.teal}
            style={styles.successIcon}
          /><Text style={[styles.successText, { color: CultureTokens.teal }]}>Valid name</Text></View>
      )}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  successIcon: {
    // Success icon styles
  },
  successText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
});

export default NameField;
