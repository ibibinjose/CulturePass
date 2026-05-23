import type { EventData, Profile } from '@/shared/schema';

const INDIGENOUS_KEYWORDS = [
  'indigenous',
  'first nations',
  'aboriginal',
  'torres strait',
  'naidoc',
  'yolngu',
  'gadigal',
] as const;

function includesIndigenousKeyword(text: string): boolean {
  const lowered = text.toLowerCase();
  return INDIGENOUS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

export function isIndigenousEvent(event: EventData): boolean {
  const record = event as unknown as Record<string, unknown>;
  const indigenousTags = Array.isArray(record.indigenousTags)
    ? (record.indigenousTags as unknown[]).map((value) => String(value))
    : [];

  const haystack = [
    event.title ?? '',
    event.description ?? '',
    event.category ?? '',
    ...(event.tags ?? []),
    ...(event.cultureTag ?? []),
    ...indigenousTags,
  ].join(' ');

  return includesIndigenousKeyword(haystack);
}

export function isIndigenousProfile(profile: Profile): boolean {
  const tags = Array.isArray(profile.tags) ? profile.tags.join(' ') : '';
  const haystack = [
    profile.name,
    profile.description ?? '',
    profile.category ?? '',
    profile.entityType,
    tags,
  ].join(' ');

  return includesIndigenousKeyword(haystack);
}
