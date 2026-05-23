import { Platform } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useEventDetailRouteState() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const eventId = typeof id === 'string' ? id : '';
  const topInset = Platform.OS === 'web' ? 0 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 20);

  return {
    eventId,
    pathname,
    topInset,
    bottomInset,
  };
}
