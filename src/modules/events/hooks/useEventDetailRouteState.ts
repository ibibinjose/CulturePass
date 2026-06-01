import { useLocalSearchParams, usePathname } from 'expo-router';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';

export function useEventDetailRouteState() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pathname = usePathname();
  const insets = useSafeAreaInsetsWeb();
  const eventId = typeof id === 'string' ? id : '';
  const topInset = insets.top;
  const bottomInset = Math.max(insets.bottom, 20);

  return {
    eventId,
    pathname,
    topInset,
    bottomInset,
  };
}
