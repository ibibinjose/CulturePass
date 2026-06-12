/**
 * Unified Organisation & Community create form — page type catalog.
 * Maps Creation Lab tiles to a single form with a "what kind of page" selector.
 */
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import {
  isOrganisationCommunityCategoryId,
  ORGANISATION_COMMUNITY_CREATE_PATH,
  type OrganisationCommunityCategoryId,
} from '@shared/creation/orgCommunity';

export type OrganisationCommunityTypeId = OrganisationCommunityCategoryId;

export type OrganisationCommunityType = {
  id: OrganisationCommunityTypeId;
  label: string;
  notes: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  entityType: HostEntityType;
  /** Stored as first category tag + directory subCategory on publish migration. */
  subCategory?: string;
};

export const ORGANISATION_COMMUNITY_TYPES: OrganisationCommunityType[] = [
  {
    id: 'community',
    label: 'Community',
    notes: 'Diaspora groups, cultural associations',
    icon: 'people-outline',
    color: CultureTokens.teal,
    entityType: 'community',
  },
  {
    id: 'organizer',
    label: 'Organizer',
    notes: 'Producing brand behind events/series',
    icon: 'flag-outline',
    color: CultureTokens.indigo,
    entityType: 'organiser',
  },
  {
    id: 'association',
    label: 'Association',
    notes: 'Member associations',
    icon: 'people-circle-outline',
    color: CultureTokens.teal,
    entityType: 'organiser',
    subCategory: 'association',
  },
  {
    id: 'organisation',
    label: 'Organisation',
    notes: 'Non-profits, cultural societies',
    icon: 'business-outline',
    color: CultureTokens.indigo,
    entityType: 'organiser',
    subCategory: 'organisation',
  },
  {
    id: 'ngo',
    label: 'NGO',
    notes: 'Community services, advocacy bodies',
    icon: 'ribbon-outline',
    color: CultureTokens.violet,
    entityType: 'organiser',
    subCategory: 'ngo',
  },
  {
    id: 'charity',
    label: 'Charity',
    notes: 'Foundations, causes',
    icon: 'heart-outline',
    color: CultureTokens.coral,
    entityType: 'organiser',
    subCategory: 'charity',
  },
  {
    id: 'government',
    label: 'Government',
    notes: 'Agencies, embassies, public services',
    icon: 'shield-checkmark-outline',
    color: CultureTokens.indigo,
    entityType: 'organiser',
    subCategory: 'government',
  },
  {
    id: 'council',
    label: 'Council',
    notes: 'LGA / municipal bodies',
    icon: 'map-outline',
    color: CultureTokens.teal,
    entityType: 'organiser',
    subCategory: 'council',
  },
  {
    id: 'club-society',
    label: 'Club or Society',
    notes: 'Student clubs, alumni circles, interest groups',
    icon: 'sparkles-outline',
    color: CultureTokens.gold,
    entityType: 'organiser',
    subCategory: 'club_society',
  },
];

export const ORGANISATION_COMMUNITY_CREATE_PATHNAME = ORGANISATION_COMMUNITY_CREATE_PATH;

export function isOrganisationCommunityCategory(categoryId: string | undefined): boolean {
  return isOrganisationCommunityCategoryId(categoryId);
}

export function findOrganisationCommunityType(
  typeId: string | undefined,
): OrganisationCommunityType {
  const normalized = (typeId ?? 'community').trim().toLowerCase();
  return (
    ORGANISATION_COMMUNITY_TYPES.find((t) => t.id === normalized) ??
    ORGANISATION_COMMUNITY_TYPES[0]
  );
}

export function resolveOrganisationCommunityEntityType(
  typeId: string | undefined,
): HostEntityType {
  return findOrganisationCommunityType(typeId).entityType;
}

/** Build category tags ensuring page type label is always first. */
export function buildOrgCommunityCategoryTags(
  pageType: OrganisationCommunityType,
  extra: string[] = [],
): string[] {
  const merged = [pageType.label, ...extra.filter((t) => t && t !== pageType.label)];
  return merged.slice(0, 3);
}

/** Resolve page type from /hostspace/create/page query params. */
export function resolveOrganisationPageTypeId(params: {
  type?: string;
  category?: string;
  entityType?: string;
}): OrganisationCommunityTypeId {
  const direct = params.type ?? params.category;
  if (direct && isOrganisationCommunityCategory(direct)) {
    return findOrganisationCommunityType(direct).id;
  }

  const entity = (params.entityType ?? '').trim().toLowerCase();
  if (entity === 'community') return 'community';
  if (entity === 'organizer' || entity === 'organiser') return 'organizer';

  if (direct) {
    const byAlias = ORGANISATION_COMMUNITY_TYPES.find(
      (t) => t.id === direct.toLowerCase() || t.label.toLowerCase() === direct.toLowerCase(),
    );
    if (byAlias) return byAlias.id;
  }

  return 'community';
}