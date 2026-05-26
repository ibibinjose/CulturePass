import { CultureTokens } from '@/design-system/tokens/theme';
import { USE_NATIVE_DRIVER as _USE_NATIVE_DRIVER } from '@/design-system/tokens/animations';

export const ACCENT = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.coral,
  CultureTokens.gold,
  CultureTokens.gold,
  '#7C3AED',
  '#059669',
];

/** Re-exported for backward compatibility with existing feed module imports. */
export const USE_NATIVE_DRIVER = _USE_NATIVE_DRIVER;

export const COUNTRY_FLAG: Record<string, string> = {
  'United States': '🇺🇸',
  USA: '🇺🇸',
  Canada: '🇨🇦',
  'United Arab Emirates': '🇦🇪',
  UAE: '🇦🇪',
  'United Kingdom': '🇬🇧',
  UK: '🇬🇧',
  Australia: '🇦🇺',
  Singapore: '🇸🇬',
  'New Zealand': '🇳🇿',
};
