/**
 * Create navigation — canonical routes and legacy redirects.
 *
 * Canonical catalog: `/hostspace/create`
 * Wizards: `/hostspace/[category]/create`, `/hostspace/event/create`, `/hostspace/listing`
 */

/** HostSpace manage hub. */
export const HOSTSPACE_PATHNAME = '/hostspace' as const;

/** Create catalog — category grid and page selector. */
export const HOSTSPACE_CREATE_CATALOG_PATHNAME = '/hostspace/create' as const;

/** Unified create-a-page form (organisation & community types). */
export const HOSTSPACE_CREATE_PAGE_PATHNAME = '/hostspace/create/page' as const;

/** @deprecated Query panel on /hostspace — redirects to /hostspace/create */
export const HOSTSPACE_CREATE_PANEL = 'create' as const;

/** @deprecated Alias — use HOSTSPACE_CREATE_CATALOG_PATHNAME */
export const CREATE_LAB_PATHNAME = HOSTSPACE_CREATE_CATALOG_PATHNAME;

/** @deprecated Legacy pages/create — redirects to /hostspace/create */
export const LEGACY_CREATE_LAB_PATHNAME = '/pages/create' as const;

/** CultureMarket product/service/link wizard. */
export const CULTURE_MARKET_LISTING_LAB_PATHNAME = '/hostspace/listing' as const;

/** Legacy public URL — still serves listing wizard; prefer `/hostspace/[category]/create`. */
export const LISTING_WIZARD_PUBLIC_PATHNAME = '/listing/create' as const;

/** @deprecated Expo Router legacy file path — redirects to /hostspace/[category]/create */
export const DOMAIN_LISTING_WIZARD_PATHNAME = '/(domain)/listing/create' as const;

/** Canonical event wizard. */
export const EVENT_WIZARD_PATHNAME = '/hostspace/event/create' as const;

/** Unified organisation & community page form (all 9 org types). */
export {
  ORGANISATION_COMMUNITY_CREATE_PATH as ORGANISATION_COMMUNITY_CREATE_PATHNAME,
  isOrganisationCommunityCategoryId,
} from '@shared/creation/orgCommunity';

/** @deprecated Legacy top-level event create — redirects to EVENT_WIZARD_PATHNAME */
export const LEGACY_EVENT_WIZARD_PATHNAME = '/event/create' as const;

/** Expo Router dynamic category create pathname. */
export const HOSTSPACE_CATEGORY_CREATE_PATHNAME = '/hostspace/[category]/create' as const;

function appendQuery(path: string, extra?: Record<string, string | undefined>): string {
  if (!extra) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value) qs.set(key, value);
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

/** Path for a create category — event uses the dedicated event route. */
export function hostspaceCategoryCreatePath(categoryId: string): string {
  const id = categoryId.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!id) return HOSTSPACE_CREATE_CATALOG_PATHNAME;
  if (id === 'event' || id === 'events') return EVENT_WIZARD_PATHNAME;
  if (id === 'organisation-community' || isOrganisationCommunityCategoryId(id)) {
    const type = id === 'organisation-community' ? 'community' : id;
    return `${HOSTSPACE_CREATE_PAGE_PATHNAME}?type=${encodeURIComponent(type)}`;
  }
  return `/hostspace/${id}/create`;
}

function entityTypeToCategoryId(entityType: string): string {
  const normalized = entityType.trim().toLowerCase();
  if (normalized === 'organizer' || normalized === 'organiser') return 'organizer';
  if (normalized === 'restaurant') return 'dining';
  return normalized;
}

/** Build `/hostspace/create` or a category path with optional query params. */
export function buildHostspaceCreateHref(extra?: Record<string, string | undefined>): string {
  if (!extra) return HOSTSPACE_CREATE_CATALOG_PATHNAME;

  const category = extra.category?.trim();
  const entityType = extra.entityType?.trim();
  const queryKeys = ['template', 'draftId', 'pageId', 'intent', 'profileId', 'publisherProfileId', 'editId'] as const;
  const query: Record<string, string | undefined> = {};
  for (const key of queryKeys) {
    if (extra[key]) query[key] = extra[key];
  }

  if (category) {
    return appendQuery(hostspaceCategoryCreatePath(category), query);
  }

  if (entityType) {
    return appendQuery(hostspaceCategoryCreatePath(entityTypeToCategoryId(entityType)), query);
  }

  const hasQuery = Object.values(query).some(Boolean);
  return hasQuery ? appendQuery(HOSTSPACE_CREATE_CATALOG_PATHNAME, query) : HOSTSPACE_CREATE_CATALOG_PATHNAME;
}

/** Category deep link — e.g. `/hostspace/venue/create`. */
export function createLabCategoryHref(segment: string): string {
  return hostspaceCategoryCreatePath(segment);
}

/** Page wizard deep link — e.g. `/hostspace/venue/create?template=…`. */
export function createPageWizardHref(
  entityType: string,
  opts?: { template?: string; draftId?: string; pageId?: string; intent?: string },
): string {
  return appendQuery(hostspaceCategoryCreatePath(entityTypeToCategoryId(entityType)), {
    template: opts?.template,
    draftId: opts?.draftId,
    pageId: opts?.pageId,
    intent: opts?.intent,
  });
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

/** Build canonical create href from route params or legacy path segments. */
export function resolveCreateLabHref(
  params: StringParams,
  pathSegment?: string,
): string {
  const extra: Record<string, string | undefined> = {};

  const segment = pathSegment?.trim().toLowerCase();
  if (segment === 'page') {
    return appendQuery(HOSTSPACE_CREATE_PAGE_PATHNAME, {
      type: firstString(params.type) ?? firstString(params.category),
      entityType:
        firstString(params.entityType) ?? firstString(params.profileType) ?? firstString(params.pageType),
      template: firstString(params.template),
      draftId: firstString(params.draftId) ?? firstString(params.draft),
      pageId: firstString(params.pageId),
      intent: firstString(params.intent),
    });
  }

  const category = pathSegment?.trim() || firstString(params.category);
  if (category) extra.category = category;

  const entityType =
    firstString(params.entityType) ?? firstString(params.profileType) ?? firstString(params.pageType);
  if (entityType) extra.entityType = entityType;

  const draftId = firstString(params.draftId) ?? firstString(params.draft);
  if (draftId) extra.draftId = draftId;

  for (const key of ['template', 'pageId', 'intent', 'profileId', 'publisherProfileId', 'editId'] as const) {
    const v = firstString(params[key]);
    if (v) extra[key] = v;
  }

  return buildHostspaceCreateHref(extra);
}

/** @deprecated Use resolveCreateLabHref */
export const resolveLegacyHostspaceCreateHref = resolveCreateLabHref;

/** @deprecated Use resolveCreateLabHref */
export const resolveLegacyPagesCreateHref = resolveCreateLabHref;

/** Expo Router href object for the create catalog. */
export function hostspaceCreateRoute(extra?: Record<string, string | undefined>) {
  if (!extra || (!extra.category && !extra.entityType)) {
    return { pathname: HOSTSPACE_CREATE_CATALOG_PATHNAME } as const;
  }
  const href = buildHostspaceCreateHref(extra);
  const qIndex = href.indexOf('?');
  const pathname = qIndex >= 0 ? href.slice(0, qIndex) : href;
  const search = qIndex >= 0 ? href.slice(qIndex + 1) : '';
  const parsed = new URLSearchParams(search);
  const routeParams: Record<string, string> = {};
  parsed.forEach((v, k) => {
    routeParams[k] = v;
  });
  return { pathname, params: routeParams } as const;
}

/** Params forwarded to the event wizard when present on legacy URLs. */
function eventForwardParams(params: StringParams): Record<string, string> {
  const out: Record<string, string> = {};
  const editId = firstString(params.editId) ?? firstString(params.id);
  if (editId) out.editId = editId;
  const publisherProfileId = firstString(params.publisherProfileId);
  if (publisherProfileId) out.publisherProfileId = publisherProfileId;
  return out;
}

/** Params forwarded to listing create when present on legacy URLs. */
function listingForwardParams(params: StringParams): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = ['listingEntityType', 'listingSubCategory', 'publisherProfileId', 'editId'] as const;
  for (const k of keys) {
    const v = firstString(params[k]);
    if (v) out[k] = v;
  }
  return out;
}

const LEGACY_ENTITY_TO_CATEGORY: Record<string, string> = {
  business: 'business',
  venue: 'venue',
  artist: 'artist',
  organizer: 'organizer',
  organiser: 'organizer',
  organisation: 'organizer',
  organization: 'organizer',
  dining: 'dining',
  restaurant: 'dining',
  restaurants: 'dining',
  shopping: 'shopping',
  shop: 'shopping',
  professional: 'professional',
};

export type LegacyCreateRedirect = { pathname: string; params?: Record<string, string> };

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
    return Object.keys(fwd).length
      ? { pathname: EVENT_WIZARD_PATHNAME, params: fwd }
      : { pathname: EVENT_WIZARD_PATHNAME };
  }

  if (
    normalized === 'community' ||
    normalized === 'organisation' ||
    normalized === 'organization'
  ) {
    return { pathname: hostspaceCategoryCreatePath('community') };
  }

  if (normalized === 'perk' || normalized === 'coupon' || normalized === 'voucher') {
    return { pathname: hostspaceCategoryCreatePath('offer') };
  }

  if (normalized === 'movie' || normalized === 'movies' || normalized === 'film') {
    return { pathname: hostspaceCategoryCreatePath('movie') };
  }

  if (normalized === 'activity' || normalized === 'activities') {
    return { pathname: hostspaceCategoryCreatePath('activity') };
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

  const categoryId = LEGACY_ENTITY_TO_CATEGORY[normalized];
  if (categoryId) {
    const fwd = listingForwardParams(rest);
    return Object.keys(fwd).length
      ? { pathname: hostspaceCategoryCreatePath(categoryId), params: fwd }
      : { pathname: hostspaceCategoryCreatePath(categoryId) };
  }

  if (
    normalized === 'business' ||
    normalized === 'venue' ||
    normalized === 'artist' ||
    normalized === 'organizer' ||
    normalized === 'organiser' ||
    normalized === 'professional'
  ) {
    return { pathname: hostspaceCategoryCreatePath(entityTypeToCategoryId(normalized)) };
  }

  return { pathname: HOSTSPACE_CREATE_CATALOG_PATHNAME };
}