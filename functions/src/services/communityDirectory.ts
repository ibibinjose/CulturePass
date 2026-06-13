/**
 * Community directory — bridges published community host pages (`hostPages`)
 * into public discovery (`profiles` + GET /api/communities).
 */

import type { HostPage } from '../../../shared/schema/hostPage';
import type { HostPageMembershipModel } from '../../../shared/schema/hostPage';
import { db } from '../admin';
import {
  profilesService,
  isPublicCommunityHub,
  type FirestoreProfile,
} from './profiles';

const profilesCol = () => db.collection('profiles');
const hostPagesCol = () => db.collection('hostPages');

const COMMUNITY_HOST_PAGE_STATUSES = new Set(['published', 'pending_verification']);

function mapMembershipToJoinMode(
  model: HostPageMembershipModel | undefined,
): FirestoreProfile['joinMode'] {
  switch (model) {
    case 'invite-only':
      return 'invite';
    case 'paid':
      return 'request';
    default:
      return 'open';
  }
}

function socialUrl(
  links: HostPage['formData']['socialLinks'] | undefined,
  platform: string,
): string | undefined {
  const match = (links ?? []).find((l) => l.platform === platform);
  return match?.url?.trim() || undefined;
}

/** Map a published community host page onto directory profile fields. */
export function mapHostPageToProfileFields(
  page: HostPage,
  now: string,
): Omit<FirestoreProfile, 'id'> {
  const fd = page.formData;
  const addr = fd.primaryAddress;
  const isPublished = page.status === 'published';

  return {
    name: fd.name.trim(),
    entityType: 'community',
    title: fd.categoryTags?.[0],
    description: fd.bio,
    bio: fd.bio,
    imageUrl: fd.logoUrl,
    coverImageUrl: fd.coverUrl,
    avatarUrl: fd.logoUrl,
    city: addr?.city?.trim() || undefined,
    state: addr?.state?.trim() || undefined,
    country: addr?.country?.trim() || 'Australia',
    latitude: addr?.latitude,
    longitude: addr?.longitude,
    category: fd.categoryTags?.[0],
    tags: fd.categoryTags ?? [],
    cultureTags: fd.culturalTags ?? [],
    languages: fd.languageTags ?? [],
    nationalityId: fd.nationalityId,
    cultureIds: fd.cultureIds ?? [],
    indigenousTags: fd.indigenousTags ?? [],
    isIndigenous: fd.isIndigenousOwned,
    contactEmail: fd.publicEmail?.trim() || undefined,
    phone: fd.phoneNumber?.trim() || undefined,
    website: socialUrl(fd.socialLinks, 'website'),
    instagram: socialUrl(fd.socialLinks, 'instagram'),
    facebook: socialUrl(fd.socialLinks, 'facebook'),
    twitter: socialUrl(fd.socialLinks, 'twitter'),
    linkedin: socialUrl(fd.socialLinks, 'linkedin'),
    tiktok: socialUrl(fd.socialLinks, 'tiktok'),
    youtube: socialUrl(fd.socialLinks, 'youtube'),
    ownerId: page.ownerId,
    status: isPublished ? 'published' : 'draft',
    handle: page.handle,
    handleStatus: page.handle ? 'approved' : undefined,
    hostPageId: page.id,
    joinMode: mapMembershipToJoinMode(fd.membershipModel),
    memberCount: 0,
    activityLevel: 'new',
    createdAt: page.createdAt,
    updatedAt: now,
    publishedAt: page.publishedAt,
  };
}

export function isListedCommunityProfile(profile: FirestoreProfile): boolean {
  if (!isPublicCommunityHub(profile)) return false;
  if (profile.status === 'draft') return false;
  return true;
}

/** Shape stored profile for Community tab / detail screens. */
export function toCommunityDto(profile: FirestoreProfile): Record<string, unknown> {
  const members = profile.memberCount ?? 0;
  return {
    ...profile,
    type: 'community',
    membersCount: members,
    memberCount: members,
    headline: profile.title ?? profile.description?.slice(0, 80),
    communityCategory: profile.category,
    activityLevel: profile.activityLevel ?? 'new',
  };
}

/**
 * Upsert a directory profile for a community host page.
 * Profile document id defaults to `page.profileId ?? page.id` so public URLs stay stable.
 */
export async function syncCommunityProfileFromHostPage(page: HostPage): Promise<FirestoreProfile> {
  if (page.entityType !== 'community') {
    throw Object.assign(new Error('Host page is not a community'), { status: 400 });
  }

  const now = new Date().toISOString();
  const profileId = page.profileId ?? page.id;
  const fields = mapHostPageToProfileFields(page, now);
  const ref = profilesCol().doc(profileId);
  const existing = await ref.get();

  if (existing.exists) {
    await ref.update(fields as FirebaseFirestore.UpdateData<FirestoreProfile>);
  } else {
    await ref.set({
      ...fields,
      createdAt: page.createdAt ?? now,
    });
  }

  if (page.profileId !== profileId) {
    await hostPagesCol().doc(page.id).update({
      profileId,
      updatedAt: now,
    });
  }

  const snap = await ref.get();
  return { id: snap.id, ...snap.data() } as FirestoreProfile;
}

/** Backfill directory profiles for published community pages missing `profileId` sync. */
export async function backfillOrphanedPublishedCommunityPages(limit = 50): Promise<number> {
  const snap = await hostPagesCol().where('entityType', '==', 'community').limit(200).get();
  let synced = 0;

  for (const doc of snap.docs) {
    if (synced >= limit) break;
    const page = { ...(doc.data() as HostPage), id: doc.id };
    if (!COMMUNITY_HOST_PAGE_STATUSES.has(page.status)) continue;

    const profileId = page.profileId ?? page.id;
    const profileSnap = await profilesCol().doc(profileId).get();
    if (profileSnap.exists && profileSnap.data()?.hostPageId === page.id) continue;

    await syncCommunityProfileFromHostPage(page);
    synced += 1;
  }

  return synced;
}

export async function listPublicCommunities(
  filters: { city?: string; country?: string } = {},
): Promise<Record<string, unknown>[]> {
  await backfillOrphanedPublishedCommunityPages(50);

  const rows = await profilesService.list({
    entityType: 'community',
    city: filters.city,
    country: filters.country,
  });

  return rows.filter(isListedCommunityProfile).map(toCommunityDto);
}

async function getCommunityHostPageById(pageId: string): Promise<HostPage | null> {
  const snap = await hostPagesCol().doc(pageId).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as HostPage), id: snap.id };
}

export async function getPublicCommunityByIdOrHandle(
  param: string,
): Promise<Record<string, unknown> | null> {
  const trimmed = String(param ?? '').trim();
  if (!trimmed) return null;

  const profile = await profilesService.getPublicCommunityHubByIdOrHandle(trimmed);
  if (profile && isListedCommunityProfile(profile)) {
    return toCommunityDto(profile);
  }

  const page = await getCommunityHostPageById(trimmed);
  if (
    page?.entityType === 'community' &&
    COMMUNITY_HOST_PAGE_STATUSES.has(page.status)
  ) {
    const synced = await syncCommunityProfileFromHostPage(page);
    if (isListedCommunityProfile(synced)) return toCommunityDto(synced);
  }

  if (page?.handle && page.handle.toLowerCase() === trimmed.toLowerCase()) {
    const synced = await syncCommunityProfileFromHostPage(page);
    if (isListedCommunityProfile(synced)) return toCommunityDto(synced);
  }

  return null;
}

/** Mark linked directory profile suspended when a host page is blocked. */
export async function suspendCommunityProfileForHostPage(page: HostPage): Promise<void> {
  if (page.entityType !== 'community') return;
  const profileId = page.profileId ?? page.id;
  const ref = profilesCol().doc(profileId);
  const snap = await ref.get();
  if (!snap.exists) return;
  await ref.update({
    status: 'suspended',
    updatedAt: new Date().toISOString(),
  });
}

/** Restore directory profile when a blocked community host page is unblocked. */
export async function restoreCommunityProfileForHostPage(page: HostPage): Promise<void> {
  if (page.entityType !== 'community') return;
  const refreshed = await getCommunityHostPageById(page.id);
  if (!refreshed) return;
  await syncCommunityProfileFromHostPage(refreshed);
}