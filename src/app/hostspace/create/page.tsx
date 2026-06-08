import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveLegacyHostspaceCreateHref } from '@/constants/navigation/createNav';

/** Legacy `/hostspace/create/page` → `/pages/create?entityType=…`. */
export default function LegacyHostspaceCreatePageRedirect() {
  const params = useLocalSearchParams();
  const href = resolveLegacyHostspaceCreateHref(params);
  return <Redirect href={href as never} />;
}