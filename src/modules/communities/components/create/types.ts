import { CommunityCategory, CommunityJoinMode } from '@/shared/schema/profile';

export type CommunityStep = 
  | 'basics'     // Name, Category, Description
  | 'image'      // Hero and Logo
  | 'location'   // City, Country
  | 'culture'    // Nationality, Heritage, Language
  | 'membership' // Privacy, Join Mode
  | 'social'     // Links
  | 'review';    // Confirm

export const ALL_COMMUNITY_STEPS: CommunityStep[] = [
  'basics',
  'image',
  'location',
  'culture',
  'membership',
  'social',
  'review',
];

export const STEP_TITLES: Record<CommunityStep, string> = {
  basics: 'The Basics',
  image: 'Visual Identity',
  location: 'Home Base',
  culture: 'Cultural Soul',
  membership: 'Membership',
  social: 'Social Hub',
  review: 'Review & Launch',
};

export const STEP_ICONS: Record<CommunityStep, string> = {
  basics: 'document-text-outline',
  image: 'image-outline',
  location: 'location-outline',
  culture: 'globe-outline',
  membership: 'people-outline',
  social: 'share-social-outline',
  review: 'rocket-outline',
};

export function getStepSub(step: CommunityStep): string {
  switch (step) {
    case 'basics': return 'Name and define your community.';
    case 'image': return 'Add images that represent your community.';
    case 'location': return 'Where is your community primarily based?';
    case 'culture': return 'Define the cultural identity of your community.';
    case 'membership': return 'How do people join your community?';
    case 'social': return 'Connect your website and social channels.';
    case 'review': return 'Triple check everything before we go live.';
    default: return '';
  }
}

export interface CommunityFormData {
  name: string;
  description: string;
  category: CommunityCategory;
  city: string;
  country: string;
  imageUrl: string; // Hero
  logoUrl: string;   // Avatar/Logo
  nationalityId: string;
  cultureIds: string[];
  languageIds: string[];
  diasporaGroupIds: string[];
  joinMode: CommunityJoinMode;
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  telegram: string;
}

export const defaultCommunityForm: CommunityFormData = {
  name: '',
  description: '',
  category: 'cultural',
  city: '',
  country: 'Australia',
  imageUrl: '',
  logoUrl: '',
  nationalityId: '',
  cultureIds: [],
  languageIds: [],
  diasporaGroupIds: [],
  joinMode: 'open',
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  telegram: '',
};

export const COMMUNITY_CATEGORIES: { label: string; value: CommunityCategory; icon: string }[] = [
  { label: 'Cultural', value: 'cultural', icon: 'color-palette-outline' },
  { label: 'Local Community', value: 'local_community', icon: 'home-outline' },
  { label: 'Art & Sports Club', value: 'arts_sports_club', icon: 'trophy-outline' },
  { label: 'Business', value: 'business', icon: 'business-outline' },
  { label: 'Brand', value: 'brand', icon: 'pricetag-outline' },
  { label: 'Professional network', value: 'professional', icon: 'briefcase-outline' },
  { label: 'Club / Society', value: 'club', icon: 'people-outline' },
  { label: 'Charity', value: 'charity', icon: 'heart-outline' },
  { label: 'Council / Civic', value: 'council', icon: 'ribbon-outline' },
];

export const JOIN_MODES: { label: string; value: CommunityJoinMode; sub: string; icon: string }[] = [
  { label: 'Open', value: 'open', sub: 'Anyone can join instantly.', icon: 'unlock-outline' },
  { label: 'Request', value: 'request', sub: 'Admins must approve new members.', icon: 'shield-checkmark-outline' },
  { label: 'Invite Only', value: 'invite', sub: 'Private community. Invite required.', icon: 'mail-outline' },
];
