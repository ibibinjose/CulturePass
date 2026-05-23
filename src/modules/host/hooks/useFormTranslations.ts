/**
 * useFormTranslations Hook
 *
 * Provides translated strings and locale-aware formatting utilities
 * for the HostSpace form system. Wraps react-i18next's useTranslation
 * with host-module-specific helpers for dates, numbers, currency,
 * and pluralization.
 *
 * @example
 * ```tsx
 * const { t, formatDate, formatCurrency, formatNumber } = useFormTranslations();
 *
 * // Simple translation
 * <Text>{t('wizard.steps.identity')}</Text>
 *
 * // With interpolation
 * <Text>{t('wizard.progress.step', { current: 2, total: 6 })}</Text>
 *
 * // Locale-aware date
 * <Text>{formatDate(new Date())}</Text>
 *
 * // Locale-aware currency
 * <Text>{formatCurrency(2500, 'AUD')}</Text>
 *
 * // Pluralization
 * <Text>{t('versionHistory.changedFields', { count: 3 })}</Text>
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useTranslation, type UseTranslationOptions } from 'react-i18next';

import { HOST_NAMESPACE, getDeviceLocale } from '../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DateFormatOptions {
  /** 'short' = "14 Apr 2025", 'medium' = "14 April 2025", 'long' = "Monday, 14 April 2025" */
  style?: 'short' | 'medium' | 'long';
  /** Include time in the output */
  includeTime?: boolean;
  /** Use relative time (e.g., "2 hours ago") */
  relative?: boolean;
}

export interface NumberFormatOptions {
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
  /** Use grouping separators (e.g., 1,000) */
  useGrouping?: boolean;
  /** Display as percentage */
  asPercentage?: boolean;
  /** Compact notation (e.g., 1.2K) */
  compact?: boolean;
}

export interface CurrencyFormatOptions {
  /** Show currency symbol or code */
  display?: 'symbol' | 'code' | 'name';
  /** Minimum fraction digits (default: 2) */
  minimumFractionDigits?: number;
  /** Maximum fraction digits (default: 2) */
  maximumFractionDigits?: number;
}

export interface UseFormTranslationsReturn {
  /** Translation function scoped to host namespace */
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Format a date according to user's locale */
  formatDate: (date: Date | string | number, options?: DateFormatOptions) => string;
  /** Format a number according to user's locale */
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  /** Format currency according to user's locale */
  formatCurrency: (amountInCents: number, currencyCode?: string, options?: CurrencyFormatOptions) => string;
  /** Format relative time (e.g., "2 hours ago", "in 3 days") */
  formatRelativeTime: (date: Date | string | number) => string;
  /** Get the current locale string */
  locale: string;
  /** Current language code */
  language: string;
  /** Whether translations are ready */
  ready: boolean;
}

// ─── Relative Time Helpers ───────────────────────────────────────────────────

const RELATIVE_TIME_UNITS: Array<{
  unit: Intl.RelativeTimeFormatUnit;
  ms: number;
}> = [
  { unit: 'year', ms: 365.25 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30.44 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * Hook providing translations and locale-aware formatting for the host form system.
 *
 * Uses the device locale for date/number/currency formatting, independent of
 * the UI language. This means a user with English UI but Australian locale
 * will see dates as "14/04/2025" and currency as "$25.00 AUD".
 */
export function useFormTranslations(
  options?: UseTranslationOptions<typeof HOST_NAMESPACE>
): UseFormTranslationsReturn {
  const { t, i18n, ready } = useTranslation(HOST_NAMESPACE, options);

  const locale = useMemo(() => getDeviceLocale(), []);
  const language = i18n.language;

  // ─── Date Formatting ─────────────────────────────────────────────────────

  const formatDate = useCallback(
    (date: Date | string | number, formatOptions?: DateFormatOptions): string => {
      const d = date instanceof Date ? date : new Date(date);

      if (isNaN(d.getTime())) {
        return typeof date === 'string' ? date : '';
      }

      if (formatOptions?.relative) {
        return formatRelativeTimeInternal(d, locale);
      }

      const intlOptions: Intl.DateTimeFormatOptions = {};

      switch (formatOptions?.style) {
        case 'long':
          intlOptions.weekday = 'long';
          intlOptions.day = 'numeric';
          intlOptions.month = 'long';
          intlOptions.year = 'numeric';
          break;
        case 'medium':
          intlOptions.day = 'numeric';
          intlOptions.month = 'long';
          intlOptions.year = 'numeric';
          break;
        case 'short':
        default:
          intlOptions.day = 'numeric';
          intlOptions.month = 'short';
          intlOptions.year = 'numeric';
          break;
      }

      if (formatOptions?.includeTime) {
        intlOptions.hour = 'numeric';
        intlOptions.minute = '2-digit';
      }

      try {
        return new Intl.DateTimeFormat(locale, intlOptions).format(d);
      } catch {
        // Fallback for environments without full Intl support
        return d.toLocaleDateString();
      }
    },
    [locale]
  );

  // ─── Number Formatting ───────────────────────────────────────────────────

  const formatNumber = useCallback(
    (value: number, formatOptions?: NumberFormatOptions): string => {
      const intlOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: formatOptions?.minimumFractionDigits ?? 0,
        maximumFractionDigits: formatOptions?.maximumFractionDigits ?? 2,
        useGrouping: formatOptions?.useGrouping ?? true,
      };

      if (formatOptions?.asPercentage) {
        intlOptions.style = 'percent';
        intlOptions.minimumFractionDigits = formatOptions.minimumFractionDigits ?? 0;
        intlOptions.maximumFractionDigits = formatOptions.maximumFractionDigits ?? 1;
      }

      if (formatOptions?.compact) {
        intlOptions.notation = 'compact';
        intlOptions.compactDisplay = 'short';
      }

      try {
        return new Intl.NumberFormat(locale, intlOptions).format(value);
      } catch {
        return String(value);
      }
    },
    [locale]
  );

  // ─── Currency Formatting ─────────────────────────────────────────────────

  const formatCurrency = useCallback(
    (
      amountInCents: number,
      currencyCode = 'AUD',
      formatOptions?: CurrencyFormatOptions
    ): string => {
      // Determine if currency uses zero-decimal (e.g., JPY, KRW)
      const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'BIF', 'GNF'];
      const isZeroDecimal = zeroDecimalCurrencies.includes(currencyCode.toUpperCase());
      const amount = isZeroDecimal ? amountInCents : amountInCents / 100;

      const intlOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        currencyDisplay: formatOptions?.display ?? 'symbol',
        minimumFractionDigits: formatOptions?.minimumFractionDigits ?? (isZeroDecimal ? 0 : 2),
        maximumFractionDigits: formatOptions?.maximumFractionDigits ?? (isZeroDecimal ? 0 : 2),
      };

      try {
        return new Intl.NumberFormat(locale, intlOptions).format(amount);
      } catch {
        // Fallback: basic formatting
        const symbol = currencyCode.toUpperCase();
        return `${symbol} ${amount.toFixed(isZeroDecimal ? 0 : 2)}`;
      }
    },
    [locale]
  );

  // ─── Relative Time Formatting ────────────────────────────────────────────

  const formatRelativeTime = useCallback(
    (date: Date | string | number): string => {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) {
        return typeof date === 'string' ? date : '';
      }
      return formatRelativeTimeInternal(d, locale);
    },
    [locale]
  );

  return {
    t: t as (key: string, options?: Record<string, unknown>) => string,
    formatDate,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    locale,
    language,
    ready,
  };
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function formatRelativeTimeInternal(date: Date, locale: string): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const absDiff = Math.abs(diff);

  for (const { unit, ms } of RELATIVE_TIME_UNITS) {
    if (absDiff >= ms || unit === 'second') {
      const value = Math.round(diff / ms);
      try {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        return rtf.format(value, unit);
      } catch {
        // Fallback for environments without RelativeTimeFormat
        const absValue = Math.abs(value);
        const unitLabel = absValue === 1 ? unit : `${unit}s`;
        return diff < 0 ? `${absValue} ${unitLabel} ago` : `in ${absValue} ${unitLabel}`;
      }
    }
  }

  return 'just now';
}

export default useFormTranslations;
