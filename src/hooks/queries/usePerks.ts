import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PerkData } from '@/shared/schema';
import { perkKeys } from './keys';

// ─── List ─────────────────────────────────────────────────────────────────────

export function usePerks(filters?: { city?: string; country?: string; category?: string; q?: string; status?: string; pageSize?: number }) {
  return useQuery<PerkData[]>({
    queryKey: [...perkKeys.lists(), filters ?? {}],
    queryFn: () => api.perks.list(filters),
    staleTime: 1000 * 60 * 10,
  });
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export function usePerk(id: string) {
  return useQuery<PerkData>({
    queryKey: perkKeys.detail(id),
    queryFn: () => api.perks.get(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

// ─── Redeem ───────────────────────────────────────────────────────────────────

export function useRedeemPerk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.perks.redeem(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: perkKeys.detail(id) });
    },
  });
}
