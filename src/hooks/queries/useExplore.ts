// hooks/queries/useExplore.ts
import { useQuery } from '@tanstack/react-query';
import { getExploreItems } from '@/lib/firebase/explore';
import { isFirebaseWebClientReady } from '@/lib/config';

export const useExplore = (filters: any) => {
  return useQuery({
    queryKey: ['explore', filters],
    queryFn: () => getExploreItems(filters),
    enabled: isFirebaseWebClientReady(),
    placeholderData: (previousData) => previousData, // Equivalent to keepPreviousData in v5
    staleTime: 1000 * 60 * 10,   // 10 minutes
  });
};
