/**
 * CulturePass Creation Dataflow — application-layer registry.
 *
 * Maps Creation Lab categories to wizards, Firestore collections, and HostSpace tabs.
 * This is the scalable alternative to a single polymorphic `entities` table: keep
 * purpose-built collections (`hostPages`, `profiles`, `events`, `cultureShopListings`)
 * and unify routing + ownership rules here.
 */

/** HostSpace manage dashboard tab ids. */
export type HostspaceManageTab = 'all' | 'pages' | 'events' | 'listings' | 'offers' | 'market';

/** Owner page vs child content vs marketplace listing. */
export type CreationLayer = 'owner' | 'content' | 'market';

/** Which UI wizard handles the create flow. */
export type CreationWizard =
  | 'page-pro'
  | 'creation-lab'
  | 'event'
  | 'listing'
  | 'culture-market';

/** Primary Firestore collection written on publish (API layer). */
export type StorageCollection =
  | 'hostPages'
  | 'hostPageDrafts'
  | 'profiles'
  | 'events'
  | 'cultureShopListings';

export interface CreationDataflow {
  layer: CreationLayer;
  wizard: CreationWizard;
  /** Collection where the published record lives. */
  storage: StorageCollection;
  /** Draft autosave collection when applicable. */
  draftStorage?: StorageCollection;
  manageTab: HostspaceManageTab;
  requiresParent: boolean;
  /** Shared heritage fields (culture / indigenous) on create forms. */
  hasCultureStep: boolean;
}

export interface CreationCategoryInput {
  id: string;
  entityType: string;
  group: string;
  kind?: 'owner' | 'content';
  contentKind?: 'event' | 'activity' | 'offer' | 'market' | 'listing';
  requiresParent?: boolean;
  subCategory?: string;
}

const PAGE_ENTITY_TYPES = new Set([
  'community',
  'organiser',
  'organizer',
  'venue',
  'business',
  'artist',
  'professional',
]);

const ORG_SUBCATEGORIES = new Set([
  'association',
  'organisation',
  'ngo',
  'charity',
  'government',
  'council',
  'club_society',
]);

/** Page Pro Wizard entity types (rich owner profiles). */
export const PAGE_OWNER_ENTITY_TYPES = [
  'community',
  'organiser',
  'venue',
  'business',
  'artist',
  'professional',
] as const;

export type PageOwnerEntityType = (typeof PAGE_OWNER_ENTITY_TYPES)[number];

/**
 * Resolve storage + UI routing for a Creation Lab category.
 * Used by docs, analytics, and future unified create router.
 */
export function resolveCreationDataflow(category: CreationCategoryInput): CreationDataflow {
  const requiresParent = category.requiresParent === true || category.kind === 'content';

  // CultureMarket
  if (category.group === 'market' || category.id.startsWith('market-') || category.id === 'market-listing') {
    return {
      layer: 'market',
      wizard: 'culture-market',
      storage: 'cultureShopListings',
      manageTab: 'market',
      requiresParent: false,
      hasCultureStep: true,
    };
  }

  // Events
  if (category.contentKind === 'event' || category.entityType === 'event') {
    return {
      layer: 'content',
      wizard: 'event',
      storage: 'events',
      manageTab: 'events',
      requiresParent: true,
      hasCultureStep: true,
    };
  }

  // Offers
  if (category.contentKind === 'offer' || category.id === 'offer') {
    return {
      layer: 'content',
      wizard: 'listing',
      storage: 'profiles',
      manageTab: 'offers',
      requiresParent: true,
      hasCultureStep: true,
    };
  }

  // Child listings (directory profiles under a parent host)
  if (requiresParent) {
    return {
      layer: 'content',
      wizard: 'listing',
      storage: 'profiles',
      manageTab: 'listings',
      requiresParent: true,
      hasCultureStep: true,
    };
  }

  // Rich host pages (Page Pro Wizard)
  if (PAGE_ENTITY_TYPES.has(category.entityType)) {
    return {
      layer: 'owner',
      wizard: 'page-pro',
      storage: 'hostPages',
      draftStorage: 'hostPageDrafts',
      manageTab: 'pages',
      requiresParent: false,
      hasCultureStep: true,
    };
  }

  // Org subtypes that map to organiser pages or directory profiles
  if (category.entityType === 'organizer' || ORG_SUBCATEGORIES.has(category.subCategory ?? '')) {
    return {
      layer: 'owner',
      wizard: 'page-pro',
      storage: 'hostPages',
      draftStorage: 'hostPageDrafts',
      manageTab: 'pages',
      requiresParent: false,
      hasCultureStep: true,
    };
  }

  // Fallback — Creation Lab routes to listing wizard
  return {
    layer: 'content',
    wizard: 'creation-lab',
    storage: 'profiles',
    manageTab: 'listings',
    requiresParent: false,
    hasCultureStep: true,
  };
}

/** Wizard pathname for each creation wizard kind. */
export const WIZARD_PATHS: Record<CreationWizard, string> = {
  'page-pro': '/hostspace/[category]/create',
  'creation-lab': '/hostspace/[category]/create',
  event: '/hostspace/event/create',
  listing: '/hostspace/[category]/create',
  'culture-market': '/hostspace/listing',
};

/**
 * High-level platform dataflow (accurate for Firebase stack).
 *
 * User → Creation Lab / Wizard → API (Express Functions) → Firestore collection
 * → HostSpace manage tab + public discovery feeds.
 */
/**
 * Storage strategy: keep purpose-built Firestore collections (below).
 * Do NOT migrate to a single polymorphic `entities` table unless search/reporting
 * volume forces a read-model (BigQuery, Algolia, etc.). Unify routing in
 * shared/creation/* instead.
 */
export const PLATFORM_DATAFLOW = {
  entryPoints: ['/hostspace', '/hostspace/create', '/hostspace/event/create', '/hostspace/[category]/create', '/hostspace/listing'],
  auth: 'Firebase Auth + HostspaceAccessGate + organizer role (hostApplications)',
  api: 'Firebase Functions v2 → Express handlers',
  database: 'Firestore (not Supabase)',
  collections: {
    owner: ['hostPages', 'hostPageDrafts'],
    directory: ['profiles'],
    events: ['events'],
    market: ['cultureShopListings'],
    trust: ['hostApplications', 'hostVerificationTasks'],
  },
  manageTabs: ['all', 'pages', 'events', 'listings', 'offers', 'market'] as HostspaceManageTab[],
  heritageFields: ['nationalityId', 'cultureIds', 'indigenousTags', 'isIndigenousOwned', 'languageIds'],
} as const;