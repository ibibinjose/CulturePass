/**
 * HostSpace create catalog — rendered on /hostspace/create (and legacy query params on /hostspace).
 */
import React, { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';

import { HostspaceCreatePanel } from '@/modules/host/components/HostspaceCreatePanel';
import { CreatePageSelector, type PageEntityType } from '@/modules/host/screens/CreatePageSelector';
import { PageProWizard } from '@/modules/host/screens/PageProWizard';
import type { HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import {
  buildHostspaceCreateHref,
  HOSTSPACE_CREATE_CATALOG_PATHNAME,
  HOSTSPACE_PATHNAME,
} from '@/constants/navigation/createNav';
import { navigateToPageProEntity } from '@/lib/creationRouting';
import { sanitizeInternalRedirect } from '@/lib/routes';
import { labelForOnboardingDestination } from '@/lib/onboardingDestination';
import { OnboardingDestinationBanner } from '@/components/onboarding/OnboardingDestinationBanner';
import { HostspaceCreateShell } from '@/components/hostspace/HostspaceCreateShell';
import { LuxeButton } from '@/design-system/ui';

const PAGE_ENTITY_TYPES: HostEntityType[] = [
  'community',
  'organiser',
  'organizer',
  'venue',
  'business',
  'artist',
  'professional',
];

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
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
  const entityType = PAGE_ENTITY_TYPES.includes(entityTypeRaw as HostEntityType)
    ? (entityTypeRaw as PageEntityType)
    : undefined;
  const templateId = firstParam(params.template) as HostPageTemplateId | undefined;
  const redirectTo = sanitizeInternalRedirect(params.redirectTo ?? params.redirect);
  const destinationLabel = labelForOnboardingDestination(redirectTo);

  const { user } = useAuth();

  const { data: myPages = [] } = useQuery({
    queryKey: ['host-pages-my'],
    queryFn: () => modulesApi.hostPages.my(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: myProfiles = [] } = useQuery({
    queryKey: ['hostspace-my-profiles'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const handlePageSelect = useCallback(
    (type: PageEntityType, template?: string) => {
      navigateToPageProEntity(type, 'create_page_selector', {
        templateId: template,
        intent,
        replace: true,
      });
    },
    [intent],
  );

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
      {entityType ? (
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
          <CreatePageSelector
            onSelect={handlePageSelect}
            existingPages={myPages}
            existingProfiles={myProfiles}
            intent={intent}
            embedded
          />
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