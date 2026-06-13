/**
 * /CultureMarket/list — redirects to /hostspace/listing.
 * Kept for backwards-compat with any existing deep links or bookmarks.
 */
import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { CULTURE_MARKET_LISTING_LAB_PATHNAME } from '@/constants/navigation/createNav';

export default function ListRedirect() {
  const params = useLocalSearchParams();
  useEffect(() => {
    const edit = params.edit ? `?edit=${params.edit}` : '';
    router.replace(`${CULTURE_MARKET_LISTING_LAB_PATHNAME}${edit}` as never);
  }, [params.edit]);
  return null;
}