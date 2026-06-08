import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveLegacyHostspaceCreateHref } from '@/constants/navigation/createNav';

/** Legacy `/hostspace/create/:category` → `/pages/create?category=…`. */
export default function LegacyHostspaceCreateCategoryRedirect() {
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const raw = Array.isArray(params.category) ? params.category[0] : params.category;
  const href = resolveLegacyHostspaceCreateHref(params, raw);
  return <Redirect href={href as never} />;
}