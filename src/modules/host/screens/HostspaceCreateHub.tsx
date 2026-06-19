/**
 * HostSpace create catalog — /hostspace/create
 * Org/community types always route to the unified /hostspace/create/page form.
 */
import React, { useCallback, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { View, StyleSheet } from 'react-native';

import { HostspaceCreatePanel } from '@/modules/host/components/HostspaceCreatePanel';
import type { PageEntityType } from '@/modules/host/screens/CreatePageSelector';
import { PageProWizard } from '@/modules/host/screens/PageProWizard';
import type { HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { isOrganisationCommunityCategory } from '@/modules/host/config/organisationCommunityTypes.config';
import { findCategory } from '@/modules/host/config/hostspaceCreateCategories.config';
import {
  HOSTSPACE_CREATE_CATALOG_PATHNAME,
  HOSTSPACE_CREATE_PAGE_PATHNAME,
  HOSTSPACE_PATHNAME,
} from '@/constants/navigation/createNav';

import { sanitizeInternalRedirect } from '@/lib/routes';
import { labelForOnboardingDestination } from '@/lib/onboardingDestination';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import { HostspaceCreateShell } from '@/components/hostspace/HostspaceCreateShell';
import { LuxeButton } from '@/design-system/ui';

const NON_ORG_PAGE_ENTITY_TYPES: HostEntityType[] = ['venue', 'business', 'artist', 'professional'];

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function resolveOrgPageTypeId(
  category: string | undefined,
  entityType: string | undefined,
): string | null {
  if (entityType === 'community') return 'community';
  if (entityType === 'organiser' || entityType === 'organizer') return 'organizer';
  if (category && isOrganisationCommunityCategory(category)) return category;
  if (category) {
    const resolved = findCategory(category);
    if (isOrganisationCommunityCategory(resolved.id)) return resolved.id;
  }
  return null;
}

export function HostspaceCreateHub() {
  const params = useLocalSearchParams<{
    category?: string | string[];
    intent?: string | string[];
    draftId?: string | string[];
    pageId?: string | string[];
    entityType?: string | string[];
    template?: string | string[];
    redirectTo?: string | string[];
    redirect?: string | string[];
  }>();

  const category = firstParam(params.category);
  const intent = firstParam(params.intent);
  const draftId = firstParam(params.draftId);
  const pageId = firstParam(params.pageId);
  const entityTypeRaw = firstParam(params.entityType);
  const entityType = NON_ORG_PAGE_ENTITY_TYPES.includes(entityTypeRaw as HostEntityType)
    ? (entityTypeRaw as PageEntityType)
    : undefined;
  const templateId = firstParam(params.template) as HostPageTemplateId | undefined;
  const redirectTo = sanitizeInternalRedirect(params.redirectTo ?? params.redirect);
  const destinationLabel = labelForOnboardingDestination(redirectTo);

  const orgPageTypeId = resolveOrgPageTypeId(category, entityTypeRaw);

  useEffect(() => {
    if (!orgPageTypeId) return;
    router.replace({
      pathname: HOSTSPACE_CREATE_PAGE_PATHNAME,
      params: {
        type: orgPageTypeId,
        ...(draftId ? { draftId } : {}),
        ...(pageId ? { pageId } : {}),
        ...(templateId ? { template: templateId } : {}),
        ...(intent ? { intent } : {}),
      },
    } as never);
  }, [orgPageTypeId, draftId, intent, pageId, templateId]);

  const handleCancel = useCallback(() => {
    router.replace(HOSTSPACE_CREATE_CATALOG_PATHNAME as never);
  }, []);

  const headTitle = entityType ? `Create Page · ${APP_NAME}` : `Create · ${APP_NAME}`;

  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${SITE_ORIGIN}${HOSTSPACE_PATHNAME}`} />
      </Head>
      {redirectTo && !entityType && !category ? (
        <View style={createStyles.redirectBanner}>
          <OnboardingDestinationBanner redirectTo={redirectTo} variant="step" />
          <LuxeButton
            variant="tonal"
            onPress={() => router.replace(redirectTo as never)}
            rightIcon="arrow-forward"
          >
            {destinationLabel ? `Skip to ${destinationLabel}` : 'Continue to app'}
          </LuxeButton>
        </View>
      ) : null}
      {orgPageTypeId ? null : entityType ? (
        <PageProWizard
          entityType={entityType}
          templateId={templateId}
          draftId={draftId}
          pageId={pageId}
          onCancel={handleCancel}
        />
      ) : category ? (
        <HostspaceCreateShell flow="category" categoryId={category}>
          <HostspaceCreatePanel initialCategory={category} embedded />
        </HostspaceCreateShell>
      ) : (
        <HostspaceCreateShell flow="catalog">
          <HostspaceCreatePanel embedded />
        </HostspaceCreateShell>
      )}
    </>
  );
}

const createStyles = StyleSheet.create({
  redirectBanner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
});