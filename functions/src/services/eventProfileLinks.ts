/**
 * Phase 1 — validate profiles/{id} before writing publisherProfileId / venueProfileId on events.
 */

import { db } from '../admin';
import type { RequestUser } from '../middleware/auth';
import { isOwnerOrAdmin } from '../middleware/auth';

type ProfileDoc = {
  ownerId?: string;
  entityType?: string;
};

const VENUE_LIKE_ENTITY_TYPES = new Set(['venue', 'business', 'restaurant']);

export type ProfileLinkValidation =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function validatePublisherProfileLink(
  user: RequestUser,
  profileId: string,
): Promise<ProfileLinkValidation> {
  const id = profileId.trim();
  if (!id) {
    return { ok: false, status: 400, error: 'publisherProfileId is empty' };
  }
  const snap = await db.collection('profiles').doc(id).get();
  if (!snap.exists) {
    return { ok: false, status: 404, error: 'Publisher profile not found' };
  }
  const p = snap.data() as ProfileDoc;
  if (!isOwnerOrAdmin(user, p.ownerId ?? null)) {
    return { ok: false, status: 403, error: 'You do not own this publisher profile' };
  }
  return { ok: true };
}

export async function validateVenueProfileLink(
  user: RequestUser,
  profileId: string,
): Promise<ProfileLinkValidation> {
  const id = profileId.trim();
  if (!id) {
    return { ok: false, status: 400, error: 'venueProfileId is empty' };
  }
  const snap = await db.collection('profiles').doc(id).get();
  if (!snap.exists) {
    return { ok: false, status: 404, error: 'Venue profile not found' };
  }
  const p = snap.data() as ProfileDoc;
  const et = (p.entityType ?? '').toLowerCase();
  if (!VENUE_LIKE_ENTITY_TYPES.has(et)) {
    return {
      ok: false,
      status: 400,
      error: 'venueProfileId must reference a profile with entityType venue, business, or restaurant',
    };
  }
  if (!isOwnerOrAdmin(user, p.ownerId ?? null)) {
    return { ok: false, status: 403, error: 'You do not own this venue profile' };
  }
  return { ok: true };
}
