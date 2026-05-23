import { modulesApi } from '@/modules/api';
import type { SavedContact } from '@/repositories/ContactsRepository';

export type ResolvedContactFields = Omit<SavedContact, 'savedAt'>;

type CpidLookupResponse = {
  cpid?: string;
  name?: string;
  username?: string;
  tier?: string;
  org?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  bio?: string;
  userId?: string;
  targetId?: string;
  entityType?: 'user' | 'profile' | string;
};

function fromLookupPayload(cpid: string, data: CpidLookupResponse): ResolvedContactFields | null {
  const name = data.name?.trim();
  if (name) {
    return {
      cpid: data.cpid?.toUpperCase() ?? cpid,
      name,
      username: data.username,
      tier: data.tier,
      org: data.org,
      avatarUrl: data.avatarUrl,
      city: data.city,
      country: data.country,
      bio: data.bio,
      userId: data.userId ?? data.targetId,
    };
  }
  return null;
}

async function fromUser(cpid: string, userId: string): Promise<ResolvedContactFields> {
  const u = await modulesApi.users.get(userId);
  return {
    cpid: u.culturePassId?.toUpperCase() ?? cpid,
    name: u.displayName?.trim() || u.username || cpid,
    username: u.username,
    tier: u.membership?.tier,
    avatarUrl: u.avatarUrl,
    city: u.city,
    country: u.country,
    bio: u.bio,
    userId: u.id,
  };
}

async function fromProfile(cpid: string, profileId: string): Promise<ResolvedContactFields> {
  const p = await modulesApi.profiles.get(profileId);
  return {
    cpid,
    name: p.name?.trim() || cpid,
    username: p.handle,
    org: p.entityType === 'business' ? p.name : undefined,
    avatarUrl: p.imageUrl ?? p.avatarUrl,
    city: p.city,
    country: p.country,
    bio: p.description,
    userId: p.ownerId,
  };
}

/**
 * Resolves a CulturePass ID to full contact fields.
 * The API returns only entityType + targetId; we fetch user/profile for display names.
 */
export async function resolveContactFromCpid(raw: string): Promise<ResolvedContactFields | null> {
  const cpid = raw.trim().toUpperCase();
  if (!/^CP-[A-Z0-9]+$/i.test(cpid)) return null;

  let data: CpidLookupResponse;
  try {
    data = await modulesApi.cpid.lookup(cpid);
  } catch {
    return null;
  }

  const legacy = fromLookupPayload(cpid, data);
  if (legacy) return legacy;

  const targetId = data.targetId ?? data.userId;
  if (!targetId) return null;

  if (data.entityType === 'profile') {
    return fromProfile(cpid, targetId);
  }

  // Default: user entity (or missing entityType with a uid)
  try {
    return await fromUser(cpid, targetId);
  } catch {
    return { cpid, name: cpid, userId: targetId };
  }
}
