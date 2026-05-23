import type { ApiRequestFn } from '../client';
import type { User } from '@/shared/schema';

export function createUsersNamespace(request: ApiRequestFn) {
  return {
    me: () => request<User>('GET', 'api/users/me'),

    list: () => request<User[]>('GET', 'api/users'),

    get: (id: string) => request<User>('GET', `api/users/${id}`),

    getByHandle: (handle: string) =>
      request<User>('GET', `api/users/handle/${encodeURIComponent(handle)}`),

    update: (id: string, data: Partial<User>) => request<User>('PUT', `api/users/${id}`, data),
  };
}
