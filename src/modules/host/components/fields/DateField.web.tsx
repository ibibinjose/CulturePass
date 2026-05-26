/**
 * Web-only DateField
 *
 * This implementation avoids the native @react-native-community/datetimepicker
 * package, which is not available in the Expo web bundle.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/design-system/ui/Input';
import { useColors } from '@/hooks/useColors';
import { useFieldValidation } from '@/modules/host/hooks/useFieldValidation';
import { pastDateSchema } from '@/modules/host/schemas/profileSchema';
import { CultureTokens, FontFamily } from '@/design-system/tokens/theme';

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
  onValidationComplete?: (isValid: boolean) => void;
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(isoString: string): Date | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;
  return date;
}

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
  placeholder = 'YYYY-MM-DD',
  required = true,
  disabled = false,
  maxDate = new Date(),
  minDate,
  onValidationComplete,
}: DateFieldProps) {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? parseISODate(value) || new Date() : new Date()
  );

  const {
    error: validationError,
    isValid,
    hasValidated,
    validate,
  } = useFieldValidation({
    schema: pastDateSchema,
    debounceMs: 300,
  });

  const handleTextChange = (text: string) => {
    onChange(text);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      validate(text);
      const date = parseISODate(text);
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  useEffect(() => {
    if (hasValidated && onValidationComplete) {
      onValidationComplete(isValid);
    }
  }, [isValid, hasValidated, onValidationComplete]);

  const displayError = externalError || validationError || undefined;
  const displayValue = value ? formatDateForDisplay(value) : '';

  return (
    <View style={styles.container}>
      <Input
        label={required ? `${label} *` : label}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        error={displayError}
        hint={displayError ? undefined : hint}
        editable={!disabled}
        accessibilityLabel={label}
        accessibilityHint="Enter date in YYYY-MM-DD format"
        rightIcon={hasValidated && isValid && !displayError ? 'checkmark-circle' : undefined}
      />

      {hasValidated && isValid && !displayError && value && (
        <View style={styles.successContainer}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={CultureTokens.teal}
            style={styles.successIcon}
          />
          <Text style={[styles.successText, { color: CultureTokens.teal }]}>Valid date</Text>
        </View>
      )}

      {!displayError && !hint && Platform.OS === 'web' && (
        <Text style={[styles.helperText, { color: colors.textTertiary }]}>Format: YYYY-MM-DD (e.g., 2020-01-15)</Text>
      )}
    </View>
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
  successIcon: {},
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
