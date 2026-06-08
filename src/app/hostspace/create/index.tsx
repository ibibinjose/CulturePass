import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveLegacyHostspaceCreateHref } from '@/constants/navigation/createNav';

/** Legacy `/hostspace/create` → canonical `/pages/create`. */
export default function LegacyHostspaceCreateIndexRedirect() {
  const params = useLocalSearchParams();
  const href = resolveLegacyHostspaceCreateHref(params);
  return <Redirect href={href as never} />;
}