import {
  HOSTSPACE_CREATE_CATALOG_PATHNAME,
  HOSTSPACE_CREATE_PAGE_PATHNAME,
  HOSTSPACE_PATHNAME,
  hostspaceCategoryCreatePath,
} from '@/constants/navigation/createNav';
import { isHostspaceCreateMode } from '@/lib/hostspacePanel';
import { isOrganisationCommunityCategoryId } from '@shared/creation/orgCommunity';
import type { HostspaceManageTab } from '@shared/creation/dataflow';

type ParamValue = string | string[] | undefined;

const MANAGE_TABS = new Set<HostspaceManageTab>([
  'all',
  'pages',
  'events',
  'listings',
  'offers',
  'market',
]);

const CREATE_FORWARD_PARAMS = [
  'draftId',
  'pageId',
  'template',
  'intent',
  'redirectTo',
  'redirect',
  'entityType',
] as const;

function firstParam(v: ParamValue): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function appendQuery(path: string, extra?: Record<string, string | undefined>): string {
  if (!extra) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value) qs.set(key, value);
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

function entityTypeToCategoryId(entityType: string): string {
  const normalized = entityType.trim().toLowerCase();
  if (normalized === 'organizer' || normalized === 'organiser') return 'organizer';
  if (normalized === 'restaurant') return 'dining';
  return normalized;
}

function organisationPageHref(categoryId: string, query: Record<string, string | undefined>): string {
  const type = categoryId === 'organizer' ? 'organizer' : categoryId;
  const { entityType: _ignored, ...rest } = query;
  void _ignored;
  return appendQuery(HOSTSPACE_CREATE_PAGE_PATHNAME, { ...rest, type });
}

/** Resolve `?tab=` / `?manageTab=` into a valid manage filter tab. */
export function resolveHostspaceManageTab(params: {
  tab?: ParamValue;
  manageTab?: ParamValue;
}): HostspaceManageTab {
  const raw = firstParam(params.tab) ?? firstParam(params.manageTab);
  if (raw && MANAGE_TABS.has(raw as HostspaceManageTab)) {
    return raw as HostspaceManageTab;
  }
  return 'all';
}

/** Build `/hostspace` with optional manage tab deeplink. */
export function buildHostspaceManageHref(tab?: HostspaceManageTab): string {
  if (!tab || tab === 'all') return HOSTSPACE_PATHNAME;
  return appendQuery(HOSTSPACE_PATHNAME, { tab });
}

/**
 * Legacy `/hostspace?panel=create&category=…` and similar query intents
 * should navigate to canonical create routes instead of inline rendering.
 */
export function resolveHostspaceCreateRedirect(params: Record<string, ParamValue>): string | null {
  if (!isHostspaceCreateMode(params)) return null;

  const query: Record<string, string | undefined> = {};
  for (const key of CREATE_FORWARD_PARAMS) {
    const v = firstParam(params[key]);
    if (v) query[key] = v;
  }

  const category = firstParam(params.category)?.trim().toLowerCase();
  if (category) {
    if (category === 'organisation-community') {
      return appendQuery(HOSTSPACE_CREATE_PAGE_PATHNAME, query);
    }
    if (isOrganisationCommunityCategoryId(category)) {
      return organisationPageHref(category, query);
    }
    return appendQuery(hostspaceCategoryCreatePath(category), query);
  }

  const entityTypeRaw = firstParam(params.entityType)?.trim().toLowerCase();
  if (entityTypeRaw) {
    const categoryId = entityTypeToCategoryId(entityTypeRaw);
    if (isOrganisationCommunityCategoryId(categoryId) || categoryId === 'community') {
      return organisationPageHref(categoryId, query);
    }
    return appendQuery(hostspaceCategoryCreatePath(categoryId), query);
  }

  return appendQuery(HOSTSPACE_CREATE_CATALOG_PATHNAME, query);
}