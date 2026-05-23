export function logError(error: unknown, context?: Record<string, any>): void {
  if (__DEV__) console.error('[host-app error]', context?.context ?? context, error);
}
