import { Redirect } from 'expo-router';

import { resolveLegacyPagesCreateHref } from '@/constants/navigation/createNav';
import { useRouteParams } from '@/lib/routeParams';

/** Legacy `/pages/create` → `/hostspace/create`. */
export default function LegacyPagesCreateIndexRedirect() {
  const params = useRouteParams();
  const href = resolveLegacyPagesCreateHref(params);
  return <Redirect href={href as never} />;
}