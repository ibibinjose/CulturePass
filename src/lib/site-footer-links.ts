/**
 * Footer links for the CulturePass application
 */

export type FooterLink = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
};

const GET2KNOW_LINKS = [
  { id: 'about', href: '/about', label: 'About' },
  { id: 'pricing', href: '/pricing', label: 'Pricing' },
  { id: 'company-info', href: '/company-info', label: 'Company Info' },
  { id: 'founder', href: '/founder', label: 'Founder' },
  { id: 'get-to-know', href: '/about', label: 'Get to Know' },
  { id: 'help', href: '/help', label: 'Help' },
] as const satisfies readonly FooterLink[];

const LEGAL_SUPPORT_LINKS = [
  { id: 'terms', href: '/legal/terms', label: 'Terms' },
  { id: 'privacy', href: '/legal/privacy', label: 'Privacy' },
  { id: 'cookies', href: '/legal/cookies', label: 'Cookies' },
  { id: 'community', href: '/legal/community', label: 'Community' },
  { id: 'guidelines', href: '/legal/guidelines', label: 'Guidelines' },
  { id: 'event-terms', href: '/legal/event-terms', label: 'Event Terms' },
  { id: 'contact', href: '/contact', label: 'Contact' },
] as const satisfies readonly FooterLink[];

export const FOOTER_LINKS: readonly FooterLink[] = [
  ...GET2KNOW_LINKS,
  ...LEGAL_SUPPORT_LINKS,
];

export const SOCIAL_LINKS = [
  { key: 'instagram', label: '@culturepassapp', url: 'https://www.instagram.com/culturepass.app', icon: 'logo-instagram' },
  { key: 'facebook', label: 'CulturePass.App', url: 'https://facebook.com/CulturePass.App', icon: 'logo-facebook' },
  { key: 'x', label: '@CulturePassApp', url: 'https://x.com/CulturePassApp', icon: 'logo-twitter' },
  { key: 'tiktok', label: '@culturepassapp', url: 'https://tiktok.com/@culturepassapp', icon: 'logo-tiktok' },
  { key: 'youtube', label: '@culturepassapp', url: 'https://youtube.com/@culturepassapp', icon: 'logo-youtube' },
  { key: 'linkedin', label: 'CulturePass', url: 'https://linkedin.com/company/culturepass', icon: 'logo-linkedin' },
] as const;

// Organized footer sections for better structure
export const FOOTER_SECTIONS = {
  get2Know: GET2KNOW_LINKS,
  legalSupport: LEGAL_SUPPORT_LINKS,
  connect: SOCIAL_LINKS,
} as const;