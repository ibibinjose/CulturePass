/**
 * /hostspace/event/create/[id] — edit event by path id.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function HostspaceEventEditRedirect() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    publisherProfileId?: string | string[];
  }>();
  const editId = firstParam(params.id);
  const publisherProfileId = firstParam(params.publisherProfileId);

  return (
    <Redirect
      href={{
        pathname: '/hostspace/event/create',
        params: {
          ...(editId ? { editId } : {}),
          ...(publisherProfileId ? { publisherProfileId } : {}),
        },
      }}
    />
  );
}