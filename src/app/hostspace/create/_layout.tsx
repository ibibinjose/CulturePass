/**
 * /hostspace/create/* — HostSpace Creation Lab (noindex).
 */
import Head from 'expo-router/head';
import { Stack } from 'expo-router';

import { APP_NAME } from '@/lib/app-meta';

export default function HostspaceCreateLayout() {
  return (
    <>
      <Head>
        <title>{`Create · ${APP_NAME}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="page" />
        <Stack.Screen name="[category]" />
        <Stack.Screen name="listing" />
      </Stack>
    </>
  );
}