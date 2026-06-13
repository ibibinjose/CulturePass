/**
 * /hostspace/create/page — unified Create a Page form with category dropdown.
 */
import { useCallback } from 'react';
import { router } from 'expo-router';
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
import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

export default function HostspaceCreatePageScreen() {
  const params = useRouteParams();

  const initialTypeId = resolveOrganisationPageTypeId({
    type: firstRouteParam(params.type),
    category: firstRouteParam(params.category),
    entityType:
      firstRouteParam(params.entityType) ??
      firstRouteParam(params.profileType) ??
      firstRouteParam(params.pageType),
  });
  const templateId = firstRouteParam(params.template) as HostPageTemplateId | undefined;
  const draftId = firstRouteParam(params.draftId);
  const pageId = firstRouteParam(params.pageId);

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