/**
 * Creation funnel analytics — wired to PostHog via captureEvent.
 * Every create entry point should call these helpers.
 */

import { captureEvent } from '@/lib/analytics';
import type { CreationLayer, CreationWizard, StorageCollection, HostspaceManageTab } from '@shared/creation/dataflow';
import { monetizationSurfacesForLayer, type MonetizationSurface } from '@shared/creation/monetization';

export type CreationFunnelStage =
  | 'catalog_view'
  | 'category_select'
  | 'wizard_open'
  | 'wizard_step'
  | 'publish_attempt'
  | 'publish_success'
  | 'publish_error';

export interface CreationAnalyticsContext {
  categoryId: string;
  categoryLabel?: string;
  layer: CreationLayer;
  wizard: CreationWizard;
  storage: StorageCollection;
  manageTab: HostspaceManageTab;
  source: string;
  parentProfileId?: string;
  entityType?: string;
  subCategory?: string;
}

function baseProps(ctx: Partial<CreationAnalyticsContext> & { stage: CreationFunnelStage }) {
  const monetizationSurfaces = ctx.layer
    ? monetizationSurfacesForLayer(ctx.layer).map((s) => s.surface)
    : [];
  return {
    stage: ctx.stage,
    category_id: ctx.categoryId ?? null,
    category_label: ctx.categoryLabel ?? null,
    creation_layer: ctx.layer ?? null,
    creation_wizard: ctx.wizard ?? null,
    storage_collection: ctx.storage ?? null,
    manage_tab: ctx.manageTab ?? null,
    source: ctx.source ?? 'app',
    parent_profile_id: ctx.parentProfileId ?? null,
    entity_type: ctx.entityType ?? null,
    sub_category: ctx.subCategory ?? null,
    monetization_surfaces: monetizationSurfaces,
    platform_database: 'firestore',
  };
}

export function captureCreationCatalogView(source = 'creation_lab') {
  captureEvent('creation_funnel', baseProps({ stage: 'catalog_view', source }));
}

export function captureCreationCategorySelect(ctx: CreationAnalyticsContext) {
  captureEvent('creation_funnel', baseProps({ ...ctx, stage: 'category_select' }));
}

export function captureCreationWizardOpen(ctx: CreationAnalyticsContext) {
  captureEvent('creation_funnel', baseProps({ ...ctx, stage: 'wizard_open' }));
}

export function captureCreationWizardStep(
  ctx: CreationAnalyticsContext & { stepId: string; stepIndex?: number },
) {
  captureEvent('creation_funnel', {
    ...baseProps({ ...ctx, stage: 'wizard_step' }),
    step_id: ctx.stepId,
    step_index: ctx.stepIndex ?? null,
  });
}

export function captureCreationPublishAttempt(ctx: CreationAnalyticsContext) {
  captureEvent('creation_funnel', baseProps({ ...ctx, stage: 'publish_attempt' }));
}

export function captureCreationPublishSuccess(
  ctx: CreationAnalyticsContext & {
    entityId: string;
    heritage?: {
      nationalityId?: string;
      indigenousTags?: string[];
      isIndigenousOwned?: boolean;
      cultureTagCount?: number;
    };
  },
) {
  captureEvent('creation_funnel', {
    ...baseProps({ ...ctx, stage: 'publish_success' }),
    entity_id: ctx.entityId,
    has_heritage_tags: Boolean(
      ctx.heritage?.indigenousTags?.length ||
        ctx.heritage?.nationalityId ||
        ctx.heritage?.isIndigenousOwned,
    ),
    nationality_id: ctx.heritage?.nationalityId ?? null,
    indigenous_tag_count: ctx.heritage?.indigenousTags?.length ?? 0,
    is_indigenous_owned: ctx.heritage?.isIndigenousOwned ?? false,
    culture_tag_count: ctx.heritage?.cultureTagCount ?? 0,
  });
}

export function captureCreationPublishError(
  ctx: CreationAnalyticsContext & { errorMessage: string },
) {
  captureEvent('creation_funnel', {
    ...baseProps({ ...ctx, stage: 'publish_error' }),
    error_message: ctx.errorMessage,
  });
}

/** Future upsell — log intent without blocking publish. */
export function captureMonetizationImpression(surface: MonetizationSurface, source: string) {
  captureEvent('monetization_impression', { surface, source });
}