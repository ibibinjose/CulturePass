import type { User, AdminStats, AuditLog, VerificationTask, CommunityHomeBanner } from '@/shared/schema';
import type { ContentReport, ModerationReportContext } from '@/shared/schema/moderation';
import type { ApiRequestFn } from '../client';

export function createAdminNamespace(request: ApiRequestFn) {
  return {
  stats: () => request<AdminStats & {
    multiOrganizerProfiles?: number;
    activeOrganizers?: number;
    signupTrends?: Array<{ date: string; count: number }>;
    newProfiles30d?: number;
    newEvents30d?: number;
    organizerRoleCounts?: Record<string, number>;
    multiOrganizerCommunities?: number;
    multiOrganizerBusinesses?: number;
  }>('GET', 'api/admin/stats'),

  recomputeDailyStats: () =>
    request<{ ok: boolean; date: string; stats: any }>('POST', 'api/admin/stats/recompute-daily'),
  systemHealth: () =>
    request<{
      generatedAt: string;
      checks: {
        id: string;
        name: string;
        status: 'operational' | 'degraded';
        healthy: boolean;
        metric?: number;
        detail: string;
      }[];
    }>('GET', 'api/admin/system/health'),
  complianceSummary: () =>
    request<{
      pendingReports: number;
      resolvedReports: number;
      auditLogs: number;
      generatedAt: string;
      requests: {
        id: string;
        user: string;
        type: string;
        status: string;
        date: string;
        count: number;
      }[];
    }>('GET', 'api/admin/compliance/summary'),
  auditLogs: (params?: { limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<{ logs: AuditLog[] }>('GET', `api/admin/audit-logs${q ? `?${q}` : ''}`);
  },
  reports: (params?: { status?: 'pending' | 'resolved' | 'dismissed' | 'all'; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<{ reports: ContentReport[] }>('GET', `api/admin/reports${q ? `?${q}` : ''}`);
  },
  reportContext: (id: string) =>
    request<ModerationReportContext>('GET', `api/admin/reports/${encodeURIComponent(id)}/context`),
  resolveReport: (id: string, action: 'resolved' | 'dismissed' | 'keep_content' | 'remove_item' | 'ban_user') =>
    request<{ ok: boolean; status: 'resolved' | 'dismissed' }>('POST', `api/admin/reports/${id}/resolve`, { action }),

  patchUser: (id: string, data: Partial<User> & { status?: 'active' | 'suspended' }) =>
    request<{ ok: boolean }>('PATCH', `api/admin/users/${encodeURIComponent(id)}`, data),

  runGeohashBackfill: (body?: { forceGeoHash?: boolean; overwriteCoordinates?: boolean; limit?: number }) =>
    request<{ ok: boolean; result: unknown }>('POST', 'api/admin/jobs/geohash-backfill', body ?? {}),
  financeTransactions: (params?: { limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return request<{
      transactions: {
        id: string;
        userId: string;
        eventId: string;
        eventTitle: string;
        amountCents: number;
        paymentStatus: string;
        status: string;
        createdAt: string;
      }[];
    }>('GET', `api/admin/finance/transactions${q ? `?${q}` : ''}`);
  },
  financeConfig: () =>
    request<{
      feeBps: number;
      minimumPayoutThresholdCents: number;
      reserveRateBps: number;
      autoPayoutsEnabled: boolean;
      updatedAt?: string;
      updatedBy?: string | null;
    }>('GET', 'api/admin/finance/config'),
  updateFinanceConfig: (payload: {
    feeBps?: number;
    minimumPayoutThresholdCents?: number;
    reserveRateBps?: number;
    autoPayoutsEnabled?: boolean;
  }) => request<{ ok: boolean }>('PUT', 'api/admin/finance/config', payload),
  discoveryConfig: () =>
    request<{
      trendingMultiplier: number;
      socialProofGate: number;
      featuredCityIds: string[];
      heroSlides: { id: string; title: string; city: string; status: 'active' | 'scheduled' | 'paused'; image: string }[];
      updatedAt?: string;
      updatedBy?: string | null;
    }>('GET', 'api/admin/discovery/config'),
  updateDiscoveryConfig: (payload: {
    trendingMultiplier?: number;
    socialProofGate?: number;
    featuredCityIds?: string[];
    heroSlides?: { id: string; title: string; city: string; status: 'active' | 'scheduled' | 'paused'; image: string }[];
  }) => request<{ ok: boolean }>('PUT', 'api/admin/discovery/config', payload),
  platformConfig: () =>
    request<{
      maintenanceMode: boolean;
      readOnlyMode: boolean;
      feeBps: number;
      minimumPayoutThresholdCents: number;
    }>('GET', 'api/admin/platform/config'),
  updatePlatformConfig: (payload: {
    maintenanceMode?: boolean;
    readOnlyMode?: boolean;
    feeBps?: number;
    minimumPayoutThresholdCents?: number;
  }) => request<{ ok: boolean }>('PUT', 'api/admin/platform/config', payload),

  // Promo codes
  listPromoCodes: () =>
    request<{
      codes: {
        id: string;
        code: string;
        type: 'free_plus';
        durationDays: number;
        maxUses: number | null;
        usedCount: number;
        isActive: boolean;
        expiresAt: string | null;
        note: string;
        createdBy: string;
        createdAt: string;
      }[];
    }>('GET', 'api/admin/promo-codes'),
  createPromoCode: (data: {
    code: string;
    type: 'free_plus';
    durationDays: number;
    maxUses: number | null;
    expiresAt: string | null;
    note: string;
  }) => request<{ id: string; code: string }>('POST', 'api/admin/promo-codes', data),
  togglePromoCode: (id: string, isActive: boolean) =>
    request<{ ok: boolean }>('PATCH', `api/admin/promo-codes/${id}`, { isActive }),

  // Grant Plus directly to a user
  grantMembership: (userId: string, durationDays: number, note?: string) =>
    request<{ success: boolean; expiresAt: string }>('POST', 'api/membership/admin-grant', { userId, durationDays, note }),

  // Verification workflow
  verificationTasks: (params?: { status?: string; entityType?: string; assignedTo?: string; overdueSla?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.assignedTo) qs.set('assignedTo', params.assignedTo);
    if (params?.overdueSla) qs.set('overdueSla', 'true');
    const q = qs.toString();
    return request<{ tasks: VerificationTask[] }>('GET', `api/admin/verification/tasks${q ? `?${q}` : ''}`);
  },
  verificationTask: (taskId: string) =>
    request<VerificationTask>('GET', `api/admin/verification/tasks/${taskId}`),
  verificationStats: () =>
    request<{
      pending: number;
      inReview: number;
      approved: number;
      rejected: number;
      moreInfoNeeded: number;
      overdueSla: number;
    }>('GET', 'api/admin/verification/stats'),
  approveVerification: (taskId: string, adminNotes?: string) =>
    request<{ ok: boolean }>('POST', `api/admin/verification/tasks/${taskId}/approve`, { adminNotes }),
  rejectVerification: (taskId: string, rejectionReason: string, adminNotes?: string) =>
    request<{ ok: boolean }>('POST', `api/admin/verification/tasks/${taskId}/reject`, { rejectionReason, adminNotes }),
  requestMoreInfo: (taskId: string, requestMessage: string) =>
    request<{ ok: boolean }>('POST', `api/admin/verification/tasks/${taskId}/request-info`, { requestMessage }),
  assignVerification: (taskId: string, adminId: string) =>
    request<{ ok: boolean }>('POST', `api/admin/verification/tasks/${taskId}/assign`, { adminId }),
  updateVerificationChecklist: (taskId: string, checklist: { item: string; checked: boolean; notes?: string }[]) =>
    request<{ ok: boolean }>('PUT', `api/admin/verification/tasks/${taskId}/checklist`, { checklist }),

  communityHomeBanners: () =>
    request<{ banners: CommunityHomeBanner[] }>('GET', 'api/admin/community-home-banners'),
  createCommunityHomeBanner: (data: {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaRoute?: string;
    imageUrl?: string;
  }) => request<{ banner: CommunityHomeBanner }>('POST', 'api/admin/community-home-banners', data),
  updateCommunityHomeBanner: (
    id: string,
    data: Partial<{ title: string; subtitle: string; ctaLabel: string; ctaRoute: string; imageUrl: string }>,
  ) => request<{ banner: CommunityHomeBanner }>('PUT', `api/admin/community-home-banners/${encodeURIComponent(id)}`, data),
  publishCommunityHomeBanner: (id: string) =>
    request<{ banner: CommunityHomeBanner }>('POST', `api/admin/community-home-banners/${encodeURIComponent(id)}/publish`),
  triggerCommunityHomeBanner: (id: string) =>
    request<{ banner: CommunityHomeBanner }>('POST', `api/admin/community-home-banners/${encodeURIComponent(id)}/trigger`),
  deleteCommunityHomeBanner: (id: string) =>
    request<{ ok: boolean }>('DELETE', `api/admin/community-home-banners/${encodeURIComponent(id)}`),
  };
}
