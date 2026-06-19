/**
 * /hostspace/[category]/create — resolves catalog category to the correct wizard.
 */
import React, { useCallback } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { HostspaceCreatePanel } from '@/modules/host/components/HostspaceCreatePanel';
import { HostspaceCreateShell } from '@/components/hostspace/HostspaceCreateShell';
import { PageProWizard } from '@/modules/host/screens/PageProWizard';
import type { PageEntityType } from '@/modules/host/screens/CreatePageSelector';
import type { HostPageTemplateId } from '@/shared/schema';
import ListingCreateScreen from '@/app/(domain)/listing/create';
import { findCategory, getCategoryDataflow } from '@/modules/host/config/hostspaceCreateCategories.config';
import { isOrganisationCommunityCategory } from '@/modules/host/config/organisationCommunityTypes.config';
import {
  buildHostspaceCreateHref,
  hostspaceCategoryCreatePath,
  HOSTSPACE_CREATE_PAGE_PATHNAME,
} from '@/constants/navigation/createNav';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function toPageEntityType(entityType: string): PageEntityType {
  if (entityType === 'organizer' || entityType === 'organiser') return 'organiser';
  return entityType as PageEntityType;
}

function orgUnifiedCreateHref(
  categoryId: string,
  opts: {
    draftId?: string;
    pageId?: string;
    templateId?: string;
    intent?: string;
  },
): string {
  const type = categoryId === 'organisation-community' ? 'community' : categoryId;
  const params = new URLSearchParams();
  params.set('type', type);
  if (opts.draftId) params.set('draftId', opts.draftId);
  if (opts.pageId) params.set('pageId', opts.pageId);
  if (opts.templateId) params.set('template', opts.templateId);
  if (opts.intent) params.set('intent', opts.intent);
  const qs = params.toString();
  return qs ? `${HOSTSPACE_CREATE_PAGE_PATHNAME}?${qs}` : HOSTSPACE_CREATE_PAGE_PATHNAME;
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
  const publisherProfileId = firstParam(params.publisherProfileId);

  const handleCancel = useCallback(() => {
    router.replace(buildHostspaceCreateHref() as never);
  }, []);

  const canonicalPath = hostspaceCategoryCreatePath(category.id);
  const headTitle = `Create ${category.label} · ${APP_NAME}`;

  if (category.id === 'event') {
    const parentPageId = pageId ?? publisherProfileId;
    return (
      <Redirect
        href={{
          pathname: '/hostspace/event/create',
          params: {
            ...(editId ? { editId } : {}),
            ...(parentPageId ? { pageId: parentPageId } : {}),
          },
        }}
      />
    );
  }

  if (category.id === 'organisation-community' || isOrganisationCommunityCategory(category.id)) {
    return (
      <Redirect
        href={orgUnifiedCreateHref(category.id, { draftId, pageId, templateId, intent }) as never}
      />
    );
  }

  if (flow.wizard === 'culture-market') {
    return <Redirect href="/hostspace/listing" />;
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