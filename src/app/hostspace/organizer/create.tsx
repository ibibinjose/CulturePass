import { Redirect } from 'expo-router';

import { HOSTSPACE_CREATE_PAGE_PATHNAME } from '@/constants/navigation/createNav';
import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

/** Legacy deep link — unified org form at /hostspace/create/page?type=organizer */
export default function OrganizerCreateRedirect() {
  const params = useRouteParams();
  const q = new URLSearchParams();
  q.set('type', firstRouteParam(params.type) ?? firstRouteParam(params.category) ?? 'organizer');
  for (const key of ['draftId', 'pageId', 'template', 'intent', 'entityType'] as const) {
    const v = firstRouteParam(params[key]);
    if (v) q.set(key, v);
  }
  const suffix = q.toString();
  const href = suffix ? `${HOSTSPACE_CREATE_PAGE_PATHNAME}?${suffix}` : HOSTSPACE_CREATE_PAGE_PATHNAME;
  return <Redirect href={href as never} />;
}