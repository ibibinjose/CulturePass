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
  | 'midnight';

export type DefaultImageConfig = {
  key: DefaultImageKey;
  label: string;
  gradientColors: readonly [string, string];
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
