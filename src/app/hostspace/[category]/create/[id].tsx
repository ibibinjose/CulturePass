/**
 * /hostspace/[category]/create/[id] — edit listing or page by path id.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function HostspaceCategoryEditRedirect() {
  const params = useLocalSearchParams<{
    category?: string | string[];
    id?: string | string[];
    publisherProfileId?: string | string[];
  }>();
  const category = firstParam(params.category);
  const editId = firstParam(params.id);
  const publisherProfileId = firstParam(params.publisherProfileId);

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