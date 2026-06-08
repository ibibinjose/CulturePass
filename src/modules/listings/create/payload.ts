import type { CommunityCreateInput } from '@/platform/api/endpoints/communities';
import type { ListingFormState } from './types';
import type { Community, Profile, SocialLinks } from '@/shared/schema';

function numToFormStr(n: number | undefined): string {
  return n != null && Number.isFinite(n) ? String(n) : '';
}

/** Maps GET /api/communities/:id into listing wizard fields for edit mode. */
export function communityToListingFormPartial(c: Community): Partial<ListingFormState> {
  const lp = c.listingProfile;
  const social = c.socialLinks ?? {};
  return {
    entityType: 'community',
    name: c.name ?? '',
    handle: c.handle ?? '',
    tagline: (c.title ?? c.headline ?? lp?.tagline ?? '').trim(),
    cultureTags: Array.isArray(c.cultureTags) ? [...c.cultureTags] : [],
    cultureIds: Array.isArray(c.cultureIds) ? [...c.cultureIds] : [],
    indigenousTags: Array.isArray(c.indigenousTags) ? [...c.indigenousTags] : [],
    isIndigenousOwned: c.isIndigenousOwned ?? false,
    description: c.description ?? '',
    mission: c.mission ?? lp?.mission ?? '',
    founderStory: c.foundingStory ?? lp?.founderStory ?? '',
    imageUrl: c.imageUrl ?? '',
    coverImageUrl: c.coverImageUrl ?? '',
    gallery: Array.isArray(c.gallery) ? [...c.gallery] : [],
    address: c.address ?? '',
    city: c.city ?? '',
    country: c.country ?? '',
    latitude: c.latitude ?? c.location?.lat ?? null,
    longitude: c.longitude ?? c.location?.lng ?? null,
    councilId: c.councilId ?? '',
    lgaCode: c.lgaCode ?? '',
    website: c.website ?? social.website ?? '',
    instagram: c.instagram ?? social.instagram ?? '',
    facebook: c.facebook ?? social.facebook ?? '',
    youtube: c.youtube ?? social.youtube ?? '',
    tiktok: c.tiktok ?? social.tiktok ?? '',
    twitter: social.twitter ?? '',
    spotify: c.spotify ?? social.spotify ?? '',
    linkedin: social.linkedin ?? '',
    pinterest: social.pinterest ?? '',
    linktree: social.linktree ?? '',
    whatsapp: social.whatsapp ?? '',
    wechat: social.wechat ?? '',
    line: social.line ?? '',
    kakao: social.kakao ?? '',
    beacons: social.beacons ?? '',
    aboutme: social.aboutme ?? '',
    abn: lp?.abn ?? '',
    acn: lp?.acn ?? '',
    gstRegistered: lp?.gstRegistered ?? false,
    tradingName: lp?.tradingName ?? '',
    foodLiquorLicence: lp?.foodLiquorLicence ?? '',
    entertainmentLicence: lp?.entertainmentLicence ?? '',
    deliveryAvailable: c.deliveryAvailable ?? false,
    openingHoursNote: lp?.openingHoursNote ?? '',
    capacitySeated: numToFormStr(lp?.capacitySeated),
    capacityStanding: numToFormStr(lp?.capacityStanding),
    artistDisciplines: Array.isArray(lp?.artistDisciplines) ? lp.artistDisciplines.join(', ') : '',
    venueType: lp?.venueType ?? '',
    amenities: Array.isArray(lp?.amenities) ? lp.amenities.join(', ') : '',
    communityGuidelines: lp?.communityGuidelines ?? '',
    deliveryUberEats: lp?.deliveryUberEats ?? '',
    deliveryDoorDash: lp?.deliveryDoorDash ?? '',
    deliveryMenulog: lp?.deliveryMenulog ?? '',
    culturalDeliveryNotes: lp?.culturalDeliveryNotes ?? '',
    publicContactName: lp?.publicContactName ?? '',
    publicContactRole: lp?.publicContactRole ?? '',
    featuredSubmissionRequested: lp?.featuredSubmissionRequested ?? false,
    communityCategory: c.communityCategory ?? 'cultural',
    joinMode: c.joinMode ?? 'open',
    foundedDate: c.foundedDate ?? '',
    foundedLocation: c.foundedLocation ?? '',
    legalStatus: (c.legalStatus as ListingFormState['legalStatus']) ?? '',
    registrationNumber: c.registrationNumber ?? '',
    governingStructure: c.governingStructure ?? '',
    leadership: Array.isArray(c.leadership) ? [...c.leadership] : [],
    partners: Array.isArray(c.partners) ? [...c.partners] : [],
    languages: Array.isArray(c.languages) ? [...c.languages] : [],
    languageIds: Array.isArray(c.languageIds) ? [...c.languageIds] : [],
    nationalityId: c.nationalityId ?? '',
    draftProfileId: null,
  };
}

function compactSocialLinks(entries: Record<string, string | undefined>): SocialLinks | undefined {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    const t = (v ?? '').trim();
    if (t) out[k] = t;
  }
  return Object.keys(out).length ? (out as SocialLinks) : undefined;
}

function numOrUndef(s: string): number | undefined {
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Partial profile for POST/PUT api/profiles (directory listings). */
export function formToProfilePayload(form: ListingFormState, status: 'draft' | 'published'): Partial<Profile> {
  const listingProfile = {
    tagline: form.tagline.trim() || undefined,
    mission: form.mission.trim() || undefined,
    founderStory: form.founderStory.trim() || undefined,
    longDescription: form.description.trim() || undefined,
    abn: form.abn.replace(/\s/g, '') || undefined,
    acn: form.acn.replace(/\s/g, '') || undefined,
    gstRegistered: form.gstRegistered,
    tradingName: form.tradingName.trim() || undefined,
    foodLiquorLicence: form.foodLiquorLicence.trim() || undefined,
    entertainmentLicence: form.entertainmentLicence.trim() || undefined,
    deliveryUberEats: form.deliveryUberEats.trim() || undefined,
    deliveryDoorDash: form.deliveryDoorDash.trim() || undefined,
    deliveryMenulog: form.deliveryMenulog.trim() || undefined,
    culturalDeliveryNotes: form.culturalDeliveryNotes.trim() || undefined,
    openingHoursNote: form.openingHoursNote.trim() || undefined,
    capacitySeated: numOrUndef(form.capacitySeated),
    capacityStanding: numOrUndef(form.capacityStanding),
    venueType: form.venueType.trim() || undefined,
    amenities: form.amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    artistDisciplines: form.artistDisciplines
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    communityGuidelines: form.communityGuidelines.trim() || undefined,
    featuredSubmissionRequested: form.featuredSubmissionRequested,
    publicContactName: form.publicContactName.trim() || undefined,
    publicContactRole: form.publicContactRole.trim() || undefined,
  };

  const socialRaw = {
    website: form.website.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
    facebook: form.facebook.trim() || undefined,
    youtube: form.youtube.trim() || undefined,
    tiktok: form.tiktok.trim() || undefined,
    twitter: form.twitter.trim() || undefined,
    spotify: form.spotify.trim() || undefined,
    linkedin: form.linkedin.trim() || undefined,
    pinterest: form.pinterest.trim() || undefined,
    linktree: form.linktree.trim() || undefined,
    whatsapp: form.whatsapp.trim() || undefined,
    wechat: form.wechat.trim() || undefined,
    line: form.line.trim() || undefined,
    kakao: form.kakao.trim() || undefined,
    beacons: form.beacons.trim() || undefined,
    aboutme: form.aboutme.trim() || undefined,
  };

  const socialLinks = compactSocialLinks(socialRaw);

  return {
    name: form.name.trim(),
    entityType: form.entityType,
    handle: form.handle.trim().replace(/^\+/, '').replace(/^@/, '') || undefined,
    description: form.description.trim() || undefined,
    status,
    imageUrl: form.imageUrl.trim() || undefined,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    gallery: form.gallery.length ? form.gallery : undefined,
    address: form.address.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    latitude: form.latitude ?? undefined,
    longitude: form.longitude ?? undefined,
    councilId: form.councilId.trim() || undefined,
    lgaCode: form.lgaCode.trim() || undefined,
    cultureTags: form.cultureTags.length ? form.cultureTags : undefined,
    cultureIds: form.cultureIds.length ? form.cultureIds : undefined,
    indigenousTags: form.indigenousTags.length ? form.indigenousTags : undefined,
    isIndigenousOwned: form.isIndigenousOwned || undefined,
    languageIds: form.languageIds.length ? form.languageIds : undefined,
    website: form.website.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
    facebook: form.facebook.trim() || undefined,
    youtube: form.youtube.trim() || undefined,
    tiktok: form.tiktok.trim() || undefined,
    spotify: form.spotify.trim() || undefined,
    deliveryAvailable: form.deliveryAvailable,
    socialLinks: socialLinks ?? undefined,
    nationalityId: form.nationalityId.trim() || undefined,
    listingProfile:
      Object.values(listingProfile).some((v) => v !== undefined && v !== false && v !== null && !(Array.isArray(v) && !v.length)) ||
      form.featuredSubmissionRequested
        ? listingProfile
        : undefined,
  };
}

export function formToCommunityCreateInput(form: ListingFormState): CommunityCreateInput {
  return {
    name: form.name.trim(),
    handle: form.handle.trim().replace(/^@/, '') || undefined,
    title: form.tagline.trim() || undefined,
    description: form.description.trim() || undefined,
    communityCategory: form.communityCategory,
    joinMode: form.joinMode,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    gallery: form.gallery.length ? form.gallery : undefined,
    website: form.website.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
    facebook: form.facebook.trim() || undefined,
    cultureTags: form.cultureTags.length ? form.cultureTags : undefined,
    cultureIds: form.cultureIds.length ? form.cultureIds : undefined,
    indigenousTags: form.indigenousTags.length ? form.indigenousTags : undefined,
    isIndigenousOwned: form.isIndigenousOwned || undefined,
    languages: form.languages.length ? form.languages : undefined,
    languageIds: form.languageIds.length ? form.languageIds : undefined,
    nationalityId: form.nationalityId.trim() || undefined,
    foundedDate: form.foundedDate.trim() || undefined,
    foundedLocation: form.foundedLocation.trim() || undefined,
    foundingStory: form.founderStory.trim() || undefined,
    legalStatus: form.legalStatus || undefined,
    registrationNumber: form.registrationNumber.trim() || undefined,
    governingStructure: form.governingStructure.trim() || undefined,
    leadership: form.leadership.length ? form.leadership : undefined,
    partners: form.partners.length ? form.partners : undefined,
  };
}

export function minimalDraftPayload(form: ListingFormState): Partial<Profile> {
  return {
    name: form.name.trim(),
    entityType: form.entityType,
    status: 'draft',
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    description: form.description.trim() || undefined,
  };
}
