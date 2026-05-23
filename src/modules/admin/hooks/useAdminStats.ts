import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { adminKeys } from '@/hooks/queries/keys';

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => api.admin.stats(),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAuditLogs(limit = 50) {
  return useQuery({
    queryKey: adminKeys.auditLogs({ limit }),
    queryFn: () => api.admin.auditLogs({ limit }),
  });
}
