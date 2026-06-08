import type {
  CommunityCategory,
  CommunityJoinMode,
  CommunityLeader,
  CommunityLegalStatus,
  CommunityPartner,
  Profile,
} from '@/shared/schema';

export const LISTING_STEP_IDS = [
  'identity',
  'about',
  'media',
  'location',
  'social',
  'auLegal',
  'entityExtras',
  'delivery',
  'teamVerify',
  'review',
] as const;

export type ListingStepId = (typeof LISTING_STEP_IDS)[number];

export type DirectoryListingEntity = 'business' | 'venue' | 'artist' | 'organizer' | 'restaurant';

export type ListingWizardEntity = DirectoryListingEntity | 'community' | 'event';

export interface ListingFormState {
  /** Directory entity or community; never `event` after redirect. */
  entityType: Profile['entityType'];
  name: string;
  handle: string;
  tagline: string;
  cultureTags: string[];
  cultureIds: string[];
  indigenousTags: string[];
  isIndigenousOwned: boolean;
  description: string;
  mission: string;
  founderStory: string;
  imageUrl: string;
  coverImageUrl: string;
  gallery: string[];
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  councilId: string;
  lgaCode: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  twitter: string;
  spotify: string;
  linkedin: string;
  pinterest: string;
  linktree: string;
  whatsapp: string;
  wechat: string;
  line: string;
  kakao: string;
  beacons: string;
  aboutme: string;
  abn: string;
  acn: string;
  gstRegistered: boolean;
  tradingName: string;
  foodLiquorLicence: string;
  entertainmentLicence: string;
  deliveryAvailable: boolean;
  openingHoursNote: string;
  capacitySeated: string;
  capacityStanding: string;
  artistDisciplines: string;
  venueType: string;
  amenities: string;
  communityGuidelines: string;
  deliveryUberEats: string;
  deliveryDoorDash: string;
  deliveryMenulog: string;
  culturalDeliveryNotes: string;
  publicContactName: string;
  publicContactRole: string;
  featuredSubmissionRequested: boolean;
  /** Community-only */
  communityCategory: CommunityCategory;
  joinMode: CommunityJoinMode;
  foundedDate: string;
  foundedLocation: string;
  legalStatus: CommunityLegalStatus | '';
  registrationNumber: string;
  governingStructure: string;
  leadership: CommunityLeader[];
  partners: CommunityPartner[];
  languages: string[];
  languageIds: string[];
  nationalityId: string;
  /** Set after first server draft create (directory only) */
  draftProfileId: string | null;
  /** Subcategory hint from workspace navigation (e.g. 'dance', 'charity', 'cinema') */
  subCategory: string;
}

export function defaultListingForm(
  seed: { entityType: Profile['entityType']; city?: string; country?: string },
): ListingFormState {
  return {
    entityType: seed.entityType,
    name: '',
    handle: '',
    tagline: '',
    cultureTags: [],
    cultureIds: [],
    indigenousTags: [],
    isIndigenousOwned: false,
    description: '',
    mission: '',
    founderStory: '',
    imageUrl: '',
    coverImageUrl: '',
    gallery: [],
    address: '',
    city: seed.city ?? '',
    country: seed.country ?? 'Australia',
    latitude: null,
    longitude: null,
    councilId: '',
    lgaCode: '',
    website: '',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    twitter: '',
    spotify: '',
    linkedin: '',
    pinterest: '',
    linktree: '',
    whatsapp: '',
    wechat: '',
    line: '',
    kakao: '',
    beacons: '',
    aboutme: '',
    abn: '',
    acn: '',
    gstRegistered: false,
    tradingName: '',
    foodLiquorLicence: '',
    entertainmentLicence: '',
    deliveryAvailable: false,
    openingHoursNote: '',
    capacitySeated: '',
    capacityStanding: '',
    artistDisciplines: '',
    venueType: '',
    amenities: '',
    communityGuidelines: '',
    deliveryUberEats: '',
    deliveryDoorDash: '',
    deliveryMenulog: '',
    culturalDeliveryNotes: '',
    publicContactName: '',
    publicContactRole: '',
    featuredSubmissionRequested: false,
    communityCategory: 'cultural',
    joinMode: 'open',
    foundedDate: '',
    foundedLocation: '',
    legalStatus: '',
    registrationNumber: '',
    governingStructure: '',
    leadership: [],
    partners: [],
    languages: [],
    languageIds: [],
    nationalityId: '',
    draftProfileId: null,
    subCategory: '',
  };
}

export function listingStepTitle(id: ListingStepId): string {
  switch (id) {
    case 'identity':
      return 'Identity';
    case 'about':
      return 'About';
    case 'media':
      return 'Visual';
    case 'location':
      return 'Location';
    case 'social':
      return 'Social hub';
    case 'auLegal':
      return 'AU details';
    case 'entityExtras':
      return 'Details';
    case 'delivery':
      return 'Delivery & notes';
    case 'teamVerify':
      return 'Team & verification';
    case 'review':
      return 'Review';
    default:
      return '';
  }
}

export function visibleListingSteps(entityType: Profile['entityType']): ListingStepId[] {
  const base: ListingStepId[] = [
    'identity',
    'about',
    'media',
    'location',
    'social',
  ];
  const auEligible = entityType === 'business' || entityType === 'venue' || entityType === 'organizer';
  if (auEligible) base.push('auLegal');
  base.push('entityExtras');
  const deliveryEligible =
    entityType === 'business' ||
    entityType === 'venue' ||
    entityType === 'organizer' ||
    entityType === 'restaurant';
  if (deliveryEligible) base.push('delivery');
  base.push('teamVerify', 'review');
  return base;
}
