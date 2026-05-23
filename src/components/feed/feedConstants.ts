import { Platform } from 'react-native';
import { CultureTokens } from '@/design-system/tokens/theme';

export const ACCENT = [
  CultureTokens.indigo,
  CultureTokens.teal,
  CultureTokens.coral,
  CultureTokens.gold,
  CultureTokens.gold,
  '#7C3AED',
  '#059669',
];

export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

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
