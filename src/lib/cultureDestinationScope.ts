import type { EventData } from '@/shared/schema';
import { getStateForCity } from '@/constants/locations';

/** Default countries to scan for diaspora culture hubs (merged with viewer’s country). */
export const CULTURE_HUB_DEFAULT_COUNTRIES = [
  'Australia',
  'New Zealand',
  'United Arab Emirates',
  'United Kingdom',
  'Canada',
  'India',
  'United States',
  'Singapore',
  'Philippines',
  'Vietnam',
  'South Korea',
  'Japan',
  'China',
  'Mexico',
  'Nigeria',
  'South Africa',
  'Kenya',
  'Ethiopia',
  'Somalia',
  'Iran',
  'Lebanon',
  'Greece',
  'Italy',
  'Ukraine',
  'Pakistan',
  'Sri Lanka',
  'Bangladesh',
  'Nepal',
  'Indonesia',
  'Malaysia',
  'Thailand',
  'France',
  'Germany',
  'Netherlands',
  'Ireland',
] as const;

export function normalizeCultureText(value?: string | null): string {
  return (value ?? '').toLowerCase().trim();
}

/** Build one searchable string from an event for culture / language matching. */
export function eventCultureHaystack(event: EventData): string {
  return normalizeCultureText(
    [
      event.title,
      event.description,
      event.category,
      event.city,
      event.state,
      event.country,
      event.venue,
      ...(event.tags ?? []),
      ...(event.cultureTag ?? []),
      ...(event.cultureTags ?? []),
      ...(event.languageTags ?? []),
    ].join(' '),
  );
}

export function eventMatchesCultureTerms(event: EventData, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = eventCultureHaystack(event);
  return terms.some((t) => hay.includes(normalizeCultureText(t)));
}

/** True if the event is in the viewer’s selected region (state / territory code). */
export function eventMatchesViewerRegion(event: EventData, stateCode: string): boolean {
  const sc = normalizeCultureText(stateCode);
  if (!sc) return false;
  if (normalizeCultureText(event.state) === sc) return true;
  const mapped = event.city ? getStateForCity(event.city) : undefined;
  return normalizeCultureText(mapped) === sc;
}

/**
 * Higher score = show first. Prioritises viewer’s country, then state/region, then stable country order.
 */
export function cultureDestinationPriorityScore(
  event: EventData,
  viewerCountry: string,
  viewerStateCode: string | undefined,
  options?: { originCountryHint?: string; originKeywords?: string[] },
): number {
  const vc = normalizeCultureText(viewerCountry);
  const ec = normalizeCultureText(event.country);
  let score = 0;

  if (ec && vc && ec === vc) score += 1_000_000;

  if (viewerStateCode && eventMatchesViewerRegion(event, viewerStateCode)) {
    score += 500_000;
  }

  const hint = options?.originCountryHint ? normalizeCultureText(options.originCountryHint) : '';
  if (hint && ec === hint && options?.originKeywords?.length) {
    const hay = eventCultureHaystack(event);
    if (options.originKeywords.some((k) => hay.includes(normalizeCultureText(k)))) {
      score += 250_000;
    }
  }

  const order = CULTURE_HUB_DEFAULT_COUNTRIES as unknown as string[];
  const idx = order.findIndex((c) => normalizeCultureText(c) === ec);
  score += Math.max(0, 50 - (idx >= 0 ? idx : 50));

  return score;
}

export function sortEventsForCultureDestination(
  events: EventData[],
  viewerCountry: string,
  viewerStateCode: string | undefined,
  options?: { originCountryHint?: string; originKeywords?: string[] },
): EventData[] {
  return [...events].sort((a, b) => {
    const sb =
      cultureDestinationPriorityScore(b, viewerCountry, viewerStateCode, options) -
      cultureDestinationPriorityScore(a, viewerCountry, viewerStateCode, options);
    if (sb !== 0) return sb;
    return (a.date ?? '').localeCompare(b.date ?? '');
  });
}

export function uniqueCountriesForHub(viewerCountry: string): string[] {
  const set = new Set<string>();
  set.add(viewerCountry);
  for (const c of CULTURE_HUB_DEFAULT_COUNTRIES) set.add(c);
  return Array.from(set);
}

/** How far we scan for diaspora-style hubs vs one-country listings. */
export type CultureHubScope = 'singleCountry' | 'diaspora';

export function countriesForCultureHubQueries(focusCountry: string, scope: CultureHubScope): string[] {
  if (scope === 'singleCountry') {
    return [focusCountry];
  }
  return uniqueCountriesForHub(focusCountry);
}
