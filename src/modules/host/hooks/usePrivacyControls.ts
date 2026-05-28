/**
 * usePrivacyControls Hook
 *
 * Manages privacy settings state for the HostSpace Enterprise-Grade Form System.
 * Provides field-level privacy controls, data export, data deletion,
 * consent management, and access logging.
 *
 * Requirements: 24 (Privacy and Data Protection)
 *
 * Features:
 * - Field-level privacy level management (Public/Members Only/Private)
 * - Data export trigger with download
 * - Data deletion request with 30-day anonymization
 * - Consent state tracking with timestamps
 * - Sensitive field access logging
 * - Re-authentication requirement for sensitive fields
 *
 * @example
 * ```tsx
 * const {
 *   fieldPrivacy,
 *   setFieldPrivacy,
 *   exportData,
 *   requestDeletion,
 *   consents,
 *   updateConsent,
 * } = usePrivacyControls({ profileId: 'abc123' });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PrivacyLevel } from '../components/fields/PrivacyControl';
import {
  getProfilePrivacySettings,
  updateProfilePrivacySettings,
  exportProfileData,
  downloadExportedData,
  requestDataDeletion,
  cancelDataDeletion,
  logFieldAccess,
  isSensitiveField,
  maskSensitiveValue,
  createConsentRecord,
  validateRequiredConsents,
  DEFAULT_FIELD_PRIVACY,
  REQUIRED_CONSENTS,
  OPTIONAL_CONSENTS,
  type ProfilePrivacyConfig,
  type ConsentRecord,
  type DataDeletionRequest,
} from '../services/privacyService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePrivacyControlsOptions {
  /** Profile ID to manage privacy for */
  profileId: string;
  /** Whether to enable fetching privacy settings */
  enabled?: boolean;
  /** Current user ID for access logging */
  userId?: string;
}

export interface UsePrivacyControlsReturn {
  /** Current field privacy settings (field name → privacy level) */
  fieldPrivacy: Record<string, PrivacyLevel>;
  /** Set privacy level for a specific field */
  setFieldPrivacy: (fieldName: string, level: PrivacyLevel) => void;
  /** Set privacy level for multiple fields at once */
  setBulkFieldPrivacy: (settings: Record<string, PrivacyLevel>) => void;
  /** Get the privacy level for a field (with fallback to default) */
  getFieldPrivacy: (fieldName: string) => PrivacyLevel;
  /** Default privacy level for new fields */
  defaultLevel: PrivacyLevel;
  /** Set the default privacy level */
  setDefaultLevel: (level: PrivacyLevel) => void;

  /** Export all profile data as JSON */
  exportData: () => Promise<void>;
  /** Whether data export is in progress */
  isExporting: boolean;

  /** Request data deletion (30-day anonymization) */
  requestDeletion: (reason?: string) => Promise<DataDeletionRequest>;
  /** Cancel a pending deletion request */
  cancelDeletion: () => Promise<void>;
  /** Whether a deletion request is pending */
  isDeletionPending: boolean;
  /** Whether deletion request is in progress */
  isDeleting: boolean;

  /** Current consent states */
  consents: Record<string, boolean>;
  /** Update a consent item */
  updateConsent: (consentId: string, given: boolean) => void;
  /** Consent history records */
  consentHistory: ConsentRecord[];
  /** Whether all required consents are given */
  allRequiredConsentsGiven: boolean;
  /** List of missing required consent IDs */
  missingConsents: string[];

  /** Check if a field is sensitive */
  isSensitive: (fieldName: string) => boolean;
  /** Mask a sensitive field value */
  maskValue: (fieldName: string, value: string) => string;
  /** Log access to a sensitive field */
  logAccess: (fieldName: string, action?: 'view' | 'export' | 'modify') => void;
  /** Whether re-authentication is required to view sensitive fields */
  requiresReauth: boolean;
  /** Mark that re-authentication has been completed */
  confirmReauth: () => void;

  /** Whether privacy settings are loading */
  isLoading: boolean;
  /** Whether privacy settings are being saved */
  isSaving: boolean;
  /** Error from privacy operations */
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

function privacySettingsKey(profileId: string) {
  return ['privacy-settings', profileId] as const;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePrivacyControls({
  profileId,
  enabled = true,
  userId,
}: UsePrivacyControlsOptions): UsePrivacyControlsReturn {
  const queryClient = useQueryClient();

  // Local state for consent management
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [isDeletionPending, setIsDeletionPending] = useState(false);
  const [requiresReauth, setRequiresReauth] = useState(true);
  const [defaultLevel, setDefaultLevelState] = useState<PrivacyLevel>('public');

  // Fetch privacy settings
  const {
    data: privacyConfig,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: privacySettingsKey(profileId),
    queryFn: () => getProfilePrivacySettings(profileId),
    enabled: enabled && !!profileId,
    staleTime: 60_000, // 1 minute
  });

  // Update privacy settings mutation
  const updateMutation = useMutation({
    mutationFn: (settings: Partial<ProfilePrivacyConfig>) =>
      updateProfilePrivacySettings(profileId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: privacySettingsKey(profileId) });
    },
  });

  // Export data mutation
  const exportMutation = useMutation({
    mutationFn: () => exportProfileData(profileId),
    onSuccess: (data) => {
      downloadExportedData(data);
      // Log the export action
      if (userId) {
        logFieldAccess(profileId, '_all', userId, 'export');
      }
    },
  });

  // Deletion mutation
  const deletionMutation = useMutation({
    mutationFn: (reason?: string) => requestDataDeletion(profileId, reason),
    onSuccess: () => {
      setIsDeletionPending(true);
    },
  });

  // Cancel deletion mutation
  const cancelDeletionMutation = useMutation({
    mutationFn: () => cancelDataDeletion(profileId),
    onSuccess: () => {
      setIsDeletionPending(false);
    },
  });

  // Current field privacy settings
  const fieldPrivacy = useMemo(
    () => privacyConfig?.fieldSettings ?? { ...DEFAULT_FIELD_PRIVACY },
    [privacyConfig]
  );

  // Set privacy for a single field
  const setFieldPrivacy = useCallback(
    (fieldName: string, level: PrivacyLevel) => {
      const updatedSettings = {
        ...fieldPrivacy,
        [fieldName]: level,
      };
      updateMutation.mutate({ fieldSettings: updatedSettings });
    },
    [fieldPrivacy, updateMutation]
  );

  // Set privacy for multiple fields
  const setBulkFieldPrivacy = useCallback(
    (settings: Record<string, PrivacyLevel>) => {
      const updatedSettings = {
        ...fieldPrivacy,
        ...settings,
      };
      updateMutation.mutate({ fieldSettings: updatedSettings });
    },
    [fieldPrivacy, updateMutation]
  );

  // Get privacy level for a field with fallback
  const getFieldPrivacy = useCallback(
    (fieldName: string): PrivacyLevel => {
      return fieldPrivacy[fieldName] ?? defaultLevel;
    },
    [fieldPrivacy, defaultLevel]
  );

  // Set default level
  const setDefaultLevel = useCallback(
    (level: PrivacyLevel) => {
      setDefaultLevelState(level);
      updateMutation.mutate({ defaultLevel: level });
    },
    [updateMutation]
  );

  // Export data
  const exportData = useCallback(async () => {
    await exportMutation.mutateAsync();
  }, [exportMutation]);

  // Request deletion
  const requestDeletion = useCallback(
    async (reason?: string) => {
      return deletionMutation.mutateAsync(reason);
    },
    [deletionMutation]
  );

  // Cancel deletion
  const cancelDeletion = useCallback(async () => {
    await cancelDeletionMutation.mutateAsync();
  }, [cancelDeletionMutation]);

  // Update consent
  const updateConsent = useCallback(
    (consentId: string, given: boolean) => {
      setConsents((prev) => ({ ...prev, [consentId]: given }));

      // Find the consent type
      const allConsents = [...REQUIRED_CONSENTS, ...OPTIONAL_CONSENTS];
      const consentItem = allConsents.find((c) => c.id === consentId);
      const type = consentItem?.type ?? 'data-processing';

      // Record consent change
      const record = createConsentRecord(consentId, type, given);
      setConsentHistory((prev) => [...prev, record]);
    },
    []
  );

  // Validate required consents
  const { valid: allRequiredConsentsGiven, missing: missingConsents } = useMemo(
    () => validateRequiredConsents(consents),
    [consents]
  );

  // Sensitive field helpers
  const isSensitive = useCallback(
    (fieldName: string) => isSensitiveField(fieldName),
    []
  );

  const maskValue = useCallback(
    (fieldName: string, value: string) => maskSensitiveValue(fieldName, value),
    []
  );

  const logAccess = useCallback(
    (fieldName: string, action: 'view' | 'export' | 'modify' = 'view') => {
      if (userId) {
        logFieldAccess(profileId, fieldName, userId, action);
      }
    },
    [profileId, userId]
  );

  // Confirm re-authentication
  const confirmReauth = useCallback(() => {
    setRequiresReauth(false);
  }, []);

  return {
    fieldPrivacy,
    setFieldPrivacy,
    setBulkFieldPrivacy,
    getFieldPrivacy,
    defaultLevel,
    setDefaultLevel,

    exportData,
    isExporting: exportMutation.isPending,

    requestDeletion,
    cancelDeletion,
    isDeletionPending,
    isDeleting: deletionMutation.isPending,

    consents,
    updateConsent,
    consentHistory,
    allRequiredConsentsGiven,
    missingConsents,

    isSensitive,
    maskValue,
    logAccess,
    requiresReauth,
    confirmReauth,

    isLoading,
    isSaving: updateMutation.isPending,
    error: fetchError as Error | null,
  };
}

export default usePrivacyControls;
