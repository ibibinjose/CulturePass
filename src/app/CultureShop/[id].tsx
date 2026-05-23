/**
 * Backwards compatibility: marketplace listing details moved from
 * /CultureShop/[id] to /CultureMarket/[id].
 */
import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function CultureShopListingRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  useEffect(() => {
    if (id) {
      router.replace(`/CultureMarket/${id}` as never);
      return;
    }
    router.replace('/CultureMarket' as never);
  }, [id]);

  return null;
}
