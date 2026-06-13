/**
 * /hostspace/[category]/create/[id] — edit listing or page by path id.
 */
import { Redirect } from 'expo-router';

import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

export default function HostspaceCategoryEditRedirect() {
  const params = useRouteParams();
  const category = firstRouteParam(params.category);
  const editId = firstRouteParam(params.id);
  const publisherProfileId = firstRouteParam(params.publisherProfileId);

  if (!category) {
    return <Redirect href="/hostspace/create" />;
  }

  return (
    <Redirect
      href={{
        pathname: `/hostspace/${category}/create`,
        params: {
          ...(editId ? { editId } : {}),
          ...(publisherProfileId ? { publisherProfileId } : {}),
        },
      }}
    />
  );
}