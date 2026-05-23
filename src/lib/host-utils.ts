/**
 * Host Hub utility pure functions.
 *
 * - applyQuickPublishDefaults: merges basics with platform defaults for Quick Publish
 * - validateEventField: field-level validation for the event creation wizard
 *
 * All functions are pure (no side effects) for testability.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventBasics {
  title: string;
  category: string;
  description: string;
}

/** Minimal event payload shape produced by Quick Publish. */
export interface QuickPublishPayload {
  title: string;
  category: string;
  description: string;
  entryType: 'free';
  priceCents: 0;
  /** null = no capacity limit */
  capacityLimit: null;
  /** Organiser's saved venue or 'online'. */
  venue: string;
  /** ISO date string for start date (current date). */
  date: string;
  /** ISO date string for end date (current date + 7 days). */
  endDate: string;
  isFree: true;
  status: 'published';
}

// ---------------------------------------------------------------------------
// applyQuickPublishDefaults
// ---------------------------------------------------------------------------

/**
 * Produces a complete event payload by merging validated basics with platform defaults:
 *   - entryType: 'free'
 *   - priceCents: 0
 *   - capacityLimit: null (unlimited)
 *   - venue: organiserVenue ?? 'online'
 *   - date: today (ISO date string)
 *   - endDate: today + 7 days (ISO date string)
 *   - status: 'published'
 *
 * @param basics - Validated title, category, description
 * @param organiserVenue - The organiser's saved venue name (null if none)
 * @param nowMs - Current timestamp in ms (injectable for testing; defaults to Date.now())
 */
export function applyQuickPublishDefaults(
  basics: EventBasics,
  organiserVenue: string | null,
  nowMs = Date.now(),
): QuickPublishPayload {
  const startDate = new Date(nowMs);
  const endDate = new Date(nowMs + 7 * 24 * 60 * 60 * 1000);

  return {
    title: basics.title,
    category: basics.category,
    description: basics.description,
    entryType: 'free',
    priceCents: 0,
    capacityLimit: null,
    venue: organiserVenue ?? 'online',
    date: startDate.toISOString().split('T')[0]!,
    endDate: endDate.toISOString().split('T')[0]!,
    isFree: true,
    status: 'published',
  };
}

// ---------------------------------------------------------------------------
// validateEventField
// ---------------------------------------------------------------------------

export type EventFieldName = 'title' | 'description' | 'category';

const FIELD_RULES: Record<
  EventFieldName,
  (value: unknown) => string | null
> = {
  title: (value) => {
    if (typeof value !== 'string') return 'Title is required.';
    const trimmed = value.trim();
    if (trimmed.length < 1) return 'Title is required.';
    if (trimmed.length > 100) return 'Title must be 100 characters or fewer.';
    return null;
  },
  description: (value) => {
    if (typeof value !== 'string') return 'Description is required.';
    const trimmed = value.trim();
    if (trimmed.length < 1) return 'Description is required.';
    if (trimmed.length > 2000) return 'Description must be 2000 characters or fewer.';
    return null;
  },
  category: (value) => {
    if (typeof value !== 'string') return 'Category is required.';
    if (value.trim().length === 0) return 'Category is required.';
    return null;
  },
};

/**
 * Validates a single event creation field.
 *
 * @param field - The field name to validate
 * @param value - The current field value
 * @returns null when valid; a non-empty error message string when invalid
 */
export function validateEventField(
  field: EventFieldName,
  value: unknown,
): string | null {
  const rule = FIELD_RULES[field];
  return rule(value);
}
