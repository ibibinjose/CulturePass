/**
 * Creation routing — maps categories to wizard navigation intents.
 * Consumers (Expo Router) turn these into hrefs via src/lib/creationRouting.ts.
 */

import { resolveCreationDataflow, type CreationCategoryInput, type CreationWizard } from './dataflow';

export interface CreateNavigationOpts {
  parentProfileId?: string;
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
      params.entityType = category.entityType === 'organizer' ? 'organiser' : category.entityType;
      if (opts.pageId) params.pageId = opts.pageId;
      if (opts.draftId) params.draftId = opts.draftId;
      if (opts.templateId) params.template = opts.templateId;
      if (opts.intent) params.intent = opts.intent;
      return {
        wizard: flow.wizard,
        pathname: '/pages/create',
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'event':
      if (opts.parentProfileId) params.publisherProfileId = opts.parentProfileId;
      if (opts.editId) params.editId = opts.editId;
      return {
        wizard: flow.wizard,
        pathname: '/event/create',
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'listing':
      params.listingEntityType = category.entityType;
      if (category.subCategory) params.listingSubCategory = category.subCategory;
      if (opts.parentProfileId) params.publisherProfileId = opts.parentProfileId;
      if (opts.editId) params.editId = opts.editId;
      return {
        wizard: flow.wizard,
        pathname: '/(domain)/listing/create',
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'culture-market':
      if (opts.editId) params.edit = opts.editId;
      if (category.subCategory && ['product', 'service', 'link'].includes(category.subCategory)) {
        params.type = category.subCategory;
      }
      return {
        wizard: flow.wizard,
        pathname: '/pages/create/listing',
        params,
        layer: flow.layer,
        storage: flow.storage,
        manageTab: flow.manageTab,
        requiresParent: flow.requiresParent,
      };

    case 'creation-lab':
    default: {
      // category.route is already `/pages/create?category=…`
      const href = category.route ?? '/pages/create';
      const qIndex = href.indexOf('?');
      const pathname = qIndex >= 0 ? href.slice(0, qIndex) : href;
      const search = qIndex >= 0 ? href.slice(qIndex + 1) : '';
      const parsed = new URLSearchParams(search);
      parsed.forEach((v, k) => {
        params[k] = v;
      });
      if (opts.parentProfileId) params.publisherProfileId = opts.parentProfileId;
      return {
        wizard: 'creation-lab',
        pathname,
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