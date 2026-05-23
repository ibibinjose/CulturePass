/**
 * /CultureMarket/list — redirects to /hostspace/create/listing.
 * Kept for backwards-compat with any existing deep links or bookmarks.
 */
import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function ListRedirect() {
  const params = useLocalSearchParams();
  useEffect(() => {
    const edit = params.edit ? `?edit=${params.edit}` : '';
    router.replace(`/hostspace/create/listing${edit}` as any);
  }, [params.edit]);
  return null;
}
