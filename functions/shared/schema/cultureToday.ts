/**
 * Culture Today — global calendar of cultural observances (countries, states, cultures).
 * Stored in Firestore `cultureTodayEntries`; surfaced via Cloud Functions API.
 */

export const CULTURE_TODAY_EVENT_TAG = 'CultureToday' as const;

export type CultureTodayScopeType = 'global' | 'country' | 'state' | 'culture';

export interface CultureTodayEntry {
  id: string;
  /** "MM-DD" zero-padded */
  dayKey: string;
  month: number;
  day: number;
  title: string;
  subtitle?: string;
  body?: string;
  learnMoreUrl?: string;
  scopeType: CultureTodayScopeType;
  countryCode?: string;
  countryName?: string;
  stateRegion?: string;
  cultureLabel?: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
