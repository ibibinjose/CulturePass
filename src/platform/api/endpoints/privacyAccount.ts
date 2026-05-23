import type { ApiRequestFn } from '../client';
import type { PrivacySettings } from '@/shared/schema';

export function createPrivacyNamespace(request: ApiRequestFn) {
  return {
    get: () => request<PrivacySettings>('GET', 'api/privacy/settings'),
    update: (data: Partial<PrivacySettings>) =>
      request<PrivacySettings>('PUT', 'api/privacy/settings', data),
  };
}

export function createAccountNamespace(request: ApiRequestFn) {
  return {
    delete: (userId: string) =>
      request<{ ok: boolean; userId: string }>('DELETE', `api/account/${encodeURIComponent(userId)}`),
  };
}
