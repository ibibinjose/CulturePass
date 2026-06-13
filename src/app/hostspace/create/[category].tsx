import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveCreateLabHref } from '@/constants/navigation/createNav';

/** Path-style `/hostspace/create/:category` → `/hostspace/:category/create`. */
export default function HostspaceCreateCategoryRedirect() {
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const raw = Array.isArray(params.category) ? params.category[0] : params.category;
  const href = resolveCreateLabHref(params, raw);
  return <Redirect href={href as never} />;
}