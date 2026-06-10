/**
 * Canonical CulturePass digital ID branding — single source for cards, exports, wallet, and UI.
 * Production URL: https://culturepass.app (CulturePass.App)
 */
export const DIGITAL_ID_BRAND = {
  name: 'CulturePass.App',
  domain: 'culturepass.app',
  /** Shown on pass footers and wallet back fields */
  domainDisplay: 'CulturePass.App',
  tagline: 'Belong anywhere.',
} as const;

export function brandDomainLabel(): string {
  return DIGITAL_ID_BRAND.domainDisplay;
}

export function brandProfileUrl(cpid: string): string {
  return `https://${DIGITAL_ID_BRAND.domain}/cpu/${encodeURIComponent(cpid)}`;
}