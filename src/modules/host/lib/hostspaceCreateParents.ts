import type { HostPage } from '@/shared/schema';
import type { CreateCategory } from '@/modules/host/config/hostspaceCreateCategories.config';

const ORG_HOST_ENTITY_TYPES = new Set(['community', 'organiser', 'organizer']);

export function isOrgCommunityHostPage(page: HostPage): boolean {
  return ORG_HOST_ENTITY_TYPES.has(page.entityType);
}

export function hostPageLabel(page: HostPage): string {
  return page.formData?.name?.trim() || 'Untitled page';
}

export function hostPageSubtitle(page: HostPage): string {
  const tag = page.formData?.categoryTags?.[0];
  if (tag) return tag;
  return page.entityType.replace(/_/g, ' ');
}

/** Host pages eligible as parent for a Creation Lab category. */
export function filterHostPagesForCategory(pages: HostPage[], category: CreateCategory): HostPage[] {
  if (category.orgCatalogKind === 'host-listing' || category.requiresParent) {
    return pages.filter(isOrgCommunityHostPage);
  }

  const expected = category.entityType;
  return pages.filter((page) => {
    if (page.entityType === expected) return true;
    if (
      expected === 'organizer' &&
      (page.entityType === 'organiser' || page.entityType === 'organizer')
    ) {
      return true;
    }
    return false;
  });
}