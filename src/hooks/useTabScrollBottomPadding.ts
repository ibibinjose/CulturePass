/**
 * Consistent bottom padding for scroll content inside the main tab group.
 * Clears the floating CustomTabBar + device home indicator.
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@/hooks/useLayout';

/**
 * @param extra — additional spacing below the tab bar clearance (section tail, FAB, etc.)
 */
export function useTabScrollBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsets();
  const { isDesktop, tabBarHeight } = useLayout();

  // Desktop web: no tab bar; site footer is in the sidebar, not under the main column
  if (Platform.OS === 'web' && isDesktop) {
    return extra + 12;
  }

  const bottomSafe = Platform.OS === 'web' ? 12 : insets.bottom;
  return tabBarHeight + bottomSafe + extra;
}
