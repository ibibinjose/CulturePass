/**
 * /pages/create — unified Create a Page selector, Page Pro Wizard, and content lab.
 */
import React, { useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceCreateWorkspace } from '@/modules/host/components/HostspaceCreateWorkspace';
import { CreatePageSelector, type PageEntityType } from '@/modules/host/screens/CreatePageSelector';
import { PageProWizard } from '@/modules/host/screens/PageProWizard';
import type { HostPageTemplateId } from '@/shared/schema';
import type { HostEntityType } from '@/shared/schema/hostTypes';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';
import { CREATE_LAB_PATHNAME } from '@/constants/navigation/createNav';
import { navigateToPageProEntity } from '@/lib/creationRouting';

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

export default function PagesCreateIndex() {
  const params = useLocalSearchParams<{
    category?: string | string[];
    intent?: string | string[];
    draftId?: string | string[];
    pageId?: string | string[];
    entityType?: string | string[];
    template?: string | string[];
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
    router.replace(CREATE_LAB_PATHNAME as never);
  }, []);

  const headTitle = entityType ? `Create Page · ${APP_NAME}` : `Create · ${APP_NAME}`;

  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${SITE_ORIGIN}${CREATE_LAB_PATHNAME}`} />
      </Head>
      <ErrorBoundary>
        <HostspaceAccessGate intent="creationLab">
          {entityType ? (
            <PageProWizard
              entityType={entityType}
              templateId={templateId}
              draftId={draftId}
              pageId={pageId}
              onCancel={handleCancel}
            />
          ) : category ? (
            <HostspaceCreateWorkspace initialCategory={category} />
          ) : (
            <CreatePageSelector
              onSelect={handlePageSelect}
              existingPages={myPages}
              existingProfiles={myProfiles}
              intent={intent}
            />
          )}
        </HostspaceAccessGate>
      </ErrorBoundary>
    </>
  );
}