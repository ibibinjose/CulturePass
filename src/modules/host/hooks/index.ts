/**
 * Host Module Hooks
 * 
 * Exports all hooks for the HostSpace Enterprise-Grade Form System.
 */

export { useFormWizard, type UseFormWizardOptions, type UseFormWizardReturn, type EntityType, type FormWizardState } from './useFormWizard';
export { useAutoSave, formatLastSaved, type UseAutoSaveOptions, type UseAutoSaveReturn, type SaveStatus } from './useAutoSave';
export { useDraftRecovery, formatDraftAge, calculateDraftCompletion, getDraftStepLabel, type UseDraftRecoveryOptions, type UseDraftRecoveryReturn } from './useDraftRecovery';
export { useFieldValidation, useFormValidation, type UseFieldValidationOptions, type UseFieldValidationReturn } from './useFieldValidation';
export { useMediaUpload, type MediaUploadOptions, type UploadResult, type MediaUploadState } from './useMediaUpload';
export { useProfileAnalytics, type UseProfileAnalyticsOptions, type UseProfileAnalyticsReturn, type AnalyticsPeriod, type OptimizationSuggestion } from './useProfileAnalytics';
export { useVersionHistory, formatVersionDate, formatDiffValue, computeVersionDiff, getFieldLabel, type UseVersionHistoryOptions, type UseVersionHistoryReturn, type FieldDiff, type VersionDiff } from './useVersionHistory';
export { usePrivacyControls, type UsePrivacyControlsOptions, type UsePrivacyControlsReturn } from './usePrivacyControls';
export { useMultiLanguage, isRTLLanguage, getTextDirection, getDirectionStyle, PROFILE_LANGUAGES, RTL_LANGUAGES, type ProfileLanguageCode, type TranslatableFields, type LanguageVersion, type MultiLanguageProfileData, type TranslationSuggestion, type TranslationStatus, type UseMultiLanguageOptions, type UseMultiLanguageReturn } from './useMultiLanguage';
export { useFormTranslations, type UseFormTranslationsReturn, type DateFormatOptions, type NumberFormatOptions, type CurrencyFormatOptions } from './useFormTranslations';
export { useAIAssist, type AIOperation, type FieldType, type AIAssistResult, type UseAIAssistReturn } from './useAIAssist';
export { useShareProfile, type SharePlatform, type ShareProfileConfig, type ShareEvent, type WidgetTheme, type WidgetSize, type WidgetOptions, type UseShareProfileReturn } from './useShareProfile';
