/**
 * usePushNotifications — registers the device for push notifications
 * and handles incoming notification responses.
 *
 * Usage (call once near the root of the authenticated app):
 *   usePushNotifications();
 *
 * What it does:
 *   1. Requests notification permissions (iOS prompts; Android 13+ prompts)
 *   2. Gets the Expo push token (FCM on Android, APNs on iOS)
 *   3. Posts the token to the backend for targeting
 *   4. Handles notification taps — deep-links into the relevant screen
 *
 * Requirements:
 *   - expo-notifications in package.json
 *   - "expo-notifications" plugin in app.json
 *   - For Firebase Cloud Messaging: google-services.json (Android) + GoogleService-Info.plist (iOS)
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  resolveNotificationRoute,
  isResolvedRoute,
  type NotificationEntityType,
} from '@/lib/notification-utils';

type NotificationsNS = typeof import('expo-notifications');

/** Static import would split into async Metro chunks — require keeps the module in the main bundle. */
let Notifications: NotificationsNS | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications') as NotificationsNS;
} catch {
  if (__DEV__) {
    console.warn(
      '[push] expo-notifications native module missing. Rebuild the app: npx expo run:ios (or run:android).'
    );
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NotificationData {
  screen?: string;
  eventId?: string;
  communityId?: string;
  userId?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Token registration (async, fire-and-forget from component)
// ---------------------------------------------------------------------------
async function registerPushToken(userId: string): Promise<void> {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push notifications are not supported in Expo Go on Android. Use a development build.');
    return;
  }

  if (!Notifications) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
    const projectId =
      (typeof process.env.EXPO_PUBLIC_EAS_PROJECT_ID === 'string' &&
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID.trim()) ||
      extra?.eas?.projectId;
    if (!projectId) {
      if (__DEV__) {
        console.warn(
          '[push] Missing EAS project id — set EXPO_PUBLIC_EAS_PROJECT_ID or app.json extra.eas.projectId for Expo push tokens.'
        );
      }
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await api.notifications.registerToken({
      userId,
      token: tokenData.data,
      platform: Platform.OS,
    }).catch(() => {});
  } catch {
    // Silently ignore — push notifications are non-critical
  }
}

// ---------------------------------------------------------------------------
// Deep link handler for notification taps
// ---------------------------------------------------------------------------
/** Maps legacy screen strings to NotificationEntityType */
function screenToEntityType(screen: string): NotificationEntityType | null {
  switch (screen) {
    case 'event':     return 'event';
    case 'community': return 'community';
    case 'profile':   return 'profile';
    case 'tickets':   return 'tickets';
    case 'perks':     return 'perks';
    default:          return null;
  }
}

function handleNotificationResponse(data: NotificationData) {
  try {
    const entityId = data.eventId ?? data.communityId ?? data.userId ?? '';
    const entityType = screenToEntityType(data.screen ?? '');

    if (entityType && entityId) {
      const result = resolveNotificationRoute(
        { type: entityType, entityId },
        true,
      );

      if (isResolvedRoute(result)) {
        router.push(result.route as Parameters<typeof router.push>[0]);
        return;
      }
    }

    if (data.screen === 'notifications') {
      router.push('/notifications');
    } else if (data.url) {
      const url = data.url;
      if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
        router.push(url as Parameters<typeof router.push>[0]);
      }
    }
  } catch {
    // Navigation errors are non-critical
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function usePushNotifications() {
  const { userId, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo && Platform.OS === 'android') {
      return;
    }

    registerPushToken(userId);

    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowAlert: true,
      }),
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationResponse(data);
    });

    return () => {
      responseSub.remove();
    };
  }, [userId, isAuthenticated]);
}