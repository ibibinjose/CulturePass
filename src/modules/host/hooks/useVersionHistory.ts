/**
 * Version History Hook
 *
 * Manages version history data fetching, side-by-side diff computation,
 * rollback operations, and JSON export for host profiles.
 *
 * Uses TanStack Query for data fetching and caching.
 *
 * Usage:
 * ```tsx
 * const {
 *   versions,
 *   isLoading,
 *   selectedVersion,
 *   selectVersion,
 *   diff,
 *   rollback,
 *   isRollingBack,
 *   exportAsJson,
 * } = useVersionHistory({ profileId });
 * ```
 *
 * Validates: Requirements 18
 */

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import type { ProfileVersion } from '@/platform/api/endpoints/createProfilesNamespace';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseVersionHistoryOptions {
  /** Profile ID to fetch version history for */
  profileId: string;
  /** Whether to enable the query (default: true) */
  enabled?: boolean;
  /** Maximum number of versions to fetch */
  limit?: number;
}

export interface FieldDiff {
  /** Field path (dot-notation for nested fields) */
  field: string;
  /** Human-readable field label */
  label: string;
  /** Previous value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
}

export interface VersionDiff {
  /** Version being compared */
  version: ProfileVersion;
  /** Previous version (null for first version) */
  previousVersion: ProfileVersion | null;
  /** List of changed fields with old/new values */
  changes: FieldDiff[];
}

export interface UseVersionHistoryReturn {
  /** List of all versions (newest first) */
  versions: ProfileVersion[];
  /** Whether versions are loading */
  isLoading: boolean;
  /** Error from fetching versions */
  error: Error | null;
  /** Currently selected version for viewing */
  selectedVersion: ProfileVersion | null;
  /** Select a version to view its diff */
  selectVersion: (version: ProfileVersion | null) => void;
  /** Computed diff for the selected version */
  diff: VersionDiff | null;
  /** Rollback to a specific version */
  rollback: (versionNumber: number) => Promise<void>;
  /** Whether a rollback is in progress */
  isRollingBack: boolean;
  /** Export version history as JSON */
  exportAsJson: () => void;
  /** Refetch versions */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

const VERSION_HISTORY_KEY = 'profile-versions';

function versionHistoryKey(profileId: string) {
  return [VERSION_HISTORY_KEY, profileId] as const;
}

// ---------------------------------------------------------------------------
// Diff Utilities
// ---------------------------------------------------------------------------

/** Human-readable labels for profile fields */
const FIELD_LABELS: Record<string, string> = {
  officialName: 'Official Name',
  tradingName: 'Trading Name',
  handle: 'Handle',
  foundingDate: 'Founding Date',
  tagline: 'Tagline',
  description: 'Description',
  logoUrl: 'Logo',
  heroImageUrl: 'Hero Image',
  galleryImages: 'Gallery Images',
  videoUrl: 'Video',
  publicEmail: 'Public Email',
  phoneNumber: 'Phone Number',
  whatsappNumber: 'WhatsApp',
  socialLinks: 'Social Links',
  primaryContactMethod: 'Primary Contact Method',
  primaryAddress: 'Primary Address',
  additionalLocations: 'Additional Locations',
  isOnlineOnly: 'Online Only',
  categoryTags: 'Category Tags',
  metaDescription: 'Meta Description',
  abn: 'ABN',
  acn: 'ACN',
  gstRegistered: 'GST Registered',
  gstId: 'GST ID',
  licences: 'Licences',
  communityData: 'Community Details',
  organiserData: 'Organiser Details',
  venueData: 'Venue Details',
  businessData: 'Business Details',
  artistData: 'Artist Details',
  professionalData: 'Professional Details',
  status: 'Status',
  entityType: 'Entity Type',
};

/**
 * Get a human-readable label for a field path
 */
export function getFieldLabel(field: string): string {
  // Handle nested paths like "primaryAddress.street"
  const topLevel = field.split('.')[0];
  return FIELD_LABELS[topLevel] || formatFieldName(field);
}

/**
 * Convert camelCase field name to human-readable format
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Deep compare two values and determine if they differ
 */
function valuesAreDifferent(a: unknown, b: unknown): boolean {
  if (a === b) return false;
  if (a == null && b == null) return false;
  if (a == null || b == null) return true;

  // Compare arrays and objects by JSON serialization
  if (typeof a === 'object' || typeof b === 'object') {
    try {
      return JSON.stringify(a) !== JSON.stringify(b);
    } catch {
      return true;
    }
  }

  return a !== b;
}

/**
 * Compute the diff between two profile versions
 */
export function computeVersionDiff(
  current: ProfileVersion,
  previous: ProfileVersion | null
): FieldDiff[] {
  if (!previous) {
    // First version — show all fields as "added"
    return current.changedFields.map((field) => ({
      field,
      label: getFieldLabel(field),
      oldValue: undefined,
      newValue: (current.data as unknown as Record<string, unknown>)[field],
    }));
  }

  const changes: FieldDiff[] = [];
  const currentData = current.data as unknown as Record<string, unknown>;
  const previousData = previous.data as unknown as Record<string, unknown>;

  // Use changedFields from the version if available
  const fieldsToCheck =
    current.changedFields.length > 0
      ? current.changedFields
      : Object.keys(currentData);

  for (const field of fieldsToCheck) {
    const oldVal = previousData[field];
    const newVal = currentData[field];

    if (valuesAreDifferent(oldVal, newVal)) {
      changes.push({
        field,
        label: getFieldLabel(field),
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

/**
 * Format a value for display in the diff view
 */
export function formatDiffValue(value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 200) return value.slice(0, 200) + '…';
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)';
    // For simple string arrays, join them
    if (value.every((v) => typeof v === 'string')) {
      return value.join(', ');
    }
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value, null, 2);
      if (json.length > 200) return json.slice(0, 200) + '…';
      return json;
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

/**
 * Format a version timestamp for display
 */
export function formatVersionDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVersionHistory({
  profileId,
  enabled = true,
  limit,
}: UseVersionHistoryOptions): UseVersionHistoryReturn {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<ProfileVersion | null>(
    null
  );

  // Fetch version history
  const {
    data: versions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: versionHistoryKey(profileId),
    queryFn: () => api.profiles.getVersions(profileId, { limit }),
    enabled: enabled && !!profileId,
    staleTime: 30_000, // 30 seconds
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: (versionNumber: number) =>
      api.profiles.rollback(profileId, versionNumber),
    onSuccess: () => {
      // Invalidate version history and profile data
      queryClient.invalidateQueries({ queryKey: versionHistoryKey(profileId) });
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      setSelectedVersion(null);
    },
  });

  // Compute diff for selected version
  const diff = useMemo((): VersionDiff | null => {
    if (!selectedVersion || versions.length === 0) return null;

    // Find the previous version
    const currentIndex = versions.findIndex(
      (v) => v.versionNumber === selectedVersion.versionNumber
    );
    const previousVersion =
      currentIndex < versions.length - 1 ? versions[currentIndex + 1] : null;

    const changes = computeVersionDiff(selectedVersion, previousVersion);

    return {
      version: selectedVersion,
      previousVersion,
      changes,
    };
  }, [selectedVersion, versions]);

  // Select a version
  const selectVersion = useCallback(
    (version: ProfileVersion | null) => {
      setSelectedVersion(version);
    },
    []
  );

  // Rollback to a version
  const rollback = useCallback(
    async (versionNumber: number) => {
      await rollbackMutation.mutateAsync(versionNumber);
    },
    [rollbackMutation]
  );

  // Export version history as JSON
  const exportAsJson = useCallback(() => {
    if (versions.length === 0) return;

    const exportData = {
      profileId,
      exportedAt: new Date().toISOString(),
      totalVersions: versions.length,
      versions: versions.map((v) => ({
        versionNumber: v.versionNumber,
        changedFields: v.changedFields,
        changedBy: v.changedBy,
        changeReason: v.changeReason,
        createdAt: v.createdAt,
        data: v.data,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);

    if (Platform.OS === 'web') {
      // Web: trigger download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-${profileId}-versions.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Native: use Share API (simplified — in production, write to file first)
      // For now, copy to clipboard as a fallback
      try {
        const { Share } = require('react-native');
        Share.share({
          message: json,
          title: `Profile Version History - ${profileId}`,
        });
      } catch {
        // Fallback: log for debugging
        if (__DEV__) {
          console.log('[useVersionHistory] Export JSON:', json.slice(0, 500));
        }
      }
    }
  }, [versions, profileId]);

  return {
    versions,
    isLoading,
    error: error as Error | null,
    selectedVersion,
    selectVersion,
    diff,
    rollback,
    isRollingBack: rollbackMutation.isPending,
    exportAsJson,
    refetch,
  };
}
