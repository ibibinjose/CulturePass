/**
 * In-app legal + help destinations (unified on `/about` via AboutLegalStrip).
 */
export const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/company-info', label: 'Company Info' },
  { href: '/founder', label: 'Our Story' },
  { href: '/get2know', label: 'Get2Know' },
  { href: '/help', label: 'Help' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/community', label: 'Community' },
  { href: '/legal/guidelines', label: 'Guidelines' },
  { href: '/legal/event-terms', label: 'Event Terms' },
  { href: '/contact', label: 'Contact' },
] as const;

export const SOCIAL_LINKS = [
  { label: 'Instagram', handle: '@culturepassapp', icon: 'logo-instagram', url: 'https://instagram.com/culturepassapp' },
  { label: 'Instagram India', handle: '@cultureindiaapp', icon: 'logo-instagram', url: 'https://instagram.com/cultureindiaapp' },
  { label: 'Facebook', handle: 'CulturePass.App', icon: 'logo-facebook', url: 'https://facebook.com/CulturePass.App' },
  { label: 'X', handle: '@CulturePassApp', icon: 'logo-twitter', url: 'https://x.com/CulturePassApp' },
  { label: 'TikTok', handle: '@culturepassapp', icon: 'logo-tiktok', url: 'https://tiktok.com/@culturepassapp' },
  { label: 'YouTube', handle: '@culturepassapp', icon: 'logo-youtube', url: 'https://youtube.com/@culturepassapp' },
  { label: 'LinkedIn', handle: 'CulturePass', icon: 'logo-linkedin', url: 'https://linkedin.com/company/culturepassapp' },
  { label: 'Support', handle: 'airpal.me/CulturePassApp', icon: 'heart-outline', url: 'https://airpal.me/CulturePassApp' },
] as const;