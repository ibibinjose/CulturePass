/**
 * Form State Serialization Service
 * 
 * Handles serialization and deserialization of form state for:
 * - Local storage (AsyncStorage)
 * - Backend API (draft save/restore)
 * - Version history
 * 
 * Ensures consistent data format across all persistence layers.
 */

import type { HostProfileFormData } from '@/shared/schema/hostProfile';

/**
 * Form state that can be partially filled
 */
export type PartialFormData = HostProfileFormData;

/**
 * Serialization options
 */
export interface SerializationOptions {
  /**
   * Include metadata fields (createdAt, updatedAt, etc.)
   */
  includeMetadata?: boolean;
  /**
   * Pretty print JSON (for debugging)
   */
  prettyPrint?: boolean;
}

/**
 * Serialize form data to JSON string
 * 
 * @param formData - Partial profile data
 * @param options - Serialization options
 * @returns JSON string
 */
export function serializeFormData(
  formData: PartialFormData,
  options: SerializationOptions = {}
): string {
  const { includeMetadata = false, prettyPrint = false } = options;

  // Create a clean copy of the data
  const cleanData: Record<string, unknown> = {};

  // Copy all fields except metadata (unless explicitly included)
  for (const [key, value] of Object.entries(formData)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Skip metadata fields unless explicitly included
    if (!includeMetadata && isMetadataField(key)) continue;

    // Handle Date objects
    if (value instanceof Date) {
      cleanData[key] = value.toISOString();
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      cleanData[key] = value.map((item) => {
        if (item instanceof Date) return item.toISOString();
        if (typeof item === 'object' && item !== null) {
          return serializeObject(item);
        }
        return item;
      });
      continue;
    }

    // Handle nested objects
    if (typeof value === 'object' && value !== null) {
      cleanData[key] = serializeObject(value);
      continue;
    }

    // Primitive values
    cleanData[key] = value;
  }

  return JSON.stringify(cleanData, null, prettyPrint ? 2 : 0);
}

/**
 * Deserialize JSON string to form data
 * 
 * @param jsonString - JSON string
 * @returns Partial profile data
 */
export function deserializeFormData(jsonString: string): PartialFormData {
  try {
    const parsed = JSON.parse(jsonString);
    return deserializeObject(parsed) as PartialFormData;
  } catch (error) {
    console.error('[formStateSerializer] Failed to deserialize form data:', error);
    throw new Error('Invalid form data format');
  }
}

/**
 * Merge form data with defaults
 * 
 * @param formData - Partial form data
 * @param defaults - Default values
 * @returns Merged form data
 */
export function mergeFormData(
  formData: PartialFormData,
  defaults: PartialFormData
): PartialFormData {
  return {
    ...defaults,
    ...formData,
    // Deep merge for nested objects
    ...(formData.communityData && defaults.communityData
      ? { communityData: { ...defaults.communityData, ...formData.communityData } }
      : {}),
    ...(formData.organiserData && defaults.organiserData
      ? { organiserData: { ...defaults.organiserData, ...formData.organiserData } }
      : {}),
    ...(formData.venueData && defaults.venueData
      ? { venueData: { ...defaults.venueData, ...formData.venueData } }
      : {}),
    ...(formData.businessData && defaults.businessData
      ? { businessData: { ...defaults.businessData, ...formData.businessData } }
      : {}),
    ...(formData.artistData && defaults.artistData
      ? { artistData: { ...defaults.artistData, ...formData.artistData } }
      : {}),
    ...(formData.professionalData && defaults.professionalData
      ? { professionalData: { ...defaults.professionalData, ...formData.professionalData } }
      : {}),
  };
}

/**
 * Calculate diff between two form states
 * 
 * @param oldData - Previous form data
 * @param newData - New form data
 * @returns Array of changed field paths
 */
export function calculateFormDiff(
  oldData: PartialFormData,
  newData: PartialFormData
): string[] {
  const changedFields: string[] = [];

  // Get all unique keys from both objects
  const allKeys = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData),
  ]);

  for (const key of allKeys) {
    const oldValue = oldData[key as keyof PartialFormData];
    const newValue = newData[key as keyof PartialFormData];

    // Skip if both are undefined
    if (oldValue === undefined && newValue === undefined) continue;

    // Check if values are different
    if (!deepEqual(oldValue, newValue)) {
      changedFields.push(key);

      // For nested objects, add specific field paths
      if (
        typeof oldValue === 'object' &&
        oldValue !== null &&
        typeof newValue === 'object' &&
        newValue !== null &&
        !Array.isArray(oldValue) &&
        !Array.isArray(newValue)
      ) {
        const nestedDiff = calculateNestedDiff(
          oldValue as Record<string, unknown>,
          newValue as Record<string, unknown>,
          key
        );
        changedFields.push(...nestedDiff);
      }
    }
  }

  return changedFields;
}

/**
 * Validate form data structure
 * 
 * @param formData - Form data to validate
 * @returns True if structure is valid
 */
export function validateFormDataStructure(formData: unknown): formData is PartialFormData {
  if (typeof formData !== 'object' || formData === null) {
    return false;
  }

  const data = formData as Record<string, unknown>;

  // Check for required entity type if any data exists
  if (Object.keys(data).length > 0 && !data.entityType) {
    return false;
  }

  // Validate entity type if present
  if (data.entityType) {
    const validEntityTypes = ['community', 'organiser', 'venue', 'business', 'artist', 'professional'];
    if (!validEntityTypes.includes(data.entityType as string)) {
      return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Check if a field is a metadata field
 */
function isMetadataField(key: string): boolean {
  const metadataFields = [
    'id',
    'createdAt',
    'updatedAt',
    'publishedAt',
    'lastModifiedBy',
    'viewCount',
    'uniqueVisitorCount',
    'contactClickCount',
    'searchAppearances',
    'engagementScore',
  ];
  return metadataFields.includes(key);
}

/**
 * Serialize a nested object
 */
function serializeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (item instanceof Date) return item.toISOString();
        if (typeof item === 'object' && item !== null) {
          return serializeObject(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = serializeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Deserialize a nested object
 */
function deserializeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      result[key] = value;
      continue;
    }

    // Try to parse ISO date strings
    if (typeof value === 'string' && isISODateString(value)) {
      result[key] = value; // Keep as string for form compatibility
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string' && isISODateString(item)) {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          return deserializeObject(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }

    // Handle nested objects
    if (typeof value === 'object') {
      result[key] = deserializeObject(value as Record<string, unknown>);
      continue;
    }

    // Primitive values
    result[key] = value;
  }

  return result;
}

/**
 * Check if a string is an ISO date string
 */
function isISODateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/.test(value);
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * Calculate diff for nested objects
 */
function calculateNestedDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix: string
): string[] {
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (!deepEqual(oldValue, newValue)) {
      changedFields.push(`${prefix}.${key}`);
    }
  }

  return changedFields;
}
