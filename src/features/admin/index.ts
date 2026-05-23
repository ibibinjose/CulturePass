import { api } from '@/lib/api';

export async function getAdminFeatureSnapshot() {
  const [stats, audit] = await Promise.all([
    api.admin.stats(),
    api.admin.auditLogs({ limit: 20 }),
  ]);
  return { stats, audit };
}
