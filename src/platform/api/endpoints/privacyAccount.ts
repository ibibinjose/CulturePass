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

    /**
     * Initiate a secure email change.
     * Client MUST still perform Firebase Auth re-auth + updateEmail() first for security.
     * This endpoint provides server-side uniqueness validation + canonical Firestore update.
     */
    initiateEmailChange: (newEmail: string) =>
      request<{ ok: boolean; email: string }>('POST', 'api/account/email-change', { newEmail }),

    /** Live username/handle availability check (for settings + signup UX) */
    checkUsernameAvailability: (username: string) =>
      request<{ available: boolean; normalized: string }>(
        'GET',
        `api/account/username-available?username=${encodeURIComponent(username)}`
      ),
  };
}
