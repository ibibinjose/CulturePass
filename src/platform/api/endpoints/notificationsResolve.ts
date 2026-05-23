import type { ApiRequestFn } from '../client';

export interface NotificationResolution {
  route: string;
  params?: Record<string, string>;
  title?: string;
  entityType?: string;
  entityId?: string;
}

export function createNotificationsResolveNamespace(request: ApiRequestFn) {
  return {
    /** Resolve notification payload to a navigation route */
    resolve: (notifId: string, payload?: Record<string, unknown>) =>
      request<NotificationResolution>('POST', 'api/notifications/resolve', {
        notifId,
        ...payload,
      }),
  };
}
