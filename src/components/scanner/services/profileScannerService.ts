import { api } from '@/lib/api';

export function followScannedUser(userId: string) {
  return api.social.follow('user', userId);
}
