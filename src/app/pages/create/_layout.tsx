/**
 * /pages/create — Create a Page + content creation (noindex).
 */
import Head from 'expo-router/head';
import { Stack } from 'expo-router';

import { APP_NAME } from '@/lib/app-meta';

export default function PagesCreateLayout() {
  const title = `Create · ${APP_NAME}`;
  const description = 'Create a Page, events, listings, and communities on CulturePass.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="listing" />
      </Stack>
    </>
  );
}