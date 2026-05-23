/**
 * Canonical public URL segments for CulturePass (SEO, sharing, deep links).
 * Short prefixes: /u /c /b /e /a /v /t /o /r /m /s /p
 * — users, communities, brands, events, activities, venues, talent (artist),
 *   organisers, restaurants, movies, shopping, perks.
 */
import type { EventData } from '@/shared/schema/event';
import type { Profile } from '@/shared/schema/profile';
import type { User } from '@/shared/schema/user';
import { getCommunityProfilePathId } from '@/lib/community';

export const SITE_ORIGIN =
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SITE_ORIGIN) || 'https://culturepass.app';

export function siteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN.replace(/\/$/, '')}${p}`;
}

/** URL path segment for a profile row (handle → slug → id). */
export function profilePublicSegment(
  p: Pick<Profile, 'id' | 'handle' | 'handleStatus' | 'slug'>,
): string {
  const h = (p.handle ?? '').trim();
  if (h && p.handleStatus === 'approved') return h.toLowerCase();
  if (p.slug) return p.slug;
  return p.id;
}

/** Segment for user URLs. CPID-first for stable public links. */
export function userPublicSegment(u: Pick<User, 'id' | 'handle' | 'handleStatus'> & { culturePassId?: string | null }): string {
  const cpid = (u.culturePassId ?? '').trim().toUpperCase();
  if (/^CP-[A-Z0-9]{6,}$/.test(cpid)) return cpid;
  const h = (u.handle ?? '').trim();
  if (h && u.handleStatus === 'approved') return h.toLowerCase();
  return u.id;
}

export function communityPublicSegment(
  c: Parameters<typeof getCommunityProfilePathId>[0],
): string {
  return getCommunityProfilePathId(c);
}

/** Event public segment: optional slug when present; otherwise stable id. */
export function eventPublicSegment(e: Pick<EventData, 'id'> & { slug?: string }): string {
  const s = (e.slug ?? '').trim();
  if (s) return s;
  return e.id;
}

export type ProfileEntityType = string | undefined;

/**
 * Which short prefix should canonicalize this entity on the web.
 * Returns null when /profile/... should remain (e.g. venue, artist dedicated flows).
 */
export function profileCanonicalPrefix(entityType: ProfileEntityType): '/user' | '/business' | '/community' | null {
  const t = String(entityType ?? '').toLowerCase();
  if (t === 'user') return '/user';
  if (t === 'community') return '/community';
  if (t === 'business' || t === 'brand' || t === 'restaurant' || t === 'organizer' || t === 'creator') {
    return '/business';
  }
  return null;
}

export function canonicalProfilePath(profile: {
  entityType?: string;
  id: string;
  handle?: string;
  handleStatus?: Profile['handleStatus'];
  slug?: string;
  culturePassId?: string | null;
}): string | null {
  const prefix = profileCanonicalPrefix(profile.entityType);
  if (!prefix) return null;
  const segment = prefix === '/community'
    ? communityPublicSegment(profile as Parameters<typeof communityPublicSegment>[0])
    : prefix === '/user'
      ? userPublicSegment(profile as unknown as Pick<User, 'id' | 'handle' | 'handleStatus'> & { culturePassId?: string | null })
      : profilePublicSegment(profile as Profile);
  return `${prefix}/${segment}`;
}

export function canonicalEventPath(event: Pick<EventData, 'id'> & { slug?: string }): string {
  return `/event/${eventPublicSegment(event)}`;
}

export function canonicalCommunityPath(
  c: Parameters<typeof communityPublicSegment>[0],
): string {
  return `/community/${communityPublicSegment(c)}`;
}

export function canonicalUserPath(u: Pick<User, 'id' | 'handle' | 'handleStatus'> & { culturePassId?: string | null }): string {
  return `/user/${userPublicSegment(u)}`;
}

export function canonicalActivityPath(id: string): string {
  return `/activity/${id}`;
}

export function canonicalVenuePath(id: string): string {
  return `/venue/${id}`;
}

/** Artist / creator profiles */
export function canonicalTalentPath(id: string): string {
  return `/artist/${id}`;
}

export function canonicalOrganiserPath(id: string): string {
  return `/organiser/${id}`;
}

export function canonicalRestaurantPath(id: string): string {
  return `/restaurant/${id}`;
}

export function canonicalMoviePath(id: string): string {
  return `/movie/${id}`;
}

export function canonicalShoppingPath(id: string): string {
  return `/shop/${id}`;
}

export function canonicalPerkPath(id: string): string {
  return `/perk/${id}`;
}

/** Expo Router href object for communities. */
export function routeCommunity(
  c: Parameters<typeof communityPublicSegment>[0],
): { pathname: '/community/[id]'; params: { id: string } } {
  return { pathname: '/community/[id]', params: { id: communityPublicSegment(c) } };
}

export function routeCommunityMembers(
  c: Parameters<typeof communityPublicSegment>[0],
): { pathname: '/community/[id]/members'; params: { id: string } } {
  return { pathname: '/community/[id]/members', params: { id: communityPublicSegment(c) } };
}

export function routeEvent(
  e: Pick<EventData, 'id'> & { slug?: string },
): { pathname: '/event/[id]'; params: { id: string } } {
  return { pathname: '/event/[id]', params: { id: eventPublicSegment(e) } };
}

export function routeUser(
  u: Pick<User, 'id' | 'handle' | 'handleStatus'> & { culturePassId?: string | null },
): { pathname: '/user/[id]'; params: { id: string } } {
  return { pathname: '/user/[id]', params: { id: userPublicSegment(u) } };
}

export function routeBrandProfile(
  p: Pick<Profile, 'id' | 'handle' | 'handleStatus' | 'slug'>,
): { pathname: '/business/[id]'; params: { id: string } } {
  return { pathname: '/business/[id]', params: { id: profilePublicSegment(p) } };
}

export function routeActivity(id: string): { pathname: '/activity/[id]'; params: { id: string } } {
  return { pathname: '/activity/[id]', params: { id } };
}

export function routeVenue(id: string): { pathname: '/venue/[id]'; params: { id: string } } {
  return { pathname: '/venue/[id]', params: { id } };
}

export function routeTalent(id: string): { pathname: '/artist/[id]'; params: { id: string } } {
  return { pathname: '/artist/[id]', params: { id } };
}

export function routeOrganiser(id: string): { pathname: '/organiser/[id]'; params: { id: string } } {
  return { pathname: '/organiser/[id]', params: { id } };
}

export function routeRestaurant(id: string): { pathname: '/restaurant/[id]'; params: { id: string } } {
  return { pathname: '/restaurant/[id]', params: { id } };
}

export function routeMovie(id: string): { pathname: '/movie/[id]'; params: { id: string } } {
  return { pathname: '/movie/[id]', params: { id } };
}

export function routeShop(id: string): { pathname: '/shop/[id]'; params: { id: string } } {
  return { pathname: '/shop/[id]', params: { id } };
}

export function routePerk(id: string): { pathname: '/perk/[id]'; params: { id: string } } {
  return { pathname: '/perk/[id]', params: { id } };
}

/** Expo Router href for directory / finder “place” profiles. */
export function routerProfileHref(p: Profile): { pathname: string; params: { id: string } } {
  const slugOrId = p.slug || p.id;
  switch (p.entityType) {
    case 'community':
      return { pathname: '/community/[id]', params: { id: communityPublicSegment(p) } };
    case 'venue':
      return { pathname: '/venue/[id]', params: { id: slugOrId } };
    case 'business':
    case 'brand':
      return { pathname: '/business/[id]', params: { id: profilePublicSegment(p) } };
    case 'artist':
    case 'creator':
      return { pathname: '/artist/[id]', params: { id: slugOrId } };
    case 'restaurant':
      return { pathname: '/restaurant/[id]', params: { id: slugOrId } };
    case 'organizer':
      return { pathname: '/organiser/[id]', params: { id: slugOrId } };
    default:
      return { pathname: '/profile/[id]', params: { id: p.id } };
  }
}
