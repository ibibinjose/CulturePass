/**
 * E2E fixture harness — only active when EXPO_PUBLIC_E2E_FIXTURES=true at build time.
 * Playwright injects window.__CP_E2E_AUTH__ via addInitScript.
 */

import type { AuthSession } from '@/lib/auth';

declare global {
  interface Window {
    __CP_E2E_AUTH__?: AuthSession;
    /** Optional partial Host Page wizard form patch for Playwright (branding URLs, etc.) */
    __CP_E2E_PAGE_FORM__?: Record<string, unknown>;
  }
}

export const E2E_PAGE_BRANDING_PATCH = {
  logoUrl: 'https://storage.example.com/e2e-logo.png',
  coverUrl: 'https://storage.example.com/e2e-cover.png',
  publicEmail: 'e2e-organizer@culturepass.test',
} as const;

export function isE2EFixturesEnabled(): boolean {
  return process.env.EXPO_PUBLIC_E2E_FIXTURES === 'true';
}

export function readE2EAuthSession(): AuthSession | null {
  if (!isE2EFixturesEnabled()) return null;
  if (typeof window === 'undefined') return null;
  return window.__CP_E2E_AUTH__ ?? null;
}