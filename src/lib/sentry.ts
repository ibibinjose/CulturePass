/**
 * Sentry Stub - Completely Mocked to Remove Dependency
 */

export function initSentry(): void {
  // no-op
}

export function setSentryUser(user: {
  id: string;
  username?: string;
  role?: string;
  email?: string;
} | null): void {
  // no-op
}

export function captureException(error: unknown, context?: Record<string, any>): void {
  // no-op
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  // no-op
}

export const Sentry = {
  captureException(error: any, context?: any) {},
  captureMessage(message: string, level?: any) {},
  setTag(key: string, value: any) {},
  setContext(name: string, context: any) {},
  addBreadcrumb(breadcrumb: any) {},
  setUser(user: any) {},
};