import type { ApiRequestFn } from '../client';
import type { Waitlist } from '@/shared/schema/waitlist';

export function createWaitlistNamespace(request: ApiRequestFn) {
  return {
    join: (eventId: string, notificationPreference: Waitlist['notificationPreference'] = 'push') =>
      request<{ id: string; position: number }>('POST', `api/events/${eventId}/waitlist`, { notificationPreference }),
    leave: (eventId: string) =>
      request<{ ok: boolean }>('DELETE', `api/events/${eventId}/waitlist`),
    position: (eventId: string) =>
      request<{ position: number | null; total: number; expiresAt: string | null }>(
        'GET',
        `api/events/${eventId}/waitlist/position`,
      ),
    count: (eventId: string) =>
      request<{ count: number }>('GET', `api/events/${eventId}/waitlist/count`),
  };
}
