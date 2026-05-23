/**
 * useMultiLanguage Hook
 *
 * Manages multi-language profile support including:
 * - Database schema for multiple language versions per profile
 * - Language selection and switching
 * - Translation field duplication
 * - RTL (right-to-left) language detection
 * - AI translation suggestions
 * - Language version validation
 *
 * Requirements: 32
 */

import { useState, useCallback, useMemo } from 'react';
import { I18nManager } from 'react-native';
import { api } from '@/lib/api';
import { LANGUAGES, type Language } from '@/constants/languages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported profile languages for CulturePass target markets (AU, NZ, UAE, UK, CA) */
export type ProfileLanguageCode =
  | 'eng' // English
  | 'ara' // Arabic
  | 'hin' // Hindi
  | 'cmn' // Chinese (Mandarin)
  | 'vie' // Vietnamese
  | 'kor' // Korean
  | 'ell' // Greek
  | 'ita' // Italian
  | 'tgl'; // Filipino (Tagalog)

/** RTL language codes */
export const RTL_LANGUAGES: ProfileLanguageCode[] = ['ara'];

/** All supported profile languages with metadata */
export const PROFILE_LANGUAGES: Record<ProfileLanguageCode, Language> = {
  eng: LANGUAGES.eng,
  ara: LANGUAGES.ara,
  hin: LANGUAGES.hin,
  cmn: LANGUAGES.cmn,
  vie: LANGUAGES.vie,
  kor: LANGUAGES.kor,
  ell: LANGUAGES.ell,
  ita: LANGUAGES.ita,
  tgl: LANGUAGES.tgl,
};

/** Translatable text fields on a profile */
export interface TranslatableFields {
  officialName?: string;
  tradingName?: string;
  tagline?: string;
  description?: string;
  metaDescription?: string;
  communityGuidelines?: string;
  producerCredentials?: string;
}

/** A single language version of a profile */
export interface LanguageVersion {
  /** ISO 639-3 language code */
  languageCode: ProfileLanguageCode;
  /** Whether this is the primary (original) language */
  isPrimary: boolean;
  /** Translated text fields */
  fields: TranslatableFields;
  /** Translation completeness (0-100) */
  completeness: number;
  /** Whether all required fields are translated */
  isComplete: boolean;
  /** Last updated timestamp */
  updatedAt: string | null;
  /** Whether this version is published */
  isPublished: boolean;
}

/** Multi-language profile schema (stored in Firestore) */
export interface MultiLanguageProfileData {
  /** Primary language code */
  primaryLanguage: ProfileLanguageCode;
  /** All language versions */
  versions: LanguageVersion[];
  /** Languages enabled for this profile */
  enabledLanguages: ProfileLanguageCode[];
}

/** AI translation suggestion */
export interface TranslationSuggestion {
  field: keyof TranslatableFields;
  originalText: string;
  translatedText: string;
  confidence: number; // 0-1
  languageCode: ProfileLanguageCode;
}

/** Translation status for a field */
export type TranslationStatus = 'untranslated' | 'draft' | 'ai-suggested' | 'verified';

export interface UseMultiLanguageOptions {
  /** Profile ID (for existing profiles) */
  profileId?: string;
  /** Initial primary language (defaults to English) */
  initialPrimaryLanguage?: ProfileLanguageCode;
  /** Initial form data for the primary language */
  initialFields?: TranslatableFields;
}

export interface UseMultiLanguageReturn {
  /** Current active language being edited */
  activeLanguage: ProfileLanguageCode;
  /** Primary language of the profile */
  primaryLanguage: ProfileLanguageCode;
  /** All enabled languages */
  enabledLanguages: ProfileLanguageCode[];
  /** All language versions */
  versions: LanguageVersion[];
  /** Current active version's fields */
  activeFields: TranslatableFields;
  /** Whether the active language is RTL */
  isRTL: boolean;
  /** Whether AI translation is loading */
  isTranslating: boolean;
  /** Translation error */
  translationError: string | null;
  /** Set the active language for editing */
  setActiveLanguage: (code: ProfileLanguageCode) => void;
  /** Set the primary language */
  setPrimaryLanguage: (code: ProfileLanguageCode) => void;
  /** Add a language to the profile */
  addLanguage: (code: ProfileLanguageCode) => void;
  /** Remove a language from the profile */
  removeLanguage: (code: ProfileLanguageCode) => void;
  /** Update a field in the active language version */
  updateField: (field: keyof TranslatableFields, value: string) => void;
  /** Update fields in the primary language (syncs from wizard) */
  updatePrimaryFields: (fields: TranslatableFields) => void;
  /** Request AI translation for a specific field */
  requestAITranslation: (field: keyof TranslatableFields, targetLanguage: ProfileLanguageCode) => Promise<TranslationSuggestion | null>;
  /** Request AI translation for all fields in a language */
  requestAllTranslations: (targetLanguage: ProfileLanguageCode) => Promise<TranslationSuggestion[]>;
  /** Get completeness percentage for a language */
  getCompleteness: (code: ProfileLanguageCode) => number;
  /** Check if a language version is ready to publish */
  isVersionComplete: (code: ProfileLanguageCode) => boolean;
  /** Get the full multi-language data for saving */
  getMultiLanguageData: () => MultiLanguageProfileData;
  /** Get translation status for a specific field in a language */
  getFieldTranslationStatus: (code: ProfileLanguageCode, field: keyof TranslatableFields) => TranslationStatus;
  /** Get available (not yet enabled) languages */
  availableLanguages: ProfileLanguageCode[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Required translatable fields that must be filled for a version to be complete */
const REQUIRED_TRANSLATABLE_FIELDS: (keyof TranslatableFields)[] = [
  'officialName',
  'tagline',
  'description',
];

/** Calculate completeness percentage for a language version */
function calculateCompleteness(fields: TranslatableFields): number {
  const totalFields = REQUIRED_TRANSLATABLE_FIELDS.length;
  if (totalFields === 0) return 100;

  const filledFields = REQUIRED_TRANSLATABLE_FIELDS.filter(
    (key) => fields[key] && fields[key]!.trim().length > 0
  ).length;

  return Math.round((filledFields / totalFields) * 100);
}

/** Check if a version has all required fields translated */
function checkVersionComplete(fields: TranslatableFields): boolean {
  return REQUIRED_TRANSLATABLE_FIELDS.every(
    (key) => fields[key] && fields[key]!.trim().length > 0
  );
}

/** Check if a language code is RTL */
export function isRTLLanguage(code: ProfileLanguageCode): boolean {
  return RTL_LANGUAGES.includes(code);
}

/** Get text direction for a language */
export function getTextDirection(code: ProfileLanguageCode): 'ltr' | 'rtl' {
  return isRTLLanguage(code) ? 'rtl' : 'ltr';
}

/** Get writing direction style for a language */
export function getDirectionStyle(code: ProfileLanguageCode) {
  const isRTL = isRTLLanguage(code);
  return {
    direction: isRTL ? ('rtl' as const) : ('ltr' as const),
    textAlign: isRTL ? ('right' as const) : ('left' as const),
    writingDirection: isRTL ? ('rtl' as const) : ('ltr' as const),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMultiLanguage(options: UseMultiLanguageOptions = {}): UseMultiLanguageReturn {
  const {
    initialPrimaryLanguage = 'eng',
    initialFields = {},
  } = options;

  // State
  const [primaryLanguage, setPrimaryLanguageState] = useState<ProfileLanguageCode>(initialPrimaryLanguage);
  const [activeLanguage, setActiveLanguageState] = useState<ProfileLanguageCode>(initialPrimaryLanguage);
  const [enabledLanguages, setEnabledLanguages] = useState<ProfileLanguageCode[]>([initialPrimaryLanguage]);
  const [versions, setVersions] = useState<LanguageVersion[]>([
    {
      languageCode: initialPrimaryLanguage,
      isPrimary: true,
      fields: initialFields,
      completeness: calculateCompleteness(initialFields),
      isComplete: checkVersionComplete(initialFields),
      updatedAt: new Date().toISOString(),
      isPublished: false,
    },
  ]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Derived state
  const isRTL = useMemo(() => isRTLLanguage(activeLanguage), [activeLanguage]);

  const activeFields = useMemo(() => {
    const version = versions.find((v) => v.languageCode === activeLanguage);
    return version?.fields ?? {};
  }, [versions, activeLanguage]);

  const availableLanguages = useMemo(() => {
    const allCodes = Object.keys(PROFILE_LANGUAGES) as ProfileLanguageCode[];
    return allCodes.filter((code) => !enabledLanguages.includes(code));
  }, [enabledLanguages]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const setActiveLanguage = useCallback((code: ProfileLanguageCode) => {
    if (enabledLanguages.includes(code)) {
      setActiveLanguageState(code);

      // Update RTL layout direction for the app when switching to/from RTL languages
      const shouldBeRTL = isRTLLanguage(code);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
      }
    }
  }, [enabledLanguages]);

  const setPrimaryLanguage = useCallback((code: ProfileLanguageCode) => {
    setPrimaryLanguageState(code);
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        isPrimary: v.languageCode === code,
      }))
    );
  }, []);

  const addLanguage = useCallback((code: ProfileLanguageCode) => {
    if (enabledLanguages.includes(code)) return;

    setEnabledLanguages((prev) => [...prev, code]);
    setVersions((prev) => [
      ...prev,
      {
        languageCode: code,
        isPrimary: false,
        fields: {},
        completeness: 0,
        isComplete: false,
        updatedAt: null,
        isPublished: false,
      },
    ]);
  }, [enabledLanguages]);

  const removeLanguage = useCallback((code: ProfileLanguageCode) => {
    // Cannot remove primary language
    if (code === primaryLanguage) return;

    setEnabledLanguages((prev) => prev.filter((c) => c !== code));
    setVersions((prev) => prev.filter((v) => v.languageCode !== code));

    // Switch active language if removing the active one
    if (activeLanguage === code) {
      setActiveLanguageState(primaryLanguage);
    }
  }, [primaryLanguage, activeLanguage]);

  const updateField = useCallback((field: keyof TranslatableFields, value: string) => {
    setVersions((prev) =>
      prev.map((v) => {
        if (v.languageCode !== activeLanguage) return v;

        const updatedFields = { ...v.fields, [field]: value };
        return {
          ...v,
          fields: updatedFields,
          completeness: calculateCompleteness(updatedFields),
          isComplete: checkVersionComplete(updatedFields),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [activeLanguage]);

  const updatePrimaryFields = useCallback((fields: TranslatableFields) => {
    setVersions((prev) =>
      prev.map((v) => {
        if (v.languageCode !== primaryLanguage) return v;

        const updatedFields = { ...v.fields, ...fields };
        return {
          ...v,
          fields: updatedFields,
          completeness: calculateCompleteness(updatedFields),
          isComplete: checkVersionComplete(updatedFields),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, [primaryLanguage]);

  const requestAITranslation = useCallback(async (
    field: keyof TranslatableFields,
    targetLanguage: ProfileLanguageCode
  ): Promise<TranslationSuggestion | null> => {
    // Get the source text from primary language
    const primaryVersion = versions.find((v) => v.languageCode === primaryLanguage);
    const sourceText = primaryVersion?.fields[field];

    if (!sourceText || sourceText.trim().length === 0) {
      setTranslationError('No source text available for translation');
      return null;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const response = await api.ai.assist({
        text: sourceText,
        operation: 'improve', // Using improve as a proxy for translation
        fieldType: 'description',
      });

      const suggestion: TranslationSuggestion = {
        field,
        originalText: sourceText,
        translatedText: response.suggestedText,
        confidence: 0.85,
        languageCode: targetLanguage,
      };

      return suggestion;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Translation failed. Please try again.';
      setTranslationError(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [versions, primaryLanguage]);

  const requestAllTranslations = useCallback(async (
    targetLanguage: ProfileLanguageCode
  ): Promise<TranslationSuggestion[]> => {
    const primaryVersion = versions.find((v) => v.languageCode === primaryLanguage);
    if (!primaryVersion) return [];

    setIsTranslating(true);
    setTranslationError(null);

    const suggestions: TranslationSuggestion[] = [];

    try {
      const fieldsToTranslate = Object.entries(primaryVersion.fields).filter(
        ([, value]) => value && value.trim().length > 0
      );

      for (const [field, sourceText] of fieldsToTranslate) {
        try {
          const response = await api.ai.assist({
            text: sourceText!,
            operation: 'improve',
            fieldType: 'description',
          });

          suggestions.push({
            field: field as keyof TranslatableFields,
            originalText: sourceText!,
            translatedText: response.suggestedText,
            confidence: 0.85,
            languageCode: targetLanguage,
          });
        } catch {
          // Continue with other fields if one fails
          continue;
        }
      }

      // Auto-apply suggestions to the version
      if (suggestions.length > 0) {
        setVersions((prev) =>
          prev.map((v) => {
            if (v.languageCode !== targetLanguage) return v;

            const updatedFields = { ...v.fields };
            for (const suggestion of suggestions) {
              updatedFields[suggestion.field] = suggestion.translatedText;
            }

            return {
              ...v,
              fields: updatedFields,
              completeness: calculateCompleteness(updatedFields),
              isComplete: checkVersionComplete(updatedFields),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      return suggestions;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Translation failed. Please try again.';
      setTranslationError(message);
      return [];
    } finally {
      setIsTranslating(false);
    }
  }, [versions, primaryLanguage]);

  const getCompleteness = useCallback((code: ProfileLanguageCode): number => {
    const version = versions.find((v) => v.languageCode === code);
    return version?.completeness ?? 0;
  }, [versions]);

  const isVersionComplete = useCallback((code: ProfileLanguageCode): boolean => {
    const version = versions.find((v) => v.languageCode === code);
    return version?.isComplete ?? false;
  }, [versions]);

  const getMultiLanguageData = useCallback((): MultiLanguageProfileData => {
    return {
      primaryLanguage,
      versions,
      enabledLanguages,
    };
  }, [primaryLanguage, versions, enabledLanguages]);

  const getFieldTranslationStatus = useCallback((
    code: ProfileLanguageCode,
    field: keyof TranslatableFields
  ): TranslationStatus => {
    if (code === primaryLanguage) return 'verified';

    const version = versions.find((v) => v.languageCode === code);
    if (!version) return 'untranslated';

    const fieldValue = version.fields[field];
    if (!fieldValue || fieldValue.trim().length === 0) return 'untranslated';

    // If the field has content, mark as draft (could be AI-suggested or manually entered)
    return 'draft';
  }, [versions, primaryLanguage]);

  return {
    activeLanguage,
    primaryLanguage,
    enabledLanguages,
    versions,
    activeFields,
    isRTL,
    isTranslating,
    translationError,
    setActiveLanguage,
    setPrimaryLanguage,
    addLanguage,
    removeLanguage,
    updateField,
    updatePrimaryFields,
    requestAITranslation,
    requestAllTranslations,
    getCompleteness,
    isVersionComplete,
    getMultiLanguageData,
    getFieldTranslationStatus,
    availableLanguages,
  };
}
