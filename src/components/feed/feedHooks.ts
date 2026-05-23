import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';

export function useDebounced<T extends (...args: Parameters<T>) => void>(fn: T, ms = 600): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  }, [fn, ms]) as T;
}

export function useAuthGate() {
  const { isAuthenticated } = useAuth();
  return useCallback((action: () => void) => {
    if (!isAuthenticated) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/(onboarding)/login');
      return;
    }
    action();
  }, [isAuthenticated]);
}
