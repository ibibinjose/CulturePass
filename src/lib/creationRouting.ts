/**
 * Single entry for all create navigation — uses shared creation registry.
 */

import { router } from 'expo-router';
import {
  resolveCreateNavigation,
  isPageProCategory,
  type RoutableCategory,
  type CreateNavigationOpts,
} from '@shared/creation/routing';
import {
  findCategory,
  CREATE_CATEGORIES,
  getCategoryDataflow,
  type CreateCategory,
} from '@/modules/host/config/hostspaceCreateCategories.config';
import {
  captureCreationCatalogView,
  captureCreationCategorySelect,
  captureCreationWizardOpen,
  type CreationAnalyticsContext,
} from '@/lib/creationAnalytics';
import { hostspaceCreateRoute } from '@/constants/navigation/createNav';

function analyticsContext(
  category: CreateCategory,
  source: string,
  parentProfileId?: string,
): CreationAnalyticsContext {
  const flow = getCategoryDataflow(category);
  return {
    categoryId: category.id,
    categoryLabel: category.label,
    layer: flow.layer,
    wizard: flow.wizard,
    storage: flow.storage,
    manageTab: flow.manageTab,
    source,
    parentProfileId,
    entityType: category.entityType,
    subCategory: category.subCategory,
  };
}

function pushCreateIntent(
  category: CreateCategory,
  navOpts: CreateNavigationOpts,
  ctx: CreationAnalyticsContext,
  trackSelect: boolean,
  replace = false,
) {
  if (trackSelect) {
    captureCreationCategorySelect(ctx);
  }
  captureCreationWizardOpen(ctx);

  const intent = resolveCreateNavigation(category as RoutableCategory, navOpts);
  const navigate = replace ? router.replace.bind(router) : router.push.bind(router);
  if (Object.keys(intent.params).length > 0) {
    navigate({ pathname: intent.pathname as never, params: intent.params } as never);
  } else {
    navigate(intent.pathname as never);
  }
}

export function navigateToCreate(
  category: CreateCategory,
  opts: CreateNavigationOpts & { source: string; trackSelect?: boolean; replace?: boolean },
) {
  const { source, trackSelect = true, replace = false, ...navOpts } = opts;
  pushCreateIntent(
    category,
    navOpts,
    analyticsContext(category, source, navOpts.parentProfileId),
    trackSelect,
    replace,
  );
}

/** Resolve category id (e.g. `event`, `offer`, `market-product`) and navigate. */
export function navigateToCreateById(
  categoryId: string,
  opts: CreateNavigationOpts & {
    source: string;
    trackSelect?: boolean;
    parentProfileId?: string;
    replace?: boolean;
  },
) {
  navigateToCreate(findCategory(categoryId), opts);
}

/** Open HostSpace create panel with analytics. */
export function navigateToCreationLab(source: string) {
  captureCreationCatalogView(source);
  router.push(hostspaceCreateRoute() as never);
}

/** Map directory/listing entity + subcategory to a Creation Lab category. */
export function findCategoryForListingEntity(
  entityType: string,
  subCategory?: string,
): CreateCategory {
  if (subCategory) {
    const normalized = subCategory.toLowerCase().replace(/\s+/g, '_');
    const bySub = CREATE_CATEGORIES.find(
      (c) =>
        c.subCategory === normalized ||
        c.subCategory === subCategory ||
        c.id === normalized ||
        c.aliases.includes(normalized),
    );
    if (bySub) return bySub;
  }

  const byId = CREATE_CATEGORIES.find((c) => c.id === entityType);
  if (byId) return byId;

  const byEntity = CREATE_CATEGORIES.find(
    (c) => c.entityType === entityType && c.kind !== 'content' && !c.requiresParent,
  );
  if (byEntity) return byEntity;

  if (entityType === 'community') return findCategory('community');
  if (entityType === 'restaurant') return findCategory('dining');
  if (entityType === 'event') return findCategory('event');
  return findCategory('other-listing');
}

export function navigateToEditEvent(
  editId: string,
  source: string,
  parentProfileId?: string,
) {
  navigateToCreate(findCategory('event'), {
    source,
    editId,
    parentProfileId,
    trackSelect: false,
  });
}

export function navigateToEditShopListing(editId: string, source: string) {
  navigateToCreate(findCategory('market-listing'), { source, editId, trackSelect: false });
}

export function navigateToEditListing(
  editId: string,
  entityType: string,
  source: string,
  opts?: { subCategory?: string; parentProfileId?: string },
) {
  const category = findCategoryForListingEntity(entityType, opts?.subCategory);
  navigateToCreate(category, {
    source,
    editId,
    parentProfileId: opts?.parentProfileId,
    trackSelect: false,
  });
}

export function navigateToEditHostPage(
  entityType: string,
  pageId: string,
  source: string,
) {
  const categoryId =
    entityType === 'organizer' || entityType === 'organiser' ? 'organizer' : entityType;
  navigateToCreate(findCategory(categoryId), { source, pageId, trackSelect: false });
}

export function navigateToResumeDraft(
  draft: { entityType: string; id: string },
  source: string,
) {
  const richTypes = new Set([
    'business',
    'venue',
    'artist',
    'professional',
    'organizer',
    'organiser',
    'community',
  ]);
  const et = draft.entityType;
  if (richTypes.has(et)) {
    const categoryId = et === 'organizer' || et === 'organiser' ? 'organizer' : et;
    navigateToCreate(findCategory(categoryId), { source, draftId: draft.id, trackSelect: false });
    return;
  }
  navigateToCreate(findCategory(et), { source, draftId: draft.id, trackSelect: false });
}

export function navigateToPageProEntity(
  entityType: string,
  source: string,
  opts?: CreateNavigationOpts & { trackSelect?: boolean; replace?: boolean },
) {
  const categoryId =
    entityType === 'organiser' || entityType === 'organizer' ? 'organizer' : entityType;
  navigateToCreate(findCategory(categoryId), {
    source,
    trackSelect: opts?.trackSelect ?? true,
    replace: opts?.replace ?? false,
    templateId: opts?.templateId,
    draftId: opts?.draftId,
    pageId: opts?.pageId,
    intent: opts?.intent,
    parentProfileId: opts?.parentProfileId,
  });
}

/** Category grid tap — page-pro / market types jump straight to wizard. */
export function navigateOnCategorySelect(
  category: CreateCategory,
  source = 'creation_lab_sidebar',
) {
  if (isPageProCategory(category as RoutableCategory) || category.group === 'market') {
    navigateToCreate(category, { source, trackSelect: true });
    return;
  }

  captureCreationCategorySelect(analyticsContext(category, source));
  router.replace(category.route as never);
}