/**
 * Creation routing — maps categories to wizard navigation intents.
 * Consumers (Expo Router) turn these into hrefs via src/lib/creationRouting.ts.
 */

import { resolveCreationDataflow, type CreationCategoryInput, type CreationWizard } from './dataflow';
import { isOrganisationCommunityCategoryId, ORGANISATION_COMMUNITY_CREATE_PATH } from './orgCommunity';

const EVENT_CREATE_PATH = '/hostspace/event/create';
const HOSTSPACE_CREATE_CATALOG = '/hostspace/create';

function hostspaceCategoryCreatePath(categoryId: string): string {
  const id = categoryId.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!id || id === 'event' || id === 'events') return EVENT_CREATE_PATH;
  return `/hostspace/${id}/create`;
}

export interface CreateNavigationOpts {
  /** @deprecated Host pages replaced legacy profiles — use parentHostPageId. */
  parentProfileId?: string;
  /** Org/community host page that owns child listings and events. */
  parentHostPageId?: string;
  editId?: string;
  pageId?: string;
  draftId?: string;
  templateId?: string;
  intent?: string;
}

export interface CreateNavigationIntent {
  wizard: CreationWizard;
  /** Expo Router pathname */
  pathname: string;
  params: Record<string, string>;
  layer: ReturnType<typeof resolveCreationDataflow>['layer'];
  storage: ReturnType<typeof resolveCreationDataflow>['storage'];
  manageTab: ReturnType<typeof resolveCreationDataflow>['manageTab'];
  requiresParent: boolean;
}

export type RoutableCategory = CreationCategoryInput & {
  id: string;
  route?: string;
  entityType: string;
};

/**
 * Resolve where a Creation Lab category should navigate.
 * All create entry points must use this (or navigateToCreate wrapper).
 */
export function resolveCreateNavigation(
  category: RoutableCategory,
  opts: CreateNavigationOpts = {},
): CreateNavigationIntent {
  const flow = resolveCreationDataflow(category);
  const params: Record<string, string> = {};

  switch (flow.wizard) {
    case 'page-pro':
      if (opts.pageId) params.pageId = opts.pageId;
      if (opts.draftId) params.draftId = opts.draftId;
      if (opts.templateId) params.template = opts.templateId;
      if (opts.intent) params.intent = opts.intent;
      if (opts.editId) params.editId = opts.editId;
      if (isOrganisationCommunityCategoryId(category.id)) {
        params.type = category.id;
      } else if (category.id === 'organisation-community') {
        params.type = 'community';
      } else if (category.group === 'templates') {
        const et = category.entityType;
        if (et === 'community') params.type = 'community';
        if (et === 'organizer' || et === 'organiser') params.type = 'organizer';
      }
      const orgUnifiedPath =
        isOrganisationCommunityCategoryId(category.id) ||
        category.id === 'organisation-community' ||
        (category.group === 'templates' &&
          (category.entityType === 'community' ||
            category.entityType === 'organizer' ||
            category.entityType === 'organiser'));
      const templatePageProPath =
        category.group === 'templates' && !orgUnifiedPath
          ? hostspaceCategoryCreatePath(
              category.entityType === 'organizer' || category.entityType === 'organiser'
                ? 'organizer'
                : category.entityType,
            )
          : hostspaceCategoryCreatePath(category.id);
      return {
        wizard: flow.wizard,
        pathname: orgUnifiedPath ? ORGANISATION_COMMUNITY_CREATE_PATH : templatePageProPath,
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'event': {
      const parentPageId = opts.parentHostPageId ?? opts.parentProfileId;
      if (parentPageId) params.pageId = parentPageId;
      if (opts.editId) params.editId = opts.editId;
      return {
        wizard: flow.wizard,
        pathname: EVENT_CREATE_PATH,
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };
    }

    case 'listing': {
      const parentPageId = opts.parentHostPageId ?? opts.parentProfileId;
      if (parentPageId) params.pageId = parentPageId;
      if (opts.editId) params.editId = opts.editId;
      return {
        wizard: flow.wizard,
        pathname: hostspaceCategoryCreatePath(category.id),
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };
    }

    case 'culture-market':
      if (opts.editId) params.edit = opts.editId;
      if (category.subCategory && ['product', 'service', 'link'].includes(category.subCategory)) {
        params.type = category.subCategory;
      }
      return {
        wizard: flow.wizard,
        pathname: '/hostspace/listing',
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'creation-lab':
    default: {
      if (opts.parentProfileId) params.publisherProfileId = opts.parentProfileId;
      if (opts.editId) params.editId = opts.editId;
      return {
        wizard: 'creation-lab',
        pathname: category.id ? hostspaceCategoryCreatePath(category.id) : HOSTSPACE_CREATE_CATALOG,
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };
    }
  }
}

/** Rich Page Pro entity types — selecting these opens the page wizard immediately. */
export const PAGE_PRO_ENTITY_TYPES = new Set([
  'community',
  'organiser',
  'organizer',
  'venue',
  'business',
  'artist',
  'professional',
]);

export function isPageProCategory(category: RoutableCategory): boolean {
  return PAGE_PRO_ENTITY_TYPES.has(category.entityType);
}