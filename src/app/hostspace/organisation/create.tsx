import { Redirect, useLocalSearchParams } from 'expo-router';

import { HOSTSPACE_CREATE_PAGE_PATHNAME } from '@/constants/navigation/createNav';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Legacy alias — unified form lives at /hostspace/create/page */
export default function OrganisationCommunityCreateRedirect() {
  const params = useLocalSearchParams<Record<string, string | string[] | undefined>>();
  const q = new URLSearchParams();
  const type = firstParam(params.type) ?? firstParam(params.category);
  if (type) q.set('type', type);
  for (const key of ['draftId', 'pageId', 'template', 'intent', 'entityType'] as const) {
    const v = firstParam(params[key]);
    if (v) q.set(key, v);
  }
  const suffix = q.toString();
  const href = suffix ? `${HOSTSPACE_CREATE_PAGE_PATHNAME}?${suffix}` : HOSTSPACE_CREATE_PAGE_PATHNAME;
  return <Redirect href={href as never} />;
}