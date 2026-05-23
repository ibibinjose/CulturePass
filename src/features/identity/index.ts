import { api } from '@/lib/api';

export async function getIdentityFeatureProfile() {
  return api.users.me();
}

export async function updateIdentityFeatureProfile(userId: string, payload: Record<string, unknown>) {
  return api.users.update(userId, payload);
}
