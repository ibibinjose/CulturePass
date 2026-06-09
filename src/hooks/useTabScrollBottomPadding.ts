/**
 * Consistent bottom padding for scroll content inside the main tab group.
 * Clears the floating CustomTabBar + device home indicator.
 */

import { Platform } from 'react-native';
import { useSafeAreaInsetsWeb } from '@/hooks/useSafeAreaInsetsWeb';
import { useLayout } from '@/hooks/useLayout';

/**
 * @param extra — additional spacing below the tab bar clearance (section tail, FAB, etc.)
 */
export function useTabScrollBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsetsWeb();
  const { isDesktop, tabBarHeight } = useLayout();

  // Desktop web: no tab bar; site footer is in the sidebar, not under the main column
  if (Platform.OS === 'web' && isDesktop) {
    return extra + Math.max(insets.bottom, 12);
  }

  const bottomSafe = insets.bottom;
  return tabBarHeight + bottomSafe + extra;
}
