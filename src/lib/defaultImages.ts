export type DefaultImageKey =
  | 'indigo-violet'
  | 'coral-rose'
  | 'teal-cyan'
  | 'emerald-teal'
  | 'amber-orange'
  | 'festival'
  | 'azure'
  | 'blossom'
  | 'harvest'
  | 'jade'
  | 'stone'
  | 'midnight'
  | 'stock-art'
  | 'stock-kathakali'
  | 'stock-concert'
  | 'stock-dining'
  | 'stock-community';

export type DefaultImageConfig = {
  key: DefaultImageKey;
  label: string;
  gradientColors?: readonly [string, string];
  imageAsset?: any;
  icon: string;
};

export const DEFAULT_IMAGE_URI_PREFIX = '@default:';

export function isDefaultImageUri(uri: string | null | undefined): uri is string {
  return typeof uri === 'string' && uri.startsWith(DEFAULT_IMAGE_URI_PREFIX);
}

export function getDefaultKey(uri: string): DefaultImageKey {
  return uri.slice(DEFAULT_IMAGE_URI_PREFIX.length) as DefaultImageKey;
}

export function makeDefaultUri(key: DefaultImageKey): string {
  return `${DEFAULT_IMAGE_URI_PREFIX}${key}`;
}

export const DEFAULT_IMAGE_CONFIGS: DefaultImageConfig[] = [
  // 5 Stock Images
  { key: 'stock-art',       label: 'Art & Theater', imageAsset: require('../../assets/images/stock/art_performance.png'), icon: 'easel' },
  { key: 'stock-kathakali', label: 'Kathakali',     imageAsset: require('../../assets/images/stock/festival_kathakali.png'), icon: 'sparkles' },
  { key: 'stock-concert',   label: 'Concert',       imageAsset: require('../../assets/images/stock/live_concert.png'), icon: 'musical-notes' },
  { key: 'stock-dining',    label: 'Food & Wine',   imageAsset: require('../../assets/images/stock/dining_food.png'), icon: 'restaurant' },
  { key: 'stock-community', label: 'Community',     imageAsset: require('../../assets/images/stock/heritage_gather.png'), icon: 'people' },

  // Gradient placeholders
  { key: 'indigo-violet', label: 'Royal',   gradientColors: ['#4F46E5', '#7C3AED'], icon: 'sparkles' },
  { key: 'coral-rose',    label: 'Sunset',  gradientColors: ['#FF5E5B', '#E11D48'], icon: 'heart' },
  { key: 'teal-cyan',     label: 'Ocean',   gradientColors: ['#0F766E', '#0891B2'], icon: 'water' },
  { key: 'emerald-teal',  label: 'Forest',  gradientColors: ['#059669', '#0D9488'], icon: 'leaf' },
  { key: 'amber-orange',  label: 'Saffron', gradientColors: ['#D97706', '#EA580C'], icon: 'flame' },
  { key: 'festival',      label: 'Festival',gradientColors: ['#7C3AED', '#EC4899'], icon: 'musical-notes' },
  { key: 'azure',         label: 'Azure',   gradientColors: ['#2563EB', '#4F46E5'], icon: 'planet' },
  { key: 'blossom',       label: 'Blossom', gradientColors: ['#F43F5E', '#EC4899'], icon: 'flower' },
  { key: 'harvest',       label: 'Harvest', gradientColors: ['#EAB308', '#D97706'], icon: 'star' },
  { key: 'jade',          label: 'Jade',    gradientColors: ['#16A34A', '#059669'], icon: 'globe' },
  { key: 'stone',         label: 'Stone',   gradientColors: ['#475569', '#334155'], icon: 'grid' },
  { key: 'midnight',      label: 'Midnight',gradientColors: ['#9333EA', '#4F46E5'], icon: 'moon' },
];

export function getDefaultConfig(key: DefaultImageKey): DefaultImageConfig | undefined {
  return DEFAULT_IMAGE_CONFIGS.find((c) => c.key === key);
}

export function getDefaultConfigFromUri(uri: string): DefaultImageConfig | undefined {
  if (!isDefaultImageUri(uri)) return undefined;
  return getDefaultConfig(getDefaultKey(uri));
}

export function getAlignFromUri(uri?: string | null): string {
  if (!uri) return 'center';
  const match = uri.match(/[?&]align=([^&]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : 'center';
}

export function setAlignInUri(uri: string, align: string): string {
  let cleanUri = uri.replace(/[?&]align=[/s/S]*?(?:&|$)/g, '').replace(/[?&]align=[^&]*/g, '');
  // Simple regex to safely remove align parameter
  cleanUri = uri.replace(/[?&]align=[^&]+/g, '');
  const separator = cleanUri.includes('?') ? '&' : '?';
  return `${cleanUri}${separator}align=${encodeURIComponent(align)}`;
}
