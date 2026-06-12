import { Redirect, useLocalSearchParams } from 'expo-router';

import { resolveLegacyPagesCreateHref } from '@/constants/navigation/createNav';

/** Legacy `/pages/create` → `/hostspace/create`. */
export default function LegacyPagesCreateIndexRedirect() {
  const params = useLocalSearchParams();
  const href = resolveLegacyPagesCreateHref(params);
  return <Redirect href={href as never} />;
}