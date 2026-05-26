/**
 * App-wide Lazy Loading Utilities
 *
 * Provides consistent, high-quality code splitting across the entire app.
 * Follows patterns used in elite consumer apps (Instagram, Airbnb, etc.).
 */

import React, { ComponentType, lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface LazyOptions {
  /** Fallback component while loading */
  fallback?: React.ComponentType;
  /** Minimum display time for the loading state (prevents flash) */
  minDelayMs?: number;
}

/**
 * Default loading fallback with consistent styling.
 */
export function DefaultLoadingFallback() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary || '#4F46E5'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});

/**
 * Creates a lazy-loaded screen/component with proper Suspense boundary.
 *
 * Usage:
 * ```tsx
 * const AdminScreen = createLazyScreen(() => import('../app/admin'));
 * ```
 */
export function createLazyScreen<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyOptions = {}
): React.ComponentType<P> {
  const LazyComponent = lazy(importFn);

  const Fallback = options.fallback || DefaultLoadingFallback;

  return function LazyScreenWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Creates a lazy-loaded component (not necessarily a full screen).
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> } | { [key: string]: ComponentType<P> }>,
  exportName?: string
): React.LazyExoticComponent<ComponentType<P>> {
  return lazy(async () => {
    const module = await importFn();
    if ('default' in module) {
      return module as { default: ComponentType<P> };
    }
    const name = exportName ?? Object.keys(module)[0];
    return { default: (module as Record<string, ComponentType<P>>)[name] };
  });
}