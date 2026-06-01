/**
 * Web-only DateField
 *
 * This implementation avoids the native @react-native-community/datetimepicker
 * package, which is not available in the Expo web bundle.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
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
  allowFutureDates?: boolean;
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
  allowFutureDates = false,
}: DateFieldProps) {
  const colors = useColors();

  // Segmented date state (Year | Month | Day)
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // Sync from external value (e.g. draft load or parent change)
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    } else if (!value) {
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  // Compute days in the selected month/year for the Day dropdown
  const getDaysInMonth = (y: string, m: string): number => {
    if (!y || !m) return 31;
    const yearNum = parseInt(y, 10);
    const monthNum = parseInt(m, 10);
    if (isNaN(yearNum) || isNaN(monthNum)) return 31;
    return new Date(yearNum, monthNum, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(year, month);

  // Emit ISO date when all three parts are present
  const emitDate = (y: string, m: string, d: string) => {
    if (y && m && d) {
      const iso = `${y}-${m}-${d}`;
      onChange(iso);
    } else {
      // Incomplete → clear the value so the wizard knows the field is not done
      onChange('');
    }
  };

  const handleYearChange = (text: string) => {
    // Only allow digits, max 4 characters
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    setYear(cleaned);
    emitDate(cleaned, month, day);
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);

    // If current day is now invalid for the new month, clamp it
    const maxDay = getDaysInMonth(year, newMonth);
    let newDay = day;
    if (day && parseInt(day, 10) > maxDay) {
      newDay = String(maxDay).padStart(2, '0');
      setDay(newDay);
    }

    emitDate(year, newMonth, newDay);
  };

  const handleDayChange = (newDay: string) => {
    setDay(newDay);
    emitDate(year, month, newDay);
  };

  // Build options for selects
  const currentYear = new Date().getFullYear();
  const maxYear = allowFutureDates ? currentYear + 15 : currentYear;
  const minYear = 1800; // Reasonable for historical entities/organisers

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
    const y = String(maxYear - i);
    return { value: y, label: y };
  });

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    return { value: d, label: d };
  });

  // Notify parent validation callback if provided (simple passthrough based on whether we have a full valid date)
  useEffect(() => {
    if (onValidationComplete) {
      const hasFullDate = !!(year && month && day);
      onValidationComplete(hasFullDate);
    }
  }, [year, month, day, onValidationComplete]);

  const displayError = externalError || undefined;

  return (
    <View style={styles.container}>
      {/* Label with required asterisk to match other fields */}
      <Text style={[styles.label, { color: displayError ? colors.error : colors.text }]}>
        {required ? `${label} *` : label}
      </Text>

      {/* Three-column date selector: Year | Month | Day */}
      <View style={styles.dateRow}>
        {/* Year Column */}
        <View style={styles.dateCol}>
          <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Year</Text>
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={disabled}
            style={{
              ...styles.select,
              backgroundColor: colors.surfaceElevated,
              borderColor: displayError ? colors.error : colors.borderLight,
              color: colors.text,
            } as any}
            aria-label="Year"
          >
            <option value="">Year</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </View>

        {/* Month Column */}
        <View style={styles.dateCol}>
          <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Month</Text>
          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            disabled={disabled}
            style={{
              ...styles.select,
              backgroundColor: colors.surfaceElevated,
              borderColor: displayError ? colors.error : colors.borderLight,
              color: colors.text,
            } as any}
            aria-label="Month"
          >
            <option value="">Month</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </View>

        {/* Day Column */}
        <View style={styles.dateCol}>
          <Text style={[styles.colLabel, { color: colors.textSecondary }]}>Day</Text>
          <select
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            disabled={disabled}
            style={{
              ...styles.select,
              backgroundColor: colors.surfaceElevated,
              borderColor: displayError ? colors.error : colors.borderLight,
              color: colors.text,
            } as any}
            aria-label="Day"
          >
            <option value="">Day</option>
            {dayOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </View>
      </View>

      {/* Error or Hint (matching Input behavior) */}
      {displayError ? (
        <Text style={[styles.hint, { color: colors.error }]}>{displayError}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>
      ) : null}

      {/* Success indicator (simple check for complete valid date) */}
      {!displayError && year && month && day && value && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    marginLeft: 4,
    marginBottom: 4,
  },
  // Three-column layout: Year | Month | Day
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  dateCol: {
    flex: 1,
    minWidth: 0,
  },
  colLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
    marginLeft: 4,
  },
  // Base styles for <select> (theme colors + border are applied inline for dark mode support)
  select: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    outline: 'none',
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
  } as any,
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
    marginTop: 4,
  },
  successIcon: {},
  successText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  hint: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
});

export default DateField;
