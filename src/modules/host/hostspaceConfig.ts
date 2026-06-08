import { Ionicons } from '@expo/vector-icons';

import { createLabCategoryHref, createPageWizardHref, EVENT_WIZARD_PATHNAME } from '@/constants/navigation/createNav';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { ListingWizardEntityParam } from '@/constants/navigation/experienceNav';

export type HostspaceAction = {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export type HostspaceWorkflowStep = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export type HostspacePipelineStep = HostspaceWorkflowStep & {
  value: string;
};

export type HostspaceCreateKind = 'event' | 'listing' | 'surface';

export type HostspaceCreateCategory = HostspaceAction & {
  aliases: string[];
  browseRoute: string;
  type: 'Creation';
  purpose: string;
  kind: HostspaceCreateKind;
  entityType?: ListingWizardEntityParam;
  createRoute?: string;
};

export const HOSTSPACE_CREATE_CATEGORIES: HostspaceCreateCategory[] = [
  {
    id: 'community',
    aliases: ['communities'],
    label: 'Community',
    route: createPageWizardHref('community'),
    browseRoute: '/(tabs)/community',
    type: 'Creation',
    purpose: 'Create new communities',
    description: 'Launch a diaspora group, cultural association, or member community.',
    icon: 'people-outline',
    color: CultureTokens.teal,
    kind: 'listing',
    entityType: 'community',
  },
  {
    id: 'event',
    aliases: ['events'],
    label: 'Events',
    route: EVENT_WIZARD_PATHNAME,
    browseRoute: '/events',
    type: 'Creation',
    purpose: 'Create events',
    description: 'Create ticketed or free happenings with schedule, venue, ticketing, and publishing.',
    icon: 'calendar-outline',
    color: CultureTokens.indigo,
    kind: 'event',
    createRoute: '/event/create',
  },
  {
    id: 'business',
    aliases: ['businesses'],
    label: 'Business',
    route: createPageWizardHref('business'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Register businesses',
    description: 'Add shops, services, producers, and cultural brands to the directory.',
    icon: 'briefcase-outline',
    color: CultureTokens.indigo,
    kind: 'listing',
    entityType: 'business',
  },
  {
    id: 'venue',
    aliases: ['venues'],
    label: 'Venue',
    route: createPageWizardHref('venue'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Add venues',
    description: 'Create halls, galleries, clubs, theatres, and cultural spaces.',
    icon: 'location-outline',
    color: CultureTokens.teal,
    kind: 'listing',
    entityType: 'venue',
  },
  {
    id: 'artist',
    aliases: ['artists'],
    label: 'Artist',
    route: createPageWizardHref('artist'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Artist profiles',
    description: 'Create performer, maker, speaker, and creative profiles for line-ups.',
    icon: 'mic-outline',
    color: CultureTokens.coral,
    kind: 'listing',
    entityType: 'artist',
  },
  {
    id: 'organizer',
    aliases: ['organiser', 'organizers', 'organisers'],
    label: 'Organizer',
    route: createPageWizardHref('organiser'),
    browseRoute: '/dashboard/organizer',
    type: 'Creation',
    purpose: 'Organizer profiles',
    description: 'Create the producing brand behind festivals, series, venues, and ticketing.',
    icon: 'flag-outline',
    color: CultureTokens.indigo,
    kind: 'listing',
    entityType: 'organizer',
  },
  {
    id: 'movies',
    aliases: ['movie'],
    label: 'Movies',
    route: createLabCategoryHref('movies'),
    browseRoute: '/movies',
    type: 'Creation',
    purpose: 'Movie programming',
    description: 'Plan cinema nights and cultural film programming. Dedicated creation is coming.',
    icon: 'film-outline',
    color: CultureTokens.indigo,
    kind: 'surface',
    createRoute: '/movies',
  },
  {
    id: 'dining',
    aliases: ['dine', 'food', 'restaurant', 'restaurants'],
    label: 'Dining',
    route: createLabCategoryHref('dining'),
    browseRoute: '/restaurants',
    type: 'Creation',
    purpose: 'Restaurant and food profiles',
    description: 'Create a restaurant or food business profile with licences and delivery notes.',
    icon: 'restaurant-outline',
    color: CultureTokens.teal,
    kind: 'listing',
    entityType: 'restaurant',
  },
  {
    id: 'activities',
    aliases: ['activity'],
    label: 'Activities',
    route: createLabCategoryHref('activity'),
    browseRoute: '/activities',
    type: 'Creation',
    purpose: 'Activities and experiences',
    description: 'Shape tours, workshops, classes, and local cultural experiences.',
    icon: 'bicycle-outline',
    color: CultureTokens.coral,
    kind: 'surface',
    createRoute: createLabCategoryHref('activity'),
  },
  {
    id: 'travel',
    aliases: ['trips'],
    label: 'Travel',
    route: createLabCategoryHref('travel'),
    browseRoute: '/(tabs)/CultureX',
    type: 'Creation',
    purpose: 'Travel experiences',
    description: 'Plan destination-led culture itineraries and travel ideas.',
    icon: 'airplane-outline',
    color: CultureTokens.indigo,
    kind: 'surface',
    createRoute: '/(tabs)/CultureX',
  },
  {
    id: 'shopping',
    aliases: ['shop', 'shops'],
    label: 'Shopping',
    route: createLabCategoryHref('shopping'),
    browseRoute: '/shopping',
    type: 'Creation',
    purpose: 'Retail and shopping profiles',
    description: 'Create a shop, maker, or retail business profile.',
    icon: 'bag-handle-outline',
    color: CultureTokens.teal,
    kind: 'listing',
    entityType: 'business',
  },
  {
    id: 'offers',
    aliases: ['offer', 'perks'],
    label: 'Offers',
    route: createLabCategoryHref('offers'),
    browseRoute: '/offers',
    type: 'Creation',
    purpose: 'Deals and perks',
    description: 'Prepare promotions, member perks, and marketplace offers.',
    icon: 'pricetag-outline',
    color: CultureTokens.coral,
    kind: 'surface',
    createRoute: '/offers',
  },
];

export const HOSTSPACE_PRIMARY_LINKS: HostspaceAction[] = [
  {
    id: 'create',
    label: 'Create',
    description: 'Communities, events, profiles, dining, shopping, offers, and more.',
    route: '/pages/create',
    icon: 'add-circle-outline',
    color: CultureTokens.teal,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Manage events, listings, payouts, drafts, and host performance.',
    route: '/hostspace/dashboard',
    icon: 'grid-outline',
    color: CultureTokens.indigo,
  },
  {
    id: 'scanner',
    label: 'Scanner',
    description: 'Gate check-in, QR validation, and contact scanning.',
    route: '/scanner',
    icon: 'scan-outline',
    color: CultureTokens.coral,
  },
];

export const HOSTSPACE_WORKFLOW_STEPS: HostspaceWorkflowStep[] = [
  { label: 'Create', description: 'Draft the thing you want to publish.', icon: 'create-outline', color: CultureTokens.teal },
  { label: 'Publish', description: 'Move it into CulturePass discovery.', icon: 'cloud-upload-outline', color: CultureTokens.indigo },
  { label: 'Operate', description: 'Scan, manage, and improve from HostSpace.', icon: 'pulse-outline', color: CultureTokens.coral },
];

export const HOSTSPACE_DASHBOARD_COMMANDS: HostspaceAction[] = [
  {
    id: 'create',
    label: 'Create workspace',
    description: 'Draft, preview, update, and launch new HostSpace records.',
    route: '/pages/create',
    icon: 'add-circle-outline',
    color: CultureTokens.teal,
  },
  {
    id: 'organizer',
    label: 'Organizer dashboard',
    description: 'Full event, listing, ticket, and revenue management.',
    route: '/dashboard/organizer',
    icon: 'grid-outline',
    color: CultureTokens.indigo,
  },
  {
    id: 'scanner',
    label: 'Scanner',
    description: 'Validate tickets, scan CulturePass IDs, and manage contacts.',
    route: '/scanner',
    icon: 'scan-outline',
    color: CultureTokens.coral,
  },
  {
    id: 'wallet',
    label: 'Wallet readiness',
    description: 'Check payout readiness, tax details, and verification status.',
    route: '/dashboard/wallet-readiness',
    icon: 'shield-checkmark-outline',
    color: CultureTokens.teal,
  },
];

export const HOSTSPACE_MANAGEMENT_LINKS: HostspaceAction[] = [
  {
    id: 'content',
    label: 'Content Studio',
    description: 'Manage culture content, playlists, and host storytelling.',
    route: '/dashboard/content-studio',
    icon: 'document-text-outline',
    color: CultureTokens.indigo,
  },
  {
    id: 'widgets',
    label: 'Widgets',
    description: 'Configure embeddable cards and host-facing web widgets.',
    route: '/dashboard/widgets',
    icon: 'apps-outline',
    color: CultureTokens.teal,
  },
  {
    id: 'sponsor',
    label: 'Sponsor hub',
    description: 'Campaigns, placements, partner reporting, and sponsor assets.',
    route: '/dashboard/sponsor',
    icon: 'ribbon-outline',
    color: CultureTokens.coral,
  },
];

export const HOSTSPACE_PIPELINE_STEPS: HostspacePipelineStep[] = [
  { label: 'Draft', value: 'Create', description: 'Start in HostSpace create.', icon: 'create-outline', color: CultureTokens.teal },
  { label: 'Review', value: 'Check', description: 'Confirm identity, media, and location.', icon: 'checkmark-done-outline', color: CultureTokens.indigo },
  { label: 'Publish', value: 'Go live', description: 'Send the page or event into discovery.', icon: 'cloud-upload-outline', color: CultureTokens.coral },
  { label: 'Operate', value: 'Manage', description: 'Scan, update, and track performance.', icon: 'pulse-outline', color: CultureTokens.teal },
];

export function normalizeHostspaceCategory(raw: string | undefined): string {
  return (raw ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
}

export function findHostspaceCreateCategory(raw: string | undefined): HostspaceCreateCategory {
  const normalized = normalizeHostspaceCategory(raw);
  return (
    HOSTSPACE_CREATE_CATEGORIES.find((item) => item.id === normalized || item.aliases.includes(normalized)) ??
    HOSTSPACE_CREATE_CATEGORIES[0]
  );
}
