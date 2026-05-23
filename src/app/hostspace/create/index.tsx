import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import Head from 'expo-router/head';
import { useQuery } from '@tanstack/react-query';

import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { HostspaceAccessGate } from '@/modules/host/components/HostspaceAccessGate';
import { HostspaceCreateWorkspace } from '@/modules/host/components/HostspaceCreateWorkspace';
import { EntityTypeSelector, type EntityType } from '@/modules/host/components/EntityTypeSelector';
import { APP_NAME, SITE_ORIGIN } from '@/lib/app-meta';
import { useAuth } from '@/lib/auth';
import { modulesApi } from '@/modules/api';

const HOSTSPACE_CREATE_HEAD_TITLE = `HostSpace Creation Lab · ${APP_NAME}`;
const HOSTSPACE_CREATE_HEAD_DESC =
  'Create events, communities, and listings in the CulturePass host workspace.';
const HOSTSPACE_CREATE_HEAD_URL = `${SITE_ORIGIN}/hostspace/create`;

export default function HostspaceCreateIndex() {
  const { category } = useLocalSearchParams<{ category?: string | string[] }>();
  const raw = Array.isArray(category) ? category[0] : category;
  const { user } = useAuth();
  const [showEntitySelector, setShowEntitySelector] = useState(!raw);

  // Fetch existing profiles to show which entity types are already created
  const { data: myProfiles = [] } = useQuery({
    queryKey: ['hostspace-my-profiles'],
    queryFn: () => modulesApi.profiles.my(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const handleEntityTypeSelect = (entityType: EntityType) => {
    // Navigate to the wizard for the selected entity type
    // For now, we'll route to the existing create workspace with the entity type as category
    router.push(`/hostspace/create?category=${entityType}` as never);
    setShowEntitySelector(false);
  };

  return (
    <>
      <Head>
        <title>{HOSTSPACE_CREATE_HEAD_TITLE}</title>
        <meta name="description" content={HOSTSPACE_CREATE_HEAD_DESC} />
        <meta property="og:title" content={HOSTSPACE_CREATE_HEAD_TITLE} />
        <meta property="og:description" content={HOSTSPACE_CREATE_HEAD_DESC} />
        <meta property="og:url" content={HOSTSPACE_CREATE_HEAD_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={HOSTSPACE_CREATE_HEAD_URL} />
      </Head>
      <ErrorBoundary
        onError={(error, stackTrace) => {
          console.error('Hostspace create route failed', error, stackTrace);
        }}
      >
        <HostspaceAccessGate intent="creationLab">
          {showEntitySelector ? (
            <EntityTypeSelector
              onSelect={handleEntityTypeSelect}
              existingProfiles={myProfiles}
            />
          ) : (
            <HostspaceCreateWorkspace initialCategory={raw} />
          )}
        </HostspaceAccessGate>
      </ErrorBoundary>
    </>
  );
}
