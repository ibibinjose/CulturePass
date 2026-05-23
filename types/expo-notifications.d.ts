/**
 * Minimal type declarations for expo-notifications.
 * The module is dynamically imported and may not be installed in all environments.
 * These types allow TypeScript to resolve the import without requiring the full package.
 */
declare module 'expo-notifications' {
  export interface PermissionResponse {
    status: string;
    granted: boolean;
    canAskAgain: boolean;
  }

  export interface ExpoPushToken {
    data: string;
    type: string;
  }

  export interface NotificationContent {
    data: Record<string, unknown>;
    title: string | null;
    body: string | null;
  }

  export interface NotificationRequest {
    content: NotificationContent;
  }

  export interface Notification {
    request: NotificationRequest;
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
  }

  export interface Subscription {
    remove: () => void;
  }

  export interface NotificationBehavior {
    shouldShowBanner?: boolean;
    shouldShowList?: boolean;
    shouldPlaySound?: boolean;
    shouldSetBadge?: boolean;
    shouldShowAlert?: boolean;
  }

  export interface NotificationHandler {
    handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
  }

  export interface NotificationContentInput {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    sound?: boolean;
  }

  export type NotificationTriggerInput = Date | null;

  export function getPermissionsAsync(): Promise<PermissionResponse>;
  export function requestPermissionsAsync(): Promise<PermissionResponse>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<ExpoPushToken>;
  export function scheduleNotificationAsync(request: {
    content: NotificationContentInput;
    trigger: NotificationTriggerInput;
  }): Promise<string>;
  export function setNotificationHandler(handler: NotificationHandler): void;
  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void
  ): Subscription;
}
