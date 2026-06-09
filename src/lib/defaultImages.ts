import { DEFAULT_IMAGE_GRADIENTS } from '@/design-system/tokens/defaultImageGradients';

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
  { key: 'indigo-violet', label: 'Royal', gradientColors: DEFAULT_IMAGE_GRADIENTS['indigo-violet'], icon: 'sparkles' },
  { key: 'coral-rose', label: 'Sunset', gradientColors: DEFAULT_IMAGE_GRADIENTS['coral-rose'], icon: 'heart' },
  { key: 'teal-cyan', label: 'Ocean', gradientColors: DEFAULT_IMAGE_GRADIENTS['teal-cyan'], icon: 'water' },
  { key: 'emerald-teal', label: 'Forest', gradientColors: DEFAULT_IMAGE_GRADIENTS['emerald-teal'], icon: 'leaf' },
  { key: 'amber-orange', label: 'Saffron', gradientColors: DEFAULT_IMAGE_GRADIENTS['amber-orange'], icon: 'flame' },
  { key: 'festival', label: 'Festival', gradientColors: DEFAULT_IMAGE_GRADIENTS.festival, icon: 'musical-notes' },
  { key: 'azure', label: 'Azure', gradientColors: DEFAULT_IMAGE_GRADIENTS.azure, icon: 'planet' },
  { key: 'blossom', label: 'Blossom', gradientColors: DEFAULT_IMAGE_GRADIENTS.blossom, icon: 'flower' },
  { key: 'harvest', label: 'Harvest', gradientColors: DEFAULT_IMAGE_GRADIENTS.harvest, icon: 'star' },
  { key: 'jade', label: 'Jade', gradientColors: DEFAULT_IMAGE_GRADIENTS.jade, icon: 'globe' },
  { key: 'stone', label: 'Stone', gradientColors: DEFAULT_IMAGE_GRADIENTS.stone, icon: 'grid' },
  { key: 'midnight', label: 'Midnight', gradientColors: DEFAULT_IMAGE_GRADIENTS.midnight, icon: 'moon' },
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
