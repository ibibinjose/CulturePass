import type { ApiRequestFn } from '../client';
import type { Notification, NotificationType } from '@/shared/schema';

export function createNotificationsNamespace(request: ApiRequestFn) {
  return {
    list: () => request<Notification[]>('GET', 'api/notifications'),

    unreadCount: () => request<{ count: number }>('GET', 'api/notifications/unread-count'),

    markRead: (notificationId: string) =>
      request<{ success: boolean }>('PUT', `api/notifications/${notificationId}/read`),

    markAllRead: () => request<{ success: boolean }>('POST', 'api/notifications/mark-all-read'),

    delete: (id: string) => request<{ success: boolean }>('DELETE', `api/notifications/${id}`),

    deleteAll: () => request<{ success: boolean; deleted?: number }>('DELETE', 'api/notifications'),

    registerToken: (payload: { userId: string; token: string; platform: string }) =>
      request<{ ok: boolean }>('POST', 'api/notifications/register-token', payload),

    approvalStatus: (payload: { approvalToken: string }) =>
      request<{ valid: boolean; expiresAt?: string; remainingMs: number }>(
        'POST',
        'api/notifications/approval-status',
        payload,
      ),

    targeted: (payload: {
      title: string;
      message: string;
      type?: NotificationType;
      idempotencyKey?: string;
      approvalToken?: string;
      city?: string;
      country?: string;
      interestsAny?: string[];
      communitiesAny?: string[];
      languagesAny?: string[];
      categoryIdsAny?: string[];
      ethnicityContains?: string;
      dryRun?: boolean;
      limit?: number;
      metadata?: Record<string, unknown>;
    }) =>
      request<{
        dryRun: boolean;
        targetedCount: number;
        audiencePreview: { userId: string; city: string; country: string }[];
        idempotentReplay?: boolean;
        approvalToken?: string;
        approvalExpiresAt?: string;
      }>('POST', 'api/notifications/targeted', payload),
  };
}
