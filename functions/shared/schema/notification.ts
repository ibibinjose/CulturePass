export type NotificationType =
  | 'recommendation'
  | 'system'
  | 'event'
  | 'perk'
  | 'community'
  | 'payment'
  | 'follow'
  | 'review'
  | 'ticket'
  | 'membership'
  | 'badge'
  | 'update';

export type NotificationEntityType =
  | 'event'
  | 'community'
  | 'profile'
  | 'ticket'
  | 'perk'
  | 'user'
  | 'update';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  entityType?: NotificationEntityType | string;
  entityId?: string;
  /** Internal app route for deep-linking, e.g. "/event/abc123" */
  actionUrl?: string;
  /** Thumbnail image URL for the related entity */
  imageUrl?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
