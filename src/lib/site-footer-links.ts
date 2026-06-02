/**
 * Footer links for the CulturePass application
 */

export const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/company-info", label: "Company Info" },
  { href: "/founder", label: "Founder" },
  { href: "/get2know", label: "Get to Know" },
  { href: "/help", label: "Help" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/cookies", label: "Cookies" },
  { href: "/legal/community", label: "Community" },
  { href: "/legal/guidelines", label: "Guidelines" },
  { href: "/legal/event-terms", label: "Event Terms" },
  { href: "/contact", label: "Contact" },
] as const;

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
  get2Know: [
    { href: "/about", label: "About" },
    { href: "/company-info", label: "Company Info" },
    { href: "/founder", label: "Founder" },
    { href: "/get2know", label: "Get to Know" },
    { href: "/help", label: "Help" },
  ],
  legalSupport: [
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/legal/cookies", label: "Cookies" },
    { href: "/legal/community", label: "Community" },
    { href: "/legal/guidelines", label: "Guidelines" },
    { href: "/legal/event-terms", label: "Event Terms" },
    { href: "/contact", label: "Contact" },
  ],
  connect: SOCIAL_LINKS
} as const;