import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveCreateLabHref } from '@/constants/navigation/createNav';

/** Path-style `/hostspace/create/page` → `/hostspace/create` (forwards entityType query params). */
export default function HostspaceCreatePageRedirect() {
  const params = useLocalSearchParams();
  const href = resolveCreateLabHref(params);
  return <Redirect href={href as never} />;
}