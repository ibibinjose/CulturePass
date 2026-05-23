import type { ApiRequestFn } from '../client';
import type { User } from '@/shared/schema';

export function createAuthNamespace(request: ApiRequestFn) {
  return {
    me: () => request<User>('GET', 'api/auth/me'),
    register: (payload: {
      displayName?: string;
      username?: string;
      city?: string;
      state?: string;
      postcode?: number;
      country?: string;
      role?: 'user' | 'organizer';
    }) => request<User>('POST', 'api/auth/register', payload),
  };
}
