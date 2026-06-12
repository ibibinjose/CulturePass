/**
 * /hostspace/[category]/create — resolves catalog category to the correct wizard.
 */
import React, { useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { HostspaceCreatePanel } from '@/modules/host/components/HostspaceCreatePanel';
import { HostspaceCreateShell } from '@/components/hostspace/HostspaceCreateShell';
import { PageProWizard } from '@/modules/host/screens/PageProWizard';
import type { PageEntityType } from '@/modules/host/screens/CreatePageSelector';
import type { HostPageTemplateId } from '@/shared/schema';
import ListingCreateScreen from '@/app/(domain)/listing/create';
import { findCategory, getCategoryDataflow } from '@/modules/host/config/hostspaceCreateCategories.config';
import { buildHostspaceCreateHref, hostspaceCategoryCreatePath } from '@/constants/navigation/createNav';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function toPageEntityType(entityType: string): PageEntityType {
  if (entityType === 'organizer' || entityType === 'organiser') return 'organiser';
  return entityType as PageEntityType;
}

export function HostspaceCategoryCreateScreen() {
  const params = useLocalSearchParams<{
    category?: string | string[];
    template?: string | string[];
    draftId?: string | string[];
    pageId?: string | string[];
    intent?: string | string[];
    editId?: string | string[];
    publisherProfileId?: string | string[];
    id?: string | string[];
  }>();

  const categoryRaw = firstParam(params.category);
  const category = findCategory(categoryRaw);
  const flow = getCategoryDataflow(category);
  const editId = firstParam(params.editId) ?? firstParam(params.id);
  const templateId = firstParam(params.template) as HostPageTemplateId | undefined;
  const draftId = firstParam(params.draftId);
  const pageId = firstParam(params.pageId);
  const intent = firstParam(params.intent);

  const handleCancel = useCallback(() => {
    router.replace(buildHostspaceCreateHref() as never);
  }, []);

  const canonicalPath = hostspaceCategoryCreatePath(category.id);
  const headTitle = `Create ${category.label} · ${APP_NAME}`;
  const publisherProfileId = firstParam(params.publisherProfileId);

  useEffect(() => {
    if (category.id === 'event') {
      router.replace({
        pathname: '/hostspace/event/create',
        params: {
          ...(editId ? { editId } : {}),
          ...(publisherProfileId ? { publisherProfileId } : {}),
        },
      } as never);
      return;
    }
    if (flow.wizard === 'culture-market') {
      router.replace('/hostspace/listing' as never);
    }
  }, [category.id, editId, flow.wizard, publisherProfileId]);

  if (category.id === 'event' || flow.wizard === 'culture-market') {
    return null;
  }

  if (flow.wizard === 'page-pro') {
    return (
      <>
        <Head>
          <title>{headTitle}</title>
          <meta name="robots" content="noindex" />
          <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
        </Head>
        <PageProWizard
          entityType={toPageEntityType(category.entityType)}
          templateId={templateId}
          draftId={draftId}
          pageId={pageId}
          onCancel={handleCancel}
        />
      </>
    );
  }

  if (flow.wizard === 'listing') {
    return (
      <>
        <Head>
          <title>{headTitle}</title>
          <meta name="robots" content="noindex" />
          <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
        </Head>
        <ListingCreateScreen seedCategoryId={category.id} />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${SITE_ORIGIN}${canonicalPath}`} />
      </Head>
      <HostspaceCreateShell flow="category" categoryId={category.id}>
        <HostspaceCreatePanel initialCategory={category.id} embedded />
      </HostspaceCreateShell>
    </>
  );
}