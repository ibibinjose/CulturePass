import { isEventLike, TYPE_ORDER, type SubmitType } from './config';

export type CreatorAccessFlags = {
  isAdmin: boolean;
  isOrganizer: boolean;
};

/**
 * Whether the signed-in user may create this listing type in Creator Studio.
 * Mirrors server expectations: events / movies / dining / shops need organizer (or admin); perks need admin.
 */
export function canUserCreateListingType(type: SubmitType, flags: CreatorAccessFlags): boolean {
  if (type === 'perk') return flags.isAdmin;
  if (['movie', 'restaurant', 'shop'].includes(type)) return flags.isOrganizer || flags.isAdmin;
  if (isEventLike(type)) return flags.isOrganizer || flags.isAdmin;
  return true;
}

/** Ordered listing types the current user is allowed to create. */
export function listingTypesForUser(flags: CreatorAccessFlags): SubmitType[] {
  return TYPE_ORDER.filter((t) => canUserCreateListingType(t, flags));
}

/** User-facing copy when a deep-linked listing type is not permitted for this account. */
export function creatorListingBlockedHint(type: SubmitType, flags: CreatorAccessFlags): string | null {
  if (canUserCreateListingType(type, flags)) return null;
  if (type === 'perk') return 'Only platform admins can publish perks.';
  if (isEventLike(type)) {
    return 'Events require an organizer or admin account. You can still create profiles and activities from the list on the left.';
  }
  if (type === 'movie' || type === 'restaurant' || type === 'shop') {
    return 'Movies, dining, and shop listings require an organizer or admin account.';
  }
  return 'This listing type is not available for your account.';
}
