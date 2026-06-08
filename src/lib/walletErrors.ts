import { ApiError } from '@/platform/api/client';

export function formatWalletError(err: unknown, provider: 'apple' | 'google'): string {
  const label = provider === 'apple' ? 'Apple Wallet' : 'Google Wallet';

  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return 'Please sign in again to add your pass.';
    }
    if (err.status === 503) {
      if (err.message.includes('WALLET_APPLE_NOT_CONFIGURED') || err.message.includes('WALLET_GOOGLE_NOT_CONFIGURED')) {
        return `${label} is not fully configured on the server yet. Ask your admin to run wallet setup, or try again after the next deploy.`;
      }
      return `${label} is temporarily unavailable. Please try again shortly.`;
    }
    if (err.status >= 500) {
      return `${label} could not generate your pass right now. Please try again in a few minutes.`;
    }
    const body = err.body?.trim();
    if (body) {
      try {
        const parsed = JSON.parse(body) as { error?: string; hint?: string };
        if (parsed.error) return parsed.hint ? `${parsed.error} ${parsed.hint}` : parsed.error;
      } catch {
        if (body.length < 200) return body;
      }
    }
    return err.message.replace(/^\d{3}:\s*/, '') || `${label} request failed.`;
  }

  if (err instanceof Error && err.message) return err.message;
  return `Unable to open ${label}.`;
}