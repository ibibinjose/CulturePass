/**
 * DateField Component
 * 
 * Date input field with picker interface and validation for the HostSpace
 * Enterprise-Grade Form System. Supports founding date validation (no future dates).
 * 
 * Features:
 * - Native date picker on iOS/Android
 * - Web-friendly date input
 * - Past date validation (no future dates)
 * - ISO 8601 format (YYYY-MM-DD)
 * - Visual validation feedback
 * - Mobile-responsive (320px+)
 * - WCAG 2.1 Level AA compliant
 * 
 * @example
 * ```tsx
 * <DateField
 *   value={foundingDate}
 *   onChange={setFoundingDate}
 *   label="Founding Date"
 *   required
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// @ts-ignore - @react-native-community/datetimepicker may not have type declarations installed
// eslint-disable-next-line import/no-unresolved
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useFieldValidation } from '@/modules/host/hooks/useFieldValidation';
import { pastDateSchema } from '@/modules/host/schemas/profileSchema';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';

export interface DateFieldProps {
  /**
   * Current date value (ISO 8601 format: YYYY-MM-DD)
   */
  value: string;
  
  /**
   * Callback when date changes
   */
  onChange: (value: string) => void;
  
  /**
   * External error message (e.g., from form validation)
   */
  error?: string;
  
  /**
   * Label text (default: "Date")
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
   * Maximum date (default: today)
   */
  maxDate?: Date;
  
  /**
   * Minimum date (optional)
   */
  minDate?: Date;
  
  /**
   * Callback when validation completes
   */
  onValidationComplete?: (isValid: boolean) => void;
}

/**
 * Format date to ISO 8601 (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 */
function parseISODate(isoString: string): Date | null {
  if (!isoString) return null;
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Format date for display (e.g., "January 15, 2020")
 */
function formatDateForDisplay(isoString: string): string {
  const date = parseISODate(isoString);
  if (!date) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DateField({
  value,
  onChange,
  error: externalError,
  label = 'Date',
  hint,
  placeholder = 'Select date',
  required = true,
  disabled = false,
  maxDate = new Date(),
  minDate,
  onValidationComplete,
}: DateFieldProps) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? parseISODate(value) || new Date() : new Date()
  );

  /**
   * Field validation hook
   */
  const {
    error: validationError,
    isValid,
    hasValidated,
    validate,
  } = useFieldValidation({
    schema: pastDateSchema,
    debounceMs: 300,
  });

  /**
   * Handle date change from picker
   */
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    // On Android, picker closes automatically
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && date) {
      setSelectedDate(date);
      const isoDate = formatDateToISO(date);
      onChange(isoDate);
      validate(isoDate);
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  /**
   * Handle manual text input (web only)
   */
  const handleTextChange = (text: string) => {
    onChange(text);
    
    // Validate if it matches ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      validate(text);
      const date = parseISODate(text);
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  /**
   * Open date picker
   */
  const openPicker = () => {
    if (!disabled) {
      setShowPicker(true);
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
   * Get display value
   */
  const displayValue = value ? formatDateForDisplay(value) : '';

  /**
   * Render native date picker (iOS/Android)
   */
  const renderNativePicker = () => {
    if (Platform.OS === 'web') return null;

    // iOS shows picker inline, Android shows modal
    if (Platform.OS === 'ios' && !showPicker) return null;
    if (Platform.OS === 'android' && !showPicker) return null;

    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={handleDateChange}
        maximumDate={maxDate}
        minimumDate={minDate}
        textColor={colors.text}
      />
    );
  };

  /**
   * Render web date input
   */
  const renderWebInput = () => {
    if (Platform.OS !== 'web') return null;

    return (
      <Input
        label={required ? `${label} *` : label}
        value={value}
        onChangeText={handleTextChange}
        placeholder="YYYY-MM-DD"
        error={displayError}
        hint={displayError ? undefined : hint}
        editable={!disabled}
        accessibilityLabel={label}
        accessibilityHint="Enter date in YYYY-MM-DD format"
        rightIcon={hasValidated && isValid && !displayError ? 'checkmark-circle' : undefined}
      />
    );
  };

  /**
   * Render native input (iOS/Android)
   */
  const renderNativeInput = () => {
    if (Platform.OS === 'web') return null;

    return (
      <View>
        <Pressable
          onPress={openPicker}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${displayValue || 'No date selected'}. Tap to select date.`}
          accessibilityHint="Opens date picker"
        >
          <Input
            label={required ? `${label} *` : label}
            value={displayValue}
            placeholder={placeholder}
            error={displayError}
            hint={displayError ? undefined : hint}
            editable={false}
            pointerEvents="none"
            rightIcon="calendar-outline"
          />
        </Pressable>

        {renderNativePicker()}
      </View>
    );
  };

  return (
    <View style={styles.container}>{Platform.OS === 'web' ? renderWebInput() : renderNativeInput()}{hasValidated && isValid && !displayError && value && (
        <View style={styles.successContainer}><Ionicons
            name="checkmark-circle"
            size={14}
            color={CultureTokens.teal}
            style={styles.successIcon}
          /><Text style={[styles.successText, { color: CultureTokens.teal }]}>Valid date</Text></View>
      )}{!displayError && !hint && Platform.OS === 'web' && (
        <Text style={[styles.helperText, { color: colors.textTertiary }]}>Format: YYYY-MM-DD (e.g., 2020-01-15)</Text>
      )}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
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
  helperText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    paddingHorizontal: 4,
  },
});

export default DateField;
