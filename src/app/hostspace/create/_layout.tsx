/**
 * Nested stack + web metadata for /hostspace/create/* (creator tools — avoid indexing thin drafts).
 */
import Head from 'expo-router/head';
import { Stack } from 'expo-router';

import { APP_NAME } from '@/lib/app-meta';

export default function HostspaceCreateLayout() {
  const title = `Host workspace · Create · ${APP_NAME}`;
  const description =
    'Create listings, events, and communities on CulturePass. Sign in as a host to access this workspace.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[category]" />
        <Stack.Screen name="listing" />
      </Stack>
    </>
  );
}
