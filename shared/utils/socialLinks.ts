/**
 * Normalize social handles ↔ full platform URLs for users, listings, and host pages.
 * Storage format: full https:// URLs. Forms show handles where practical.
 */

import type { SocialLinks } from '../schema/common';

export type SocialPlatformKey =
  | 'instagram'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'facebook'
  | 'website'
  | 'spotify'
  | 'pinterest'
  | 'linktree'
  | 'whatsapp'
  | 'wechat'
  | 'line'
  | 'kakao'
  | 'beacons'
  | 'aboutme';

/** Social fields on listing / community create forms. */
export const LISTING_SOCIAL_PLATFORM_KEYS = [
  'website',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'twitter',
  'spotify',
  'linkedin',
  'pinterest',
  'linktree',
  'whatsapp',
  'wechat',
  'line',
  'kakao',
  'beacons',
  'aboutme',
] as const satisfies readonly SocialPlatformKey[];

export type ListingSocialKey = (typeof LISTING_SOCIAL_PLATFORM_KEYS)[number];

/** Social fields on user profile edit. */
export const PROFILE_SOCIAL_PLATFORM_KEYS = [
  'instagram',
  'twitter',
  'youtube',
  'tiktok',
  'linkedin',
  'facebook',
  'website',
] as const satisfies readonly SocialPlatformKey[];

export type ProfileSocialKey = (typeof PROFILE_SOCIAL_PLATFORM_KEYS)[number];

export const SOCIAL_HANDLE_PLACEHOLDERS: Partial<Record<SocialPlatformKey, string>> = {
  instagram: 'culturepassapp',
  twitter: 'CulturePassApp',
  tiktok: '@culturepassapp',
  youtube: '@CulturePassApp',
  facebook: 'culturepassapp',
  linkedin: 'company/culturepass',
  website: 'culturepass.app',
};

export function cleanSocialHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

/** Convert a form value (handle or URL) into a canonical https URL for storage. */
export function toPlatformUrl(value: string, key: SocialPlatformKey): string | undefined {
  const clean = value.trim();
  if (!clean) return undefined;
  if (/^https?:\/\//i.test(clean)) return clean;

  if (key === 'website') return `https://${clean.replace(/^\/+/, '')}`;
  if (key === 'twitter') return `https://x.com/${cleanSocialHandle(clean)}`;
  if (key === 'tiktok') return `https://tiktok.com/@${cleanSocialHandle(clean)}`;
  if (key === 'youtube') {
    const handle = clean.startsWith('@') ? clean : `@${cleanSocialHandle(clean)}`;
    return `https://youtube.com/${handle}`;
  }
  if (key === 'linkedin') return `https://linkedin.com/${clean.replace(/^\/+/, '')}`;
  if (key === 'facebook') return `https://facebook.com/${cleanSocialHandle(clean)}`;
  if (key === 'instagram') return `https://instagram.com/${cleanSocialHandle(clean)}`;
  if (key === 'pinterest') return `https://pinterest.com/${cleanSocialHandle(clean)}`;
  if (key === 'linktree') {
    const slug = clean.replace(/^linktr\.ee\//i, '').replace(/^@/, '');
    return `https://linktr.ee/${slug}`;
  }
  if (key === 'spotify') return clean.includes('spotify.com') ? `https://${clean.replace(/^https?:\/\//i, '')}` : clean;
  if (key === 'whatsapp') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 8) return `https://wa.me/${digits}`;
    return `https://${clean}`;
  }
  if (key === 'wechat') return clean;
  if (key === 'line') return clean.startsWith('line.me') ? `https://${clean}` : clean;
  if (key === 'kakao') return clean;
  if (key === 'beacons') return `https://beacons.ai/${cleanSocialHandle(clean)}`;
  if (key === 'aboutme') return `https://about.me/${cleanSocialHandle(clean)}`;
  return `https://${clean}`;
}

/** Strip a stored URL back to a friendly handle for form fields. */
export function socialDisplay(value?: string | null, key?: SocialPlatformKey): string {
  if (!value) return '';
  const stripped = value
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/^instagram\.com\//i, '')
    .replace(/^x\.com\//i, '')
    .replace(/^twitter\.com\//i, '')
    .replace(/^tiktok\.com\/@?/i, '')
    .replace(/^youtube\.com\//i, '')
    .replace(/^linkedin\.com\//i, '')
    .replace(/^facebook\.com\//i, '')
    .replace(/^pinterest\.com\//i, '')
    .replace(/^linktr\.ee\//i, '')
    .replace(/^beacons\.ai\//i, '')
    .replace(/^about\.me\//i, '')
    .replace(/^wa\.me\//i, '');

  if (key === 'youtube' || key === 'tiktok') {
    return stripped.startsWith('@') ? stripped : `@${stripped}`;
  }
  if (key === 'linkedin') return stripped.startsWith('in/') || stripped.startsWith('company/') ? stripped : stripped;
  if (key === 'website') return stripped.replace(/\/$/, '');
  return stripped;
}

/** Short preview label shown under inputs (e.g. `x.com/CulturePassApp`). */
export function socialUrlPreview(value: string, key: SocialPlatformKey): string | undefined {
  const url = toPlatformUrl(value, key);
  if (!url) return undefined;
  return url.replace(/^https?:\/\//i, '');
}

export function normalizeSocialLinksRecord(
  input: Record<string, string | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    const trimmed = (v ?? '').trim();
    if (!trimmed) continue;
    const normalized = toPlatformUrl(trimmed, k as SocialPlatformKey);
    if (normalized) out[k] = normalized;
    else out[k] = trimmed;
  }
  return out;
}

/** Normalize trimmed form values into stored socialLinks (undefined when empty). */
export function compactSocialLinks(
  entries: Record<string, string | undefined | null>,
): SocialLinks | undefined {
  const out = normalizeSocialLinksRecord(entries);
  return Object.keys(out).length ? (out as SocialLinks) : undefined;
}

/** Map stored URLs/handles to friendly form field values. */
export function socialFormFieldsFromRecord<K extends SocialPlatformKey>(
  sources: Partial<Record<SocialPlatformKey, string | null | undefined>>,
  keys: readonly K[],
): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const key of keys) {
    out[key] = socialDisplay(sources[key], key);
  }
  return out;
}

type CommunitySocialSource = Partial<Record<ListingSocialKey, string | null | undefined>> & {
  socialLinks?: Partial<Record<SocialPlatformKey, string>>;
};

/** Hydrate listing wizard social fields from a community record. */
export function listingSocialFormFromCommunity(c: CommunitySocialSource): Record<ListingSocialKey, string> {
  const social = c.socialLinks ?? {};
  const sources: Partial<Record<SocialPlatformKey, string | undefined>> = {};
  for (const key of LISTING_SOCIAL_PLATFORM_KEYS) {
    sources[key] = key === 'twitter' ? social.twitter : c[key] ?? social[key];
  }
  return socialFormFieldsFromRecord(sources, LISTING_SOCIAL_PLATFORM_KEYS);
}

type ProfileSocialSource = {
  website?: string | null;
  socialLinks?: Partial<Record<SocialPlatformKey, string>>;
};

/** Hydrate profile edit social fields from a user record. */
export function profileSocialFormFromUser(user: ProfileSocialSource): Record<ProfileSocialKey, string> {
  return socialFormFieldsFromRecord(
    { ...user.socialLinks, website: user.website },
    PROFILE_SOCIAL_PLATFORM_KEYS,
  );
}

/** Collect trimmed listing form social values for normalization. */
export function listingSocialRawFromForm(
  form: Partial<Record<ListingSocialKey, string>>,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of LISTING_SOCIAL_PLATFORM_KEYS) {
    const trimmed = (form[key] ?? '').trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

/** Resolve stored value for opening in browser (handles legacy handle-only data). */
export function resolveSocialUrl(value: string | undefined | null, key: SocialPlatformKey): string | undefined {
  if (!value?.trim()) return undefined;
  if (/^https?:\/\//i.test(value.trim())) return value.trim();
  return toPlatformUrl(value, key);
}

export function normalizeHostSocialUrl(input: string, platform: string): string {
  const clean = input.trim();
  if (!clean) return '';
  if (platform === 'other') {
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  }
  return toPlatformUrl(clean, platform as SocialPlatformKey) ?? clean;
}