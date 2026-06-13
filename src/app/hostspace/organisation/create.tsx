import { Redirect } from 'expo-router';

import { HOSTSPACE_CREATE_PAGE_PATHNAME } from '@/constants/navigation/createNav';
import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

/** Legacy alias — unified form lives at /hostspace/create/page */
export default function OrganisationCommunityCreateRedirect() {
  const params = useRouteParams();
  const q = new URLSearchParams();
  const type = firstRouteParam(params.type) ?? firstRouteParam(params.category);
  if (type) q.set('type', type);
  for (const key of ['draftId', 'pageId', 'template', 'intent', 'entityType'] as const) {
    const v = firstRouteParam(params[key]);
    if (v) q.set(key, v);
  }
  const suffix = q.toString();
  const href = suffix ? `${HOSTSPACE_CREATE_PAGE_PATHNAME}?${suffix}` : HOSTSPACE_CREATE_PAGE_PATHNAME;
  return <Redirect href={href as never} />;
}