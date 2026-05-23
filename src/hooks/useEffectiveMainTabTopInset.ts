import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Top safe inset for tab screens (native). Web Discover shell uses 0. */
export function useEffectiveMainTabTopInset(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') return 0;
  return insets.top;
}
