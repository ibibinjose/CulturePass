/**
 * PageShell — shared outer wrapper for browse/listing pages.
 *
 * Handles: background colour, optional ambient gradient mesh, safe area top
 * inset, desktop max-width centering. Children render inside the scrollable
 * content area.  Pass `stickyHeader` to pin a filter bar / header below the
 * hero without re-implementing ScrollView sticky logic.
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/modules/core/ui/ErrorBoundary';
import { useColors } from '@/hooks/useColors';
import { useLayout } from '@/hooks/useLayout';
import { ScreenTokens, gradients } from '@/design-system/tokens/theme';

interface PageShellProps {
  children: React.ReactNode;
  /** Pinned below any hero — use for filter bars */
  stickyHeader?: React.ReactNode;
  /** Full-bleed hero that sits above the sticky header */
  hero?: React.ReactNode;
  /** Floating action button */
  fab?: React.ReactNode;
  /** Show subtle brand gradient ambient mesh behind content */
  ambientMesh?: boolean;
  /** Desktop max-width (default 1200) */
  maxWidth?: number;
}

export function PageShell({
  children,
  stickyHeader,
  hero,
  fab,
  ambientMesh = true,
  maxWidth = 1200,
}: PageShellProps) {
  const colors = useColors();
  const { isDesktop } = useLayout();
  const insets = useSafeAreaInsets();
  const topInset = (Platform.OS === 'web' ? 0 : insets.top) + ScreenTokens.topOffset;

  return (
    <ErrorBoundary>
      <View style={[s.root, { backgroundColor: colors.background, paddingTop: hero ? 0 : topInset }]}>
        {ambientMesh && (
          <LinearGradient
            colors={gradients.culturepassBrand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.mesh}
            pointerEvents="none"
          />
        )}

        {hero}
        {stickyHeader}

        <View style={[s.content, isDesktop && { maxWidth, alignSelf: 'center', width: '100%' }]}>
          {children}
        </View>

        {fab}
      </View>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  mesh: { ...StyleSheet.absoluteFillObject, opacity: 0.055 },
  content: { flex: 1 },
});
