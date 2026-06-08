/**
 * Resolve nationality flags and culture emojis for cards and create flows.
 */

import { CULTURES, NATIONALITIES, type Nationality } from '@/constants/cultures';
import { indigenousTagLabel } from '@/constants/indigenousTags';

export interface CultureIdentityDisplay {
  flagEmoji?: string;
  cultureEmoji?: string;
  nationalityLabel?: string;
  cultureLabel?: string;
  indigenousLabel?: string;
}

/** Flag emoji for a nationality id (e.g. indian → 🇮🇳). */
export function getNationalityFlag(nationalityId?: string | null): string | undefined {
  if (!nationalityId || nationalityId === 'global') return '🌍';
  return NATIONALITIES[nationalityId]?.emoji;
}

export function getNationalityLabel(nationalityId?: string | null): string | undefined {
  if (!nationalityId) return undefined;
  if (nationalityId === 'global') return 'Global';
  return NATIONALITIES[nationalityId]?.label;
}

export function getCultureEmoji(cultureId?: string | null): string | undefined {
  if (!cultureId) return undefined;
  return CULTURES[cultureId]?.emoji;
}

export function getCultureLabel(cultureId?: string | null): string | undefined {
  if (!cultureId) return undefined;
  return CULTURES[cultureId]?.label ?? cultureId;
}

/** Best flag for an event from culture tag ids/slugs or indigenous tags. */
export function resolveEventCultureFlag(event: {
  cultureTag?: string[] | string;
  cultureTags?: string[];
  indigenousTags?: string[];
  nationalityId?: string;
}): string | undefined {
  if (event.nationalityId) {
    return getNationalityFlag(event.nationalityId);
  }

  const tags = [
    ...(Array.isArray(event.cultureTag) ? event.cultureTag : event.cultureTag ? [event.cultureTag] : []),
    ...(event.cultureTags ?? []),
  ];

  for (const tag of tags) {
    const id = String(tag).toLowerCase().replace(/\s+/g, '_');
    if (CULTURES[id]) return CULTURES[id].emoji;
    const byNat = Object.values(NATIONALITIES).find((n) => n.id === id || n.label.toLowerCase() === id);
    if (byNat) return byNat.emoji;
  }

  if ((event.indigenousTags?.length ?? 0) > 0) {
    return '🪶';
  }

  return undefined;
}

export function resolveProfileCultureFlag(profile: {
  nationalityId?: string;
  cultureIds?: string[];
  indigenousTags?: string[];
  isIndigenousOwned?: boolean;
}): string | undefined {
  if (profile.isIndigenousOwned || (profile.indigenousTags?.length ?? 0) > 0) {
    return '🪶';
  }
  if (profile.nationalityId) {
    return getNationalityFlag(profile.nationalityId);
  }
  const firstCulture = profile.cultureIds?.[0];
  if (firstCulture) {
    return getCultureEmoji(firstCulture) ?? getNationalityFlag(CULTURES[firstCulture]?.nationalityId);
  }
  return undefined;
}

export function resolveHostPageCultureFlag(formData: {
  nationalityId?: string;
  cultureIds?: string[];
  culturalTags?: string[];
  indigenousTags?: string[];
  isIndigenousOwned?: boolean;
}): string | undefined {
  return resolveProfileCultureFlag({
    nationalityId: formData.nationalityId,
    cultureIds: formData.cultureIds,
    indigenousTags: formData.indigenousTags,
    isIndigenousOwned: formData.isIndigenousOwned,
  });
}

export function formatIndigenousTags(tags?: string[]): string {
  if (!tags?.length) return '';
  return tags.map(indigenousTagLabel).join(', ');
}

export function findNationalityByLabel(label: string): Nationality | undefined {
  const q = label.trim().toLowerCase();
  return Object.values(NATIONALITIES).find((n) => n.label.toLowerCase() === q);
}