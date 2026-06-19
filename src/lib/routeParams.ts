import { useLocalSearchParams } from 'expo-router';

/** Expo Router search params — values are always string or string[]. */
export type RouteParams = Record<string, string | string[] | undefined>;

/** Untyped params accessor (avoids broken `useLocalSearchParams<T>()` generics in redirects). */
export function useRouteParams(): RouteParams {
  return useLocalSearchParams() as RouteParams;
}

export function firstRouteParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first !== 'string') return undefined;
    const trimmed = first.trim();
    return trimmed || undefined;
  }
  return undefined;
}