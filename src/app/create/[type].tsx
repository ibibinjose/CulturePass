import { Redirect } from 'expo-router';

import { resolveLegacyCreateRedirect } from '@/constants/navigation/createNav';
import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

/**
 * Legacy `/create/:type` — resolves to the Creation Lab, event wizard, listing wizard, or CultureMarket lab.
 */
export default function CreateTypeRedirect() {
  const params = useRouteParams();
  const type = firstRouteParam(params.type);
  const dest = resolveLegacyCreateRedirect(type, params);
  return <Redirect href={dest as never} />;
}