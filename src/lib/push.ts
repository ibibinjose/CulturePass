import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { router } from 'expo-router';
import type { Notification, Subscription } from 'expo-notifications';

type NotificationsCompat = typeof Notifications & {
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
    }
  ) => Promise<unknown>;
  AndroidImportance: {
    MAX: number;
  };
  addNotificationReceivedListener: (listener: (notification: Notification) => void) => Subscription;
};

const notificationsCompat = Notifications as NotificationsCompat;

/**
 * Configure how the app handles notifications when it's in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationData {
  screen?: string;
  eventId?: string;
  communityId?: string;
  userId?: string;
  url?: string;
}

function handleNotificationResponse(data: NotificationData) {
  try {
    if (data.screen === 'event' && data.eventId) {
      router.push({ pathname: '/e/[id]', params: { id: data.eventId } });
    } else if (data.screen === 'community' && data.communityId) {
      router.push({ pathname: '/c/[id]', params: { id: data.communityId } });
    } else if (data.screen === 'profile' && data.userId) {
      router.push({ pathname: '/u/[id]', params: { id: data.userId } });
    } else if (data.screen === 'notifications') {
      router.push('/notifications');
    } else if (data.screen === 'tickets') {
      router.push('/tickets');
    } else if (data.screen === 'perks') {
      router.push('/perks');
    } else if (data.url) {
      const url = data.url;
      if (url.startsWith('/') && !url.startsWith('//') && !url.includes('://')) {
        router.push(url as any);
      }
    }
  } catch (err) {
    console.warn('Navigation error in notification handler:', err);
  }
}

/**
 * registerForPushNotificationsAsync
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    const vapidKey = process.env.EXPO_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) return null;
    try {
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { firebaseApp } = await import('./firebase');
      if (!firebaseApp) return null;
      const messaging = getMessaging(firebaseApp);
      const fcmToken = await getToken(messaging, { vapidKey });
      if (fcmToken) {
        try {
          const me = await api.auth.me();
          if (me?.id) await api.users.update(me.id, { pushToken: fcmToken } as any);
        } catch {}
      }
      return fcmToken;
    } catch (e) {
      if (__DEV__) console.warn('[push] Web push registration failed:', e);
      return null;
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      try {
        const me = await api.auth.me();
        if (me?.id) {
          await api.users.update(me.id, { pushToken: token } as any);
        }
      } catch {
        // console.error('Failed to save push token to profile:', err);
      }

    } catch (e) {
      console.error('Error getting push token:', e);
    }
  }

  if (Platform.OS === 'android') {
    await notificationsCompat.setNotificationChannelAsync('default', {
      name: 'default',
      importance: notificationsCompat.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

/**
 * setupNotificationListeners
 */
export function setupNotificationListeners(
  notificationListener: { current: Subscription | null },
  responseListener: { current: Subscription | null }
) {
  notificationListener.current = notificationsCompat.addNotificationReceivedListener((_notification: Notification) => {
    // console.log('Notification Received:', notification);
  });

  responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    handleNotificationResponse(data);
  });

  return () => {
    if (notificationListener.current) {
      notificationListener.current.remove();
    }
    if (responseListener.current) {
      responseListener.current.remove();
    }
  };
}
