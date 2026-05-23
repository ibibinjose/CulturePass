import { CULTUREX_EXPLORES_CULTURE_TAG } from '@/shared/schema';

/**
 * Culture Match — preset culture tags for cross-cultural discovery.
 * Values are matched case-insensitively against `event.cultureTag` / `event.cultureTags`
 * (see `searchService.globalSearch` and event create flows).
 */
export type CultureExplorePreset = {
  id: string;
  label: string;
  /** Canonical tag sent to GET /api/search?cultureTag= */
  cultureTag: string;
};

export const CULTURE_EXPLORE_PRESETS: CultureExplorePreset[] = [
  {
    id: 'culture-explores-welcome',
    label: 'Hosting Culture Explorers',
    cultureTag: CULTUREX_EXPLORES_CULTURE_TAG,
  },
  { id: 'onam', label: 'Onam', cultureTag: 'onam' },
  { id: 'holi', label: 'Holi', cultureTag: 'holi' },
  { id: 'diwali', label: 'Diwali', cultureTag: 'diwali' },
  { id: 'eid', label: 'Eid / Ramadan', cultureTag: 'eid' },
  { id: 'ramadan', label: 'Ramadan markets', cultureTag: 'ramadan' },
  { id: 'songkran', label: 'Songkran', cultureTag: 'songkran' },
  { id: 'lunar-new-year', label: 'Lunar New Year', cultureTag: 'lunar new year' },
  { id: 'navratri', label: 'Navratri / Garba', cultureTag: 'navratri' },
  { id: 'vesak', label: 'Vesak', cultureTag: 'vesak' },
  { id: 'nowruz', label: 'Nowruz', cultureTag: 'nowruz' },
  { id: 'oktoberfest', label: 'Oktoberfest', cultureTag: 'oktoberfest' },
  { id: 'carnival', label: 'Carnival', cultureTag: 'carnival' },
  { id: 'multicultural', label: 'Multicultural', cultureTag: 'multicultural' },
  { id: 'south-asian', label: 'South Asian', cultureTag: 'south asian' },
  { id: 'african', label: 'African diaspora', cultureTag: 'african' },
  { id: 'pacific', label: 'Pacific / Pasifika', cultureTag: 'pasifika' },
];

export function interestToCultureSearchTag(interest: string): string {
  return interest.trim().toLowerCase();
}
