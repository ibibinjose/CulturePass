/**
 * Create navigation — canonical routes and legacy `/create/*` resolution.
 *
 * Canonical UI: HostSpace Creation Lab (`CREATE_LAB_PATHNAME` + optional category segment).
 * Wizards: full-screen `/event/create`, `/(domain)/listing/create`, CultureMarket listing lab.
 */

/** HostSpace Creation Lab (category picker + gates into wizards). */
export const CREATE_LAB_PATHNAME = '/hostspace/create' as const;

/** CultureMarket product/service/link wizard (nested under the lab stack). */
export const CULTURE_MARKET_LISTING_LAB_PATHNAME = `${CREATE_LAB_PATHNAME}/listing` as const;

/** Public path used in marketing / experienceNav for listing wizard. */
export const LISTING_WIZARD_PUBLIC_PATHNAME = '/listing/create' as const;

/** Expo Router pathname for the unified listing / directory profile wizard. */
export const DOMAIN_LISTING_WIZARD_PATHNAME = '/(domain)/listing/create' as const;

export const EVENT_WIZARD_PATHNAME = '/event/create' as const;

/** `/hostspace/create/{segment}` — segment matches `CreateCategory.id` or aliases (see HostspaceCreateWorkspace). */
export function createLabCategoryHref(segment: string): string {
  const id = segment.trim().replace(/^\/+|\/+$/g, '');
  if (!id) return CREATE_LAB_PATHNAME;
  return `${CREATE_LAB_PATHNAME}/${id}`;
}

type StringParams = Record<string, string | string[] | undefined>;

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined;
  if (Array.isArray(v)) {
    const x = v[0];
    return typeof x === 'string' ? x.trim() || undefined : undefined;
  }
  return undefined;
}

/** Params forwarded to `/event/create` when present on legacy URLs. */
function eventForwardParams(params: StringParams): Record<string, string> {
  const out: Record<string, string> = {};
  const editId = firstString(params.editId) ?? firstString(params.id);
  if (editId) out.editId = editId;
  const publisherProfileId = firstString(params.publisherProfileId);
  if (publisherProfileId) out.publisherProfileId = publisherProfileId;
  return out;
}

/** Params forwarded to `/(domain)/listing/create` when present. */
function listingForwardParams(params: StringParams): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = ['listingEntityType', 'listingSubCategory', 'publisherProfileId', 'editId'] as const;
  for (const k of keys) {
    const v = firstString(params[k]);
    if (v) out[k] = v;
  }
  return out;
}

const LISTING_TYPES_FALLTHROUGH_LAB = new Set([
  'business',
  'venue',
  'artist',
  'organizer',
  'organiser',
  'professional',
  'restaurant',
  'shop',
  'shopping',
  'dining',
]);

/** Maps legacy `/create/[type]` slug → listing wizard entity param (directory subset). */
const LEGACY_TYPE_TO_LISTING_ENTITY: Record<string, 'business' | 'venue' | 'artist' | 'organizer' | 'restaurant'> = {
  business: 'business',
  venue: 'venue',
  artist: 'artist',
  organizer: 'organizer',
  organiser: 'organizer',
  organisation: 'organizer',
  organization: 'organizer',
  dining: 'restaurant',
  restaurant: 'restaurant',
  restaurants: 'restaurant',
  shopping: 'business',
  shop: 'business',
  professional: 'artist',
};

/** Target for `<Redirect href={…} />` from legacy `/create/:type` routes. */
export type LegacyCreateRedirect = { pathname: string; params?: Record<string, string> };

/**
 * Resolves legacy `/create/:type` (+ optional query) to a concrete Expo Router location.
 */
function paramsWithoutType(params: StringParams): StringParams {
  const { type: _ignored, ...rest } = params;
  void _ignored;
  return rest;
}

export function resolveLegacyCreateRedirect(typeRaw: string | undefined, params: StringParams): LegacyCreateRedirect {
  const normalized = (typeRaw ?? '').trim().toLowerCase();
  const rest = paramsWithoutType(params);

  if (
    normalized === 'event' ||
    normalized === 'festival' ||
    normalized === 'concert' ||
    normalized === 'workshop'
  ) {
    const fwd = eventForwardParams(rest);
    return Object.keys(fwd).length ? { pathname: EVENT_WIZARD_PATHNAME, params: fwd } : { pathname: EVENT_WIZARD_PATHNAME };
  }

  if (
    normalized === 'community' ||
    normalized === 'organisation' ||
    normalized === 'organization'
  ) {
    return { pathname: createLabCategoryHref('community') };
  }

  if (normalized === 'perk' || normalized === 'coupon' || normalized === 'voucher') {
    return { pathname: CREATE_LAB_PATHNAME, params: { category: 'offer' } };
  }

  if (normalized === 'movie' || normalized === 'movies' || normalized === 'film') {
    return { pathname: CREATE_LAB_PATHNAME, params: { category: 'movie' } };
  }

  if (normalized === 'activity' || normalized === 'activities') {
    return { pathname: CREATE_LAB_PATHNAME, params: { category: 'activity' } };
  }

  if (normalized === 'market-listing' || normalized === 'culturemarket' || normalized === 'market') {
    return { pathname: CULTURE_MARKET_LISTING_LAB_PATHNAME };
  }

  if (normalized === 'listing') {
    const edit = firstString(rest.edit) ?? firstString(rest.editId);
    return edit
      ? { pathname: CULTURE_MARKET_LISTING_LAB_PATHNAME, params: { edit } }
      : { pathname: CULTURE_MARKET_LISTING_LAB_PATHNAME, params: listingForwardParams(rest) };
  }

  const listingEntity = LEGACY_TYPE_TO_LISTING_ENTITY[normalized];
  if (listingEntity) {
    return {
      pathname: DOMAIN_LISTING_WIZARD_PATHNAME,
      params: listingForwardParams({ ...rest, listingEntityType: listingEntity }),
    };
  }

  if (LISTING_TYPES_FALLTHROUGH_LAB.has(normalized)) {
    return { pathname: CREATE_LAB_PATHNAME };
  }

  return { pathname: CREATE_LAB_PATHNAME };
}
