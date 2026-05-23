/**
 * Performance Utilities for HostSpace Form System
 *
 * Provides debounce, throttle, memoization, and lazy loading helpers
 * to optimize bundle size, rendering performance, and validation responsiveness.
 *
 * Requirements: 22 (Mobile Responsive Design — Performance)
 */

import React, { ComponentType, lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

/**
 * Creates a debounced version of a function that delays invocation
 * until `delay` ms have elapsed since the last call.
 *
 * Useful for real-time validation (300ms debounce per Requirement 4).
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as T & { cancel: () => void };
}

// ---------------------------------------------------------------------------
// Throttle
// ---------------------------------------------------------------------------

/**
 * Creates a throttled version of a function that invokes at most once
 * per `interval` ms. Leading call is always executed.
 *
 * Useful for scroll handlers, resize listeners, and auto-save triggers.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled as T & { cancel: () => void };
}

// ---------------------------------------------------------------------------
// Memoization
// ---------------------------------------------------------------------------

/**
 * Simple memoization for pure functions with a single argument.
 * Uses a Map cache with configurable max size to prevent memory leaks.
 */
export function memoize<TArg, TResult>(
  fn: (arg: TArg) => TResult,
  options?: { maxSize?: number }
): (arg: TArg) => TResult {
  const maxSize = options?.maxSize ?? 100;
  const cache = new Map<TArg, TResult>();

  return (arg: TArg): TResult => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }

    const result = fn(arg);

    // Evict oldest entry if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(arg, result);
    return result;
  };
}

/**
 * Memoization for functions with multiple arguments.
 * Uses JSON.stringify for cache key generation.
 */
export function memoizeMulti<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  options?: { maxSize?: number }
): (...args: TArgs) => TResult {
  const maxSize = options?.maxSize ?? 50;
  const cache = new Map<string, TResult>();

  return (...args: TArgs): TResult => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, result);
    return result;
  };
}

// ---------------------------------------------------------------------------
// Lazy Loading Wrapper
// ---------------------------------------------------------------------------

/**
 * Loading fallback component for lazy-loaded step components.
 * Displays a centered activity indicator with consistent styling.
 */
export function StepLoadingFallback() {
  return React.createElement(
    View,
    { style: loadingStyles.container },
    React.createElement(ActivityIndicator, { size: 'large', color: '#4F46E5' })
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    paddingVertical: 48,
  },
});

/**
 * Creates a lazy-loaded component wrapped in Suspense with a loading fallback.
 * Use this to code-split wizard step components so only the current step is loaded.
 *
 * @example
 * ```ts
 * const LazyStep1 = createLazyStep(() => import('../steps/Step1Identity'));
 * ```
 */
export function createLazyStep<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> } | { [key: string]: ComponentType<P> }>,
  exportName?: string
): React.LazyExoticComponent<ComponentType<P>> {
  return lazy(async () => {
    const module = await importFn();
    if ('default' in module) {
      return module as { default: ComponentType<P> };
    }
    // Handle named exports
    const name = exportName ?? Object.keys(module)[0];
    return { default: (module as Record<string, ComponentType<P>>)[name] };
  });
}

// ---------------------------------------------------------------------------
// Shallow Equality Check
// ---------------------------------------------------------------------------

/**
 * Performs a shallow comparison of two objects.
 * Used by React.memo custom comparators to avoid unnecessary re-renders.
 */
export function shallowEqual<T extends Record<string, unknown>>(
  objA: T,
  objB: T
): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Validation Debounce Constants
// ---------------------------------------------------------------------------

/**
 * Standard debounce delay for real-time field validation (Requirement 4.1).
 */
export const VALIDATION_DEBOUNCE_MS = 300;

/**
 * Auto-save interval in milliseconds (Requirement 3.1).
 */
export const AUTO_SAVE_INTERVAL_MS = 8000;

/**
 * Throttle interval for scroll-based operations.
 */
export const SCROLL_THROTTLE_MS = 100;
