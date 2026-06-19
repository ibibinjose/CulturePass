import type { EventData } from '@/shared/schema';

/**
 * Local-first lists with national padding when startup data is sparse.
 */
export type LocationScope = 'local' | 'national' | 'mixed';

export type MergeLocationResult<T> = {
  items: T[];
  scope: LocationScope;
  localCount: number;
};

export const SPARSE_LIST_MIN = 3;
export const DISCOVER_RAIL_LIMIT = 12;

export function normCityToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function normCountryToken(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function getItemId(item: { id?: string }): string {
  return String(item.id ?? '');
}

/** Dedupe by id — local items first, then fill from fallback. */
export function mergeLocalWithFallback<T extends { id?: string }>(
  local: T[],
  fallback: T[],
  options?: { minLocal?: number; limit?: number },
): MergeLocationResult<T> {
  const minLocal = options?.minLocal ?? SPARSE_LIST_MIN;
  const limit = options?.limit ?? DISCOVER_RAIL_LIMIT;
  const seen = new Set<string>();
  const merged: T[] = [];

  let localCount = 0;

  const push = (item: T, fromLocal: boolean) => {
    const id = getItemId(item);
    if (!id || seen.has(id)) return;
    seen.add(id);
    merged.push(item);
    if (fromLocal) localCount += 1;
  };

  for (const item of local) push(item, true);

  if (merged.length < minLocal) {
    for (const item of fallback) {
      push(item, false);
      if (merged.length >= limit) break;
    }
  }

  const scope: LocationScope =
    localCount === 0
      ? 'national'
      : merged.length > localCount
        ? 'mixed'
        : 'local';

  return {
    items: merged.slice(0, limit),
    scope,
    localCount: Math.min(local.length, merged.length),
  };
}

export function eventMatchesCity(event: { city?: string | null }, city: string): boolean {
  const target = normCityToken(city);
  if (!target) return false;
  return normCityToken(event.city) === target;
}

export function eventMatchesCouncil(
  event: { lgaCode?: string | null; councilId?: string | null },
  council: { id?: string; lgaCode?: string | null } | null | undefined,
): boolean {
  if (!council) return false;
  if (event.lgaCode && council.lgaCode && event.lgaCode === council.lgaCode) return true;
  if (event.councilId && council.id && event.councilId === council.id) return true;
  return false;
}

export type LocalEventScope = {
  city: string;
  country: string;
  council?: { id?: string; lgaCode?: string | null } | null;
  nearbyIds?: Set<string>;
};

export function isLocalEvent(event: EventData, scope: LocalEventScope): boolean {
  if (scope.nearbyIds?.has(event.id)) return true;
  if (scope.city && eventMatchesCity(event, scope.city)) return true;
  if (eventMatchesCouncil(event, scope.council)) return true;
  return false;
}

export function filterLocalEvents(events: EventData[], scope: LocalEventScope): EventData[] {
  if (!scope.city && !scope.council && !scope.nearbyIds?.size) return [];
  return events.filter((e) => isLocalEvent(e, scope));
}

export function bucketEventsByTimeOfDay(events: EventData[]): {
  happeningNow: EventData[];
  startingSoon: EventData[];
  laterTonight: EventData[];
} {
  const now = new Date();
  const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const happeningNow: EventData[] = [];
  const startingSoon: EventData[] = [];
  const laterTonight: EventData[] = [];

  for (const event of events) {
    if (!event.time) {
      laterTonight.push(event);
      continue;
    }
    const [h, m] = event.time.split(':').map(Number);
    const eventMinutes = h * 60 + m;

    if (eventMinutes <= nowTotalMinutes + 30 && eventMinutes >= nowTotalMinutes - 120) {
      happeningNow.push(event);
    } else if (eventMinutes > nowTotalMinutes + 30 && eventMinutes <= nowTotalMinutes + 120) {
      startingSoon.push(event);
    } else if (eventMinutes > nowTotalMinutes + 120) {
      laterTonight.push(event);
    }
  }

  return { happeningNow, startingSoon, laterTonight };
}

export function eventMatchesCountry(event: { country?: string | null }, country: string): boolean {
  const target = normCountryToken(country);
  if (!target) return false;
  const eventCountry = normCountryToken(event.country);
  if (!eventCountry) return true;
  return eventCountry === target;
}

export function communityMatchesCity(community: { city?: string | null; chapterCities?: string[] | null }, city: string): boolean {
  const target = normCityToken(city);
  if (!target) return false;
  const hubCity = normCityToken(community.city);
  if (!hubCity) return true;
  if (hubCity === target) return true;
  return (community.chapterCities ?? []).some((ch) => normCityToken(ch) === target);
}

export function communityMatchesCountry(community: { country?: string | null }, country: string): boolean {
  const target = normCountryToken(country);
  if (!target) return false;
  const hubCountry = normCountryToken(community.country);
  if (!hubCountry) return true;
  return hubCountry === target;
}

export function rankEventsByLocation<T extends { id?: string; city?: string | null; country?: string | null; attending?: number }>(
  events: T[],
  city: string,
  country: string,
): T[] {
  const cityN = normCityToken(city);
  const countryN = normCountryToken(country);

  return [...events].sort((a, b) => {
    const aCity = cityN && normCityToken(a.city) === cityN ? 0 : 1;
    const bCity = cityN && normCityToken(b.city) === cityN ? 0 : 1;
    if (aCity !== bCity) return aCity - bCity;

    const aCountry = countryN && communityMatchesCountry({ country: a.country }, country) ? 0 : 1;
    const bCountry = countryN && communityMatchesCountry({ country: b.country }, country) ? 0 : 1;
    if (aCountry !== bCountry) return aCountry - bCountry;

    return (b.attending ?? 0) - (a.attending ?? 0);
  });
}

export function rankCommunitiesByLocation<T extends { id?: string; city?: string | null; country?: string | null; chapterCities?: string[] | null }>(
  communities: T[],
  city: string,
  country: string,
): T[] {
  const cityN = normCityToken(city);
  const countryN = normCountryToken(country);

  return [...communities].sort((a, b) => {
    const aLocal = cityN && communityMatchesCity(a, city) ? 0 : countryN && communityMatchesCountry(a, country) ? 1 : 2;
    const bLocal = cityN && communityMatchesCity(b, city) ? 0 : countryN && communityMatchesCountry(b, country) ? 1 : 2;
    return aLocal - bLocal;
  });
}

export function scopeSubtitle(scope: LocationScope, city: string, country: string): string | undefined {
  if (scope === 'local') return undefined;
  const place = city?.trim() || country?.trim() || 'your area';
  if (scope === 'mixed') return `Including events across ${country || 'Australia'} — few listings in ${place} so far`;
  return `Showing events across ${country || 'Australia'} while we grow local listings`;
}

export function communityScopeSubtitle(scope: LocationScope, city: string, country: string): string | undefined {
  if (scope === 'local') return undefined;
  const place = city?.trim() || 'your city';
  if (scope === 'mixed') return `Few hubs in ${place} yet — also showing communities across ${country || 'Australia'}`;
  return `Showing cultural communities across ${country || 'Australia'}`;
}