import { Redirect, useLocalSearchParams } from 'expo-router';

import { EVENT_WIZARD_PATHNAME } from '@/constants/navigation/createNav';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Legacy `/event/create` → `/hostspace/event/create`. */
export default function LegacyEventCreateRedirect() {
  const params = useLocalSearchParams<{
    editId?: string | string[];
    id?: string | string[];
    publisherProfileId?: string | string[];
  }>();

  const editId = firstParam(params.editId) ?? firstParam(params.id);
  const publisherProfileId = firstParam(params.publisherProfileId);

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