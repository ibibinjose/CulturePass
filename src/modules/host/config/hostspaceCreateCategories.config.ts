/**
 * HostSpace Create Lab — category catalog and group filters.
 */
import { Ionicons } from '@expo/vector-icons';
import { CultureTokens } from '@/design-system/tokens/theme';
import type { ListingWizardEntityParam } from '@/constants/navigation/experienceNav';
import { createLabCategoryHref } from '@/constants/navigation/createNav';
import {
  isOrganisationCommunityCategoryId,
  ORGANISATION_COMMUNITY_CREATE_PATH,
  type OrganisationCommunityCategoryId,
} from '@shared/creation/orgCommunity';
import { resolveCreationDataflow, type CreationDataflow } from '@shared/creation/dataflow';
import {
  findOrganisationCommunityType,
  ORGANISATION_COMMUNITY_TYPES,
} from './organisationCommunityTypes.config';
import { PAGE_TEMPLATES } from './pageTemplates.config';
import type { HostPageTemplateId } from '@/shared/schema';

/** Creation Lab filter groups — matches the six HostSpace catalog sections. */
export type CategoryGroup =
  | 'all'
  | 'communities'
  | 'venues'
  | 'businesses'
  | 'market'
  | 'templates';

/** @deprecated Use `content` — kept for legacy filter strings. */
export type LegacyCategoryGroup = CategoryGroup | 'events';
export type CreateContentKind = 'event' | 'activity' | 'offer' | 'market' | 'listing';

export type CreateCategory = {
  id: string;
  aliases: string[];
  label: string;
  route: string;
  browseRoute: string;
  type: 'Creation';
  purpose: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  entityType: ListingWizardEntityParam;
  group: CategoryGroup;
  kind?: 'owner' | 'content';
  contentKind?: CreateContentKind;
  requiresParent?: boolean;
  subCategory?: string;
  /** Hidden from Creation Lab grid — used for deep-link routing only. */
  catalogHidden?: boolean;
  /** Page Pro template preset — opens wizard with `template` query param. */
  templateId?: HostPageTemplateId;
  /** Orgs & Communities catalog — unified page vs listing under host. */
  orgCatalogKind?: 'page' | 'host-listing';
};

/** Listing types published under an org/community host page. */
export const ORG_HOST_LISTING_CATEGORY_IDS = [
  'event',
  'activity',
  'offer',
  'dining',
  'shopping',
  'art',
  'movie',
  'travel',
  'other-listing',
] as const;

/** Canonical Creation Lab sections (counts = tiles in sidebar/grid per section). */
export const CREATION_LAB_SECTIONS: {
  group: Exclude<CategoryGroup, 'all'>;
  title: string;
  subtitle: string;
  count: number;
}[] = [
  {
    group: 'communities',
    title: 'Orgs & Communities',
    subtitle: 'Create a page (9 types) · then events, offers & listings under your org host profile',
    count: 10,
  },
  {
    group: 'venues',
    title: 'Venues & Spaces',
    subtitle: 'Halls, galleries, nightlife, sports, monuments, wellness venues',
    count: 9,
  },
  {
    group: 'businesses',
    title: 'Businesses & Creators',
    subtitle: 'Shops, artists, workshops, wellness businesses',
    count: 4,
  },
  {
    group: 'market',
    title: 'CultureMarket',
    subtitle: 'Products, services, and external website links',
    count: 4,
  },
  {
    group: 'templates',
    title: 'Page Pro Templates',
    subtitle: 'Pre-filled presets for common cultural page types',
    count: 5,
  },
];

const CULTURE_MARKET_PATH = '/hostspace/listing';

function templateCatalogCategory(
  template: (typeof PAGE_TEMPLATES)[number],
): CreateCategory {
  const entityType =
    template.entityType === 'organiser' || template.entityType === 'organizer'
      ? 'organizer'
      : template.entityType;
  const isOrgTemplate = entityType === 'community' || entityType === 'organizer';
  return {
    id: `template-${template.id}`,
    aliases: [template.id, `page-template-${template.id}`],
    label: template.title,
    route: isOrgTemplate ? ORGANISATION_COMMUNITY_CREATE_PATH : createLabCategoryHref(entityType),
    browseRoute: '/hostspace/create',
    type: 'Creation',
    purpose: template.description,
    description: template.description,
    icon: `${template.icon}-outline` as keyof typeof Ionicons.glyphMap,
    color: CultureTokens.indigo,
    entityType: entityType as ListingWizardEntityParam,
    group: 'templates',
    templateId: template.id,
  };
}

/** Legacy alias → canonical org/community page type (unified form dropdown). */
const ORG_TYPE_ALIASES: Record<string, OrganisationCommunityCategoryId> = {
  communities: 'community',
  organiser: 'organizer',
  organizers: 'organizer',
  organisers: 'organizer',
  producer: 'organizer',
  associations: 'association',
  'cultural-association': 'association',
  'member-association': 'association',
  organization: 'organisation',
  organizations: 'organisation',
  organisations: 'organisation',
  nonprofit: 'organisation',
  'non-profit': 'organisation',
  ngos: 'ngo',
  'non-government': 'ngo',
  'non-government-organisation': 'ngo',
  'non-government-organization': 'ngo',
  charities: 'charity',
  foundation: 'charity',
  gov: 'government',
  governmental: 'government',
  'public-sector': 'government',
  councils: 'council',
  lga: 'council',
  'local-government': 'council',
  municipal: 'council',
  club: 'club-society',
  clubs: 'club-society',
  society: 'club-society',
  societies: 'club-society',
  'student-club': 'club-society',
  'social-club': 'club-society',
};

function buildOrgRouteCategory(typeId: OrganisationCommunityCategoryId): CreateCategory {
  const meta = findOrganisationCommunityType(typeId);
  return {
    id: typeId,
    aliases: [],
    label: meta.label,
    route: ORGANISATION_COMMUNITY_CREATE_PATH,
    browseRoute:
      typeId === 'community'
        ? '/(tabs)/community'
        : typeId === 'council'
          ? '/my-council'
          : '/(tabs)/directory',
    type: 'Creation',
    purpose: meta.notes,
    description: meta.notes,
    icon: meta.icon,
    color: meta.color,
    entityType: meta.entityType === 'organiser' ? 'organizer' : meta.entityType,
    group: 'communities',
    subCategory: meta.subCategory,
    catalogHidden: true,
  };
}

/** Single Creation Lab tile — unified form with 9-type dropdown. */
export const ORGANISATION_COMMUNITY_CATALOG_CATEGORY: CreateCategory = {
  id: 'organisation-community',
  aliases: ['orgs', 'org', 'organisations', 'organizations', 'pages', 'page', 'create-page'],
  label: 'Organisations & Communities',
  route: ORGANISATION_COMMUNITY_CREATE_PATH,
  browseRoute: '/(tabs)/community',
  type: 'Creation',
  purpose: 'Community through Club or Society — one dropdown form',
  description:
    'Community · Organizer · Association · Organisation · NGO · Charity · Government · Council · Club or Society',
  icon: 'people-outline',
  color: CultureTokens.teal,
  entityType: 'community',
  group: 'communities',
  orgCatalogKind: 'page',
};

export const CREATE_CATEGORIES: CreateCategory[] = [
  // ── Orgs & Communities: page (1) + host listings (9) ─────────────────────
  ORGANISATION_COMMUNITY_CATALOG_CATEGORY,

  // ── Listings under org/community host profile (9) ─────────────────────────
  {
    id: 'event',
    aliases: ['events', 'festival', 'concert', 'show'],
    label: 'Event',
    route: createLabCategoryHref('event'),
    browseRoute: '/(domain)/events',
    type: 'Creation',
    purpose: 'Events under your org page',
    description: 'Free or ticketed events published under your org or community host profile.',
    icon: 'calendar-outline',
    color: CultureTokens.coral,
    entityType: 'event',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'event',
    requiresParent: true,
  },
  {
    id: 'activity',
    aliases: ['activities', 'experience', 'experiences', 'class'],
    label: 'Activity',
    route: createLabCategoryHref('activity'),
    browseRoute: '/activities',
    type: 'Creation',
    purpose: 'Workshops, classes, tours',
    description: 'Workshops, classes, tours, and cultural experiences under your org page.',
    icon: 'sparkles-outline',
    color: CultureTokens.teal,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'activity',
    requiresParent: true,
  },
  {
    id: 'offer',
    aliases: ['offers', 'deal', 'deals', 'perk', 'perks'],
    label: 'Offer',
    route: createLabCategoryHref('offer'),
    browseRoute: '/offers',
    type: 'Creation',
    purpose: 'Deals, perks, promotions',
    description: 'Discounts, member perks, and limited offers under your org page.',
    icon: 'pricetag-outline',
    color: CultureTokens.gold,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'offer',
    requiresParent: true,
  },
  {
    id: 'dining',
    aliases: ['dine', 'food', 'restaurant', 'restaurants', 'cafe', 'eatery'],
    label: 'Dining',
    route: createLabCategoryHref('dining'),
    browseRoute: '/restaurants',
    type: 'Creation',
    purpose: 'Restaurant and café listings',
    description: 'Restaurant, café, and food listings under your org host profile.',
    icon: 'restaurant-outline',
    color: CultureTokens.coral,
    entityType: 'restaurant',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'listing',
    requiresParent: true,
    subCategory: 'dining',
  },
  {
    id: 'shopping',
    aliases: ['shop', 'shops', 'retail', 'store'],
    label: 'Shopping',
    route: createLabCategoryHref('shopping'),
    browseRoute: '/shopping',
    type: 'Creation',
    purpose: 'Retail and maker listings',
    description: 'Shops, maker markets, and retail listings under your org page.',
    icon: 'bag-handle-outline',
    color: CultureTokens.teal,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'market',
    requiresParent: true,
    subCategory: 'shopping',
  },
  {
    id: 'art',
    aliases: ['arts', 'gallery-listing', 'exhibition', 'creative'],
    label: 'Art',
    route: createLabCategoryHref('art'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Art and exhibition listings',
    description: 'Exhibitions, programs, and art services under your org page.',
    icon: 'color-palette-outline',
    color: CultureTokens.violet,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'listing',
    requiresParent: true,
    subCategory: 'art',
  },
  {
    id: 'movie',
    aliases: ['movies', 'film', 'films', 'screening'],
    label: 'Movie',
    route: createLabCategoryHref('movie'),
    browseRoute: '/movies',
    type: 'Creation',
    purpose: 'Film and screening listings',
    description: 'Screenings, film programs, and cinema listings under your org page.',
    icon: 'film-outline',
    color: CultureTokens.indigo,
    entityType: 'venue',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'listing',
    requiresParent: true,
    subCategory: 'movie',
  },
  {
    id: 'travel',
    aliases: ['trip', 'tour', 'tours', 'tourism'],
    label: 'Travel',
    route: createLabCategoryHref('travel'),
    browseRoute: '/activities',
    type: 'Creation',
    purpose: 'Tours and travel experiences',
    description: 'Tours, retreats, and cultural trips under your org host profile.',
    icon: 'airplane-outline',
    color: CultureTokens.teal,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'listing',
    requiresParent: true,
    subCategory: 'travel',
  },
  {
    id: 'other-listing',
    aliases: ['other', 'general-listing', 'listing'],
    label: 'Other Listing',
    route: createLabCategoryHref('other-listing'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'General cultural listing',
    description: 'A general listing under your org page when no specialised type fits.',
    icon: 'document-text-outline',
    color: CultureTokens.indigo,
    entityType: 'business',
    group: 'communities',
    orgCatalogKind: 'host-listing',
    kind: 'content',
    contentKind: 'listing',
    requiresParent: true,
    subCategory: 'other',
  },

  // ── Venues & Spaces ──────────────────────────────────────────────────────
  {
    id: 'venue',
    aliases: ['venues', 'space', 'hall'],
    label: 'Venue',
    route: createLabCategoryHref('venue'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'General cultural venue',
    description: 'Halls, theatres, multipurpose cultural spaces.',
    icon: 'location-outline',
    color: CultureTokens.teal,
    entityType: 'venue',
    group: 'venues',
  },
  {
    id: 'dance-studio',
    aliases: ['dance', 'dance-school', 'dance-company'],
    label: 'Dance Studio',
    route: createLabCategoryHref('dance-studio'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Dance studios and companies',
    description: 'Register dance schools, Bollywood studios, Bharatanatyam academies, and dance companies.',
    icon: 'body-outline',
    color: CultureTokens.coral,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'dance',
  },
  {
    id: 'art-gallery',
    aliases: ['art', 'gallery', 'art-space', 'exhibition-space'],
    label: 'Art Gallery',
    route: createLabCategoryHref('art-gallery'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Galleries and art spaces',
    description: 'Add galleries, artist studios, cultural exhibition spaces, and creative hubs.',
    icon: 'color-palette-outline',
    color: CultureTokens.coral,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'art',
  },
  {
    id: 'cinema',
    aliases: ['movies', 'theatre', 'film', 'movie-theatre'],
    label: 'Cinema',
    route: createLabCategoryHref('cinema'),
    browseRoute: '/movies',
    type: 'Creation',
    purpose: 'Cinemas and screening venues',
    description: 'Register cinemas, film clubs, screening rooms, and film societies.',
    icon: 'film-outline',
    color: CultureTokens.indigo,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'cinema',
  },
  {
    id: 'nightlife',
    aliases: ['nightclub', 'club', 'bar', 'lounge'],
    label: 'Nightlife',
    route: createLabCategoryHref('nightlife'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Clubs, bars, lounges',
    description: 'Nightclubs, cocktail bars, rooftop lounges, and late-night cultural venues.',
    icon: 'moon-outline',
    color: CultureTokens.violet,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'nightlife',
  },
  {
    id: 'comedy-club',
    aliases: ['comedy', 'stand-up', 'improv'],
    label: 'Comedy Club',
    route: createLabCategoryHref('comedy-club'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Comedy clubs and theatres',
    description: 'Register comedy clubs, stand-up venues, and improv theatre spaces.',
    icon: 'happy-outline',
    color: CultureTokens.gold,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'comedy',
  },
  {
    id: 'sports-venue',
    aliases: ['sports', 'stadium', 'gym', 'recreation', 'sports-club'],
    label: 'Sports Venue',
    route: createLabCategoryHref('sports-venue'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Sports venues and recreation centres',
    description: 'Add stadiums, gyms, sports clubs, cricket grounds, and recreation centres.',
    icon: 'football-outline',
    color: CultureTokens.teal,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'sports',
  },
  {
    id: 'monument',
    aliases: ['monuments', 'landmark', 'attractions', 'heritage-site', 'cultural-site'],
    label: 'Monument',
    route: createLabCategoryHref('monument'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Heritage sites, landmarks',
    description: 'Monuments, cultural landmarks, and points of interest.',
    icon: 'earth-outline',
    color: CultureTokens.gold,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'monument',
  },
  {
    id: 'wellness-space',
    aliases: ['spa', 'yoga-studio', 'meditation-centre', 'retreat-centre'],
    label: 'Wellness Space',
    route: createLabCategoryHref('wellness-space'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Yoga, meditation, spa',
    description: 'Yoga studios, meditation centres, spas, and wellness retreat venues.',
    icon: 'leaf-outline',
    color: CultureTokens.teal,
    entityType: 'venue',
    group: 'venues',
    subCategory: 'wellness',
  },

  // ── Businesses & Creators (4) ───────────────────────────────────────────
  {
    id: 'business',
    aliases: ['businesses', 'company', 'brand'],
    label: 'Business',
    route: createLabCategoryHref('business'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Shops, services, brands',
    description: 'Shops, services, producers, and cultural brands.',
    icon: 'briefcase-outline',
    color: CultureTokens.indigo,
    entityType: 'business',
    group: 'businesses',
  },
  {
    id: 'artist',
    aliases: ['artists', 'performer', 'musician', 'creator'],
    label: 'Artist',
    route: createLabCategoryHref('artist'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Performers, makers, speakers',
    description: 'Performers, makers, speakers, and creative profiles.',
    icon: 'mic-outline',
    color: CultureTokens.coral,
    entityType: 'artist',
    group: 'businesses',
  },
  {
    id: 'workshop',
    aliases: ['workshops', 'class', 'classes', 'academy', 'school'],
    label: 'Workshop',
    route: createLabCategoryHref('workshop'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Schools, academies, skill providers',
    description: 'Cooking schools, language academies, craft workshops, and skill providers.',
    icon: 'construct-outline',
    color: CultureTokens.gold,
    entityType: 'business',
    group: 'businesses',
    subCategory: 'workshop',
  },
  {
    id: 'wellness',
    aliases: ['wellness-business', 'health', 'holistic', 'ayurveda'],
    label: 'Wellness Business',
    route: createLabCategoryHref('wellness'),
    browseRoute: '/(tabs)/directory',
    type: 'Creation',
    purpose: 'Clinics, holistic health',
    description: 'Ayurvedic clinics, holistic health providers, and wellness brands.',
    icon: 'fitness-outline',
    color: CultureTokens.teal,
    entityType: 'business',
    group: 'businesses',
    subCategory: 'wellness_business',
  },

  // ── CultureMarket (4) ─────────────────────────────────────────────────────
  {
    id: 'market-listing',
    aliases: ['listing', 'marketplace', 'culturemarketplace', 'culturemarket', 'market', 'sell', 'product', 'service'],
    label: 'CultureMarket Listing',
    route: CULTURE_MARKET_PATH,
    browseRoute: '/CultureMarket',
    type: 'Creation',
    purpose: 'List on CultureMarket',
    description: 'Sell a product, offer a service, or link your cultural business website to reach thousands of diaspora members.',
    icon: 'storefront-outline',
    color: CultureTokens.coral,
    entityType: 'business',
    group: 'market',
  },
  {
    id: 'market-product',
    aliases: ['product', 'sell-product', 'physical', 'digital'],
    label: 'Sell a Product',
    route: CULTURE_MARKET_PATH,
    browseRoute: '/CultureMarket',
    type: 'Creation',
    purpose: 'Physical or digital products',
    description: 'List a physical or digital product for sale — buyers purchase or contact you directly.',
    icon: 'cube-outline',
    color: CultureTokens.coral,
    entityType: 'business',
    group: 'market',
    subCategory: 'product',
  },
  {
    id: 'market-service',
    aliases: ['service', 'offer-service', 'bookable', 'lesson', 'experience'],
    label: 'Offer a Service',
    route: CULTURE_MARKET_PATH,
    browseRoute: '/CultureMarket',
    type: 'Creation',
    purpose: 'Bookable lesson or experience',
    description: 'Offer a service, lesson, or cultural experience — set your price and let buyers contact you.',
    icon: 'briefcase-outline',
    color: CultureTokens.teal,
    entityType: 'business',
    group: 'market',
    subCategory: 'service',
  },
  {
    id: 'market-link',
    aliases: ['link', 'website', 'external', 'link-site'],
    label: 'Link Your Website',
    route: CULTURE_MARKET_PATH,
    browseRoute: '/CultureMarket',
    type: 'Creation',
    purpose: 'Traffic to your own site',
    description: 'Add your business to CultureMarket with a link directly to your own website. Drive traffic and grow your audience.',
    icon: 'open-outline',
    color: CultureTokens.violet,
    entityType: 'business',
    group: 'market',
    subCategory: 'link',
  },

  // ── Page Pro Templates (5) ────────────────────────────────────────────────
  ...PAGE_TEMPLATES.map(templateCatalogCategory),
];

export const GROUP_TABS: { id: CategoryGroup; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'communities', label: 'Orgs', icon: 'people-outline' },
  { id: 'venues', label: 'Venues', icon: 'location-outline' },
  { id: 'businesses', label: 'Businesses', icon: 'briefcase-outline' },
  { id: 'market', label: 'Market', icon: 'storefront-outline' },
  { id: 'templates', label: 'Templates', icon: 'document-text-outline' },
];

export const GROUP_COLORS: Record<CategoryGroup, string> = {
  all: CultureTokens.indigo,
  communities: CultureTokens.teal,
  venues: CultureTokens.violet,
  businesses: CultureTokens.coral,
  market: CultureTokens.coral,
  templates: CultureTokens.indigo,
};

/** Normalize legacy group filters. */
export function normalizeCategoryGroup(group: string): CategoryGroup {
  if (group === 'events' || group === 'content') return 'communities';
  return group as CategoryGroup;
}

export function getOrgHostListingCategories(): CreateCategory[] {
  return CREATE_CATEGORIES.filter((item) => item.orgCatalogKind === 'host-listing');
}

export type CatalogSubsection = {
  title: string;
  items: CreateCategory[];
};

/** Group visible catalog categories by Creation Lab section (preserves catalog order). */
export function groupCatalogCategories(
  categories: CreateCategory[],
): {
  section: (typeof CREATION_LAB_SECTIONS)[number];
  items: CreateCategory[];
  subsections?: CatalogSubsection[];
}[] {
  return CREATION_LAB_SECTIONS.map((section) => {
    const items = categories.filter((item) => item.group === section.group);
    if (section.group !== 'communities') {
      return { section, items };
    }
    const pageItems = items.filter((item) => item.orgCatalogKind === 'page');
    const listingItems = items.filter((item) => item.orgCatalogKind === 'host-listing');
    return {
      section,
      items,
      subsections: [
        { title: 'Create a page', items: pageItems },
        { title: 'Listings under your org', items: listingItems },
      ].filter((block) => block.items.length > 0),
    };
  }).filter((block) => block.items.length > 0);
}

function normalizeCategory(raw: string | undefined): string {
  return (raw ?? '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
}

export function findCategory(raw: string | undefined): CreateCategory {
  const normalized = normalizeCategory(raw);
  const catalog = CREATE_CATEGORIES.find(
    (item) => item.id === normalized || item.aliases.includes(normalized),
  );
  if (catalog) return catalog;

  if (isOrganisationCommunityCategoryId(normalized)) {
    return buildOrgRouteCategory(normalized);
  }

  const aliasType = ORG_TYPE_ALIASES[normalized];
  if (aliasType) return buildOrgRouteCategory(aliasType);

  return ORGANISATION_COMMUNITY_CATALOG_CATEGORY;
}

/** Categories shown in Creation Lab sidebar/grid (excludes deep-link-only org types). */
export function getCreateLabCatalogCategories(): CreateCategory[] {
  return CREATE_CATEGORIES.filter((item) => !item.catalogHidden);
}

/** Labels for unified org/community dropdown (re-export for docs and UI). */
export const ORGANISATION_COMMUNITY_TYPE_LABELS = ORGANISATION_COMMUNITY_TYPES.map((t) => t.label);

/** Application-layer dataflow for a category (wizard → Firestore → HostSpace tab). */
export function getCategoryDataflow(category: CreateCategory): CreationDataflow {
  return resolveCreationDataflow(category);
}

/** All categories with resolved dataflow — for analytics, docs, and unified routing. */
export function listCreationCatalog(): (CreateCategory & { dataflow: CreationDataflow })[] {
  return CREATE_CATEGORIES.map((category) => ({
    ...category,
    dataflow: getCategoryDataflow(category),
  }));
}
