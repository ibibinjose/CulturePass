/**
 * /s/[id] — CultureMarket listing deep link shortcut.
 * Redirects to /CultureMarket/[id].
 */
import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function ShopListingShortlink() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace(`/CultureMarket/${id}` as any);
    } else {
      router.replace('/CultureMarket' as any);
    }
  }, [id]);

  return null;
}
