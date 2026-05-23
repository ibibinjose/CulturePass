/**
 * Host Module i18n Infrastructure
 *
 * Sets up react-i18next for the HostSpace form system with:
 * - English translations as default language
 * - Language detection from device/browser settings
 * - Pluralization support
 * - Interpolation with locale-aware formatting
 * - Translation key validation utilities
 *
 * This is scoped to the host module namespace to avoid conflicts
 * with any future app-wide i18n setup.
 */

import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';

// ─── Constants ───────────────────────────────────────────────────────────────

/** The i18n namespace used by the host module */
export const HOST_NAMESPACE = 'host';

/** Default language fallback */
export const DEFAULT_LANGUAGE = 'en';

/** Supported languages (extend as new translations are added) */
export const SUPPORTED_LANGUAGES = ['en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ─── Language Detection ──────────────────────────────────────────────────────

/**
 * Detects the user's preferred language from device/browser settings.
 * Falls back to English if the detected language is not supported.
 */
function detectLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const deviceLang = locales[0]?.languageCode?.toLowerCase();
      if (deviceLang && (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLang)) {
        return deviceLang as SupportedLanguage;
      }
    }
  } catch {
    // Fallback silently on detection failure
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Gets the user's locale string for Intl formatting (e.g., 'en-AU', 'en-US').
 * Uses the full locale tag from the device for accurate date/number formatting.
 */
export function getDeviceLocale(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const locale = locales[0];
      // Build BCP 47 tag: languageCode-regionCode
      if (locale?.languageTag) {
        return locale.languageTag;
      }
      if (locale?.languageCode && locale?.regionCode) {
        return `${locale.languageCode}-${locale.regionCode}`;
      }
      if (locale?.languageCode) {
        return locale.languageCode;
      }
    }
  } catch {
    // Fallback silently
  }
  return 'en-AU';
}

// ─── i18n Configuration ──────────────────────────────────────────────────────

const i18nConfig: InitOptions = {
  compatibilityJSON: 'v4',
  lng: detectLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  ns: [HOST_NAMESPACE],
  defaultNS: HOST_NAMESPACE,
  resources: {
    en: {
      [HOST_NAMESPACE]: en,
    },
  },
  interpolation: {
    escapeValue: false, // React already escapes
  },
  // Pluralization is handled natively by i18next v4
  pluralSeparator: '_',
  returnNull: false,
  returnEmptyString: false,
};

// Initialize i18next with React bindings
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init(i18nConfig);
}

// ─── Translation Key Validation ──────────────────────────────────────────────

type NestedKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? NestedKeys<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>
          : Prefix extends ''
            ? K
            : `${Prefix}.${K}`
        : never;
    }[keyof T]
  : never;

/** All valid translation keys for the host module */
export type TranslationKey = NestedKeys<typeof en>;

/**
 * Validates that a translation key exists in the English translations.
 * Useful for build-time or test-time validation.
 */
export function validateTranslationKey(key: string): boolean {
  const parts = key.split('.');
  let current: unknown = en;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string';
}

/**
 * Returns all translation keys that are missing values (empty strings).
 * Useful for CI/CD validation before deployment.
 */
export function findMissingTranslations(
  translations: Record<string, unknown>,
  prefix = ''
): string[] {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      missing.push(...findMissingTranslations(value as Record<string, unknown>, fullKey));
    } else if (value === '' || value === null || value === undefined) {
      missing.push(fullKey);
    }
  }

  return missing;
}

/**
 * Extracts all leaf keys from the translation object.
 * Useful for generating a list of all keys for translation management.
 */
export function extractAllKeys(
  translations: Record<string, unknown>,
  prefix = ''
): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      keys.push(...extractAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { i18n };
export default i18n;
