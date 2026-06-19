/** Organisation & Community Creation Lab category ids — unified single-form flow. */
export const ORGANISATION_COMMUNITY_CATEGORY_IDS = [
  'community',
  'organizer',
  'association',
  'organisation',
  'ngo',
  'charity',
  'government',
  'council',
  'club-society',
] as const;

export type OrganisationCommunityCategoryId = (typeof ORGANISATION_COMMUNITY_CATEGORY_IDS)[number];

export const ORGANISATION_COMMUNITY_CREATE_PATH = '/hostspace/create/page';

export function isOrganisationCommunityCategoryId(
  categoryId: string | undefined,
): categoryId is OrganisationCommunityCategoryId {
  if (!categoryId) return false;
  const normalized = categoryId.trim().toLowerCase();
  return (ORGANISATION_COMMUNITY_CATEGORY_IDS as readonly string[]).includes(normalized);
}