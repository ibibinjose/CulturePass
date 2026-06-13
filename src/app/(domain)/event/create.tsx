import { Redirect } from 'expo-router';

import { EVENT_WIZARD_PATHNAME } from '@/constants/navigation/createNav';
import { firstRouteParam, useRouteParams } from '@/lib/routeParams';

/** Legacy `/event/create` → `/hostspace/event/create`. */
export default function LegacyEventCreateRedirect() {
  const params = useRouteParams();

  const editId = firstRouteParam(params.editId) ?? firstRouteParam(params.id);
  const publisherProfileId = firstRouteParam(params.publisherProfileId);

  return (
    <Redirect
      href={{
        pathname: EVENT_WIZARD_PATHNAME,
        params: {
          ...(editId ? { editId } : {}),
          ...(publisherProfileId ? { publisherProfileId } : {}),
        },
      }}
    />
  );
}