/**
 * /hostspace/create/page — unified Create a Page form with category dropdown.
 */
import { useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { OrganisationCommunityCreateForm } from '@/modules/host/components/OrganisationCommunityCreateForm';
import { HostspaceCreateShell } from '@/components/hostspace/HostspaceCreateShell';
import {
  buildHostspaceCreateHref,
  HOSTSPACE_CREATE_PAGE_PATHNAME,
} from '@/constants/navigation/createNav';
import { resolveOrganisationPageTypeId } from '@/modules/host/config/organisationCommunityTypes.config';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import type { HostPageTemplateId } from '@/shared/schema';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function HostspaceCreatePageScreen() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    category?: string | string[];
    entityType?: string | string[];
    profileType?: string | string[];
    pageType?: string | string[];
    template?: string | string[];
    draftId?: string | string[];
    pageId?: string | string[];
    intent?: string | string[];
  }>();

  const initialTypeId = resolveOrganisationPageTypeId({
    type: firstParam(params.type),
    category: firstParam(params.category),
    entityType: firstParam(params.entityType) ?? firstParam(params.profileType) ?? firstParam(params.pageType),
  });
  const templateId = firstParam(params.template) as HostPageTemplateId | undefined;
  const draftId = firstParam(params.draftId);
  const pageId = firstParam(params.pageId);

  const handleCancel = useCallback(() => {
    router.replace(buildHostspaceCreateHref() as never);
  }, []);

  return (
    <HostspaceAccessGate intent="creationLab">
      <Head>
        <title>Create a Page · {APP_NAME}</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${SITE_ORIGIN}${HOSTSPACE_CREATE_PAGE_PATHNAME}`} />
      </Head>
      <HostspaceCreateShell flow="category" categoryId="organisation-community">
        <OrganisationCommunityCreateForm
          initialTypeId={initialTypeId}
          draftId={draftId}
          pageId={pageId}
          templateId={templateId}
          onCancel={handleCancel}
          embeddedInShell
          showHero={false}
        />
      </HostspaceCreateShell>
    </HostspaceAccessGate>
  );
}