import { useCallback, useRef, useState } from 'react';
import { queryClient } from '@/lib/query-client';

type RefreshHandlers = {
  refetch: () => Promise<unknown>;
};

export function useDiscoverUIState() {
  const [refreshing, setRefreshing] = useState(false);
  const discoverViewedRef = useRef(false);

  const handleRefresh = useCallback(async ({ refetch }: RefreshHandlers) => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['/api/events'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/cities/featured'] }),
      refetch(),
    ]);
    setRefreshing(false);
  }, []);

  return {
    refreshing,
    discoverViewedRef,
    handleRefresh,
  };
}
