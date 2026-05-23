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
  if (Platform.OS === 'web') return;

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo && Platform.OS === 'android') {
    console.warn('Push notifications are not supported in Expo Go on Android. Use a development build.');
    return;
  }

  try {
    // Dynamic import — expo-notifications may not be installed in all environments
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return;

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
      // Use resolveNotificationRoute to get the target screen (Req 15.1, 15.4)
      const result = resolveNotificationRoute(
        { type: entityType, entityId },
        true, // assume entity exists — destination screen handles missing entity
      );

      if (isResolvedRoute(result)) {
        router.push(result.route as Parameters<typeof router.push>[0]);
        return;
      }
    }

    // Fallback: unstructured payload routing
    if (data.screen === 'notifications') {
      router.push('/notifications');
    } else if (data.url) {
      const url = data.url;
      // Only allow internal routes for security
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
    if (!isAuthenticated || !userId || Platform.OS === 'web') return;

    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (isExpoGo && Platform.OS === 'android') {
      return; // Completly bypass push tokens to avoid side-effect crashes in expo-notifications
    }

    // Register token
    registerPushToken(userId);

    // Set up notification handlers
    let cleanupFns: (() => void)[] = [];

    import('expo-notifications').then((Notifications) => {
      // Configure how notifications look when app is in foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowAlert: true,
        }),
      });

      // Handle notification tap (app in background or closed)
      const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationData;
        handleNotificationResponse(data);
      });

      cleanupFns.push(() => responseSub.remove());
    }).catch(() => {});

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [userId, isAuthenticated]);
}
