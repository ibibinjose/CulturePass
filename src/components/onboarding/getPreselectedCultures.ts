/**
 * Locale-based culture tag pre-selection for onboarding.
 *
 * Maps a user's detected locale and device language to 1–5 culture tags
 * from the available set. Returns an empty array when no mapping exists.
 *
 * Pure function — no side effects, easily testable.
 */

import { CULTURES } from '@/constants/cultures';
import { LANGUAGES } from '@/constants/languages';

/** A culture tag is the string `id` of a Culture entry (e.g. 'tamil', 'han_chinese'). */
export type CultureTag = string;

/**
 * Maximum number of pre-selected culture tags returned.
 * Requirement 2.1 specifies 1–5 tags.
 */
const MAX_PRESELECTED = 5;

/**
 * Build a lookup from ISO 639-1 (2-letter) language codes to ISO 639-3 IDs.
 * This allows us to resolve locale language codes (e.g. 'hi', 'zh', 'ta')
 * to the internal language IDs used by CULTURES.primaryLanguageId.
 */
function buildIso1ToIso3Map(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const lang of Object.values(LANGUAGES)) {
    if (lang.iso1) {
      const key = lang.iso1.toLowerCase();
      const existing = map.get(key) ?? [];
      existing.push(lang.id);
      map.set(key, existing);
    }
  }
  return map;
}

const iso1ToIso3 = buildIso1ToIso3Map();

/**
 * Extract the language subtag from a BCP 47 locale string.
 * Examples: 'en-AU' → 'en', 'hi' → 'hi', 'zh-Hans-CN' → 'zh'
 */
function extractLanguageCode(locale: string): string {
  const trimmed = locale.trim().toLowerCase();
  // BCP 47: language is always the first subtag before '-' or '_'
  const sep = trimmed.indexOf('-') !== -1 ? '-' : '_';
  return trimmed.split(sep)[0] ?? '';
}

/**
 * Find culture IDs whose primaryLanguageId matches any of the given ISO 639-3 codes.
 */
function findCulturesByLanguageIds(languageIds: string[]): string[] {
  if (languageIds.length === 0) return [];

  const langSet = new Set(languageIds);
  const results: string[] = [];

  for (const culture of Object.values(CULTURES)) {
    if (langSet.has(culture.primaryLanguageId)) {
      results.push(culture.id);
    }
  }

  return results;
}

/**
 * Resolve a 2-letter language code (ISO 639-1) to matching culture IDs.
 */
function resolveCulturesFromIso1(iso1Code: string): string[] {
  if (!iso1Code) return [];
  const iso3Ids = iso1ToIso3.get(iso1Code);
  if (!iso3Ids || iso3Ids.length === 0) return [];
  return findCulturesByLanguageIds(iso3Ids);
}

/**
 * Get pre-selected culture tags based on locale and device language.
 *
 * @param locale - BCP 47 locale string (e.g. 'en-AU', 'hi-IN', 'zh-Hans')
 * @param deviceLanguage - Device language code (e.g. 'hi', 'en', 'zh', 'ta')
 * @param availableCultures - The set of culture tag IDs currently available for selection
 * @returns Array of 1–5 culture tag IDs that are members of availableCultures,
 *          or empty array if no mapping exists
 */
export function getPreselectedCultures(
  locale: string,
  deviceLanguage: string,
  availableCultures: CultureTag[]
): CultureTag[] {
  if (!locale && !deviceLanguage) return [];
  if (availableCultures.length === 0) return [];

  const availableSet = new Set(availableCultures);

  // Extract language codes from both inputs
  const localeLanguage = extractLanguageCode(locale);
  const deviceLang = extractLanguageCode(deviceLanguage);

  // Collect candidate culture IDs from both locale and device language
  // Use a Set to deduplicate
  const candidateSet = new Set<string>();

  // Resolve from locale language
  const fromLocale = resolveCulturesFromIso1(localeLanguage);
  for (const id of fromLocale) {
    candidateSet.add(id);
  }

  // Resolve from device language (may differ from locale)
  const fromDevice = resolveCulturesFromIso1(deviceLang);
  for (const id of fromDevice) {
    candidateSet.add(id);
  }

  // Filter to only available cultures
  const matched = Array.from(candidateSet).filter((id) => availableSet.has(id));

  // Return empty if no mapping exists
  if (matched.length === 0) return [];

  // Cap at MAX_PRESELECTED (1–5 results)
  return matched.slice(0, MAX_PRESELECTED);
}
