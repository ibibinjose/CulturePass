import React, { type ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Vitrine } from '@/design-system/tokens/theme';
import { useColors } from '@/hooks/useColors';
import { useDiscoverVitrine } from '@/components/Discover/DiscoverVitrineContext';

type DiscoverScrollShellProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Bottom inset (e.g. tab bar + safe area) */
  scrollBottomPad: number;
};

/**
 * Discover tab scroll surface — solid white canvas (vitrine) + scroll for iOS, Android, and web.
 */
export function DiscoverScrollShell({
  children,
  contentContainerStyle,
  refreshControl,
  scrollBottomPad,
}: DiscoverScrollShellProps) {
  const colors = useColors();
  const vitrine = useDiscoverVitrine();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: vitrine ? Vitrine.surfaceContainerLowest : colors.background },
      ]}
    >
      <ScrollView
        style={[styles.scrollTransparent, Platform.OS === 'web' && styles.scrollTransparentWeb]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
        contentContainerStyle={[{ paddingBottom: scrollBottomPad }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollTransparent: { flex: 1, backgroundColor: 'transparent' },
  scrollTransparentWeb: {
    maxWidth: '100%',
    overflowX: 'hidden',
    overscrollBehaviorX: 'none',
  } as ViewStyle,
});
