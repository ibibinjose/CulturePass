/**
 * /CultureShop/list — redirects to /CultureMarket/list.
 * Kept for backwards-compat with any existing deep links or bookmarks.
 */
import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function ListRedirect() {
  const params = useLocalSearchParams();
  useEffect(() => {
    const edit = params.edit ? `?edit=${params.edit}` : '';
    router.replace(`/CultureMarket/list${edit}` as any);
  }, [params.edit]);
  return null;
}
