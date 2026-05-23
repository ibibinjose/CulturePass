import { modulesApi } from '@/modules/api';

export function listNotifications() {
  return modulesApi.notifications.list();
}

export function fetchUnreadNotificationCount() {
  return modulesApi.notifications.unreadCount();
}

export function markNotificationRead(id: string) {
  return modulesApi.notifications.markRead(id);
}

export function markAllNotificationsRead() {
  return modulesApi.notifications.markAllRead();
}
